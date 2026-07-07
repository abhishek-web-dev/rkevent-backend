const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipment.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // Require login for equipment catalog access

router
  .route('/')
  .get(equipmentController.getEquipment)
  .post(equipmentController.createEquipment);

module.exports = router;
