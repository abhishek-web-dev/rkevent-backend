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

    let query = { isDeleted: { $ne: true } };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = {
        isDeleted: { $ne: true },
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
    const customer = await Customer.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!customer) {
      throw new ApiError(404, 'Customer not found or has been deleted');
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
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      throw new ApiError(404, 'Customer not found or has been deleted');
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
 * Soft delete a customer by ID
 */
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!customer) {
      throw new ApiError(404, 'Customer not found or has been deleted');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Customer Deleted',
      `Customer soft deleted: ${customer.name} (${customer.email})`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Customer soft deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all soft-deleted customers (Trash)
 */
const getTrashCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = { isDeleted: true };
    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ deletedAt: -1 })
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
        'Trash customers retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a soft-deleted customer
 */
const restoreCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    );

    if (!customer) {
      throw new ApiError(404, 'Deleted customer not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Customer Restored',
      `Customer restored: ${customer.name} (${customer.email})`,
      req
    );

    res.status(200).json(new ApiResponse(200, customer, 'Customer restored successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete a customer
 */
const deleteCustomerPermanent = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Customer Permanently Deleted',
      `Customer permanently deleted: ${customer.name} (${customer.email})`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Customer permanently deleted successfully'));
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
  getTrashCustomers,
  restoreCustomer,
  deleteCustomerPermanent,
};
