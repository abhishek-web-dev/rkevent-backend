const Customer = require('../models/Customer');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/logger.service');

/**
 * Create a new customer
 */
const createCustomer = async (req, res, next) => {
  try {
    const { name, companyName, email, phone, address, notes } = req.body;

    const customer = await Customer.create({
      name,
      companyName,
      email,
      phone,
      address,
      notes,
    });

    // Log Activity
    await logActivity(
      req.user._id,
      'Customer Created',
      `Customer created: ${customer.name} (${customer.email})`,
      req
    );

    res.status(201).json(new ApiResponse(201, customer, 'Customer created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all customers with pagination & optional search filter
 */
const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        $or: [
          { name: searchRegex },
          { companyName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      };
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          customers,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        'Customers retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single customer by ID
 */
const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    res.status(200).json(new ApiResponse(200, customer, 'Customer retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update a customer by ID
 */
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Customer Updated',
      `Customer updated: ${customer.name} (${customer.email})`,
      req
    );

    res.status(200).json(new ApiResponse(200, customer, 'Customer updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a customer by ID
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Customer Deleted',
      `Customer deleted: ${customer.name} (${customer.email})`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Customer deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
