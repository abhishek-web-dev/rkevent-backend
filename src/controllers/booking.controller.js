const Booking = require('../models/Booking');
const BookingFunction = require('../models/BookingFunction');
const BookingService = require('../models/BookingService');
const Service = require('../models/Service');
const FunctionTemplate = require('../models/FunctionTemplate');
const Customer = require('../models/Customer');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/logger.service');

/**
 * Generate sequential booking number (e.g. BKG-0001)
 */
const getNextBookingNumber = async () => {
  const prefix = 'BKG';
  const latestBooking = await Booking.findOne({
    bookingNumber: new RegExp(`^${prefix}-`, 'i'),
  }).sort({ createdAt: -1, bookingNumber: -1 });

  let nextSeq = 1;

  if (latestBooking) {
    const parts = latestBooking.bookingNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
};

/**
 * Create a new booking
 */
const createBooking = async (req, res, next) => {
  try {
    const { customer, startDate, endDate, notes, templateUsed, functions, services } = req.body;

    // 1. Verify customer exists
    const customerExists = await Customer.findOne({ _id: customer, isDeleted: { $ne: true } });
    if (!customerExists) {
      throw new ApiError(404, 'Customer not found');
    }

    // 2. Generate Booking number
    const bookingNumber = await getNextBookingNumber();

    // 3. Create Booking Header
    const booking = await Booking.create({
      bookingNumber,
      customer,
      startDate,
      endDate,
      notes,
      templateUsed: templateUsed || null,
      status: 'Draft'
    });

    // 4. Create Booking Functions (if a template is selected, we can also inject template defaults)
    const savedFunctions = [];
    const templateFunctionsToInsert = [];

    // If template was selected, we read the template default functions
    if (templateUsed) {
      const template = await FunctionTemplate.findById(templateUsed);
      if (template) {
        template.functions.forEach((tf) => {
          // Calculate target date based on offset from startDate
          const functionDate = new Date(startDate);
          functionDate.setDate(functionDate.getDate() + tf.offsetDays);
          
          templateFunctionsToInsert.push({
            booking: booking._id,
            name: tf.name,
            date: functionDate,
            startTime: tf.defaultStartTime,
            endTime: tf.defaultEndTime,
            notes: tf.notes,
            status: 'Scheduled'
          });
        });
      }
    }

    // Append manual functions submitted in payload
    if (functions && Array.isArray(functions)) {
      functions.forEach((fn) => {
        templateFunctionsToInsert.push({
          booking: booking._id,
          name: fn.name,
          date: fn.date,
          startTime: fn.startTime || '10:00',
          endTime: fn.endTime || '14:00',
          venue: fn.venue || '',
          address: fn.address || '',
          contactPerson: fn.contactPerson || '',
          contactNumber: fn.contactNumber || '',
          specialInstructions: fn.specialInstructions || '',
          notes: fn.notes || '',
          status: 'Scheduled'
        });
      });
    }

    // Insert all functions in DB
    if (templateFunctionsToInsert.length > 0) {
      const docs = await BookingFunction.insertMany(templateFunctionsToInsert);
      savedFunctions.push(...docs);
    }

    // 5. Create Booking Services
    const savedServices = [];
    if (services && Array.isArray(services)) {
      for (const item of services) {
        const serviceConfig = await Service.findById(item.serviceId);
        if (!serviceConfig) continue;

        // Map function indexes to inserted function IDs
        const functionIds = [];
        if (item.functionIndexes && Array.isArray(item.functionIndexes)) {
          item.functionIndexes.forEach((idx) => {
            if (savedFunctions[idx]) {
              functionIds.push(savedFunctions[idx]._id);
            }
          });
        }

        const bService = await BookingService.create({
          booking: booking._id,
          serviceId: item.serviceId,
          serviceSnapshot: {
            name: serviceConfig.name,
            slug: serviceConfig.slug,
            fields: serviceConfig.fields
          },
          functionIds,
          quotedPrice: item.quotedPrice,
          workflowStatus: serviceConfig.workflows[0] || 'Pending',
          dynamicData: item.dynamicData || {},
          notes: item.notes || ''
        });

        // Initialize history
        bService.workflowHistory.push({
          status: bService.workflowStatus,
          updatedBy: req.user._id
        });
        await bService.save();

        savedServices.push(bService);
      }
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Booking Created',
      `Booking ${booking.bookingNumber} created for customer ${customerExists.name}`,
      req
    );

    res.status(201).json(new ApiResponse(201, {
      booking,
      functions: savedFunctions,
      services: savedServices
    }, 'Booking created successfully'));

  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings with pagination & search filters
 */
const getBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let query = { isDeleted: { $ne: true } };

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // Subquery on Customer to search by name
      const matchingCustomers = await Customer.find({ name: searchRegex }).select('_id');
      const customerIds = matchingCustomers.map(c => c._id);

      query.$or = [
        { bookingNumber: searchRegex },
        { customer: { $in: customerIds } }
      ];
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customer', 'name phone email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(new ApiResponse(200, {
      bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, 'Bookings retrieved successfully'));

  } catch (error) {
    next(error);
  }
};

/**
 * Get booking details (Header + populated Functions + Services)
 */
const getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('customer', 'name phone email address companyName alternatePhone');
    
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const functions = await BookingFunction.find({ booking: booking._id }).sort({ date: 1, startTime: 1 });
    const services = await BookingService.find({ booking: booking._id })
      .populate('serviceId', 'name slug basePrice')
      .populate('assignedStaff', 'name email role');

    res.status(200).json(new ApiResponse(200, {
      booking,
      functions,
      services
    }, 'Booking details retrieved successfully'));

  } catch (error) {
    next(error);
  }
};

