const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Item title is required'],
    trim: true,
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
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to auto-calculate amounts
invoiceSchema.pre('save', function (next) {
  // 1. Calculate amount for each item
  this.items.forEach((item) => {
    item.amount = item.quantity * item.price;
  });

  // 2. Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);

  // 3. Calculate total
  this.totalAmount = Math.max(0, this.subtotal - this.discount);

  // 4. Calculate pending amount
  this.pendingAmount = Math.max(0, this.totalAmount - this.paidAmount);

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
