const backupService = require('../services/backup.service');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { logActivity } = require('../services/logger.service');

/**
 * Trigger manual database backup
 */
const triggerBackup = async (req, res, next) => {
  try {
    const result = await backupService.createBackup();

    // Log Activity
    await logActivity(
      req.user ? req.user._id : null,
      'System Backup Created',
      `Manual backup generated: ${result.file}`,
      req
    );

    res.status(201).json(
      new ApiResponse(
        201,
        { file: result.file },
        'Database backup created successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * List all available backups
 */
const getBackups = async (req, res, next) => {
  try {
    const backups = backupService.listBackups();
    res.status(200).json(
      new ApiResponse(200, backups, 'Backups list retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Restore database from a backup file
 */
const triggerRestore = async (req, res, next) => {
  try {
    const { file } = req.body;
    if (!file) {
      throw new ApiError(400, 'Backup filename (file) is required in request body');
    }

    const result = await backupService.restoreBackup(file);

    // Log Activity
    await logActivity(
      req.user ? req.user._id : null,
      'System Restored',
      `Database restored from backup: ${file}`,
      req
    );

    res.status(200).json(
      new ApiResponse(200, result, 'Database restored successfully')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerBackup,
  getBackups,
  triggerRestore,
};
