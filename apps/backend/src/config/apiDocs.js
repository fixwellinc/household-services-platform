/**
 * API Documentation Configuration
 * Uses OpenAPI/Swagger specification
 */

export const apiDocs = {
  openapi: '3.0.0',
  info: {
    title: 'Fixwell Services Platform API',
    version: '1.0.0',
    description: 'API documentation for Fixwell Services Platform',
    contact: {
      name: 'Fixwell Support',
      email: 'support@fixwell.ca'
    }
  },
  servers: [
    {
      url: process.env.FRONTEND_URL || 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://fixwell-services-platform-production.up.railway.app',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'auth_token'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            description: 'Error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        },
        required: ['success', 'error', 'code', 'timestamp']
      },
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            example: 1
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            example: 20
          },
          total: {
            type: 'integer',
            example: 100
          },
          totalPages: {
            type: 'integer',
            example: 5
          },
          hasNext: {
            type: 'boolean',
            example: true
          },
          hasPrev: {
            type: 'boolean',
            example: false
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          role: {
            type: 'string',
            enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'],
            example: 'CUSTOMER'
          },
          phone: {
            type: 'string',
            example: '+1-604-555-0123'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Subscription: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890'
          },
          userId: {
            type: 'string',
            example: 'clx1234567890'
          },
          tier: {
            type: 'string',
            enum: ['STARTER', 'HOMECARE', 'PRIORITY'],
            example: 'HOMECARE'
          },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'CANCELLED', 'PAUSED'],
            example: 'ACTIVE'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          currentPeriodStart: {
            type: 'string',
            format: 'date-time'
          },
          currentPeriodEnd: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Booking: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clx1234567890'
          },
          customerId: {
            type: 'string',
            example: 'clx1234567890'
          },
          serviceId: {
            type: 'string',
            example: 'clx1234567890'
          },
          scheduledDate: {
            type: 'string',
            format: 'date-time'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
            example: 'PENDING'
          },
          totalAmount: {
            type: 'number',
            format: 'float',
            example: 99.99
          },
          finalAmount: {
            type: 'number',
            format: 'float',
            example: 99.99
          }
        }
      }
    }
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Returns the health status of the API',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time'
                    },
                    database: {
                      type: 'string',
                      example: 'healthy'
                    }
                  }
                }
              }
            }
          },
          '503': {
            description: 'Service is unhealthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user and return JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                    example: 'securePassword123'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    token: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                    },
                    user: {
                      $ref: '#/components/schemas/User'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/admin/users': {
      get: {
        summary: 'Get all users (Admin only)',
        description: 'Retrieve paginated list of users with filtering options',
        tags: ['Admin', 'Users'],
        security: [
          { bearerAuth: [] },
          { cookieAuth: [] }
        ],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              minimum: 1,
              default: 1
            }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50
            }
          },
          {
            name: 'role',
            in: 'query',
            description: 'Filter by role',
            schema: {
              type: 'string',
              enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN']
            }
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search by name, email, or phone',
            schema: {
              type: 'string'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                      example: true
                    },
                    users: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    pagination: {
                      $ref: '#/components/schemas/Pagination'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '403': {
            description: 'Forbidden - Admin access required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints'
    },
    {
      name: 'Authentication',
      description: 'User authentication endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Admin',
      description: 'Admin-only endpoints'
    },
    {
      name: 'Subscriptions',
      description: 'Subscription management endpoints'
    },
    {
      name: 'Bookings',
      description: 'Booking management endpoints'
    },
    {
      name: 'Services',
      description: 'Service management endpoints'
    }
  ]
};

// Export helper function to get API docs
export function getApiDocs() {
  return apiDocs;
}

