const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description: 'Production-ready URL shortener service with analytics and JWT authentication',
      contact: {
        name: 'API Support',
        email: 'support@urlshortener.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.urlshortener.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            name: {
              type: 'string',
              description: 'User name'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        URL: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'URL ID'
            },
            originalUrl: {
              type: 'string',
              format: 'uri',
              description: 'Original long URL'
            },
            shortCode: {
              type: 'string',
              description: 'Shortened URL code'
            },
            shortUrl: {
              type: 'string',
              format: 'uri',
              description: 'Complete shortened URL'
            },
            customAlias: {
              type: 'string',
              nullable: true,
              description: 'Custom alias if provided'
            },
            title: {
              type: 'string',
              nullable: true,
              description: 'URL title'
            },
            qrCode: {
              type: 'string',
              description: 'QR code data URL'
            },
            clickCount: {
              type: 'integer',
              description: 'Total number of clicks'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Expiration timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            ipAddress: {
              type: 'string'
            },
            userAgent: {
              type: 'string'
            },
            referer: {
              type: 'string'
            },
            deviceType: {
              type: 'string'
            },
            browser: {
              type: 'string'
            },
            os: {
              type: 'string'
            },
            country: {
              type: 'string'
            },
            city: {
              type: 'string'
            },
            clickedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User registration and login endpoints'
      },
      {
        name: 'URLs',
        description: 'URL shortening and management'
      },
      {
        name: 'Analytics',
        description: 'URL analytics and statistics'
      },
      {
        name: 'Health',
        description: 'API health check'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
