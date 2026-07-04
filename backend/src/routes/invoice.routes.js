const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const validate = require('../middleware/validation.middleware');
const invoiceValidation = require('../validations/invoice.validation');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // Require auth for all invoice routes

// Trash and Restore routes (placed above dynamic /:id to prevent collisions)
router.get('/trash', invoiceController.getTrashInvoices);
router.post('/:id/restore', invoiceController.restoreInvoice);
router.delete('/:id/permanent', invoiceController.deleteInvoicePermanent);

router
  .route('/')
  .post(validate(invoiceValidation.createInvoice), invoiceController.createInvoice)
  .get(invoiceController.getInvoices);

router
  .route('/:id')
  .get(invoiceController.getInvoice)
  .put(validate(invoiceValidation.updateInvoice), invoiceController.updateInvoice)
  .delete(invoiceController.deleteInvoice);

// Special routes for PDF, Email, and WhatsApp share
router.get('/:id/pdf', invoiceController.downloadPdf);
router.post('/:id/email', invoiceController.emailInvoice);
router.get('/:id/share-whatsapp', invoiceController.getWhatsAppLink);

module.exports = router;
