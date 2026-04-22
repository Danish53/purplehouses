-- Create table for tracking Stripe webhook events
-- This ensures idempotency and makes webhook the single source of truth

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

-- Optional: Add foreign key constraint if needed
-- ALTER TABLE stripe_webhook_events
-- ADD CONSTRAINT fk_application
-- FOREIGN KEY (application_id) REFERENCES frontend_applying(id)
-- ON DELETE SET NULL;