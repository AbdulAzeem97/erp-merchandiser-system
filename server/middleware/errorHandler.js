export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists',
      field: err.detail
    });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({
      error: 'Reference error',
      message: 'Cannot delete or update this record due to existing references'
    });
  }

  if (err.code === '23502') { // Not null violation
    return res.status(400).json({
      error: 'Missing required field',
      message: 'Please provide all required fields',
      field: err.column
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: err.details
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is not valid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'The provided token has expired'
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum allowed size'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file',
      message: 'An unexpected file was uploaded'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
