const Joi = require('joi');

const templateFunctionSchema = Joi.object().keys({
  name: Joi.string().required().messages({
    'any.required': 'Function name in template is required'
  }),
  offsetDays: Joi.number().integer().default(0),
  defaultStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('10:00').messages({
    'string.pattern.base': 'Start time must be in HH:MM 24-hour format'
  }),
  defaultEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('14:00').messages({
    'string.pattern.base': 'End time must be in HH:MM 24-hour format'
  }),
  notes: Joi.string().allow('').optional()
});

const createTemplate = {
  body: Joi.object().keys({
    name: Joi.string().required().messages({
      'any.required': 'Template name is required'
    }),
    description: Joi.string().allow('').optional(),
    functions: Joi.array().items(templateFunctionSchema).optional(),
    isActive: Joi.boolean().optional()
  })
};

const updateTemplate = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    description: Joi.string().allow('').optional(),
    functions: Joi.array().items(templateFunctionSchema).optional(),
    isActive: Joi.boolean().optional()
  })
};

module.exports = {
  createTemplate,
  updateTemplate
};
