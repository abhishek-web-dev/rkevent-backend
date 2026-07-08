const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const ApiError = require('./utils/apiError');

const app = express();

// Trust proxy settings for Render load balancer / rate limiting
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Serve static uploads when Cloudinary fallback is active
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Apply global rate limiting for API paths
app.use('/api', apiLimiter);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RK Event Invoice Backend Running 🚀'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy'
  });
});

// Mount Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('✔ Swagger Loaded');

// Mount routes
app.use('/api', routes);
console.log('✔ Routes Loaded');

// Send back a 404 error for any unknown api request
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Centralized error handler middleware
app.use(errorHandler);

module.exports = app;
