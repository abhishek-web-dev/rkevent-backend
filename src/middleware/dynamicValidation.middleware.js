const Joi = require('joi');
const Service = require('../models/Service');
const BookingService = require('../models/BookingService');
const ApiError = require('../utils/apiError');

/**
 * Helper to compile a Joi validation schema from a fields definition array
 */
const compileJoiSchema = (fieldsConfig) => {
  const schemaDefinition = {};

  fieldsConfig.forEach((field) => {
    let validator;

    // 1. Assign type validator
    switch (field.type) {
      case 'Number':
        validator = Joi.number();
        if (field.validation) {
          if (field.validation.min !== null && field.validation.min !== undefined) {
            validator = validator.min(field.validation.min);
          }
          if (field.validation.max !== null && field.validation.max !== undefined) {
            validator = validator.max(field.validation.max);
          }
        }
        break;

      case 'Email':
        validator = Joi.string().email().empty('');
        break;

      case 'Phone':
        validator = Joi.string().pattern(/^[0-9+() -]+$/).empty('');
        break;

      case 'Switch':
      case 'Checkbox':
        validator = Joi.boolean();
        break;

      case 'Multi Select':
        validator = Joi.array().items(Joi.string());
        if (field.validation?.options?.length > 0) {
          validator = validator.items(Joi.string().valid(...field.validation.options));
        }
        break;

      case 'Dropdown':
      case 'Radio':
        validator = Joi.string().empty('');
        if (field.validation?.options?.length > 0) {
          validator = validator.valid(...field.validation.options);
        }
        break;

      case 'URL':
        validator = Joi.string().uri().empty('');
        break;

      default:
        validator = Joi.string().allow('').empty('');
    }

    // 2. Set constraints
    if (field.required) {
      validator = validator.required().messages({
        'any.required': `${field.label} is required`
      });
    } else {
      validator = validator.optional();
    }

    schemaDefinition[field.name] = validator;
  });

  return Joi.object(schemaDefinition);
};

/**
 * Middleware to run dynamic validations
 */
const validateDynamicData = async (req, res, next) => {
  try {
    // Case 1: Booking creation (array of services in req.body.services)
    if (req.body.services && Array.isArray(req.body.services)) {
      for (let i = 0; i < req.body.services.length; i++) {
        const item = req.body.services[i];
        
        // Fetch Service Master configuration
        const serviceConfig = await Service.findById(item.serviceId);
        if (!serviceConfig) {
          return next(new ApiError(404, `Service configuration not found for service index ${i} (ID: ${item.serviceId})`));
        }

        const joiSchema = compileJoiSchema(serviceConfig.fields);
        const { value, error } = joiSchema.validate(item.dynamicData || {}, {
          abortEarly: false,
          allowUnknown: false, // Ensure they do not submit random keys not defined in config
          stripUnknown: true
        });

        if (error) {
          const errors = error.details.map((detail) => ({
            field: `services.${i}.dynamicData.${detail.path.join('.')}`,
            message: detail.message.replace(/['"]/g, '')
          }));
          return next(new ApiError(400, `Validation error in service '${serviceConfig.name}': ${errors.map(e => e.message).join(', ')}`, errors));
        }

        // Apply defaults from Service Config for empty optional values
        serviceConfig.fields.forEach(field => {
          if (value[field.name] === undefined && field.defaultValue !== null && field.defaultValue !== undefined) {
            value[field.name] = field.defaultValue;
          }
        });

        // Set the sanitized values back to request
        req.body.services[i].dynamicData = value;
      }
    }

    // Case 2: Direct service addition to an existing booking (req.body.serviceId)
    else if (req.body.serviceId && req.route.path.includes('/services') && req.method === 'POST') {
      const serviceConfig = await Service.findById(req.body.serviceId);
      if (!serviceConfig) {
        return next(new ApiError(404, 'Service configuration not found'));
      }

      const joiSchema = compileJoiSchema(serviceConfig.fields);
      const { value, error } = joiSchema.validate(req.body.dynamicData || {}, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: `dynamicData.${detail.path.join('.')}`,
          message: detail.message.replace(/['"]/g, '')
        }));
        return next(new ApiError(400, `Validation error in service '${serviceConfig.name}': ${errors.map(e => e.message).join(', ')}`, errors));
      }

      // Apply default values
      serviceConfig.fields.forEach(field => {
        if (value[field.name] === undefined && field.defaultValue !== null && field.defaultValue !== undefined) {
          value[field.name] = field.defaultValue;
        }
      });

      req.body.dynamicData = value;
    }

    // Case 3: Direct service update (updating BookingService, req.params.bookingServiceId)
    else if (req.params.bookingServiceId && req.body.dynamicData) {
      const bookingService = await BookingService.findById(req.params.bookingServiceId);
      if (!bookingService) {
        return next(new ApiError(404, 'Booking service record not found'));
      }

      // Important: validate against the snapshotted fields definition to maintain historical config bounds
      const fieldsConfig = bookingService.serviceSnapshot?.fields || [];
      const joiSchema = compileJoiSchema(fieldsConfig);
      
      const { value, error } = joiSchema.validate(req.body.dynamicData, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map((detail) => ({
          field: `dynamicData.${detail.path.join('.')}`,
          message: detail.message.replace(/['"]/g, '')
        }));
        return next(new ApiError(400, `Validation error: ${errors.map(e => e.message).join(', ')}`, errors));
      }

      req.body.dynamicData = value;
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateDynamicData };
