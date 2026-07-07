const Joi = require('joi');

// Helper to validate Mongo Object ID
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const objectId = Joi.string().pattern(objectIdPattern).messages({
  'string.pattern.base': 'Must be a valid 24-character hexadecimal ObjectId'
});

const bookingFunctionSchema = Joi.object().keys({
  name: Joi.string().required().messages({ 'any.required': 'Function name is required' }),
  date: Joi.date().required().messages({ 'any.required': 'Function date is required' }),
  startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('').optional(),
  endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('').optional(),
  venue: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  contactPerson: Joi.string().allow('').optional(),
  contactNumber: Joi.string().allow('').optional(),
  specialInstructions: Joi.string().allow('').optional(),
  notes: Joi.string().allow('').optional()
});

const bookingServicePayloadSchema = Joi.object().keys({
  serviceId: objectId.required().messages({ 'any.required': 'Service ID is required' }),
  quotedPrice: Joi.number().min(0).required().messages({ 'any.required': 'Quoted price is required' }),
  functionIndexes: Joi.array().items(Joi.number().integer().min(0)).optional(), // Map to indexes of req.body.functions
  dynamicData: Joi.object().optional(),
  notes: Joi.string().allow('').optional()
});

const createBooking = {
  body: Joi.object().keys({
    customer: objectId.required().messages({ 'any.required': 'Customer ID is required' }),
    startDate: Joi.date().required().messages({ 'any.required': 'Start date is required' }),
    endDate: Joi.date().required().greater(Joi.ref('startDate')).messages({
      'any.required': 'End date is required',
      'date.greater': 'End date must be after start date'
    }),
    notes: Joi.string().allow('').optional(),
    templateUsed: objectId.allow(null).optional(),
    functions: Joi.array().items(bookingFunctionSchema).min(1).required().messages({
      'array.min': 'Booking must have at least one function'
    }),
    services: Joi.array().items(bookingServicePayloadSchema).optional()
  })
};

const updateBooking = {
  body: Joi.object().keys({
    status: Joi.string().valid('Draft', 'Confirmed', 'Completed', 'Cancelled').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    notes: Joi.string().allow('').optional()
  })
};

const addFunction = {
  body: bookingFunctionSchema
};

const updateFunction = {
  body: Joi.object().keys({
    name: Joi.string().optional(),
    date: Joi.date().optional(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('').optional(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).allow('').optional(),
    venue: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    contactPerson: Joi.string().allow('').optional(),
    contactNumber: Joi.string().allow('').optional(),
    specialInstructions: Joi.string().allow('').optional(),
    notes: Joi.string().allow('').optional(),
    status: Joi.string().valid('Scheduled', 'In Progress', 'Completed', 'Cancelled').optional()
  })
};

const addService = {
  body: Joi.object().keys({
    serviceId: objectId.required(),
    quotedPrice: Joi.number().min(0).required(),
    functionIds: Joi.array().items(objectId).optional(),
    dynamicData: Joi.object().optional(),
    notes: Joi.string().allow('').optional()
  })
};

const updateServiceData = {
  body: Joi.object().keys({
    quotedPrice: Joi.number().min(0).optional(),
    functionIds: Joi.array().items(objectId).optional(),
    dynamicData: Joi.object().optional(),
    notes: Joi.string().allow('').optional()
  })
};

const updateServiceWorkflow = {
  body: Joi.object().keys({
    workflowStatus: Joi.string().required().messages({ 'any.required': 'workflowStatus is required' })
  })
};

module.exports = {
  createBooking,
  updateBooking,
  addFunction,
  updateFunction,
  addService,
  updateServiceData,
  updateServiceWorkflow
};
