const Joi = require('joi');

const createCustomer = {
  body: Joi.object().keys({
    name: Joi.string().required().messages({
      'any.required': 'Customer name is required',
    }),
    companyName: Joi.string().allow('').optional(),
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid customer email',
      'any.required': 'Customer email is required',
    }),
    phone: Joi.string().required().messages({
      'any.required': 'Customer phone number is required',
    }),
    address: Joi.string().required().messages({
      'any.required': 'Customer address is required',
    }),
    notes: Joi.string().allow('').optional(),
  }),
};

const updateCustomer = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    companyName: Joi.string().allow('').optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    notes: Joi.string().allow('').optional(),
  }),
};

module.exports = {
  createCustomer,
  updateCustomer,
};
