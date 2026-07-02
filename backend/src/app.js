const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const ApiError = require('./utils/apiError');

// Load environment variables
dotenv.config();

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiting for API paths
app.use('/api', apiLimiter);

// Root/health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'RK Event Invoice API is healthy' });
});

// Mount routes
app.use('/api', routes);

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Centralized error handler middleware
app.use(errorHandler);

module.exports = app;
