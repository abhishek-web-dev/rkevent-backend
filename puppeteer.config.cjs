const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Save Chromium browser inside the local workspace cache
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
