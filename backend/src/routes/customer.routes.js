const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const validate = require('../middleware/validation.middleware');
const customerValidation = require('../validations/customer.validation');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // Require auth for all customer routes

router
  .route('/')
  .post(validate(customerValidation.createCustomer), customerController.createCustomer)
  .get(customerController.getCustomers);

router
  .route('/:id')
  .get(customerController.getCustomer)
  .put(validate(customerValidation.updateCustomer), customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

module.exports = router;
