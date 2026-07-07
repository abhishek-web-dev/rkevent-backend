const mongoose = require('mongoose');

const workflowHistorySchema = new mongoose.Schema({
  status: { 
    type: String, 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  isCompleted: { 
    type: Boolean, 
    default: false 
  }
}, { _id: false });

const bookingServiceSchema = new mongoose.Schema({
  booking: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: [true, 'Booking reference is required'] 
  },
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: [true, 'Service reference is required'] 
  },
  
  // Snapshotted fields configuration to ensure historical data preservation
  serviceSnapshot: {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    fields: { type: [mongoose.Schema.Types.Mixed], default: [] } // Frozen config copy
  },
  
  // Mapped functions within the booking (Refs to BookingFunction documents)
  functionIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BookingFunction' 
  }], 

  // Quoted pricing snapshot (Overrides standard base price, immutable on invoices once generated)
  quotedPrice: { 
    type: Number, 
    required: [true, 'Quoted price is required'],
    min: [0, 'Quoted price cannot be negative']
  },
  
  // Workflow tracking
  workflowStatus: { 
    type: String, 
    required: true 
  }, 
  workflowHistory: {
    type: [workflowHistorySchema],
    default: []
  },
  
  // Dynamic fields values
  dynamicData: { 
    type: Map, 
    of: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },

  // Future Extensibility pointers
  assignedStaff: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  assignedEquipment: [{ 
    type: mongoose.Schema.Types.ObjectId 
  }], // Kept open for future equipment module
  tasks: {
    type: [taskSchema],
    default: []
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { 
  timestamps: true 
});

bookingServiceSchema.index({ booking: 1 });
bookingServiceSchema.index({ serviceId: 1 });
bookingServiceSchema.index({ workflowStatus: 1 });

const BookingService = mongoose.model('BookingService', bookingServiceSchema);

module.exports = BookingService;
