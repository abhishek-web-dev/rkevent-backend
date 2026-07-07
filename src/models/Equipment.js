const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Equipment name is required'] 
  },
  category: { 
    type: String, 
    enum: ['Camera', 'Lens', 'Drone', 'Gimbal', 'Lights', 'Other'], 
    required: [true, 'Category is required'] 
  },
  serialNumber: { 
    type: String, 
    default: '' 
  },
  status: { 
    type: String, 
    enum: ['Available', 'In Use', 'Maintenance'], 
    default: 'Available' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Equipment', equipmentSchema);
