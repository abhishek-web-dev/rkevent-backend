const path = require('path');
const dotenv = require('dotenv');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/db');
const mongoose = require('mongoose');
const { createBackup } = require('../services/backup.service');

const run = async () => {
  try {
    console.log('Initiating Database CLI Backup snapshot...');
    
    // Connect to database
    await connectDB();

    // Trigger backup creation
    const result = await createBackup();
    console.log(`✔ CLI Database Backup created successfully: ${result.file}`);

    // Disconnect and exit
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('CLI Backup failed:', error.message);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

run();
