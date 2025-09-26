import express from 'express';
import { sanitize } from '../middleware/validation.js';
import referralService from '../services/referralService.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for referral endpoints
const referralRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many referral requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiting for validation to prevent abuse
const validationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 validation requests per minute
  message: {
    error: 'Too many validation requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
router.use(referralRateLimit);

// GET /api/referral/validate/:code - Validate referral code
router.get('/validate/:code',
  validationRateLimit,
  sanitize,
  async (req, res, next) => {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          error: 'Referral code required',
          message: 'Please provide a referral code'
        });
      }

      const validation = await referralService.validateReferralCode(code);

      if (!validation.valid) {
        return res.status(404).json({
          error: 'Invalid referral code',
          message: validation.error
        });
      }

      res.json({
        success: true,
        valid: true,
        data: {
          salesman: validation.salesman,
          message: 'Valid referral code'
        }
      });
    } catch (error) {
      console.error('Error validating referral code:', error);
      next(error);
    }
  }
);

// POST /api/referral/track-visit - Track referral visit
router.post('/track-visit',
  sanitize,
  async (req, res, next) => {
    try {
      const {
        referralCode,
        campaignSource,
        referralUrl
      } = req.body;

      if (!referralCode) {
        return res.status(400).json({
          error: 'Referral code required',
          message: 'Please provide a referral code to track'
        });
      }

      // Get client IP and user agent for tracking
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const trackingResult = await referralService.trackReferralVisit({
        referralCode,
        ipAddress,
        userAgent,
        referralUrl,
        campaignSource
      });

      if (!trackingResult.success && !trackingResult.valid) {
        return res.status(404).json({
          error: 'Invalid referral code',
          message: trackingResult.error
        });
      }

      res.json({
        success: true,
        message: 'Visit tracked successfully',
        data: {
          salesman: trackingResult.salesman
        }
      });
    } catch (error) {
      console.error('Error tracking referral visit:', error);
      next(error);
    }
  }
);

// GET /api/referral/info/:code - Get referral information (for landing pages)
router.get('/info/:code',
  sanitize,
  async (req, res, next) => {
    try {
      const { code } = req.params;

      if (!code) {
        return res.status(400).json({
          error: 'Referral code required',
          message: 'Please provide a referral code'
        });
      }

      const validation = await referralService.validateReferralCode(code);

      if (!validation.valid) {
        return res.status(404).json({
          error: 'Invalid referral code',
          message: validation.error
        });
      }

      // Return information suitable for public display
      res.json({
        success: true,
        data: {
          referralCode: code.toUpperCase(),
          salesmanName: validation.salesman.displayName,
          personalMessage: validation.salesman.personalMessage,
          isValid: true
        }
      });
    } catch (error) {
      console.error('Error getting referral info:', error);
      next(error);
    }
  }
);

// GET /api/referral/redirect/:code - Redirect to registration with referral code
router.get('/redirect/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { redirect = '/register' } = req.query;

    // Validate referral code
    const validation = await referralService.validateReferralCode(code);

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let redirectUrl;

    if (validation.valid) {
      // Valid code - redirect to registration with referral code
      const params = new URLSearchParams({
        ref: code.toUpperCase(),
        utm_source: 'referral',
        utm_medium: 'link',
        utm_campaign: 'salesman_referral'
      });

      redirectUrl = `${baseUrl}${redirect}?${params.toString()}`;
    } else {
      // Invalid code - redirect to registration without referral
      redirectUrl = `${baseUrl}${redirect}?error=invalid_referral`;
    }

    // Track the visit
    try {
      await referralService.trackReferralVisit({
        referralCode: code,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referralUrl: req.get('Referer'),
        campaignSource: 'direct_link'
      });
    } catch (trackingError) {
      console.error('Error tracking referral redirect:', trackingError);
      // Don't fail the redirect due to tracking errors
    }

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Error handling referral redirect:', error);

    // Fallback redirect on error
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fallbackUrl = `${baseUrl}/register?error=system_error`;
    res.redirect(302, fallbackUrl);
  }
});

export default router;