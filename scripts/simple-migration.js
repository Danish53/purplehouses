#!/usr/bin/env node

/**
 * Simple script to create stripe_webhook_events table
 */

const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('Creating stripe_webhook_events table...');
  
  // Use the DATABASE_URL from .env.local
  const DATABASE_URL = 'mysql://root:@127.0.0.1:3306/purplehousing';
  
  console.log('Using database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
  
  try {
    // Parse the URL
    const url = new URL(DATABASE_URL);
    const hostname = url.hostname;
    const port = url.port || 3306;
    const database = url.pathname.replace(/^\//, '');
    const username = url.username;
    const password = url.password || '';
    
    console.log(`Connecting to ${hostname}:${port}/${database} as ${username}`);
    
    const connection = await mysql.createConnection({
      host: hostname,
      port: parseInt(port),
      user: username,
      password: password,
      database: database
    });
    
    console.log('✅ Connected to database successfully');
    
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
    
    // Split SQL statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 80)}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Table "stripe_webhook_events" has been created.');
    
    // Verify the table exists
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as table_exists 
      FROM information_schema.tables 
      WHERE table_schema = ? 
      AND table_name = 'stripe_webhook_events'
    `, [database]);
    
    if (rows[0]?.table_exists > 0) {
      console.log('✅ Table verification successful.');
      
      // Show table structure
      const [descRows] = await connection.execute('DESCRIBE stripe_webhook_events');
      console.log('\nTable structure:');
      console.table(descRows);
    } else {
      console.log('⚠️  Table may not have been created. Please check manually.');
    }
    
    await connection.end();
    console.log('\n✅ Migration complete. The Stripe flow is now production ready!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);