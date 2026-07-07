const ActivityLog = require('../models/ActivityLog');

/**
 * Log user activity to the database.
 * @param {string|null} userId - The user ID performing the action
 * @param {string} action - Action name (e.g. 'Invoice Created')
 * @param {string} details - Additional information about the action
 * @param {object|null} req - Express request object to extract IP address
 */
const logActivity = async (userId, action, details, req = null) => {
  try {
    let ipAddress = '';
    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    }
    
    await ActivityLog.create({
      userId: userId || null,
      action,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error(`Activity Logger Error: ${error.message}`);
  }
};

module.exports = { logActivity };
