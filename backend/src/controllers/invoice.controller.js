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
    const { dueDate, customer, notes, discount, items } = req.body;

    // Verify Customer exists
    const customerObj = await Customer.findById(customer);
    if (!customerObj) {
      throw new ApiError(404, 'Customer not found');
    }

    // Auto-generate invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = new Invoice({
      invoiceNumber,
      dueDate,
      customer,
      notes,
      discount,
      items,
    });

    // Save triggers calculations in pre('save') schema hook
    await invoice.save();

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Created',
      `Invoice created: ${invoice.invoiceNumber} for customer: ${customerObj.name}`,
      req
    );

    res.status(201).json(new ApiResponse(201, invoice, 'Invoice created successfully'));
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

    const query = {};

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
      
      // Look up customer IDs matching the name search
      const matchingCustomers = await Customer.find({
        name: searchRegex,
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
    const invoice = await Invoice.findById(req.params.id).populate(
      'customer',
      'name companyName email phone address notes'
    );
    
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
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
    const { dueDate, customer, notes, discount, items, status } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    if (customer) {
      const customerObj = await Customer.findById(customer);
      if (!customerObj) {
        throw new ApiError(404, 'Customer not found');
      }
      invoice.customer = customer;
    }

    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    if (discount !== undefined) invoice.discount = discount;
    if (items) invoice.items = items;
    if (status) invoice.status = status;

    // Save triggers recalculation in pre('save') schema hook
    await invoice.save();

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Updated',
      `Invoice updated: ${invoice.invoiceNumber}`,
      req
    );

    const updatedInvoice = await Invoice.findById(invoice._id).populate('customer');
    res.status(200).json(new ApiResponse(200, updatedInvoice, 'Invoice updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete invoice by ID
 */
const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
    }

    // Log Activity
    await logActivity(
      req.user._id,
      'Invoice Deleted',
      `Invoice deleted: ${invoice.invoiceNumber}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Invoice deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and stream PDF invoice
 */
const downloadPdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
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
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
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
    const invoice = await Invoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found');
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

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  downloadPdf,
  emailInvoice,
  getWhatsAppLink,
};
