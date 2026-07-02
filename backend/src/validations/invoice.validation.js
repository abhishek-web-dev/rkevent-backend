const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createInvoice = {
  body: Joi.object().keys({
    dueDate: Joi.date().required().messages({
      'any.required': 'Due date is required',
      'date.base': 'Please provide a valid due date',
    }),
    customer: Joi.string().regex(objectIdPattern).required().messages({
      'any.required': 'Customer ID is required',
      'string.pattern.base': 'Customer ID must be a valid MongoDB ObjectId',
    }),
    notes: Joi.string().allow('').optional(),
    discount: Joi.number().min(0).default(0).messages({
      'number.min': 'Discount cannot be negative',
    }),
    items: Joi.array()
      .items(
        Joi.object().keys({
          title: Joi.string().required().messages({
            'any.required': 'Item title is required',
          }),
          description: Joi.string().allow('').optional(),
          quantity: Joi.number().integer().min(1).required().messages({
            'any.required': 'Item quantity is required',
            'number.min': 'Quantity must be at least 1',
          }),
          price: Joi.number().min(0).required().messages({
            'any.required': 'Item price is required',
            'number.min': 'Price cannot be negative',
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        'any.required': 'Invoice items are required',
        'array.min': 'Invoice must contain at least one item',
      }),
  }),
};

const updateInvoice = {
  body: Joi.object().keys({
    dueDate: Joi.date().optional(),
    customer: Joi.string().regex(objectIdPattern).optional(),
    notes: Joi.string().allow('').optional(),
    discount: Joi.number().min(0).optional(),
    status: Joi.string().valid('Pending', 'Partial', 'Paid', 'Overdue').optional(),
    items: Joi.array()
      .items(
        Joi.object().keys({
          _id: Joi.string().regex(objectIdPattern).optional(),
          title: Joi.string().required(),
          description: Joi.string().allow('').optional(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().min(0).required(),
        })
      )
      .min(1)
      .optional(),
  }),
};

module.exports = {
  createInvoice,
  updateInvoice,
};
