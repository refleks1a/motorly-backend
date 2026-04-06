import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Motorly Backend API',
    version: '1.0.0',
    description: 'Motorly - AI-Powered Car Maintenance & Diagnosis Platform',
    contact: {
      name: 'Motorly Team',
      email: 'support@motorly.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and account management'
    },
    {
      name: 'Vehicles',
      description: 'Vehicle management operations'
    },
    {
      name: 'AI Diagnosis Chat',
      description: 'AI-powered car diagnosis chat sessions'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          name: {
            type: 'string',
            description: 'User full name'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          }
        }
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Vehicle ID'
          },
          make: {
            type: 'string',
            description: 'Vehicle manufacturer'
          },
          model: {
            type: 'string',
            description: 'Vehicle model'
          },
          year: {
            type: 'integer',
            description: 'Manufacturing year'
          },
          mileage: {
            type: 'integer',
            description: 'Current mileage'
          },
          licensePlate: {
            type: 'string',
            description: 'License plate number'
          },
          userId: {
            type: 'string',
            description: 'Owner user ID'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Vehicle creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Vehicle update timestamp'
          }
        }
      },
      ChatSession: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Chat session ID'
          },
          title: {
            type: 'string',
            description: 'Session title'
          },
          vehicleId: {
            type: 'string',
            description: 'Associated vehicle ID'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Session creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Session update timestamp'
          },
          vehicle: {
            $ref: '#/components/schemas/Vehicle'
          },
          messages: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ChatMessage'
            }
          }
        }
      },
      ChatMessage: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Message ID'
          },
          content: {
            type: 'string',
            description: 'Message content'
          },
          role: {
            type: 'string',
            enum: ['user', 'assistant'],
            description: 'Message sender role'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Message creation timestamp'
          },
          diagnosisResult: {
            $ref: '#/components/schemas/DiagnosisResult'
          }
        }
      },
      DiagnosisResult: {
        type: 'object',
        properties: {
          confidence: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 1,
            description: 'AI confidence in diagnosis'
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Issue severity level'
          },
          potentialIssues: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/PotentialIssue'
            }
          },
          recommendedActions: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Recommended actions for user'
          }
        }
      },
      PotentialIssue: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Issue name'
          },
          description: {
            type: 'string',
            description: 'Issue description'
          },
          estimatedCost: {
            type: 'string',
            description: 'Estimated repair cost'
          },
          urgency: {
            type: 'string',
            enum: ['immediate', 'soon', 'monitor'],
            description: 'Repair urgency'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          message: {
            type: 'string',
            description: 'Detailed error message (development only)'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Not authenticated'
            }
          }
        }
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Resource not found'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid request parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              error: 'Validation failed',
              message: 'Email is required'
            }
          }
        }
      }
    }
  }
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;