const Service = require('../models/Service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/logger.service');

/**
 * Create a new service template
 */
const createService = async (req, res, next) => {
  try {
    const { name, slug, description, fields, workflows, basePrice, isActive } = req.body;

    // Check if name is already taken
    const existingService = await Service.findOne({ name });
    if (existingService) {
      throw new ApiError(400, 'A service with this name already exists');
    }

    const service = await Service.create({
      name,
      slug,
      description,
      fields: fields || [],
      workflows: workflows || ['Pending', 'In Progress', 'Completed', 'Delivered'],
      basePrice: basePrice || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    // Log Activity
    await logActivity(
      req.user._id,
      'Service Created',
      `Service master configuration created: ${service.name} (Base Price: ${service.basePrice})`,
      req
    );

    res.status(201).json(new ApiResponse(201, service, 'Service created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all services (with pagination & search)
 */
const getServices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10); // High limit default for configs
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const activeOnly = req.query.activeOnly === 'true';

    let query = {};
    if (activeOnly) {
      query.isActive = true;
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    const total = await Service.countDocuments(query);
    const services = await Service.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          services,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        'Services retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get service by ID
 */
const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    res.status(200).json(new ApiResponse(200, service, 'Service retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update service by ID
 */
const updateService = async (req, res, next) => {
  try {
    // If slug is explicitly cleared or generated, validate it
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Service Updated',
      `Service master configuration updated: ${service.name}`,
      req
    );

    res.status(200).json(new ApiResponse(200, service, 'Service updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete service by ID
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Service Deleted',
      `Service master configuration deleted: ${service.name}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Service deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService
};