/**
 * Update Booking Header details
 */
const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Booking Updated',
      `Booking header ${booking.bookingNumber} updated`,
      req
    );

    res.status(200).json(new ApiResponse(200, booking, 'Booking header updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a booking
 */
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Booking Deleted',
      `Booking ${booking.bookingNumber} soft deleted`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Booking soft deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/* --- Booking Function Sub-Operations --- */

/**
 * Add a function to a Booking
 */
const addFunction = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: { $ne: true } });
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const bFunction = await BookingFunction.create({
      booking: bookingId,
      ...req.body
    });

    res.status(201).json(new ApiResponse(201, bFunction, 'Function added successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update a specific Booking Function
 */
const updateFunction = async (req, res, next) => {
  try {
    const bFunction = await BookingFunction.findByIdAndUpdate(
      req.params.functionId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!bFunction) {
      throw new ApiError(404, 'Function not found');
    }

    res.status(200).json(new ApiResponse(200, bFunction, 'Function updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a specific Booking Function
 */
const deleteFunction = async (req, res, next) => {
  try {
    const bFunction = await BookingFunction.findByIdAndDelete(req.params.functionId);
    if (!bFunction) {
      throw new ApiError(404, 'Function not found');
    }

    // Cleanup: Pull deleted function reference from all BookingServices linked to this booking
    await BookingService.updateMany(
      { booking: bFunction.booking },
      { $pull: { functionIds: bFunction._id } }
    );

    res.status(200).json(new ApiResponse(200, null, 'Function deleted and mappings cleaned successfully'));
  } catch (error) {
    next(error);
  }
};

/* --- Booking Service Sub-Operations --- */

/**
 * Add a service configuration to a Booking
 */
const addService = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findOne({ _id: bookingId, isDeleted: { $ne: true } });
    if (!booking) {
      throw new ApiError(404, 'Booking not found');
    }

    const { serviceId, quotedPrice, functionIds, dynamicData, notes } = req.body;

    const serviceConfig = await Service.findById(serviceId);
    if (!serviceConfig) {
      throw new ApiError(404, 'Service configuration master not found');
    }

    const bService = await BookingService.create({
      booking: bookingId,
      serviceId,
      serviceSnapshot: {
        name: serviceConfig.name,
        slug: serviceConfig.slug,
        fields: serviceConfig.fields
      },
      functionIds: functionIds || [],
      quotedPrice,
      workflowStatus: serviceConfig.workflows[0] || 'Pending',
      dynamicData: dynamicData || {},
      notes: notes || ''
    });

    // Log workflow creation
    bService.workflowHistory.push({
      status: bService.workflowStatus,
      updatedBy: req.user._id
    });
    await bService.save();

    res.status(201).json(new ApiResponse(201, bService, 'Service added to booking successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update Booking Service details and dynamic data
 */
const updateServiceData = async (req, res, next) => {
  try {
    const bService = await BookingService.findByIdAndUpdate(
      req.params.bookingServiceId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!bService) {
      throw new ApiError(404, 'Booking service record not found');
    }

    res.status(200).json(new ApiResponse(200, bService, 'Booking service updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update dynamic service workflow status
 */
const updateServiceWorkflow = async (req, res, next) => {
  try {
    const { workflowStatus } = req.body;

    const bService = await BookingService.findById(req.params.bookingServiceId);
    if (!bService) {
      throw new ApiError(404, 'Booking service record not found');
    }

    bService.workflowStatus = workflowStatus;
    bService.workflowHistory.push({
      status: workflowStatus,
      updatedBy: req.user._id,
      updatedAt: new Date()
    });

    await bService.save();

    // Log Activity
    await logActivity(
      req.user._id,
      'Workflow Updated',
      `Booking Service status updated to "${workflowStatus}"`,
      req
    );

    res.status(200).json(new ApiResponse(200, bService, 'Service workflow status updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete service configuration from a Booking
 */
const deleteService = async (req, res, next) => {
  try {
    const bService = await BookingService.findByIdAndDelete(req.params.bookingServiceId);
    if (!bService) {
      throw new ApiError(404, 'Booking service record not found');
    }

    res.status(200).json(new ApiResponse(200, null, 'Service removed from booking successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  addFunction,
  updateFunction,
  deleteFunction,
  addService,
  updateServiceData,
  updateServiceWorkflow,
  deleteService
};
