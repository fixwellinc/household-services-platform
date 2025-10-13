/**
 * MCP Logo Generation API Routes
 * Handles logo creation requests and serves generated logos
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { mcpLogoService } from '../services/mcpLogoService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * POST /api/logos/generate
 * Generate a new logo using MCP
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      companyName,
      description,
      style = 'modern',
      colors = [],
      industry = 'Technology',
      format = 'png',
      size = 'medium'
    } = req.body;

    // Validate required fields
    if (!companyName) {
      return res.status(400).json({
        success: false,
        error: 'Company name is required'
      });
    }

    // Validate style
    const availableStyles = mcpLogoService.getAvailableStyles();
    if (!availableStyles.includes(style)) {
      return res.status(400).json({
        success: false,
        error: `Invalid style. Available styles: ${availableStyles.join(', ')}`
      });
    }

    // Validate format
    const validFormats = ['png', 'svg', 'jpg'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Available formats: ${validFormats.join(', ')}`
      });
    }

    // Generate logo
    const result = await mcpLogoService.generateLogo({
      companyName,
      description,
      style,
      colors,
      industry,
      format,
      size
    });

    if (result.success) {
      res.json({
        success: true,
        logoUrl: result.logoUrl,
        metadata: result.metadata
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate logo'
      });
    }
  } catch (error) {
    console.error('Error generating logo:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/logos/styles
 * Get available logo styles
 */
router.get('/styles', (req, res) => {
  try {
    const styles = mcpLogoService.getAvailableStyles();
    res.json({
      success: true,
      styles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get styles'
    });
  }
});

/**
 * GET /api/logos/industries
 * Get available industries
 */
router.get('/industries', (req, res) => {
  try {
    const industries = mcpLogoService.getAvailableIndustries();
    res.json({
      success: true,
      industries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get industries'
    });
  }
});

/**
 * GET /api/logos/:filename
 * Serve generated logo files
 */
router.get('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'logos', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'Logo not found'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif'
    }[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve logo'
    });
  }
});

/**
 * POST /api/logos/upload
 * Upload a custom logo
 */
router.post('/upload', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const logoUrl = `/api/logos/${req.file.filename}`;
    
    res.json({
      success: true,
      logoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload logo'
    });
  }
});

/**
 * GET /api/logos/list
 * List all generated logos
 */
router.get('/list', async (req, res) => {
  try {
    const logosDir = path.join(process.cwd(), 'uploads', 'logos');
    
    try {
      await fs.access(logosDir);
    } catch (error) {
      return res.json({
        success: true,
        logos: []
      });
    }

    const files = await fs.readdir(logosDir);
    const logos = files
      .filter(file => /\.(png|jpg|jpeg|svg|gif)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `/api/logos/${file}`,
        createdAt: new Date().toISOString() // In a real app, you'd store this metadata
      }));

    res.json({
      success: true,
      logos
    });
  } catch (error) {
    console.error('Error listing logos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list logos'
    });
  }
});

/**
 * DELETE /api/logos/:filename
 * Delete a logo file
 */
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'logos', filename);
    
    try {
      await fs.unlink(filePath);
      res.json({
        success: true,
        message: 'Logo deleted successfully'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Logo not found'
      });
    }
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete logo'
    });
  }
});

export default router;
