const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const validate = require('../middleware/validation.middleware');
const serviceValidation = require('../validations/service.validation');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect); // Require login for all service paths

router
  .route('/')
  .get(serviceController.getServices)
  .post(authorize('admin'), validate(serviceValidation.createService), serviceController.createService);

router
  .route('/:id')
  .get(serviceController.getService)
  .put(authorize('admin'), validate(serviceValidation.updateService), serviceController.updateService)
  .delete(authorize('admin'), serviceController.deleteService);

module.exports = router;
