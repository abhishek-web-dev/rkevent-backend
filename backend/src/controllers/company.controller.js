const CompanySettings = require('../models/CompanySettings');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { uploadToCloudinary } = require('../services/cloudinary.service');
const { logActivity } = require('../services/logger.service');

/**
 * Get company settings.
 * Creates a default document if none exists yet.
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    
    // Auto-create default settings if database is blank
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'RK Event Jhansi',
        ownerName: 'Rahul Kumar',
        email: 'Rkeventrajgarh@gmail.com',
        phone: '9369649071',
        address: 'In front of Punjab National Bank, Rajgarh, Jhansi',
        upiId: '9169659965-5@ybl',
        website: 'https://rkevent.com',
        invoicePrefix: 'RKE',
        invoiceStartNumber: 1,
      });
    }

    res.status(200).json(new ApiResponse(200, settings, 'Company settings retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update company settings.
 * Supports updating the logo image via multipart file upload.
 */
const updateSettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings();
    }

    const {
      companyName,
      email,
      phone,
      address,
      website,
      invoicePrefix,
      invoiceStartNumber,
      ownerName,
      upiId,
    } = req.body;

    // Apply values
    if (companyName) settings.companyName = companyName;
    if (email) settings.email = email;
    if (phone) settings.phone = phone;
    if (address) settings.address = address;
    if (website !== undefined) settings.website = website;
    if (invoicePrefix) settings.invoicePrefix = invoicePrefix.toUpperCase().trim();
    if (invoiceStartNumber !== undefined) settings.invoiceStartNumber = Number(invoiceStartNumber);
    if (ownerName !== undefined) settings.ownerName = ownerName;
    if (upiId !== undefined) settings.upiId = upiId;

    // Upload files to Cloudinary if provided
    if (req.files) {
      if (req.files['logo'] && req.files['logo'][0]) {
        const uploadResult = await uploadToCloudinary(req.files['logo'][0].buffer, 'rk-event-invoice/company');
        settings.companyLogo = uploadResult.secure_url;
      }
      if (req.files['signature'] && req.files['signature'][0]) {
        const uploadResult = await uploadToCloudinary(req.files['signature'][0].buffer, 'rk-event-invoice/company');
        settings.signatureUrl = uploadResult.secure_url;
      }
    }

    const updatedSettings = await settings.save();

    // Log Activity
    await logActivity(
      req.user ? req.user._id : null,
      'Company Settings Updated',
      `Company settings updated: ${settings.companyName}`,
      req
    );

    res.status(200).json(new ApiResponse(200, updatedSettings, 'Company settings updated successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
