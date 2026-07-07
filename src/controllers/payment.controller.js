const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/logger.service');

/**
 * Add a new payment transaction against an invoice
 */
const addPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, transactionId, notes, paymentDate } = req.body;

    // Check if invoice exists and is active
    const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: { $ne: true } });
    if (!invoice) {
      throw new ApiError(404, 'Invoice not found or has been deleted');
    }

    // Verify payment amount doesn't exceed pending balance
    if (amount > invoice.pendingAmount) {
      throw new ApiError(
        400,
        `Payment amount (₹${amount}) exceeds invoice pending balance (₹${invoice.pendingAmount})`
      );
    }

    // Create payment
    const payment = await Payment.create({
      invoiceId,
      amount,
      paymentMethod,
      transactionId,
      notes,
      paymentDate: paymentDate || new Date(),
    });

    // Update invoice paidAmount
    invoice.paidAmount += amount;
    // Save triggers calculations in pre('save') schema hook
    await invoice.save();

    // Log Activity
    await logActivity(
      req.user._id,
      'Payment Received',
      `Payment of ₹${amount} received for invoice ${invoice.invoiceNumber} (Method: ${paymentMethod})`,
      req
    );

    res.status(201).json(new ApiResponse(201, payment, 'Payment added successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing payment transaction
 */
const updatePayment = async (req, res, next) => {
  try {
    const { amount, paymentMethod, transactionId, notes, paymentDate } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      throw new ApiError(404, 'Payment record not found');
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) {
      throw new ApiError(404, 'Associated invoice not found');
    }

    if (amount !== undefined) {
      // Determine the delta to adjust the invoice
      const delta = amount - payment.amount;

      // Ensure the new payment amount does not exceed the allowed invoice limit
      // allowed limit = current invoice.pendingAmount + old payment amount
      const maxAllowed = invoice.pendingAmount + payment.amount;
      if (amount > maxAllowed) {
        throw new ApiError(
          400,
          `Updated payment amount (₹${amount}) exceeds remaining invoice balance (₹${maxAllowed})`
        );
      }

      // Update paidAmount on invoice
      invoice.paidAmount += delta;
      await invoice.save();

      payment.amount = amount;
    }

    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (transactionId !== undefined) payment.transactionId = transactionId;
    if (notes !== undefined) payment.notes = notes;
    if (paymentDate) payment.paymentDate = paymentDate;

    await payment.save();

    // Log Activity
    await logActivity(
      req.user._id,
      'Payment Updated',
      `Payment ID ${payment._id} updated on invoice ${invoice.invoiceNumber}`,
      req
    );

    res.status(200).json(new ApiResponse(200, payment, 'Payment updated successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment transaction
 */
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      throw new ApiError(404, 'Payment record not found');
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      // Deduct the deleted payment amount from invoice paid amount
      invoice.paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
      await invoice.save();
    }

    await Payment.findByIdAndDelete(payment._id);

    // Log Activity
    await logActivity(
      req.user._id,
      'Payment Deleted',
      `Payment of ₹${payment.amount} deleted from invoice ${invoice ? invoice.invoiceNumber : 'Unknown'}`,
      req
    );

    res.status(200).json(new ApiResponse(200, null, 'Payment record deleted successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment history.
 * Optionally filter by invoiceId.
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const { invoiceId } = req.query;
    const query = {};
    if (invoiceId) {
      query.invoiceId = invoiceId;
    }

    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate({
        path: 'invoiceId',
        select: 'invoiceNumber totalAmount status customer',
        populate: {
          path: 'customer',
          select: 'name email',
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          payments,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
        'Payment history retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addPayment,
  updatePayment,
  deletePayment,
  getPaymentHistory,
};
