const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Customer address is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for search capability
customerSchema.index({ name: 'text', companyName: 'text', email: 'text', phone: 'text' });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
