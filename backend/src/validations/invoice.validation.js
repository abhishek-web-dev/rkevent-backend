const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createInvoice = {
  body: Joi.object().keys({
    dueDate: Joi.date().required().messages({
      'any.required': 'Due date is required',
      'date.base': 'Please provide a valid due date',
    }),
    customer: Joi.string().regex(objectIdPattern).optional().messages({
      'string.pattern.base': 'Customer ID must be a valid MongoDB ObjectId',
    }),
    customerDetails: Joi.object().keys({
      name: Joi.string().required().messages({
        'any.required': 'Customer name is required',
      }),
      phone: Joi.string().required().messages({
        'any.required': 'Customer phone is required',
      }),
      alternatePhone: Joi.string().allow('').optional(),
      email: Joi.string().email().allow('').optional(),
      address: Joi.string().allow('').optional(),
      city: Joi.string().allow('').optional(),
      state: Joi.string().allow('').optional(),
      pincode: Joi.string().allow('').optional(),
      saveCustomer: Joi.boolean().default(true),
    }).optional(),
    // Event Details
    eventType: Joi.string().valid('Wedding', 'Pre Wedding', 'Ring Ceremony', 'Birthday', 'Haldi', 'Engagement', 'Baby Shower', 'Anniversary', 'Corporate Event', 'Other', '').optional(),
    eventDate: Joi.date().allow(null).optional(),
    eventTime: Joi.string().allow('').optional(),
    eventLocation: Joi.string().allow('').optional(),
    expectedGuestCount: Joi.number().integer().min(0).optional(),
    specialRequirements: Joi.string().allow('').optional(),
    // Payment Details
    tokenAmount: Joi.number().min(0).optional(),
    advancePaid: Joi.number().min(0).optional(),
    paymentMode: Joi.string().valid('Cash', 'UPI', 'QR', '').optional(),
    
    notes: Joi.string().allow('').optional(),
    discount: Joi.number().min(0).default(0).messages({
      'number.min': 'Discount cannot be negative',
    }),
    items: Joi.array()
      .items(
        Joi.object().keys({
          title: Joi.string().allow('').optional(),
          serviceName: Joi.string().allow('').optional(),
          category: Joi.string().valid('Photography', 'Decoration', 'Event Planning', '').optional(),
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
    
    // Event Details
    eventType: Joi.string().valid('Wedding', 'Pre Wedding', 'Ring Ceremony', 'Birthday', 'Haldi', 'Engagement', 'Baby Shower', 'Anniversary', 'Corporate Event', 'Other', '').optional(),
    eventDate: Joi.date().allow(null).optional(),
    eventTime: Joi.string().allow('').optional(),
    eventLocation: Joi.string().allow('').optional(),
    expectedGuestCount: Joi.number().integer().min(0).optional(),
    specialRequirements: Joi.string().allow('').optional(),
    
    // Payment Details
    tokenAmount: Joi.number().min(0).optional(),
    advancePaid: Joi.number().min(0).optional(),
    paymentMode: Joi.string().valid('Cash', 'UPI', 'QR', '').optional(),

    items: Joi.array()
      .items(
        Joi.object().keys({
          _id: Joi.string().regex(objectIdPattern).optional(),
          title: Joi.string().allow('').optional(),
          serviceName: Joi.string().allow('').optional(),
          category: Joi.string().valid('Photography', 'Decoration', 'Event Planning', '').optional(),
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
