const express = require('express');
const router = express.Router();
const systemController = require('../controllers/system.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All system endpoints require admin authentication
router.use(protect);
router.use(authorize('admin'));

router.post('/backup', systemController.triggerBackup);
router.get('/backups', systemController.getBackups);
router.post('/restore', systemController.triggerRestore);

module.exports = router;
