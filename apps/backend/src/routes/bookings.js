import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireCustomer, requireCustomerOrAdmin } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's bookings (customers see their bookings, admins see all)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let where = {};
    
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.id;
    }
    // Admin can see all bookings
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }
    
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: 'desc' }
    });
    
    const result = await Promise.all(bookings.map(async (booking) => {
      const customer = await prisma.user.findUnique({
        where: { id: booking.customerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      });

      const service = await prisma.service.findUnique({
        where: { id: booking.serviceId },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true
        }
      });

      return {
        ...booking,
        customer,
        service
      };
    }));
    
    res.json({ bookings: result });
  } catch (error) {
    next(error);
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({ where: { id } });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'ADMIN' && booking.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }
    
    const customer = await prisma.user.findUnique({
      where: { id: booking.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true
      }
    });

    const service = await prisma.service.findUnique({
      where: { id: booking.serviceId },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        category: true
      }
    });

    // Fetch messages and manually populate sender
    const messagesRaw = await prisma.message.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'asc' }
    });
    const messages = await Promise.all(messagesRaw.map(async msg => {
      let sender = null;
      if (msg.senderId) {
        sender = await prisma.user.findUnique({
          where: { id: msg.senderId },
          select: { id: true, name: true, avatar: true }
        });
      }
      return { ...msg, sender };
    }));
    
    res.json({ booking, customer, service, messages });
  } catch (error) {
    next(error);
  }
});

// Create new booking (customers only)
router.post('/', authMiddleware, requireCustomer, async (req, res, next) => {
  try {
    const { serviceId, scheduledDate, notes } = req.body;
    
    // Validation
    if (!serviceId || !scheduledDate) {
      throw new ValidationError('Service ID and scheduled date are required');
    }
    
    // Check if service exists and is active
    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true }
    });
    
    if (!service) {
      throw new ValidationError('Service not found or inactive');
    }
    
    // Check if scheduled date is in the future
    const bookingDate = new Date(scheduledDate);
    if (bookingDate <= new Date()) {
      throw new ValidationError('Scheduled date must be in the future');
    }
    
    // Calculate amounts with plan discounts
    const totalAmount = service.basePrice;
    let discountAmount = 0;
    
    // Check if user has an active subscription and apply discount
    const userSubscription = await prisma.subscription.findUnique({
      where: { userId: req.user.id }
    });
    
    if (userSubscription && userSubscription.status === 'ACTIVE') {
      const { calculateServiceDiscount } = await import('../config/plans.js');
      discountAmount = calculateServiceDiscount(userSubscription.tier, totalAmount);
    }
    
    const finalAmount = totalAmount - discountAmount;
    
    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        serviceId,
        scheduledDate: bookingDate,
        totalAmount,
        discountAmount,
        finalAmount,
        notes
      },
    });
    
    res.status(201).json({ booking });
  } catch (error) {
    next(error);
  }
});

// Update booking status (admin only)
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update booking status' });
    }
    
    if (!status) {
      throw new ValidationError('Status is required');
    }
    
    if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      throw new ValidationError('Invalid status');
    }
    
    const existingBooking = await prisma.booking.findUnique({ where: { id } });
    
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    
    res.json({ booking });
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.patch('/:id/cancel', authMiddleware, requireCustomerOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const existingBooking = await prisma.booking.findUnique({ where: { id } });
    
    if (!existingBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'ADMIN' && existingBooking.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }
    
    // Can only cancel pending or confirmed bookings
    if (!['PENDING', 'CONFIRMED'].includes(existingBooking.status)) {
      throw new ValidationError('Can only cancel pending or confirmed bookings');
    }
    
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    
    res.json({ booking });
  } catch (error) {
    next(error);
  }
});

// Send message in booking
router.post('/:id/messages', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      throw new ValidationError('Message content is required');
    }
    
    const booking = await prisma.booking.findUnique({ where: { id } });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'ADMIN' && booking.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to message in this booking' });
    }
    
    // Determine receiver (customer messages admin, admin messages customer)
    let receiverId;
    if (req.user.role === 'ADMIN') {
      receiverId = booking.customerId;
    } else {
      // Customer is messaging, find an admin (for simplicity, we'll use the first admin)
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true }
      });
      if (!admin) {
        throw new ValidationError('No admin available to receive message');
      }
      receiverId = admin.id;
    }
    
    const message = await prisma.message.create({
      data: {
        bookingId: id,
        senderId: req.user.id,
        receiverId,
        content
      },
    });
    
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

export default router; 