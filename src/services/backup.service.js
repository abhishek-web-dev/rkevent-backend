const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/User');
const CompanySettings = require('../models/CompanySettings');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const { uploadToGoogleDrive } = require('./googleDrive.service');

const backupsDir = path.join(__dirname, '../../backups');

/**
 * Format date as YYYY-MM-DD-HH-mm
 */
const getBackupFilename = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}-backup.json`;
};

/**
 * Create a new backup file
 */
const createBackup = async () => {
  try {
    // 1. Ensure backups directory exists
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // 2. Fetch all collections data
    const users = await User.find({}).lean();
    const companySettings = await CompanySettings.find({}).lean();
    const customers = await Customer.find({}).lean();
    const invoices = await Invoice.find({}).lean();
    const payments = await Payment.find({}).lean();
    const activityLogs = await ActivityLog.find({}).lean();

    const backupPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      data: {
        users,
        companySettings,
        customers,
        invoices,
        payments,
        activityLogs,
      },
    };

    const filename = getBackupFilename();
    const filePath = path.join(backupsDir, filename);

    // 3. Write locally as JSON
    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), 'utf8');
    console.log(`Local backup file written: ${filename}`);

    // 4. Try uploading to Google Drive (if credentials are set)
    await uploadToGoogleDrive(filename, filePath);

    return {
      success: true,
      file: filename,
      path: filePath,
    };
  } catch (error) {
    console.error(`Backup creation failed: ${error.message}`);
    throw error;
  }
};

/**
 * List all available local backup files
 */
const listBackups = () => {
  try {
    if (!fs.existsSync(backupsDir)) {
      return [];
    }

    return fs
      .readdirSync(backupsDir)
      .filter((file) => file.endsWith('-backup.json'))
      .sort()
      .reverse(); // Newest first
  } catch (error) {
    console.error(`Listing backups failed: ${error.message}`);
    throw error;
  }
};

/**
 * Restore database from a backup file
 * @param {string} filename - The name of the backup file to restore
 */
const restoreBackup = async (filename) => {
  try {
    const filePath = path.join(backupsDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file '${filename}' not found`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const backup = JSON.parse(fileContent);

    if (!backup.data) {
      throw new Error('Invalid backup file schema: missing data payload');
    }

    const { data } = backup;

    // Start restoring collections sequentially
    console.log('Restoring database collections...');

    // 1. Clear existing database collections
    await User.deleteMany({});
    await CompanySettings.deleteMany({});
    await Customer.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await ActivityLog.deleteMany({});

    // 2. Insert details (using Mongoose model.insertMany directly retains the raw _id values)
    if (data.users && data.users.length > 0) {
      await User.insertMany(data.users);
    }
    if (data.companySettings && data.companySettings.length > 0) {
      await CompanySettings.insertMany(data.companySettings);
    }
    if (data.customers && data.customers.length > 0) {
      await Customer.insertMany(data.customers);
    }
    if (data.invoices && data.invoices.length > 0) {
      await Invoice.insertMany(data.invoices);
    }
    if (data.payments && data.payments.length > 0) {
      await Payment.insertMany(data.payments);
    }
    if (data.activityLogs && data.activityLogs.length > 0) {
      await ActivityLog.insertMany(data.activityLogs);
    }

    console.log(`✔ Database successfully restored from backup: ${filename}`);
    return {
      success: true,
      message: 'Database restored successfully',
      file: filename,
    };
  } catch (error) {
    console.error(`Restore operation failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
};
