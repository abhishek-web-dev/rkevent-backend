const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not already an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key (MongoServerError code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new ApiError(400, message);
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token. Please log in again.');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please log in again.');
  }

  // Handle cast errors (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid value for path ${err.path}: ${err.value}`);
  }

  const response = {
    success: false,
    message: error.message || 'Something went wrong',
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  // Log error for developers
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(error.statusCode || 500).json(response);
};

module.exports = errorHandler;
