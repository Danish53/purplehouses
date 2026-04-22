# Industry-Level Stripe Webhook Solution

## 🎯 **Core Principle: Webhook as Single Source of Truth**

### **Problems Solved:**
1. ✅ **In-memory `processedEvents` Set** → Replaced with database
2. ✅ **Webhook vs Manual API conflicts** → Webhook always wins
3. ✅ **Duplicate processing** → Database-level idempotency
4. ✅ **Race conditions** → Database transactions with `FOR UPDATE`
5. ✅ **Audit trail** → Complete event tracking

## 🏗️ **Architecture**

### **1. Database Schema**
```sql
CREATE TABLE stripe_webhook_events (
  id VARCHAR(255) NOT NULL PRIMARY KEY,          -- Stripe event ID
  event_type VARCHAR(100) NOT NULL,              -- payment_intent.succeeded etc.
  stripe_object_id VARCHAR(255) NOT NULL,        -- pi_xxx, ch_xxx
  stripe_object_type VARCHAR(100) NOT NULL,      -- payment_intent, charge
  application_id BIGINT NULL,                    -- Reference to application
  processed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('processed', 'failed', 'duplicate') NOT NULL DEFAULT 'processed',
  metadata JSON NULL,                            -- Additional event data
  
  INDEX idx_stripe_object (stripe_object_id),
  INDEX idx_application (application_id),
  INDEX idx_processed_at (processed_at)
);
```

### **2. Idempotency Strategy**
```javascript
// 1. Check if event already processed
const isDuplicate = await isDuplicateEvent(event.id);

// 2. Record event with INSERT ... ON DUPLICATE KEY UPDATE
const isNewEvent = await recordWebhookEvent(event, paymentIntent);

// 3. Process only if new event
if (!isNewEvent) {
  console.log(`Event ${event.id} already processed, skipping`);
  return;
}
```

### **3. Conflict Resolution (Webhook vs Manual API)**
**Rule: Webhook ALWAYS wins**
- Manual API can set status to `pending`
- Only webhook can set status to `paid` or `failed`
- Database locks prevent race conditions

## 🔒 **Transaction Flow**

### **For `payment_intent.succeeded`:**
```javascript
1. START TRANSACTION
2. SELECT ... FOR UPDATE (lock application row)
3. Check current status
4. If pending → UPDATE to paid
5. Send email
6. COMMIT
7. If error → ROLLBACK, mark event as failed
```

### **For `payment_intent.payment_failed`:**
```javascript
1. START TRANSACTION  
2. SELECT ... FOR UPDATE
3. If not already failed/paid → UPDATE to failed
4. COMMIT
```

## 🛡️ **Safety Mechanisms**

### **1. Database-Level Idempotency**
```sql
-- Only updates if status is 'pending'
WHERE id = ? AND payment_status = 'pending'

-- Prevents updating already paid/failed applications
WHERE payment_status NOT IN ('failed', 'paid')
```

### **2. Payment Intent Tracking**
```javascript
// Check if payment intent already processed
const existingApp = await queryOne(
  `SELECT id FROM frontend_applying WHERE stripe_payment_intent = ?`,
  [paymentIntent.id]
);
```

### **3. Email Deduplication**
- Email only sent when status changes from `pending` → `paid`
- If already `paid`, email skipped

## 📊 **Audit & Monitoring**

### **Event Status Tracking:**
- `processed` - Successfully handled
- `failed` - Error during processing  
- `duplicate` - Skipped as duplicate

### **Monitoring Queries:**
```sql
-- Recent webhook events
SELECT * FROM stripe_webhook_events 
ORDER BY processed_at DESC LIMIT 10;

-- Failed events for investigation
SELECT * FROM stripe_webhook_events 
WHERE status = 'failed' 
ORDER BY processed_at DESC;

-- Duplicate events (should be minimal)
SELECT COUNT(*) as duplicate_count 
FROM stripe_webhook_events 
WHERE status = 'duplicate';
```

## 🚀 **Production Deployment Steps**

### **Step 1: Create Database Table**
```bash
mysql -u root -p purplehousing < prisma/migrations/stripe_webhook_events.sql
```

### **Step 2: Update Environment**
```env
# .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Step 3: Configure Stripe Webhook**
1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Add endpoint: `http://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`  
   - `checkout.session.completed`
4. Copy "Signing secret"

### **Step 4: Test Flow**
```bash
# Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger payment_intent.succeeded

# Check database
SELECT * FROM stripe_webhook_events;
SELECT id, payment_status FROM frontend_applying ORDER BY id DESC LIMIT 5;
```

## 🔄 **Complete Payment Flow**

### **Scenario 1: Normal Success**
```
User → Form → DB(pending) → Stripe Checkout → Payment Success
                                      ↓
Stripe → Webhook → DB(paid) → Email → Admin
```

### **Scenario 2: Duplicate Webhook**
```
Stripe → Webhook(evt_123) → DB(paid) ✓
Stripe → Webhook(evt_123) → Skipped (duplicate) ✓
Stripe → Webhook(evt_123) → Skipped (duplicate) ✓
```

### **Scenario 3: Webhook vs Manual Conflict**
```
Manual API → DB(pending) ✓
Webhook → DB(paid) ✓ (Webhook wins)
Manual API tries to update → Fails (already paid) ✓
```

### **Scenario 4: Payment Failed**
```
User → Form → DB(pending) → Stripe Checkout → Payment Failed
                                      ↓
Stripe → Webhook → DB(failed) → Log error
```

## 📈 **Performance & Scaling**

### **For High Volume:**
1. **Add indexes** on frequently queried columns
2. **Archive old events** to separate table
3. **Use connection pooling** for database
4. **Consider Redis cache** for frequent event checks

### **Monitoring:**
```sql
-- Event processing rate
SELECT 
  DATE(processed_at) as day,
  COUNT(*) as total_events,
  SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed,
  SUM(CASE WHEN status = 'duplicate' THEN 1 ELSE 0 END) as duplicates,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM stripe_webhook_events
GROUP BY DATE(processed_at)
ORDER BY day DESC;
```

## ✅ **Verification Checklist**

- [ ] Database table `stripe_webhook_events` created
- [ ] Webhook handler uses database for idempotency
- [ ] No in-memory state (processedEvents removed)
- [ ] Transactions with `FOR UPDATE` locks
- [ ] Webhook is single source of truth for payment status
- [ ] Manual API cannot override webhook decisions
- [ ] Email sent only once per successful payment
- [ ] Audit trail for all webhook events
- [ ] Error handling and retry logic
- [ ] Monitoring queries implemented

## 🎯 **Summary**

This implementation provides:
- **Industry-standard idempotency** via database
- **Webhook as single source of truth** for payment status
- **Conflict resolution** (webhook always wins)
- **Complete audit trail** for debugging
- **Scalable architecture** for production loads
- **Zero duplicate processing** even with multiple servers

The solution is now **production-ready** and follows Stripe's best practices for webhook handling.