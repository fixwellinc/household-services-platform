import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { ValidationError } from '../middleware/error.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all services with optional filtering
router.get('/', async (req, res, next) => {
  try {
    const { category, complexity, minPrice, maxPrice, isActive } = req.query;
    
    const where = {
      isActive: isActive !== 'false', // Default to active services
      ...(category && { category }),
      ...(complexity && { complexity }),
      ...(minPrice && { basePrice: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { basePrice: { lte: parseFloat(maxPrice) } })
    };
    
    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ services });
  } catch (error) {
    next(error);
  }
});

// Get service by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const service = await prisma.service.findUnique({ where: { id } });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ service });
  } catch (error) {
    next(error);
  }
});

// Create new service (admin only)
router.post('/', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { name, description, category, complexity, basePrice } = req.body;
    
    // Validation
    if (!name || !description || !category || !complexity || !basePrice) {
      throw new ValidationError('All fields are required');
    }
    
    if (!['CLEANING', 'MAINTENANCE', 'REPAIR', 'ORGANIZATION', 'SHOPPING', 'OTHER'].includes(category)) {
      throw new ValidationError('Invalid category');
    }
    
    if (!['SIMPLE', 'MODERATE', 'COMPLEX'].includes(complexity)) {
      throw new ValidationError('Invalid complexity level');
    }
    
    if (basePrice <= 0) {
      throw new ValidationError('Base price must be greater than 0');
    }
    
    const service = await prisma.service.create({
      data: {
        name,
        description,
        category,
        complexity,
        basePrice: parseFloat(basePrice)
      },
    });
    
    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
});

// Update service (admin only)
router.put('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, category, complexity, basePrice, isActive } = req.body;
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({ where: { id } });
    
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(complexity && { complexity }),
        ...(basePrice && { basePrice: parseFloat(basePrice) }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
    });
    
    res.json({ service });
  } catch (error) {
    next(error);
  }
});

// Delete service (admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({ where: { id } });
    
    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    await prisma.service.delete({ where: { id } });
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router; 