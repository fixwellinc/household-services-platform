import prisma from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * AppointmentService - Handles appointment management operations
 */
class AppointmentService {
  /**
   * Get appointments for a customer
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options (status, startDate, endDate)
   * @param {Object} pagination - Pagination options (limit, offset)
   * @returns {Promise<Object>} Appointments with pagination
   */
  async getAppointments(userId, filters = {}, pagination = {}) {
    try {
      const { status, startDate, endDate } = filters;
      const { limit = 50, offset = 0 } = pagination;

      const where = {
        customerId: userId
      };

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.scheduledDate = {};
        if (startDate) where.scheduledDate.gte = new Date(startDate);
        if (endDate) where.scheduledDate.lte = new Date(endDate);
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            serviceType: {
              select: {
                id: true,
                name: true,
                displayName: true,
                duration: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'desc'
          },
          take: parseInt(limit),
          skip: parseInt(offset)
        }),
        prisma.appointment.count({ where })
      ]);

      return {
        appointments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + appointments.length < total
        }
      };
    } catch (error) {
      logger.error('Error getting appointments', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  /**
   * Get appointment by ID
   * @param {string} appointmentId - Appointment ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Appointment data
   */
  async getAppointment(appointmentId, userId) {
    try {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          customerId: userId
        },
        include: {
          serviceType: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return appointment;
    } catch (error) {
      logger.error('Error getting appointment', {
        error: error.message,
        stack: error.stack,
        appointmentId,
        userId
      });
      throw error;
    }
  }

  /**
   * Create a new appointment
   * @param {string} userId - User ID
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(userId, appointmentData) {
    try {
      const {
        serviceTypeId,
        scheduledDate,
        duration,
        customerName,
        customerEmail,
        customerPhone,
        propertyAddress,
        notes
      } = appointmentData;

      if (!serviceTypeId || !scheduledDate || !customerName || !customerEmail || !propertyAddress) {
        throw new Error('Missing required fields: serviceTypeId, scheduledDate, customerName, customerEmail, propertyAddress');
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true }
      });

      const appointment = await prisma.appointment.create({
        data: {
          customerId: userId,
          serviceTypeId,
          scheduledDate: new Date(scheduledDate),
          duration: duration || 60,
          customerName: customerName || user?.name || '',
          customerEmail: customerEmail || user?.email || '',
          customerPhone: customerPhone || user?.phone || null,
          propertyAddress,
          notes: notes || null,
          status: 'PENDING'
        },
        include: {
          serviceType: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      });

      logger.info('Appointment created', {
        appointmentId: appointment.id,
        userId,
        serviceTypeId,
        scheduledDate
      });

      return appointment;
    } catch (error) {
      logger.error('Error creating appointment', {
        error: error.message,
        stack: error.stack,
        userId
      });
      throw error;
    }
  }

  /**
   * Update an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointment(appointmentId, userId, updateData) {
    try {
      // Verify appointment belongs to user
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          customerId: userId
        }
      });

      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      const dataToUpdate = {};
      if (updateData.scheduledDate) dataToUpdate.scheduledDate = new Date(updateData.scheduledDate);
      if (updateData.duration) dataToUpdate.duration = updateData.duration;
      if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;
      if (updateData.status) dataToUpdate.status = updateData.status;

      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: dataToUpdate,
        include: {
          serviceType: {
            select: {
              id: true,
              name: true,
              displayName: true
            }
          }
        }
      });

      logger.info('Appointment updated', {
        appointmentId,
        userId,
        updates: Object.keys(dataToUpdate)
      });

      return updatedAppointment;
    } catch (error) {
      logger.error('Error updating appointment', {
        error: error.message,
        stack: error.stack,
        appointmentId,
        userId
      });
      throw error;
    }
  }

  /**
   * Cancel an appointment
   * @param {string} appointmentId - Appointment ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} Cancelled appointment
   */
  async cancelAppointment(appointmentId, userId) {
    try {
      // Verify appointment belongs to user
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          customerId: userId
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Update status to CANCELLED instead of deleting
      const cancelledAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED'
        }
      });

      logger.info('Appointment cancelled', {
        appointmentId,
        userId
      });

      return cancelledAppointment;
    } catch (error) {
      logger.error('Error cancelling appointment', {
        error: error.message,
        stack: error.stack,
        appointmentId,
        userId
      });
      throw error;
    }
  }
}

export default new AppointmentService();
