const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const CompanySettings = require('../models/CompanySettings');
const Booking = require('../models/Booking');
const BookingService = require('../models/BookingService');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { generateInvoicePdf } = require('../services/pdf.service');
const { sendInvoiceEmail } = require('../services/email.service');
const { logActivity } = require('../services/logger.service');

/**
 * Generate Next Auto-Incremented Invoice Number
 */
const getNextInvoiceNumber = async () => {
  let settings = await CompanySettings.findOne();
  if (!settings) {
    settings = { invoicePrefix: 'INV', invoiceStartNumber: 1 };
  }

  const prefix = settings.invoicePrefix || 'INV';
  const startNumber = settings.invoiceStartNumber || 1;

  // Search latest invoice with matching prefix format
  const latestInvoice = await Invoice.findOne({
    invoiceNumber: new RegExp(`^${prefix}-`, 'i'),
  }).sort({ createdAt: -1, invoiceNumber: -1 });

  let nextSeq = startNumber;

  if (latestInvoice) {
    const parts = latestInvoice.invoiceNumber.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  return `${prefix}-${String(nextSeq).padStart(4, '0')}`;
};

/**
 * Create a new invoice
 */
const createInvoice = async (req, res, next) => {
  try {
    const {
      dueDate,
      customer,
      booking,
      customerDetails,
      notes,
      discount,
      items,
      taxConfig,
      
      // Event Details (Legacy)
      eventType,
      eventDate,
      eventTime,
      eventLocation,
      expectedGuestCount,
      specialRequirements,
      
      // Payment Details
      tokenAmount,
      advancePaid,
      paymentMode,
    } = req.body;

    let finalCustomerId;
    let customerNameForLog = '';
    let bookingObj = null;

    // 1. Resolve Booking if linked
    if (booking) {
      bookingObj = await Booking.findById(booking);
      if (!bookingObj) {
        throw new ApiError(404, 'Booking not found');
      }
    }

    // 2. Resolve Customer ID
    if (customer && typeof customer === 'string') {
      const customerObj = await Customer.findById(customer);
      if (!customerObj) {
        throw new ApiError(404, 'Customer not found');
      }
      finalCustomerId = customerObj._id;
      customerNameForLog = customerObj.name;
    } else if (bookingObj) {
      // Auto-extract customer from booking if customer parameter is omitted
      const customerObj = await Customer.findById(bookingObj.customer);
      if (customerObj) {
        finalCustomerId = customerObj._id;
        customerNameForLog = customerObj.name;
      }
    } else if (customerDetails && customerDetails.name && customerDetails.phone) {
      // Legacy dynamic customer creation
      let customerObj = await Customer.findOne({
        phone: customerDetails.phone,
        isDeleted: { $ne: true },
      });

      if (customerObj) {
        if (customerDetails.saveCustomer !== false) {
          customerObj.name = customerDetails.name;
          if (customerDetails.alternatePhone !== undefined) customerObj.alternatePhone = customerDetails.alternatePhone;
          if (customerDetails.email !== undefined) customerObj.email = customerDetails.email;
          if (customerDetails.address !== undefined) customerObj.address = customerDetails.address;
          if (customerDetails.city !== undefined) customerObj.city = customerDetails.city;
          if (customerDetails.state !== undefined) customerObj.state = customerDetails.state;
          if (customerDetails.pincode !== undefined) customerObj.pincode = customerDetails.pincode;
          await customerObj.save();
        }
        finalCustomerId = customerObj._id;
        customerNameForLog = customerObj.name;
      } else {
        customerObj = new Customer({
          name: customerDetails.name,
          phone: customerDetails.phone,
          alternatePhone: customerDetails.alternatePhone || '',
          email: customerDetails.email || '',
          address: customerDetails.address || '',
          city: customerDetails.city || '',
          state: customerDetails.state || '',
          pincode: customerDetails.pincode || '',
        });
        await customerObj.save();
        finalCustomerId = customerObj._id;
        customerNameForLog = customerObj.name;
      }
    } else {
      throw new ApiError(400, 'Customer reference or customerDetails are required');
    }

    // 3. Resolve items (pulling from booking if not provided)
    let invoiceItems = [];
    if (items && items.length > 0) {
      invoiceItems = items;
    } else if (bookingObj) {
      const bookingServices = await BookingService.find({ booking: bookingObj._id });
      invoiceItems = bookingServices.map(bs => ({
        title: bs.serviceSnapshot?.name || 'Service',
        serviceName: bs.serviceSnapshot?.name || 'Service',
        quantity: 1,
        price: bs.quotedPrice,
        amount: bs.quotedPrice,
        bookingService: bs._id
      }));
    }

    // Auto-create Booking from timeline functions if provided
    const { functions } = req.body;
    if (!bookingObj && functions && functions.length > 0) {
      const Booking = require('../models/Booking');
      const BookingFunction = require('../models/BookingFunction');
      const BookingService = require('../models/BookingService');

      const getNextBookingNumber = async () => {
        const latest = await Booking.findOne().sort({ createdAt: -1 });
        let nextSeq = 1;
        if (latest && latest.bookingNumber) {
          const num = parseInt(latest.bookingNumber.replace('BKG-', ''), 10);
          if (!isNaN(num)) nextSeq = num + 1;
        }
        return `BKG-${String(nextSeq).padStart(4, '0')}`;
      };

      const bookingNumber = await getNextBookingNumber();
      const newBooking = new Booking({
        bookingNumber,
        customer: finalCustomerId,
        startDate: eventDate ? new Date(eventDate) : new Date(),
        endDate: eventDate ? new Date(eventDate) : new Date(),
        status: 'Confirmed',
        notes: notes || 'Auto-created from Invoice'
      });
      await newBooking.save();

      // Spawn timeline functions
      const funcPromises = functions.map(fn => {
        const bFn = new BookingFunction({
          booking: newBooking._id,
          name: fn.name,
          date: fn.date || eventDate || new Date().toISOString().split('T')[0],
          startTime: fn.startTime || fn.time || '10:00',
          endTime: fn.endTime || '14:00',
          venue: fn.venue || eventLocation || '',
          notes: fn.notes || ''
        });
        return bFn.save();
      });
      await Promise.all(funcPromises);

      // Create Booking Services from manual invoice items to keep them in sync
      const Service = require('../models/Service');
      const allServices = await Service.find({ isActive: true });
      const defaultService = allServices[0];

      const svcPromises = [];
      for (const item of invoiceItems) {
        const itemName = item.title || item.serviceName || 'Standard Service';
        let matchedService = allServices.find(s => s.name.toLowerCase() === itemName.toLowerCase());
        if (!matchedService) {
          matchedService = defaultService;
        }

        if (!matchedService) {
          throw new ApiError(400, 'Please seed services master database first');
        }

        // 1. Create the main billing service card (e.g. Wedding Photography)
        const bSvc = new BookingService({
          booking: newBooking._id,
          serviceId: matchedService._id,
          serviceSnapshot: {
            name: itemName,
            slug: matchedService.slug || 'generic-service',
            fields: matchedService.fields || []
          },
          quotedPrice: item.price,
          dynamicData: item.specs || {},
          workflowStatus: 'Pending'
        });
        svcPromises.push(bSvc.save());

        // 2. Check if nested deliverables are enabled
        if (item.specs) {
          // Album
          if (item.specs.album && item.specs.album.selected) {
            const albumService = allServices.find(s => s.name.toLowerCase().includes('album')) || defaultService;
            const bSvcAlbum = new BookingService({
              booking: newBooking._id,
              serviceId: albumService._id,
              serviceSnapshot: {
                name: 'Premium Wedding Album',
                slug: albumService.slug || 'premium-wedding-album',
                fields: albumService.fields || []
              },
              quotedPrice: 0,
              dynamicData: item.specs.album,
              workflowStatus: 'Pending'
            });
            svcPromises.push(bSvcAlbum.save());
          }

          // Traditional Video
          if (item.specs.video && item.specs.video.selected) {
            const videoService = allServices.find(s => s.name.toLowerCase().includes('traditional')) || defaultService;
            const bSvcVideo = new BookingService({
              booking: newBooking._id,
              serviceId: videoService._id,
              serviceSnapshot: {
                name: 'Traditional Video Deliverables',
                slug: videoService.slug || 'traditional-video-deliverables',
                fields: videoService.fields || []
              },
              quotedPrice: 0,
              dynamicData: item.specs.video,
              workflowStatus: 'Pending'
            });
            svcPromises.push(bSvcVideo.save());
          }

          // Cinematic Video
          if (item.specs.cinematic && item.specs.cinematic.selected) {
            const cinematicService = allServices.find(s => s.name.toLowerCase().includes('cinematic')) || defaultService;
            const bSvcCinematic = new BookingService({
              booking: newBooking._id,
              serviceId: cinematicService._id,
              serviceSnapshot: {
                name: 'Cinematic Movie & Reels',
                slug: cinematicService.slug || 'cinematic-movie-reels',
                fields: cinematicService.fields || []
              },
              quotedPrice: 0,
              dynamicData: item.specs.cinematic,
              workflowStatus: 'Pending'
            });
            svcPromises.push(bSvcCinematic.save());
          }

          // Drone Service
          if (item.specs.drone && item.specs.drone.selected) {
            const droneService = allServices.find(s => s.name.toLowerCase().includes('drone')) || defaultService;
            const bSvcDrone = new BookingService({
              booking: newBooking._id,
              serviceId: droneService._id,
              serviceSnapshot: {
                name: 'Drone Shoot',
                slug: droneService.slug || 'drone-shoot',
                fields: droneService.fields || []
              },
              quotedPrice: 0,
              dynamicData: item.specs.drone,
              workflowStatus: 'Pending'
            });
            svcPromises.push(bSvcDrone.save());
          }

          // Custom Deliverables checklist items
          if (item.specs.customDeliverables && item.specs.customDeliverables.length > 0) {
            for (const cust of item.specs.customDeliverables) {
              if (cust.selected) {
                let matchedCustService = allServices.find(s => s.name.toLowerCase() === cust.name.toLowerCase());
                if (!matchedCustService) {
                  matchedCustService = defaultService;
                }
                const bSvcCust = new BookingService({
                  booking: newBooking._id,
                  serviceId: matchedCustService._id,
                  serviceSnapshot: {
                    name: cust.name,
                    slug: matchedCustService.slug || 'custom-deliverable',
                    fields: matchedCustService.fields || []
                  },
                  quotedPrice: 0,
                  dynamicData: { notes: cust.notes },
                  workflowStatus: 'Pending'
                });
                svcPromises.push(bSvcCust.save());
              }
            }
          }
        }
      }
      await Promise.all(svcPromises);

      bookingObj = newBooking;
    }

    // 4. Generate Next auto invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // 5. Construct Invoice record
    const invoice = new Invoice({
      invoiceNumber,
      dueDate,
      customer: finalCustomerId,
      booking: bookingObj ? bookingObj._id : null,
      notes,
      discount: discount || 0,
      items: invoiceItems,
      taxConfig: taxConfig || { taxType: 'None' },
      
      // Event Info (Legacy compatibility / fallback)
      eventType: eventType || (bookingObj ? 'Event' : ''),
      eventDate: eventDate || (bookingObj ? bookingObj.startDate : null),
      eventTime: eventTime || '',
      eventLocation: eventLocation || (bookingObj ? bookingObj.notes || '' : ''),
      expectedGuestCount: expectedGuestCount || 0,
      specialRequirements: specialRequirements || '',
      
      // Payment Details
      tokenAmount: tokenAmount || 0,
      advancePaid: advancePaid || tokenAmount || 0,
      paymentMode: paymentMode || '',
    });

    // 6. Save Invoice (triggers calculations pre-save)
    await invoice.save();

    // 7. Automate payment ledger registration if advance/token paid
    const finalToken = tokenAmount || advancePaid || 0;
    if (finalToken > 0) {
      const Payment = require('../models/Payment');
      const payment = new Payment({
        invoiceId: invoice._id,
        amount: finalToken,
        paymentMethod: paymentMode || 'UPI',
        transactionId: 'Advance Token',
        notes: 'Automatically recorded advance payment during event booking',
      });
      await payment.save();
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Created',
      `Invoice created: ${invoice.invoiceNumber} for customer: ${customerNameForLog}`,
      req
    );

    // Retrieve populated invoice for response
    const populatedInvoice = await Invoice.findById(invoice._id).populate('customer').populate('booking');

    res.status(201).json(new ApiResponse(201, populatedInvoice, 'Invoice created successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices with filtering, searching, and pagination
 */
const getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const { status, startDate, endDate, search } = req.query;

    const query = { isDeleted: { $ne: true } };

    // 1. Filter by Status
    if (status) {
      query.status = status;
    }

    // 2. Filter by Date Range (invoiceDate)
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    // 3. Search by invoice number or customer name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Look up customer IDs matching the name search (excluding deleted)
      const matchingCustomers = await Customer.find({
        name: searchRegex,
        isDeleted: { $ne: true },
      }).select('_id');
      const customerIds = matchingCustomers.map((c) => c._id);

      query.$or = [
        { invoiceNumber: searchRegex },
        { customer: { $in: customerIds } },
      ];
    }

    const total = await Invoice.countDocuments(query);
    
    const invoices = await Invoice.find(query)
      .populate('customer', 'name companyName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          invoices,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        'Invoices retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get invoice details by ID
 */
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('customer', 'name companyName email phone address notes')
      .populate({
        path: 'booking',
        select: 'bookingNumber startDate endDate status notes'
      });
    
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    const invoiceObj = invoice.toObject();
    if (invoiceObj.booking) {
      const BookingFunction = require('../models/BookingFunction');
      invoiceObj.booking.functions = await BookingFunction.find({ booking: invoice.booking._id }).sort({ date: 1, startTime: 1 });
    }

    res.status(200).json(new ApiResponse(200, invoiceObj, 'Invoice retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update invoice details by ID
 */
const updateInvoice = async (req, res, next) => {
  try {
    const {
      dueDate,
      customer,
      booking,
      notes,
      discount,
      items,
      status,
      taxConfig,

      // Event details
      eventType,
      eventDate,
      eventTime,
      eventLocation,
      expectedGuestCount,
      specialRequirements,

      // Payment details
      tokenAmount,
      advancePaid,
      paymentMode,
    } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    if (customer) {
      const customerObj = await Customer.findOne({ _id: customer, isDeleted: { $ne: true } });
      if (!customerObj) {
        throw new ApiError(404, 'Customer not found or has been deleted');
      }
      invoice.customer = customer;
    }

    if (booking !== undefined) {
      if (booking) {
        const bookingObj = await Booking.findOne({ _id: booking, isDeleted: { $ne: true } });
        if (!bookingObj) {
          throw new ApiError(404, 'Booking not found');
        }
        invoice.booking = booking;
      } else {
        invoice.booking = null;
      }
    }

    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (discount !== undefined) invoice.discount = discount;
    if (items) invoice.items = items;
    if (status) invoice.status = status;

    if (taxConfig) {
      invoice.taxConfig = {
        ...invoice.taxConfig.toObject(),
        ...taxConfig
      };
    }

    // Event updates
    if (eventType !== undefined) invoice.eventType = eventType;
    if (eventDate !== undefined) invoice.eventDate = eventDate;
    if (eventTime !== undefined) invoice.eventTime = eventTime;
    if (eventLocation !== undefined) invoice.eventLocation = eventLocation;
    if (expectedGuestCount !== undefined) invoice.expectedGuestCount = expectedGuestCount;
    if (specialRequirements !== undefined) invoice.specialRequirements = specialRequirements;

    // Payment updates
    if (tokenAmount !== undefined) invoice.tokenAmount = tokenAmount;
    if (advancePaid !== undefined) invoice.advancePaid = advancePaid;
    if (paymentMode !== undefined) invoice.paymentMode = paymentMode;

    // Save triggers recalculation in pre('save') schema hook
    await invoice.save();

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Updated',
      `Invoice updated: ${invoice.invoiceNumber}`,
      req
    );

    const updatedInvoice = await Invoice.findOne({ _id: invoice._id, isDeleted: { $ne: true } })
      .populate('customer')
      .populate('booking');
    res.status(200).json(new ApiResponse(200, updatedInvoice, 'Invoice updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete invoice by ID
 */
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Deleted',
      `Invoice soft deleted: ${invoice.invoiceNumber}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Invoice soft deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and stream PDF invoice
 */
const downloadPdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('customer');
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    let companySettings = await CompanySettings.findOne();
    if (!companySettings) {
      companySettings = {
        companyName: 'RK Event Group',
        email: 'info@rkevent.com',
        phone: '+91 99999 99999',
        address: 'RK Event Headquarters, New Delhi, India',
        website: 'https://rkevent.com',
      };
    }

    const pdfBuffer = await generateInvoicePdf(invoice, companySettings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`
    );
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Generate PDF and send invoice via Email
 */
const emailInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('customer');
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    let companySettings = await CompanySettings.findOne();
    if (!companySettings) {
      companySettings = {
        companyName: 'RK Event Group',
        email: 'info@rkevent.com',
        phone: '+91 99999 99999',
        address: 'RK Event Headquarters, New Delhi, India',
        website: 'https://rkevent.com',
      };
    }

    const pdfBuffer = await generateInvoicePdf(invoice, companySettings);

    await sendInvoiceEmail(invoice.customer.email, invoice.customer.name, invoice, pdfBuffer);

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Emailed',
      `Invoice ${invoice.invoiceNumber} emailed to ${invoice.customer.email}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Invoice emailed successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Generate WhatsApp share link with invoice details
 */
const getWhatsAppLink = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('customer');
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    let companySettings = await CompanySettings.findOne();
    const companyName = companySettings ? companySettings.companyName : 'RK Event Group';

    const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString();
    const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString();

    // Construct a standard, highly informative WhatsApp message
    const message = `Hello ${invoice.customer.name},\n\n` +
      `This is a message from *${companyName}* regarding your invoice *${invoice.invoiceNumber}*.\n\n` +
      `*Invoice Details:*\n` +
      `- Issue Date: ${formattedDate}\n` +
      `- Due Date: ${formattedDueDate}\n` +
      `- Total Amount: ₹${invoice.totalAmount.toFixed(2)}\n` +
      `- Paid Amount: ₹${invoice.paidAmount.toFixed(2)}\n` +
      `- Balance Due: *₹${invoice.pendingAmount.toFixed(2)}*\n` +
      `- Payment Status: *${invoice.status.toUpperCase()}*\n\n` +
      `Please clear the balance as soon as possible. Thank you for your business!`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = invoice.customer.phone.replace(/[^0-9]/g, ''); // strip non-numeric characters
    
    // Standard WhatsApp wa.me links
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          whatsappLink,
          messageText: message,
        },
        'WhatsApp share link generated successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all soft-deleted invoices (Trash)
 */
const getTrashInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const query = { isDeleted: true };
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name companyName email')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          invoices,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        'Trash invoices retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a soft-deleted invoice
 */
const restoreInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
      { new: true }
    );

    if (!invoice) {
      throw new ApiError(404, 'Deleted invoice not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Restored',
      `Invoice restored: ${invoice.invoiceNumber}`,
      req
    );

    res.status(200).json(new ApiResponse(200, invoice, 'Invoice restored successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Permanently delete an invoice
 */
const deleteInvoicePermanent = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Permanently Deleted',
      `Invoice permanently deleted: ${invoice.invoiceNumber}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Invoice permanently deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  downloadPdf,
  emailInvoice,
  getWhatsAppLink,
  getTrashInvoices,
  restoreInvoice,
  deleteInvoicePermanent,
};
