const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  serviceName: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
    default: '',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
  bookingService: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingService',
    default: null,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    items: [invoiceItemSchema],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative'],
    },
    pendingAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
      default: 'Pending',
    },
    taxConfig: {
      taxType: {
        type: String,
        enum: ['GST', 'IGST', 'None'],
        default: 'None',
      },
      cgstRate: { type: Number, default: 0 },
      sgstRate: { type: Number, default: 0 },
      igstRate: { type: Number, default: 0 },
      cgstAmount: { type: Number, default: 0 },
      sgstAmount: { type: Number, default: 0 },
      igstAmount: { type: Number, default: 0 },
      taxableAmount: { type: Number, default: 0 },
    },
    // Event Details
    eventType: {
      type: String,
      default: '',
    },
    eventDate: {
      type: Date,
      default: null,
    },
    eventTime: {
      type: String,
      default: '',
    },
    eventLocation: {
      type: String,
      default: '',
    },
    expectedGuestCount: {
      type: Number,
      default: 0,
    },
    specialRequirements: {
      type: String,
      default: '',
    },
    // Payment Details
    tokenAmount: {
      type: Number,
      default: 0,
    },
    advancePaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'QR', ''],
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-calculate amounts
invoiceSchema.pre('save', function (next) {
  // 1. Calculate amount for each item and sync title/serviceName
  this.items.forEach((item) => {
    if (item.serviceName && !item.title) item.title = item.serviceName;
    if (item.title && !item.serviceName) item.serviceName = item.title;
    item.amount = item.quantity * item.price;
  });

  // 2. Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);

  // 3. Calculate taxable amount (subtotal - discount)
  const taxable = Math.max(0, this.subtotal - this.discount);

  // 4. Calculate taxes and final total amount
  if (this.taxConfig) {
    this.taxConfig.taxableAmount = taxable;
    if (this.taxConfig.taxType === 'GST') {
      this.taxConfig.cgstAmount = taxable * (this.taxConfig.cgstRate / 100);
      this.taxConfig.sgstAmount = taxable * (this.taxConfig.sgstRate / 100);
      this.taxConfig.igstAmount = 0;
    } else if (this.taxConfig.taxType === 'IGST') {
      this.taxConfig.igstAmount = taxable * (this.taxConfig.igstRate / 100);
      this.taxConfig.cgstAmount = 0;
      this.taxConfig.sgstAmount = 0;
    } else {
      this.taxConfig.cgstAmount = 0;
      this.taxConfig.sgstAmount = 0;
      this.taxConfig.igstAmount = 0;
    }
    const totalTax = this.taxConfig.cgstAmount + this.taxConfig.sgstAmount + this.taxConfig.igstAmount;
    this.totalAmount = taxable + totalTax;
  } else {
    this.totalAmount = taxable;
  }

  // Auto-treat Token Amount as Advance Payment if advancePaid is not set
  if (this.tokenAmount > 0 && this.advancePaid === 0) {
    this.advancePaid = this.tokenAmount;
  }

  // Ensure paidAmount is kept in sync with advancePaid
  if (this.advancePaid > 0 && this.paidAmount === 0) {
    this.paidAmount = this.advancePaid;
  } else if (this.paidAmount > 0) {
    this.advancePaid = this.paidAmount;
  }

  // 5. Calculate pending and remaining amount
  this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);
  this.remainingAmount = this.pendingAmount;

  // 6. Update Status
  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    // Check if overdue
    if (this.dueDate && new Date(this.dueDate) < new Date()) {
      this.status = 'Overdue';
    } else {
      this.status = 'Partial';
    }
  } else {
    // paidAmount <= 0
    if (this.dueDate && new Date(this.dueDate) < new Date()) {
      this.status = 'Overdue';
    } else {
      this.status = 'Pending';
    }
  }

  next();
});

// Indexing for search capability
invoiceSchema.index({ invoiceNumber: 'text', notes: 'text' });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
