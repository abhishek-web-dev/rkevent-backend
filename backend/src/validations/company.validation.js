const Joi = require('joi');

const updateSettings = {
  body: Joi.object().keys({
    companyName: Joi.string().required().messages({
      'any.required': 'Company name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid company email',
      'any.required': 'Company email is required',
    }),
    phone: Joi.string().required().messages({
      'any.required': 'Company phone number is required',
    }),
    address: Joi.string().required().messages({
      'any.required': 'Company address is required',
    }),
    website: Joi.string().uri().allow('').optional().messages({
      'string.uri': 'Please enter a valid website URL',
    }),
    invoicePrefix: Joi.string().trim().default('INV').messages({
      'string.empty': 'Invoice prefix cannot be empty',
    }),
    invoiceStartNumber: Joi.number().integer().min(1).default(1).messages({
      'number.min': 'Invoice start number must be at least 1',
    }),
  }),
};

module.exports = {
  updateSettings,
};
