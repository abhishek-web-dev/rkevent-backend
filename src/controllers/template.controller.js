const FunctionTemplate = require('../models/FunctionTemplate');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/logger.service');

/**
 * Create a new function template
 */
const createTemplate = async (req, res, next) => {
  try {
    const { name, description, functions, isActive } = req.body;

    // Check if template name already exists
    const existingTemplate = await FunctionTemplate.findOne({ name });
    if (existingTemplate) {
      throw new ApiError(400, 'A template with this name already exists');
    }

    const template = await FunctionTemplate.create({
      name,
      description,
      functions: functions || [],
      isActive: isActive !== undefined ? isActive : true
    });

    // Log Activity
    await logActivity(
      req.user._id,
      'Template Created',
      `Function template created: ${template.name} (${template.functions.length} functions)`,
      req
    );

    res.status(201).json(new ApiResponse(201, template, 'Template created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all function templates
 */
const getTemplates = async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const query = activeOnly ? { isActive: true } : {};

    const templates = await FunctionTemplate.find(query).sort({ name: 1 });

    res.status(200).json(new ApiResponse(200, templates, 'Templates retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get template by ID
 */
const getTemplate = async (req, res, next) => {
  try {
    const template = await FunctionTemplate.findById(req.params.id);
    if (!template) {
      throw new ApiError(404, 'Template not found');
    }

    res.status(200).json(new ApiResponse(200, template, 'Template retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update template by ID
 */
const updateTemplate = async (req, res, next) => {
  try {
    const template = await FunctionTemplate.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new ApiError(404, 'Template not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Template Updated',
      `Function template updated: ${template.name}`,
      req
    );

    res.status(200).json(new ApiResponse(200, template, 'Template updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete template by ID
 */
const deleteTemplate = async (req, res, next) => {
  try {
    const template = await FunctionTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      throw new ApiError(404, 'Template not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Template Deleted',
      `Function template deleted: ${template.name}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Template deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
};
