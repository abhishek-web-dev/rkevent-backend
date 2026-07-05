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

  // 3. Calculate total
  this.totalAmount = Math.max(0, this.subtotal - this.discount);

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

  // 4. Calculate pending and remaining amount
  this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);
  this.remainingAmount = this.pendingAmount;

  // 5. Update Status
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
