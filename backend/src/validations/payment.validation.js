const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const addPayment = {
  body: Joi.object().keys({
    invoiceId: Joi.string().regex(objectIdPattern).required().messages({
      'any.required': 'Invoice ID is required',
      'string.pattern.base': 'Invoice ID must be a valid MongoDB ObjectId',
    }),
    amount: Joi.number().precision(2).positive().required().messages({
      'any.required': 'Payment amount is required',
      'number.positive': 'Payment amount must be greater than 0',
    }),
    paymentMethod: Joi.string().required().messages({
      'any.required': 'Payment method is required',
    }),
    transactionId: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
  }),
};

const updatePayment = {
  body: Joi.object().keys({
    amount: Joi.number().precision(2).positive().optional(),
    paymentMethod: Joi.string().optional(),
    transactionId: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
  }),
};

module.exports = {
  addPayment,
  updatePayment,
};
