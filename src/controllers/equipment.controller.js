const Equipment = require('../models/Equipment');
const ApiResponse = require('../utils/apiResponse');

const DEFAULT_EQUIPMENT = [
  { name: 'Sony Alpha 7 IV Camera', category: 'Camera', serialNumber: 'SN-A7IV-9981' },
  { name: 'Sony FE 85mm f/1.4 GM Lens', category: 'Lens', serialNumber: 'SN-SEL85-3341' },
  { name: 'DJI Mavic 3 Cine Drone', category: 'Drone', serialNumber: 'SN-MAV3-5561' },
  { name: 'DJI Ronin RS3 Pro Gimbal', category: 'Gimbal', serialNumber: 'SN-RS3P-8789' },
  { name: 'Godox AD600 Pro Strobe Lights', category: 'Lights', serialNumber: 'SN-AD60-4412' }
];

/**
 * Get all equipment (seeds default items if database is empty)
 */
const getEquipment = async (req, res, next) => {
  try {
    let list = await Equipment.find({});
    
    // Auto seed default items for rich testing experience
    if (list.length === 0) {
      await Equipment.insertMany(DEFAULT_EQUIPMENT);
      list = await Equipment.find({});
    }

    res.status(200).json(new ApiResponse(200, list, 'Equipment list retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new equipment
 */
const createEquipment = async (req, res, next) => {
  try {
    const { name, category, serialNumber } = req.body;
    const gear = await Equipment.create({ name, category, serialNumber });
    res.status(201).json(new ApiResponse(201, gear, 'Equipment created successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEquipment,
  createEquipment
};
