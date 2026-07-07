const express = require('express');
const router = express.Router();
const templateController = require('../controllers/template.controller');
const validate = require('../middleware/validation.middleware');
const templateValidation = require('../validations/template.validation');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect); // Require login for all template paths

router
  .route('/')
  .get(templateController.getTemplates)
  .post(authorize('admin'), validate(templateValidation.createTemplate), templateController.createTemplate);

router
  .route('/:id')
  .get(templateController.getTemplate)
  .put(authorize('admin'), validate(templateValidation.updateTemplate), templateController.updateTemplate)
  .delete(authorize('admin'), templateController.deleteTemplate);

module.exports = router;
