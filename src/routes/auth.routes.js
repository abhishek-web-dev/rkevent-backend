const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validation.middleware');
const authValidation = require('../validations/auth.validation');
const { protect } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, validate(authValidation.updateProfile), authController.updateProfile);
router.put('/change-password', protect, validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
