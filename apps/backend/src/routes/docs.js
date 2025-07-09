import express from 'express';

const router = express.Router();

// API Documentation endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Household Services API',
    version: '1.0.0',
    description: 'Backend API for Household Services Subscription Platform',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: {
        'POST /auth/register': {
          description: 'Register a new user',
          body: {
            email: 'string (required)',
            password: 'string (required, min 6 chars)',
            name: 'string (required)',
            role: 'string (optional, defaults to CUSTOMER)'
          },
          response: {
            message: 'string',
            user: 'User object',
            token: 'string'
          }
        },
        'POST /auth/login': {
          description: 'Login user',
          body: {
            email: 'string (required)',
            password: 'string (required)'
          },
          response: {
            message: 'string',
            user: 'User object',
            token: 'string'
          }
        },
        'GET /auth/me': {
          description: 'Get current user profile',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            user: 'User object'
          }
        },
        'POST /auth/logout': {
          description: 'Logout user',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            message: 'string'
          }
        }
      },
      services: {
        'GET /services': {
          description: 'Get all services with optional filtering',
          query: {
            category: 'string (optional)',
            complexity: 'string (optional)',
            minPrice: 'number (optional)',
            maxPrice: 'number (optional)',
            isActive: 'boolean (optional)'
          },
          response: {
            services: 'Service[]'
          }
        },
        'GET /services/:id': {
          description: 'Get service by ID',
          params: {
            id: 'string (required)'
          },
          response: {
            service: 'Service object'
          }
        },
        'POST /services': {
          description: 'Create new service (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            name: 'string (required)',
            description: 'string (required)',
            category: 'string (required)',
            complexity: 'string (required)',
            basePrice: 'number (required)'
          },
          response: {
            service: 'Service object'
          }
        },
        'PUT /services/:id': {
          description: 'Update service (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            name: 'string (optional)',
            description: 'string (optional)',
            category: 'string (optional)',
            complexity: 'string (optional)',
            basePrice: 'number (optional)',
            isActive: 'boolean (optional)'
          },
          response: {
            service: 'Service object'
          }
        },
        'DELETE /services/:id': {
          description: 'Delete service (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            message: 'string'
          }
        }
      },
      bookings: {
        'GET /bookings': {
          description: 'Get user bookings (customers see their bookings, admins see all)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          query: {
            status: 'string (optional)',
            startDate: 'string (optional)',
            endDate: 'string (optional)'
          },
          response: {
            bookings: 'Booking[]'
          }
        },
        'GET /bookings/:id': {
          description: 'Get booking by ID',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            booking: 'Booking object',
            customer: 'User object',
            service: 'Service object',
            messages: 'Message[]'
          }
        },
        'POST /bookings': {
          description: 'Create new booking (customers only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            serviceId: 'string (required)',
            scheduledDate: 'string (required, ISO date)',
            notes: 'string (optional)'
          },
          response: {
            booking: 'Booking object'
          }
        },
        'PATCH /bookings/:id/status': {
          description: 'Update booking status (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            status: 'string (required)'
          },
          response: {
            booking: 'Booking object'
          }
        },
        'PATCH /bookings/:id/cancel': {
          description: 'Cancel booking',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            message: 'string'
          }
        }
      },
      payments: {
        'POST /payments/create-intent': {
          description: 'Create Stripe payment intent',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            bookingId: 'string (required)',
            amount: 'number (required)'
          },
          response: {
            clientSecret: 'string'
          }
        },
        'POST /payments/confirm': {
          description: 'Confirm payment',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            paymentIntentId: 'string (required)',
            bookingId: 'string (required)'
          },
          response: {
            success: 'boolean',
            message: 'string'
          }
        }
      },
      quotes: {
        'GET /quotes': {
          description: 'Get all quotes (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            quotes: 'Quote[]'
          }
        },
        'POST /quotes': {
          description: 'Submit a quote request',
          body: {
            email: 'string (required)',
            message: 'string (required)',
            userId: 'string (optional)',
            serviceId: 'string (optional)'
          },
          response: {
            success: 'boolean',
            quote: 'Quote object'
          }
        },
        'POST /quotes/:id/reply': {
          description: 'Reply to quote (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          body: {
            reply: 'string (required)',
            price: 'number (optional)'
          },
          response: {
            success: 'boolean'
          }
        }
      },
      health: {
        'GET /health': {
          description: 'Health check endpoint',
          response: {
            status: 'string',
            timestamp: 'string',
            database: 'object',
            environment: 'string'
          }
        }
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      tokenExpiry: '7 days'
    },
    rateLimiting: {
      general: '100 requests per 15 minutes per IP',
      auth: '5 requests per 15 minutes per IP',
      api: '200 requests per 15 minutes for authenticated users, 50 for anonymous'
    },
    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      409: 'Conflict - Resource already exists',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    }
  });
});

export default router; 