#!/usr/bin/env node

/**
 * Script to run the Stripe webhook events table migration
 * This creates the stripe_webhook_events table for idempotency
 */

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Load environment variables like Next.js does
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const root = path.join(__dirname, '..');
  
  for (const envFile of envFiles) {
    const envPath = path.join(root, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  }
}

async function runMigration() {
  console.log('Starting Stripe webhook events table migration...');
  
  // Load environment variables
  loadEnv();
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    console.log('Please set DATABASE_URL in .env.local or .env file');
    process.exit(1);
  }
  
  const dbUrl = process.env.DATABASE_URL;
  console.log('Using database URL:', dbUrl.replace(/:[^:@]*@/, ':****@'));
  
  try {
    // Parse DATABASE_URL
    const url = new URL(dbUrl);
    const protocol = url.protocol.replace(':', '');
    const hostname = url.hostname;
    const port = url.port || (protocol === 'mysql' ? 3306 : 5432);
    const database = url.pathname.replace(/^\//, '');
    
    // Parse username and password
    let username = url.username;
    let password = url.password;
    
    // Handle empty password case (root:)
    if (username && !password && url.auth.includes(':')) {
      // This handles "root:" case where password is empty string
      password = '';
    }
    
    console.log(`Parsed connection details:`);
    console.log(`  Protocol: ${protocol}`);
    console.log(`  Host: ${hostname}:${port}`);
    console.log(`  Database: ${database}`);
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password ? '****' : '(empty)'}`);
    
    // Create MySQL connection using mysql2
    const mysql = require('mysql2/promise');
    
    let connection;
    try {
      connection = await mysql.createConnection({
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
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      
      // Check if table already exists (MySQL error 1050)
      if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message.includes('1050') || error.message.includes('already exists')) {
        console.log('ℹ️  Table already exists. Checking current structure...');
        
        try {
          const [existing] = await connection.execute('SELECT COUNT(*) as count FROM stripe_webhook_events');
          console.log(`ℹ️  Table exists with ${existing[0]?.count || 0} records.`);
          
          // Show existing records if any
          if (existing[0]?.count > 0) {
            const [sampleRows] = await connection.execute('SELECT * FROM stripe_webhook_events LIMIT 3');
            console.log('\nSample records:');
            console.table(sampleRows);
          }
        } catch (checkError) {
          console.log('ℹ️  Could not query table:', checkError.message);
        }
      }
      
      process.exit(1);
    } finally {
      if (connection) {
        await connection.end();
        console.log('Database connection closed.');
      }
    }
  } catch (urlError) {
    console.error('❌ Failed to parse DATABASE_URL:', urlError.message);
    console.log('DATABASE_URL format should be: mysql://username:password@host:port/database');
    console.log('Current DATABASE_URL:', process.env.DATABASE_URL);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});