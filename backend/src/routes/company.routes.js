const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const validate = require('../middleware/validation.middleware');
const companyValidation = require('../validations/company.validation');
const { protect, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');

// Setup multer in-memory storage with size limit of 2MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

router.use(protect); // All routes here require authentication

router.get('/', companyController.getSettings);
router.put(
  '/',
  authorize('admin'),
  upload.single('logo'),
  validate(companyValidation.updateSettings),
  companyController.updateSettings
);

module.exports = router;
