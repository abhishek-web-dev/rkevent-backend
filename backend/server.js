require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { printRouteTable } = require('./src/utils/routePrinter');
const { initScheduler } = require('./src/services/scheduler.service');

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start Listening
    const server = app.listen(PORT, () => {
      console.log('\n================ STARTUP CHECKLIST ================');
      console.log('✔ MongoDB Connected');
      console.log(`✔ Server Running on port ${PORT}`);
      console.log('✔ Routes Loaded');
      console.log('✔ Swagger Loaded');
      console.log('===================================================\n');

      // Initialize Automated Cron Scheduler
      initScheduler();

      // Print the complete endpoints table
      printRouteTable(app);
    });

    // Handle unhandled promise rejections globally
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message, err.stack);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('Startup Error:', error);
    process.exit(1);
  }
};

startServer();
