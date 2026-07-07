const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  const targets = ['params', 'query', 'body'];
  
  for (const target of targets) {
    if (schema[target]) {
      const { value, error } = schema[target].validate(req[target], {
        abortEarly: false, // Include all errors, don't stop at first
        allowUnknown: true, // Allow fields not defined in schema (for backwards compatibility)
        stripUnknown: true, // Remove keys that are not defined in the schema
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/['"]/g, ''),
        }));
        
        const message = `Validation error in request ${target}: ${errors.map(e => e.message).join(', ')}`;
        return next(new ApiError(400, message, errors));
      }
      
      // Update request object with validated and sanitized values
      req[target] = value;
    }
  }
  
  next();
};

module.exports = validate;
