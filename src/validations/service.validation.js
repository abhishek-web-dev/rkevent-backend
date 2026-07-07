const Joi = require('joi');

const fieldValidationSchema = Joi.object().keys({
  min: Joi.number().allow(null).optional(),
  max: Joi.number().allow(null).optional(),
  pattern: Joi.string().allow('').optional(),
  options: Joi.array().items(Joi.string()).optional()
});

const fieldConfigSchema = Joi.object().keys({
  name: Joi.string().required().pattern(/^[a-zA-Z0-9_]+$/).messages({
    'string.pattern.base': 'Field name must be alphanumeric and start with a letter (e.g. albumSize, pagesCount)'
  }),
  label: Joi.string().required(),
  type: Joi.string().required().valid(
    'Text', 'Number', 'Dropdown', 'Checkbox', 'Radio', 
    'Date', 'Time', 'DateTime', 'Textarea', 'File Upload', 
    'Image Upload', 'Switch', 'Multi Select', 'URL', 'Phone', 'Email'
  ),
  required: Joi.boolean().optional(),
  defaultValue: Joi.any().optional(),
  placeholder: Joi.string().allow('').optional(),
  helpText: Joi.string().allow('').optional(),
  validation: fieldValidationSchema.optional(),
  order: Joi.number().optional()
});

const createService = {
  body: Joi.object().keys({
    name: Joi.string().required().messages({
      'any.required': 'Service name is required'
    }),
    description: Joi.string().allow('').optional(),
    fields: Joi.array().items(fieldConfigSchema).optional(),
    workflows: Joi.array().items(Joi.string()).min(1).optional().messages({
      'array.min': 'Service must have at least one workflow stage'
    }),
    basePrice: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional()
  })
};

const updateService = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    fields: Joi.array().items(fieldConfigSchema).optional(),
    workflows: Joi.array().items(Joi.string()).min(1).optional(),
    basePrice: Joi.number().min(0).optional(),
    isActive: Joi.boolean().optional()
  })
};

module.exports = {
  createService,
  updateService
};
