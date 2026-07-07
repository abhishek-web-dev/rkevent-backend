const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const validate = require('../middleware/validation.middleware');
const paymentValidation = require('../validations/payment.validation');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // Require auth for all payment routes

router
  .route('/')
  .post(validate(paymentValidation.addPayment), paymentController.addPayment)
  .get(paymentController.getPaymentHistory);

router
  .route('/:id')
  .put(validate(paymentValidation.updatePayment), paymentController.updatePayment)
  .delete(paymentController.deletePayment);

module.exports = router;
