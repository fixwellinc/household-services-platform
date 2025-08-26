import express from 'express';
import prisma from '../config/database.js';
import { authMiddleware, requireCustomer, requireTechnician, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/service-requests/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Customer: Submit a service request
router.post('/', authMiddleware, requireCustomer, upload.array('media', 5), async (req, res, next) => {
  try {
    const { serviceId, category, description, urgency, address, preferredDate } = req.body;
    
    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required' });
    }

    // Process uploaded files
    const photos = [];
    const videos = [];
    
    if (req.files) {
      req.files.forEach(file => {
        if (file.mimetype.startsWith('image/')) {
          photos.push(`/uploads/service-requests/${file.filename}`);
        } else if (file.mimetype.startsWith('video/')) {
          videos.push(`/uploads/service-requests/${file.filename}`);
        }
      });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: req.user.id,
        serviceId: serviceId || null,
        category,
        description,
        urgency: urgency || 'NORMAL',
        address: address || req.user.address,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        photos,
        videos
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
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
    });

    res.status(201).json({ 
      success: true, 
      message: 'Service request submitted successfully',
      serviceRequest 
    });
  } catch (error) {
    next(error);
  }
});

// Customer: Get their service requests
router.get('/my-requests', authMiddleware, requireCustomer, async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let where = { customerId: req.user.id };
    if (status) {
      where.status = status;
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        quotes: {
          include: {
            technician: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        jobs: {
          include: {
            technician: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ serviceRequests });
  } catch (error) {
    next(error);
  }
});

// Technician: Get assigned service requests
router.get('/assigned', authMiddleware, requireTechnician, async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let where = { assignedTechnicianId: req.user.id };
    if (status) {
      where.status = status;
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
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
        },
        quotes: true,
        jobs: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ serviceRequests });
  } catch (error) {
    next(error);
  }
});

// Admin: Get all service requests
router.get('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { status, category, urgency } = req.query;
    
    let where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (urgency) where.urgency = urgency;

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ serviceRequests });
  } catch (error) {
    next(error);
  }
});

// Get service request by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
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
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        quotes: {
          include: {
            technician: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        jobs: {
          include: {
            technician: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Check authorization
    if (req.user.role === 'CUSTOMER' && serviceRequest.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this service request' });
    }

    if (req.user.role === 'TECHNICIAN' && serviceRequest.assignedTechnicianId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this service request' });
    }

    res.json({ serviceRequest });
  } catch (error) {
    next(error);
  }
});

// Admin/Technician: Update service request status
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTechnicianId } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Check authorization
    if (req.user.role === 'TECHNICIAN' && serviceRequest.assignedTechnicianId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this service request' });
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        assignedTechnicianId: assignedTechnicianId || serviceRequest.assignedTechnicianId,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTechnician: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Service request status updated successfully',
      serviceRequest: updatedRequest 
    });
  } catch (error) {
    next(error);
  }
});

// Customer: Cancel service request
router.patch('/:id/cancel', authMiddleware, requireCustomer, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (serviceRequest.customerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this service request' });
    }

    if (serviceRequest.status === 'COMPLETED' || serviceRequest.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot cancel completed or cancelled service request' });
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    res.json({ 
      success: true, 
      message: 'Service request cancelled successfully',
      serviceRequest: updatedRequest 
    });
  } catch (error) {
    next(error);
  }
});

export default router;
