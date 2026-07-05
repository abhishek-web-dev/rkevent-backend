const Joi = require('joi');

const createCustomer = {
  body: Joi.object().keys({
    name: Joi.string().required().messages({
      'any.required': 'Customer name is required',
    }),
    companyName: Joi.string().allow('').optional(),
    email: Joi.string().email().empty('').optional().messages({
      'string.email': 'Please enter a valid customer email',
    }),
    phone: Joi.string().required().messages({
      'any.required': 'Customer phone number is required',
    }),
    alternatePhone: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    pincode: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
  }),
};

const updateCustomer = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    companyName: Joi.string().allow('').optional(),
    email: Joi.string().email().empty('').optional(),
    phone: Joi.string().optional(),
    alternatePhone: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    state: Joi.string().allow('').optional(),
    pincode: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
  }),
};

module.exports = {
  createCustomer,
  updateCustomer,
};
