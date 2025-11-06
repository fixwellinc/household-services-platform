import express from 'express';
import { getApiDocs } from '../config/apiDocs.js';

const router = express.Router();

// OpenAPI/Swagger JSON endpoint
router.get('/openapi.json', (req, res) => {
  const docs = getApiDocs();
  res.json(docs);
});

// Swagger UI endpoint (if swagger-ui-express is installed)
router.get('/swagger', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fixwell Services API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <style>
          html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
          *, *:before, *:after { box-sizing: inherit; }
          body { margin:0; background: #fafafa; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: "${req.protocol}://${req.get('host')}/api/docs/openapi.json",
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              layout: "StandaloneLayout"
            });
          };
        </script>
      </body>
    </html>
  `);
});

// API Documentation endpoint (legacy format)
router.get('/', (req, res) => {
  res.json({
    name: 'Fixwell Services API',
    version: '1.0.0',
    description: 'Backend API for Fixwell Services Platform',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    documentation: {
      openapi: `${req.protocol}://${req.get('host')}/api/docs/openapi.json`,
      swagger: `${req.protocol}://${req.get('host')}/api/docs/swagger`
    },
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
            isActive: 'boolean (optional)',
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 20, max: 100)'
          },
          response: {
            success: 'boolean',
            services: 'Service[]',
            pagination: 'Pagination object'
          }
        },
        'GET /services/:id': {
          description: 'Get service by ID',
          params: {
            id: 'string (required)'
          },
          response: {
            success: 'boolean',
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
            success: 'boolean',
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
            success: 'boolean',
            service: 'Service object'
          }
        },
        'DELETE /services/:id': {
          description: 'Delete service (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            success: 'boolean',
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
            endDate: 'string (optional)',
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 20, max: 100)'
          },
          response: {
            success: 'boolean',
            bookings: 'Booking[]',
            pagination: 'Pagination object'
          }
        },
        'GET /bookings/:id': {
          description: 'Get booking by ID',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            success: 'boolean',
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
            success: 'boolean',
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
            success: 'boolean',
            booking: 'Booking object'
          }
        },
        'PATCH /bookings/:id/cancel': {
          description: 'Cancel booking',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            success: 'boolean',
            message: 'string'
          }
        }
      },
      admin: {
        'GET /admin/users': {
          description: 'Get all users with pagination (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          query: {
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 50, max: 100)',
            role: 'string (optional)',
            search: 'string (optional)'
          },
          response: {
            success: 'boolean',
            users: 'User[]',
            pagination: 'Pagination object'
          }
        },
        'GET /admin/subscriptions': {
          description: 'Get all subscriptions (admin only)',
          headers: {
            Authorization: 'Bearer <token> (required)'
          },
          response: {
            success: 'boolean',
            subscriptions: 'Subscription[]'
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
      cookie: 'auth_token',
      tokenExpiry: '7 days'
    },
    rateLimiting: {
      general: '200 requests per 15 minutes per IP',
      auth: '50 requests per 15 minutes per IP',
      api: '500 requests per 15 minutes for authenticated users, 100 for anonymous',
      admin: '1000 requests per 15 minutes for admin users'
    },
    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      409: 'Conflict - Resource already exists',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error',
      503: 'Service Unavailable - Database or service unavailable'
    },
    responseFormat: {
      success: {
        success: true,
        data: 'Response data',
        pagination: 'Pagination object (if applicable)'
      },
      error: {
        success: false,
        error: 'Error message',
        code: 'Error code',
        timestamp: 'ISO timestamp',
        details: 'Additional error details (development only)'
      }
    }
  });
});

export default router; 