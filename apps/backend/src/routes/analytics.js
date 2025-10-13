import express from 'express';

const router = express.Router();

/**
 * POST /api/analytics/web-vitals
 * Track Core Web Vitals metrics
 */
router.post('/web-vitals', async (req, res) => {
  try {
    const { name, value, delta, id, navigationType } = req.body;
    
    // Log the web vitals data (in production, you'd store this in a database)
    console.log('Web Vitals received:', {
      name,
      value,
      delta,
      id,
      navigationType,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // For now, just acknowledge receipt
    res.json({
      success: true,
      message: 'Web vitals data received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process web vitals data'
    });
  }
});

/**
 * POST /api/analytics/performance
 * Track performance metrics
 */
router.post('/performance', async (req, res) => {
  try {
    const performanceData = req.body;
    
    console.log('Performance data received:', {
      ...performanceData,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Performance data received',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing performance data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process performance data'
    });
  }
});

export default router;
