const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'RK Event Invoice System API',
    version: '1.0.0',
    description: 'Swagger API documentation for the RK Event Invoice Management System.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'RK Admin' },
          email: { type: 'string', format: 'email', example: 'admin@rkevent.com' },
          password: { type: 'string', minLength: 6, example: 'adminpassword123' },
          role: { type: 'string', enum: ['admin', 'staff'], example: 'admin' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@rkevent.com' },
          password: { type: 'string', example: 'adminpassword123' },
        },
      },
      CustomerInput: {
        type: 'object',
        required: ['name', 'email', 'phone', 'address'],
        properties: {
          name: { type: 'string', example: 'John Doe' },
          companyName: { type: 'string', example: 'Doe Events Inc' },
          email: { type: 'string', format: 'email', example: 'johndoe@example.com' },
          phone: { type: 'string', example: '+1 555-0199' },
          address: { type: 'string', example: '742 Evergreen Terrace, Springfield' },
          notes: { type: 'string', example: 'Requires late evening deliveries.' },
        },
      },
      InvoiceInput: {
        type: 'object',
        required: ['dueDate', 'customer', 'items'],
        properties: {
          dueDate: { type: 'string', format: 'date', example: '2026-07-20' },
          customer: { type: 'string', example: '60d5ec49ad41162468ef8392' },
          notes: { type: 'string', example: 'Net 15 terms.' },
          discount: { type: 'number', example: 50 },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['title', 'price'],
              properties: {
                title: { type: 'string', example: 'Premium Sound System' },
                description: { type: 'string', example: 'With subwoofers and arrays' },
                quantity: { type: 'number', example: 1 },
                price: { type: 'number', example: 500 },
              },
            },
          },
        },
      },
      PaymentInput: {
        type: 'object',
        required: ['invoiceId', 'amount', 'paymentMethod'],
        properties: {
          invoiceId: { type: 'string', example: '60d5ec49ad41162468ef8399' },
          amount: { type: 'number', example: 500 },
          paymentMethod: { type: 'string', example: 'UPI' },
          transactionId: { type: 'string', example: 'TXN99281' },
          notes: { type: 'string', example: 'Advance installment' },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [], // We programmatically specify Swagger docs or JSDoc if desired
};

const swaggerSpec = swaggerJSDoc(options);

// Define manual OpenAPI paths to ensure they load correctly without parsing errors
swaggerSpec.paths = {
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
      },
      responses: { 201: { description: 'Registered successfully' } },
    },
  },
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login user',
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
      },
      responses: { 200: { description: 'Logged in successfully' } },
    },
  },
  '/api/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Profile retrieved successfully' } },
    },
    put: {
      tags: ['Authentication'],
      summary: 'Update user profile details',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { name: { type: 'string' }, email: { type: 'string' } },
            },
          },
        },
      },
      responses: { 200: { description: 'Profile updated' } },
    },
  },
  '/api/company': {
    get: {
      tags: ['Company Settings'],
      summary: 'Get company settings',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Settings retrieved' } },
    },
    put: {
      tags: ['Company Settings'],
      summary: 'Update company settings and logo',
      security: [{ bearerAuth: [] }],
      description: 'Upload logo as multipart/form-data',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                companyName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                address: { type: 'string' },
                website: { type: 'string' },
                invoicePrefix: { type: 'string' },
                invoiceStartNumber: { type: 'number' },
                logo: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { 200: { description: 'Settings updated' } },
    },
  },
  '/api/customers': {
    post: {
      tags: ['Customers'],
      summary: 'Create customer',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerInput' } } },
      },
      responses: { 201: { description: 'Customer created' } },
    },
    get: {
      tags: ['Customers'],
      summary: 'Get all customers (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Customers list retrieved' } },
    },
  },
  '/api/customers/{id}': {
    get: {
      tags: ['Customers'],
      summary: 'Get single customer details',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Customer details retrieved' } },
    },
    put: {
      tags: ['Customers'],
      summary: 'Update customer details',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerInput' } } },
      },
      responses: { 200: { description: 'Customer updated' } },
    },
    delete: {
      tags: ['Customers'],
      summary: 'Delete customer',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Customer deleted' } },
    },
  },
  '/api/customers/trash': {
    get: {
      tags: ['Customers Trash'],
      summary: 'Get all soft-deleted customers in trash',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
      responses: { 200: { description: 'Deleted customers retrieved' } },
    },
  },
  '/api/customers/{id}/restore': {
    post: {
      tags: ['Customers Trash'],
      summary: 'Restore a soft-deleted customer from trash',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Customer restored' } },
    },
  },
  '/api/customers/{id}/permanent': {
    delete: {
      tags: ['Customers Trash'],
      summary: 'Permanently delete a customer from DB',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Customer permanently deleted' } },
    },
  },
  '/api/invoices': {
    post: {
      tags: ['Invoices'],
      summary: 'Create invoice (auto-incremented)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/InvoiceInput' } } },
      },
      responses: { 201: { description: 'Invoice created' } },
    },
    get: {
      tags: ['Invoices'],
      summary: 'Get all invoices with filters',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Partial', 'Paid', 'Overdue'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Invoices list retrieved' } },
    },
  },
  '/api/invoices/{id}': {
    get: {
      tags: ['Invoices'],
      summary: 'Get invoice details',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Invoice details' } },
    },
    put: {
      tags: ['Invoices'],
      summary: 'Update invoice',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/InvoiceInput' } } },
      },
      responses: { 200: { description: 'Invoice updated' } },
    },
    delete: {
      tags: ['Invoices'],
      summary: 'Delete invoice',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Invoice deleted' } },
    },
  },
  '/api/invoices/trash': {
    get: {
      tags: ['Invoices Trash'],
      summary: 'Get all soft-deleted invoices in trash',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
      responses: { 200: { description: 'Deleted invoices retrieved' } },
    },
  },
  '/api/invoices/{id}/restore': {
    post: {
      tags: ['Invoices Trash'],
      summary: 'Restore a soft-deleted invoice from trash',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Invoice restored' } },
    },
  },
  '/api/invoices/{id}/permanent': {
    delete: {
      tags: ['Invoices Trash'],
      summary: 'Permanently delete an invoice from DB',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Invoice permanently deleted' } },
    },
  },
  '/api/invoices/{id}/pdf': {
    get: {
      tags: ['Invoices'],
      summary: 'Download printable A4 PDF invoice',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'PDF binary stream' } },
    },
  },
  '/api/invoices/{id}/email': {
    post: {
      tags: ['Invoices'],
      summary: 'Generate invoice PDF and send email attachment to customer',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'Email sent status' } },
    },
  },
  '/api/invoices/{id}/share-whatsapp': {
    get: {
      tags: ['Invoices'],
      summary: 'Get pre-populated WhatsApp sharing link',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      responses: { 200: { description: 'WhatsApp URL details' } },
    },
  },
  '/api/payments': {
    post: {
      tags: ['Payments'],
      summary: 'Add payment transaction (updates invoice balance/status)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentInput' } } },
      },
      responses: { 201: { description: 'Payment recorded' } },
    },
    get: {
      tags: ['Payments'],
      summary: 'Get all payments history',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'invoiceId', in: 'query', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'Payments history list' } },
    },
  },
  '/api/dashboard': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get dashboard KPIs and charts aggregation data',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Aggregation statistics' } },
    },
  },
  '/api/system/backup': {
    post: {
      tags: ['System Administration'],
      summary: 'Trigger manual database backup snapshot',
      security: [{ bearerAuth: [] }],
      responses: { 201: { description: 'Backup file generated' } },
    },
  },
  '/api/system/backups': {
    get: {
      tags: ['System Administration'],
      summary: 'List all locally available database backup snapshots',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'Backup file list' } },
    },
  },
  '/api/system/restore': {
    post: {
      tags: ['System Administration'],
      summary: 'Restore entire database from a local snapshot file',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', example: '2026-07-02-15-45-backup.json' } },
            },
          },
        },
      },
      responses: { 200: { description: 'Database successfully restored' } },
    },
  },
  '/api/health': {
    get: {
      tags: ['System Utilities'],
      summary: 'Health status check',
      responses: { 200: { description: 'Server health report' } },
    },
  },
};

module.exports = swaggerSpec;
