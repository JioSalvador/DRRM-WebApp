const pool = require('../db'); // adjust path if needed

async function cleanupExpiredRequests() {
  try {
    console.log('[CLEANUP] Starting cleanup of expired requests...');

    const deleteResult = await pool.query(`
      DELETE FROM services.document_requests
      WHERE 
        (status = 'terminated' AND created_at < NOW() - INTERVAL '30 days')
        OR
        (status = 'received' AND received_at < NOW() - INTERVAL '30 days')
      RETURNING id, status;
    `);

    if (deleteResult.rowCount > 0) {
      console.log(`[CLEANUP] Deleted ${deleteResult.rowCount} expired request(s):`);
      deleteResult.rows.forEach(row => {
        console.log(` - ID: ${row.id}, Status: ${row.status}`);
      });
    } else {
      console.log('[CLEANUP] No expired requests found.');
    }
  } catch (err) {
    console.error('[CLEANUP] Error during cleanup:', err);
  }
}

cleanupExpiredRequests();