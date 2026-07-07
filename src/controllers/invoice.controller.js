const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const CompanySettings = require('../models/CompanySettings');
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
      customerDetails,
      notes,
      discount,
      items,
      
      // Event Details
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

    // 1. Resolve Customer ID
    if (customer && typeof customer === 'string') {
      const customerObj = await Customer.findById(customer);
      if (!customerObj) {
        throw new ApiError(404, 'Customer not found');
      }
      finalCustomerId = customerObj._id;
      customerNameForLog = customerObj.name;
    } else if (customerDetails && customerDetails.name && customerDetails.phone) {
      // Find customer by phone (not deleted)
      let customerObj = await Customer.findOne({
        phone: customerDetails.phone,
        isDeleted: { $ne: true },
      });

      if (customerObj) {
        // Customer exists, update details if requested
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
        // Create dynamic customer
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

    // 2. Generate Next auto invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // 3. Construct Invoice record
    const invoice = new Invoice({
      invoiceNumber,
      dueDate,
      customer: finalCustomerId,
      notes,
      discount,
      items,
      
      // Event Info
      eventType,
      eventDate,
      eventTime,
      eventLocation,
      expectedGuestCount,
      specialRequirements,
      
      // Payment Details
      tokenAmount: tokenAmount || 0,
      advancePaid: advancePaid || tokenAmount || 0,
      paymentMode: paymentMode || '',
    });

    // 4. Save Invoice (triggers calculations pre-save)
    await invoice.save();

    // 5. Automate payment ledger registration if advance/token paid
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
    const populatedInvoice = await Invoice.findById(invoice._id).populate('customer');

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
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate(
      'customer',
      'name companyName email phone address notes'
    );
    
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    res.status(200).json(new ApiResponse(200, invoice, 'Invoice retrieved successfully'));
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
      notes,
      discount,
      items,
      status,

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

    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (discount !== undefined) invoice.discount = discount;
    if (items) invoice.items = items;
    if (status) invoice.status = status;

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

    const updatedInvoice = await Invoice.findOne({ _id: invoice._id, isDeleted: { $ne: true } }).populate('customer');
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
      `- Total Amount: $${invoice.totalAmount.toFixed(2)}\n` +
      `- Paid Amount: $${invoice.paidAmount.toFixed(2)}\n` +
      `- Balance Due: *$${invoice.pendingAmount.toFixed(2)}*\n` +
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
