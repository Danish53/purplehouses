#!/usr/bin/env node

/**
 * Simple script to create stripe_webhook_events table
 * Uses the existing database connection from lib/db.js
 */

// Set up environment
require('dotenv').config({ path: '.env.local' });

async function run() {
  console.log('Creating stripe_webhook_events table...');
  
  try {
    // Import the db module
    const { query } = require('../lib/db.js');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS stripe_webhook_events (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        stripe_object_id VARCHAR(255) NOT NULL,
        stripe_object_type VARCHAR(100) NOT NULL,
        application_id BIGINT NULL,
        processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status ENUM('processed', 'failed', 'duplicate') NOT NULL DEFAULT 'processed',
        metadata JSON NULL,
        
        INDEX idx_stripe_object (stripe_object_id),
        INDEX idx_application (application_id),
        INDEX idx_processed_at (processed_at)
      );
      
      -- Add comment
      ALTER TABLE stripe_webhook_events 
      COMMENT = 'Tracks Stripe webhook events for idempotency and audit';
    `;
    
    // Execute the SQL
    await query(sql);
    console.log('✅ Table created successfully!');
    
    // Verify
    const result = await query(`
      SELECT COUNT(*) as count FROM stripe_webhook_events
    `);
    console.log(`Table now has ${result[0]?.count || 0} records.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Check if table already exists
    if (error.message.includes('already exists') || error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️ Table already exists. That\'s okay!');
      
      try {
        const { query } = require('../lib/db.js');
        const result = await query('SELECT COUNT(*) as count FROM stripe_webhook_events');
        console.log(`Table has ${result[0]?.count || 0} records.`);
      } catch (e) {
        console.log('Could not query table:', e.message);
      }
    }
    
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});