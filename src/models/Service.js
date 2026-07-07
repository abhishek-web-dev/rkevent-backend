const mongoose = require('mongoose');

const fieldValidationSchema = new mongoose.Schema({
  min: { type: Number, default: null },
  max: { type: Number, default: null },
  pattern: { type: String, default: '' }, // Regex patterns
  options: { type: [String], default: [] } // For Dropdown, Checkbox, Radio, Multi Select
}, { _id: false });

const fieldConfigSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Field name (identifier) is required'], 
    trim: true 
  }, // camelCase identifier e.g., 'albumSize'
  label: { 
    type: String, 
    required: [true, 'Field label (display text) is required'], 
    trim: true 
  }, // Display label e.g., 'Album Size'
  type: { 
    type: String, 
    required: [true, 'Field type is required'],
    enum: [
      'Text', 'Number', 'Dropdown', 'Checkbox', 'Radio', 
      'Date', 'Time', 'DateTime', 'Textarea', 'File Upload', 
      'Image Upload', 'Switch', 'Multi Select', 'URL', 'Phone', 'Email'
    ]
  },
  required: { 
    type: Boolean, 
    default: false 
  },
  defaultValue: { 
    type: mongoose.Schema.Types.Mixed, 
    default: null 
  },
  placeholder: { 
    type: String, 
    default: '' 
  },
  helpText: { 
    type: String, 
    default: '' 
  },
  validation: { 
    type: fieldValidationSchema, 
    default: () => ({})
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Service name is required'], 
    unique: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: [true, 'Service slug is required'], 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  fields: {
    type: [fieldConfigSchema],
    default: []
  },
  workflows: { 
    type: [String], 
    default: ['Pending', 'In Progress', 'Completed', 'Delivered'] 
  },
  basePrice: { 
    type: Number, 
    default: 0,
    min: [0, 'Base price cannot be negative']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Middleware to auto-generate slug before validation if not provided
serviceSchema.pre('validate', function(next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
