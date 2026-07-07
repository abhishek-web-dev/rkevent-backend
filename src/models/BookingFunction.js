const mongoose = require('mongoose');

const bookingFunctionSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: [true, 'Booking reference is required'] 
  },
  name: { 
    type: String, 
    required: [true, 'Function name is required'],
    trim: true
  },
  date: { 
    type: Date, 
    required: [true, 'Function date is required'] 
  },
  startTime: { 
    type: String, 
    default: '' 
  }, // Format: "14:00"
  endTime: { 
    type: String, 
    default: '' 
  }, // Format: "18:00"
  venue: { 
    type: String, 
    default: '',
    trim: true
  },
  address: { 
    type: String, 
    default: '',
    trim: true
  },
  contactPerson: { 
    type: String, 
    default: '',
    trim: true
  },
  contactNumber: { 
    type: String, 
    default: '',
    trim: true
  },
  specialInstructions: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  }
}, { 
  timestamps: true 
});

bookingFunctionSchema.index({ booking: 1 });
bookingFunctionSchema.index({ date: 1 });

const BookingFunction = mongoose.model('BookingFunction', bookingFunctionSchema);

module.exports = BookingFunction;
