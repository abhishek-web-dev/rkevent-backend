const mongoose = require('mongoose');

const templateFunctionSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Function name is required'],
    trim: true
  },
  offsetDays: { 
    type: Number, 
    default: 0,
    helpText: 'Number of days relative to the main event start date (e.g. -1 for Mehndi, 0 for Wedding Day)'
  }, 
  defaultStartTime: { 
    type: String, 
    default: '10:00' 
  }, // "10:00"
  defaultEndTime: { 
    type: String, 
    default: '14:00' 
  }, // "14:00"
  notes: { 
    type: String, 
    default: '' 
  }
}, { _id: false });

const functionTemplateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Template name is required'], 
    unique: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  functions: {
    type: [templateFunctionSchema],
    default: []
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

const FunctionTemplate = mongoose.model('FunctionTemplate', functionTemplateSchema);

module.exports = FunctionTemplate;
