const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Company email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Company phone is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Company address is required'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
      trim: true,
    },
    invoiceStartNumber: {
      type: Number,
      default: 1,
    },
    ownerName: {
      type: String,
      default: 'Rahul Kumar',
      trim: true,
    },
    upiId: {
      type: String,
      default: '9169659965-5@ybl',
      trim: true,
    },
    signatureUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for logoUrl to match frontend expectations
companySettingsSchema.virtual('logoUrl').get(function() {
  return this.companyLogo;
});

// Ensure virtual fields are serialized to JSON and Objects
companySettingsSchema.set('toJSON', { virtuals: true });
companySettingsSchema.set('toObject', { virtuals: true });

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = CompanySettings;
