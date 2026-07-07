const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const validate = require('../middleware/validation.middleware');
const bookingValidation = require('../validations/booking.validation');
const { validateDynamicData } = require('../middleware/dynamicValidation.middleware');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // Require auth for all booking actions

// Root actions
router
  .route('/')
  .get(bookingController.getBookings)
  .post(
    validate(bookingValidation.createBooking), 
    validateDynamicData, 
    bookingController.createBooking
  );

router
  .route('/:id')
  .get(bookingController.getBooking)
  .put(validate(bookingValidation.updateBooking), bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

// Function Sub-routes
router.post('/:id/functions', validate(bookingValidation.addFunction), bookingController.addFunction);
router.put('/functions/:functionId', validate(bookingValidation.updateFunction), bookingController.updateFunction);
router.delete('/functions/:functionId', bookingController.deleteFunction);

// Service Sub-routes
router.post(
  '/:id/services', 
  validate(bookingValidation.addService), 
  validateDynamicData, 
  bookingController.addService
);

router.put(
  '/services/:bookingServiceId', 
  validate(bookingValidation.updateServiceData), 
  validateDynamicData, 
  bookingController.updateServiceData
);

router.patch(
  '/services/:bookingServiceId/workflow', 
  validate(bookingValidation.updateServiceWorkflow), 
  bookingController.updateServiceWorkflow
);

router.delete('/services/:bookingServiceId', bookingController.deleteService);

module.exports = router;
