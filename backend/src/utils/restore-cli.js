const path = require('path');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const mongoose = require('mongoose');
const { restoreBackup } = require('../services/backup.service');

const run = async () => {
  try {
    const filename = process.argv[2];
    
    if (!filename) {
      console.error('Error: Please specify the backup filename to restore.');
      console.log('Usage: npm run restore <filename>');
      console.log('Example: npm run restore 2026-07-02-15-45-backup.json');
      process.exit(1);
    }

    console.log(`Initiating database restoration from backup: ${filename}...`);
    
    // Connect to database
    await connectDB();

    // Trigger restore
    const result = await restoreBackup(filename);
    console.log(`✔ Database restored successfully: ${result.file}`);

    // Disconnect and exit
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('CLI Restore failed:', error.message);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

run();
