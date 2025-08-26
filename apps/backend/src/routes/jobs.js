import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware, requireCustomer, requireTechnician, requireAdmin } from '../middleware/auth.js';
import { generateInvoiceNumber } from '../utils/invoice.js';

const router = express.Router();

// Technician: Create a job from a service request
router.post('/', authMiddleware, requireTechnician, async (req, res, next) => {
  try {
    const { 
      serviceRequestId, 
      quoteId, 
      customerId, 
      scheduledDate, 
      estimatedHours,
      notes 
    } = req.body;

    if (!serviceRequestId || !customerId || !scheduledDate) {
      return res.status(400).json({ 
        error: 'Service request ID, customer ID, and scheduled date are required' 
      });
    }

    // Verify the service request is assigned to this technician
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.assignedTechnicianId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to create job for this service request' });
    }

    const job = await prisma.job.create({
      data: {
        serviceRequestId,
        quoteId: quoteId || null,
        customerId,
        technicianId: req.user.id,
        scheduledDate: new Date(scheduledDate),
        notes: notes || null
      },
      include: {
        serviceRequest: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Update service request status to IN_PROGRESS
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status: 'IN_PROGRESS' }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Job created successfully',
      job 
    });
  } catch (error) {
    next(error);
  }
});

// Get jobs based on user role
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let where = {};
    
    if (req.user.role === 'CUSTOMER') {
      where.customerId = req.user.id;
    } else if (req.user.role === 'TECHNICIAN') {
      where.technicianId = req.user.id;
    }
    // Admin can see all jobs
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) where.scheduledDate.gte = new Date(startDate);
      if (endDate) where.scheduledDate.lte = new Date(endDate);
    }
    
    const jobs = await prisma.job.findMany({
      where,
      include: {
        serviceRequest: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        quote: {
          select: {
            id: true,
            totalCost: true,
            estimatedHours: true
          }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    });
    
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
});

// Get job by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        serviceRequest: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true
              }
            },
            service: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        quote: {
          select: {
            id: true,
            totalCost: true,
            estimatedHours: true,
            materialsCost: true,
            laborCost: true
          }
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            dueDate: true
          }
        }
      }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check authorization
    if (req.user.role === 'CUSTOMER' && job.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this job' });
    }
    
    if (req.user.role === 'TECHNICIAN' && job.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this job' });
    }
    
    res.json({ job });
  } catch (error) {
    next(error);
  }
});

// Technician: Update job status
router.patch('/:id/status', authMiddleware, requireTechnician, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, startTime, endTime, actualHours, materialsUsed, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.technicianId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const updateData = { status, updatedAt: new Date() };
    
    if (status === 'IN_PROGRESS' && startTime) {
      updateData.startTime = new Date(startTime);
    }
    
    if (status === 'COMPLETED') {
      updateData.endTime = new Date();
      updateData.completedAt = new Date();
      if (actualHours) updateData.actualHours = actualHours;
      if (materialsUsed) updateData.materialsUsed = materialsUsed;
      if (notes) updateData.notes = notes;
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: updateData,
      include: {
        serviceRequest: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // If job is completed, update service request status and generate invoice
    if (status === 'COMPLETED') {
      await prisma.serviceRequest.update({
        where: { id: job.serviceRequestId },
        data: { status: 'COMPLETED' }
      });

      // Generate invoice for completed job
      await generateInvoiceForJob(job.id);
    }

    res.json({ 
      success: true, 
      message: 'Job status updated successfully',
      job: updatedJob 
    });
  } catch (error) {
    next(error);
  }
});

// Customer: Rate completed job
router.post('/:id/rate', authMiddleware, requireCustomer, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to rate this job' });
    }

    if (job.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only rate completed jobs' });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        customerRating: rating,
        customerFeedback: feedback || null,
        updatedAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      message: 'Job rated successfully',
      job: updatedJob 
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate invoice for completed job
async function generateInvoiceForJob(jobId) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        quote: true,
        serviceRequest: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!job) return;

    const quote = job.quote;
    const subtotal = quote ? quote.totalCost : 0;
    const taxAmount = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        jobId: job.id,
        customerId: job.customerId,
        technicianId: job.technicianId,
        invoiceNumber: generateInvoiceNumber(),
        subtotal,
        taxAmount,
        totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'PENDING'
      }
    });

    return invoice;
  } catch (error) {
    console.error('Error generating invoice:', error);
  }
}

export default router;
