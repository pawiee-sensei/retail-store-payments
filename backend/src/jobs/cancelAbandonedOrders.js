const cron = require('node-cron');
const pool = require('../config/db');

const ABANDONED_MINUTES = 30; // orders PENDING longer than this get cancelled

async function cancelAbandonedOrders() {
  try {
    const [result] = await pool.execute(
      `UPDATE orders 
       SET status = 'CANCELLED' 
       WHERE status = 'PENDING' 
       AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [ABANDONED_MINUTES]
    );

    if (result.affectedRows > 0) {
      console.log(`[cleanup] Cancelled ${result.affectedRows} abandoned order(s)`);
    }
  } catch (err) {
    console.error('[cleanup] Failed to cancel abandoned orders:', err.message);
  }
}

function startAbandonedOrderCleanup() {
  // Runs every 5 minutes
  cron.schedule('*/5 * * * *', cancelAbandonedOrders);
  console.log('[cleanup] Abandoned order cleanup job scheduled (every 5 min)');
}

module.exports = { startAbandonedOrderCleanup, cancelAbandonedOrders };