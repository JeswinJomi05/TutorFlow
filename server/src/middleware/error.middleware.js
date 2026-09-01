const ApiError = require('../utils/apiError');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid format for field '${err.path}': ${err.value}`;
    error = new ApiError(400, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join(', ');
    error = new ApiError(400, message);
  }

  // Handle MongoDB Duplicate Key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    const message = `Duplicate value '${value}' for ${field}. A resource with this ${field} already exists.`;
    error = new ApiError(409, message);
  }

  // Handle JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid authentication token.');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Authentication token has expired.');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const isProduction = process.env.NODE_ENV === 'production';

  // Only log unexpected 500 errors to console in production
  if (statusCode === 500) {
    console.error('[Unhandled Server Error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(!isProduction && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
