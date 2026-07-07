const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: [true, 'Customer is required'] 
  },
  status: { 
    type: String, 
    enum: ['Draft', 'Confirmed', 'Completed', 'Cancelled'], 
    default: 'Draft' 
  },
  templateUsed: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FunctionTemplate',
    default: null
  },
  startDate: { 
    type: Date, 
    required: [true, 'Start date is required'] 
  },
  endDate: { 
    type: Date, 
    required: [true, 'End date is required'] 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true 
});

bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
