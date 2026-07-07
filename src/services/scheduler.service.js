const cron = require('node-cron');
const { createBackup } = require('./backup.service');

/**
 * Initialize background cron schedules.
 */
const initScheduler = () => {
  // Schedule a daily database backup snapshot at 2:00 AM
  // Cron pattern: minute(0) hour(2) day-of-month(*) month(*) day-of-week(*)
  cron.schedule('0 2 * * *', async () => {
    console.log('[Scheduler] Executing scheduled daily database backup snapshot (2:00 AM)...');
    try {
      const result = await createBackup();
      console.log(`[Scheduler] Scheduled database backup successfully completed: ${result.file}`);
    } catch (error) {
      console.error(`[Scheduler] Scheduled database backup failed: ${error.message}`);
    }
  });

  console.log('✔ Scheduler Loaded (Daily 2:00 AM backup task active)');
};

module.exports = {
  initScheduler,
};
