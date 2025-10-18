# Razorpay Route Setup Guide - Split Payments

## 🎯 Goal
Automatically split customer payments to multiple restaurant bank accounts.

**Example:**
```
Customer pays ₹861
    ↓ (Automatic Split)
├─ Pizza Palace Bank: ₹492
├─ Burger Barn Bank: ₹369
└─ Done! No manual work.
```

---

## 📋 Prerequisites

1. **Razorpay Account** (already have ✅)
2. **KYC Completed** on Razorpay
3. **Route Feature Enabled** (need to request)

---

## Step 1: Enable Razorpay Route

### 1.1 Request Route Access

1. **Login to Razorpay Dashboard:**
   - Go to https://dashboard.razorpay.com/

2. **Contact Razorpay Support:**
   - Click on "Help" → "Contact Support"
   - Or email: support@razorpay.com
   
3. **Request Message:**
   ```
   Subject: Enable Razorpay Route for Split Payments
   
   Hi Razorpay Team,
   
   I need to enable Razorpay Route for my account to implement 
   marketplace/split payment functionality for a food court application.
   
   Account Details:
   - Business Name: [Your Business Name]
   - Account ID: [Your Account ID]
   - Use Case: Food court with multiple restaurants
   - Need: Split payments to vendor accounts
   
   Please enable Route feature and provide documentation.
   
   Thanks,
   [Your Name]
   ```

4. **Wait for Approval** (usually 1-2 business days)

5. **Once Enabled:**
   - You'll see "Route" in your dashboard menu
   - API access will be granted

---

## Step 2: Test Mode Setup (No Real Money)

### 2.1 Enable Test Mode

1. **Dashboard:** Switch to **Test Mode** (toggle in top-right)
2. **Get Test Keys:**
   - Settings → API Keys → Test Mode
   - Copy: `Test Key ID` and `Test Key Secret`

### 2.2 Create Test Linked Accounts (Restaurants)

**Option A: Via Razorpay Dashboard**

1. Go to **Route** → **Linked Accounts**
2. Click **Create Linked Account**
3. Fill details:
   ```
   Name: Pizza Palace Test
   Email: pizza@test.com
   Phone: 9999999991
   Business Type: Individual / Proprietorship
   ```
4. Get `account_id` (format: `acc_xxxxxxxxxxxxx`)
5. Repeat for other restaurants

**Option B: Via API** (Recommended for automation)

```bash
curl -X POST https://api.razorpay.com/v1/accounts \
  -u YOUR_TEST_KEY_ID:YOUR_TEST_KEY_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pizza@test.com",
    "phone": "9999999991",
    "type": "route",
    "legal_business_name": "Pizza Palace",
    "business_type": "individual",
    "contact_name": "Pizza Manager",
    "profile": {
      "category": "food",
      "subcategory": "restaurant"
    },
    "legal_info": {
      "pan": "AAAPL1234C",
      "gst": "18AABCT1234C1Z1"
    },
    "notes": {
      "restaurant_id": "pizza-palace-id"
    }
  }'
```

**Response:**
```json
{
  "id": "acc_PizzaPalaceXYZ",
  "entity": "account",
  "status": "created",
  "email": "pizza@test.com",
  ...
}
```

**Save the `account_id` for each restaurant!**

---

## Step 3: Database Schema Updates

### 3.1 Update Prisma Schema

```prisma
// server/prisma/schema.prisma

model Restaurant {
  id                String     @id @default(auto()) @map("_id") @db.ObjectId
  name              String
  description       String
  image             String?
  cuisine           String
  isActive          Boolean    @default(true)
  rating            Float      @default(4.0)
  preparationTime   Int        @default(20)
  
  // NEW: Payment & Settlement Fields
  razorpayAccountId String?    // Razorpay linked account ID
  bankAccountNumber String?
  bankIfsc          String?
  bankAccountName   String?
  settlementSchedule String    @default("instant") // instant, daily, weekly
  commissionRate    Float      @default(0.10) // Platform commission (10%)
  
  menuItems         MenuItem[]
  staff             Staff[]
  orders            Order[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}

model Order {
  id               String      @id @default(auto()) @map("_id") @db.ObjectId
  orderNumber      String      @unique
  orderGroupId     String?
  status           String      @default("pending")
  orderType        String      @default("dine-in")
  totalAmount      Int
  serviceCharge    Int
  gst              Int
  grandTotal       Int
  paymentStatus    String      @default("unpaid")
  paymentMethod    String?
  customerEmail    String?
  customerPhone    String?
  restaurantId     String      @db.ObjectId
  restaurant       Restaurant  @relation(fields: [restaurantId], references: [id])
  
  // NEW: Transfer & Settlement Fields
  razorpayPaymentId String?    // Original payment ID
  transferId        String?    // Razorpay transfer ID
  transferStatus    String?    // created, pending, processed, reversed
  transferAmount    Int?       // Amount transferred to restaurant
  platformCommission Int?      // Commission kept by platform
  settlementStatus  String     @default("pending") // pending, completed, failed
  settledAt         DateTime?
  
  orderItems       OrderItem[]
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  @@index([orderGroupId])
}
```

### 3.2 Apply Schema Changes

```bash
cd server
npx prisma db push
```

### 3.3 Update Seed Data with Test Account IDs

```javascript
// server/prisma/seed.js

const restaurants = [
  {
    name: 'Spice Junction',
    description: 'Authentic Indian cuisine with rich flavors',
    cuisine: 'Indian',
    image: '🌶️',
    rating: 4.5,
    preparationTime: 25,
    razorpayAccountId: 'acc_SpiceJunctionXYZ', // From Step 2.2
    settlementSchedule: 'instant',
    commissionRate: 0.10,
  },
  {
    name: 'Dragon Wok',
    description: 'Traditional Chinese dishes with a modern twist',
    cuisine: 'Chinese',
    image: '🐉',
    rating: 4.3,
    preparationTime: 20,
    razorpayAccountId: 'acc_DragonWokXYZ',
    settlementSchedule: 'instant',
    commissionRate: 0.10,
  },
  // ... other restaurants
];
```

Run seed:
```bash
npm run db:seed
```

---

## Step 4: Implement Transfer Logic

### 4.1 Create Transfer Service

Create `server/services/paymentTransfer.js`:

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Transfer payment to restaurant's linked account
 */
async function transferToRestaurant(order, paymentId) {
  try {
    // Calculate platform commission
    const commissionRate = order.restaurant.commissionRate || 0.10;
    const platformCommission = Math.round(order.grandTotal * commissionRate);
    const transferAmount = order.grandTotal - platformCommission;

    console.log(`💰 Processing transfer for Order ${order.orderNumber}:`);
    console.log(`   Total: ₹${order.grandTotal}`);
    console.log(`   Platform Commission (${commissionRate * 100}%): ₹${platformCommission}`);
    console.log(`   Transfer to ${order.restaurant.name}: ₹${transferAmount}`);

    // Check if restaurant has linked account
    if (!order.restaurant.razorpayAccountId) {
      console.warn(`⚠️  ${order.restaurant.name} has no linked account. Skipping transfer.`);
      return {
        success: false,
        reason: 'no_linked_account',
        orderId: order.id
      };
    }

    // Create transfer via Razorpay Route
    const transfer = await razorpay.transfers.create({
      account: order.restaurant.razorpayAccountId,
      amount: transferAmount * 100, // Convert to paise
      currency: 'INR',
      source: paymentId, // Link to original payment
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant.name,
        platformCommission: platformCommission,
      }
    });

    console.log(`✅ Transfer created: ${transfer.id}`);
    console.log(`   Status: ${transfer.status}`);

    return {
      success: true,
      transferId: transfer.id,
      transferAmount: transferAmount,
      platformCommission: platformCommission,
      transferStatus: transfer.status,
      recipient: order.restaurant.name,
    };

  } catch (error) {
    console.error(`❌ Transfer failed for ${order.restaurant.name}:`, error);
    
    return {
      success: false,
      error: error.message,
      orderId: order.id,
      recipient: order.restaurant.name,
    };
  }
}

/**
 * Transfer payments for all orders in a group (multi-restaurant)
 */
async function transferForOrderGroup(orders, paymentId) {
  const results = [];
  
  for (const order of orders) {
    const result = await transferToRestaurant(order, paymentId);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Transfer Summary:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  
  return results;
}

module.exports = {
  transferToRestaurant,
  transferForOrderGroup,
};
```

### 4.2 Update Order Routes

Update `server/routes/order.js`:

```javascript
const { transferToRestaurant, transferForOrderGroup } = require('../services/paymentTransfer');

// ... existing imports

// Verify prepayment and CREATE order with automatic transfers
router.post('/verify-prepayment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, orderType } = req.body;

    // ... existing verification code ...

    console.log('✅ Payment signature verified successfully');

    // ... existing order creation code ...
    // (creates createdOrders array)

    // NEW: Automatically transfer to restaurants
    console.log('\n💸 Initiating transfers to restaurants...');
    
    const transferResults = await transferForOrderGroup(
      createdOrders,
      razorpay_payment_id
    );

    // Update orders with transfer information
    for (let i = 0; i < createdOrders.length; i++) {
      const order = createdOrders[i];
      const transferResult = transferResults[i];

      if (transferResult.success) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            transferId: transferResult.transferId,
            transferAmount: transferResult.transferAmount,
            platformCommission: transferResult.platformCommission,
            transferStatus: transferResult.transferStatus,
            settlementStatus: 'completed',
            settledAt: new Date(),
          }
        });
      } else {
        // Mark for manual settlement if transfer failed
        await prisma.order.update({
          where: { id: order.id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            transferStatus: 'failed',
            settlementStatus: 'pending',
          }
        });
      }
    }

    console.log('✅ Orders updated with transfer information');
    
    // Emit socket events
    // ... existing socket code ...

    res.json({ 
      success: true, 
      orders: createdOrders,
      message: `Payment successful! Created ${createdOrders.length} order(s)`,
      totalOrders: createdOrders.length,
      orderGroupId,
      transfers: transferResults, // Include transfer info in response
    });

  } catch (error) {
    console.error('❌ Error verifying prepayment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});
```

---

## Step 5: Testing the Flow

### 5.1 Test Mode Payment Flow

1. **Start your servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   npm run dev
   ```

2. **Place a multi-restaurant order:**
   - Add items from Pizza Palace
   - Add items from Burger Barn
   - Click "Pay Now"

3. **Use Test Card:**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: 123
   Expiry: Any future date
   Name: Test User
   ```

4. **Complete payment**

5. **Check Console Logs:**
   ```
   ✅ Payment signature verified successfully
   
   💸 Initiating transfers to restaurants...
   
   💰 Processing transfer for Order ORD-001:
      Total: ₹492
      Platform Commission (10%): ₹49
      Transfer to Pizza Palace: ₹443
   ✅ Transfer created: trf_PizzaXYZ123
      Status: created
   
   💰 Processing transfer for Order ORD-002:
      Total: ₹369
      Platform Commission (10%): ₹37
      Transfer to Burger Barn: ₹332
   ✅ Transfer created: trf_BurgerXYZ456
      Status: created
   
   📊 Transfer Summary:
      Total: 2
      Successful: 2
      Failed: 0
   ```

6. **Verify in Razorpay Dashboard:**
   - Go to **Route** → **Transfers**
   - You should see 2 transfers:
     - ₹443 to Pizza Palace
     - ₹332 to Burger Barn

### 5.2 Check Transfer Status

Create test endpoint `server/routes/order.js`:

```javascript
// Get transfer status for an order
router.get('/:id/transfer-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!order.transferId) {
      return res.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        transferStatus: 'no_transfer',
        message: 'No transfer initiated for this order'
      });
    }

    // Fetch transfer details from Razorpay
    const transfer = await razorpay.transfers.fetch(order.transferId);

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurant: order.restaurant.name,
      transferId: transfer.id,
      transferAmount: order.transferAmount,
      platformCommission: order.platformCommission,
      transferStatus: transfer.status,
      recipient: transfer.recipient,
      processedAt: transfer.processed_at,
      settlementStatus: order.settlementStatus,
    });

  } catch (error) {
    console.error('Error fetching transfer status:', error);
    res.status(500).json({ error: 'Failed to fetch transfer status' });
  }
});
```

Test it:
```bash
curl http://localhost:5000/api/orders/ORDER_ID/transfer-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 6: Production Setup

### 6.1 Live Mode Restaurant Accounts

**For production, restaurants need to provide:**

1. **Business Documents:**
   - PAN Card
   - GST Certificate (if applicable)
   - Bank Account Proof
   - Address Proof

2. **Bank Details:**
   - Account Number
   - IFSC Code
   - Account Holder Name
   - Bank Name

3. **Create Live Linked Accounts:**
   ```bash
   curl -X POST https://api.razorpay.com/v1/accounts \
     -u LIVE_KEY_ID:LIVE_KEY_SECRET \
     -H "Content-Type: application/json" \
     -d '{
       "email": "real@pizzapalace.com",
       "phone": "9876543210",
       "type": "route",
       "legal_business_name": "Pizza Palace Pvt Ltd",
       "business_type": "proprietorship",
       "contact_name": "John Doe",
       "profile": {
         "category": "food",
         "subcategory": "restaurant"
       },
       "legal_info": {
         "pan": "AAAPL1234C",
         "gst": "18AABCT1234C1Z1"
       },
       "bank_account": {
         "ifsc": "HDFC0001234",
         "account_number": "50100123456789",
         "beneficiary_name": "Pizza Palace Pvt Ltd"
       },
       "notes": {
         "restaurant_id": "pizza-palace-id"
       }
     }'
   ```

4. **Submit for KYC:**
   - Razorpay will verify documents (1-2 days)
   - Account status: `created` → `activated`

5. **Update Database:**
   ```javascript
   await prisma.restaurant.update({
     where: { id: 'pizza-palace-id' },
     data: {
       razorpayAccountId: 'acc_LivePizzaXYZ',
       bankAccountNumber: '50100123456789',
       bankIfsc: 'HDFC0001234',
       bankAccountName: 'Pizza Palace Pvt Ltd'
     }
   });
   ```

### 6.2 Switch to Live Mode

1. **Environment Variables:**
   ```env
   # .env (server)
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
   ```

2. **Test with Small Amount:**
   - Place ₹10 order
   - Verify transfer works
   - Check restaurant bank account (usually 2-3 days for first settlement)

---

## Step 7: Settlement Timeline

### Instant Settlement (Default)
```
Payment Received
    ↓ (Immediate)
Transfer Created
    ↓ (T+2 to T+3 days)
Money in Restaurant Bank Account
```

### Custom Schedule
```javascript
// Update restaurant
{
  settlementSchedule: 'daily',    // Batch at EOD
  settlementSchedule: 'weekly',   // Every Monday
  settlementSchedule: 'monthly',  // 1st of month
}
```

---

## Step 8: Monitoring & Reports

### 8.1 Transfer Dashboard

Create `server/routes/settlements.js`:

```javascript
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get settlement report
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, restaurantId } = req.query;

    const where = {
      paymentStatus: 'paid',
      createdAt: {
        gte: new Date(startDate || '2025-01-01'),
        lte: new Date(endDate || new Date()),
      }
    };

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        restaurant: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by restaurant
    const settlementByRestaurant = {};

    for (const order of orders) {
      const restId = order.restaurantId;
      
      if (!settlementByRestaurant[restId]) {
        settlementByRestaurant[restId] = {
          restaurant: order.restaurant.name,
          totalOrders: 0,
          totalRevenue: 0,
          totalTransferred: 0,
          totalCommission: 0,
          pendingSettlement: 0,
          orders: []
        };
      }

      const data = settlementByRestaurant[restId];
      data.totalOrders++;
      data.totalRevenue += order.grandTotal;
      data.totalTransferred += order.transferAmount || 0;
      data.totalCommission += order.platformCommission || 0;
      
      if (order.settlementStatus === 'pending') {
        data.pendingSettlement += order.grandTotal;
      }

      data.orders.push({
        orderNumber: order.orderNumber,
        amount: order.grandTotal,
        transferred: order.transferAmount,
        commission: order.platformCommission,
        status: order.settlementStatus,
        date: order.createdAt
      });
    }

    res.json({
      reportPeriod: { startDate, endDate },
      settlements: Object.values(settlementByRestaurant),
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.grandTotal, 0),
        totalTransferred: orders.reduce((sum, o) => sum + (o.transferAmount || 0), 0),
        totalCommission: orders.reduce((sum, o) => sum + (o.platformCommission || 0), 0),
      }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
```

Register route in `server/index.js`:
```javascript
const settlementRoutes = require('./routes/settlements');
app.use('/api/settlements', settlementRoutes);
```

### 8.2 Test Report

```bash
curl "http://localhost:5000/api/settlements/report?startDate=2025-10-01&endDate=2025-10-10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 Quick Start Checklist

- [ ] Request Razorpay Route access
- [ ] Create test linked accounts for restaurants
- [ ] Update database schema with transfer fields
- [ ] Update seed data with test account IDs
- [ ] Implement transfer service
- [ ] Update order verification route
- [ ] Test with test card
- [ ] Verify transfers in dashboard
- [ ] Create settlement reports
- [ ] Set up production accounts (for live)

---

## 📊 Expected Test Results

### Console Output:
```
Customer Payment: ₹861
   ↓
Platform receives: ₹861
   ↓
Transfers:
├─ Pizza Palace: ₹443 (₹492 - 10% = ₹443)
└─ Burger Barn: ₹332 (₹369 - 10% = ₹332)
Platform keeps: ₹86 (10% commission)

Total: ₹443 + ₹332 + ₹86 = ₹861 ✅
```

### Database:
```javascript
Order 1 (Pizza):
{
  grandTotal: 492,
  transferAmount: 443,
  platformCommission: 49,
  transferId: "trf_xyz123",
  transferStatus: "created",
  settlementStatus: "completed"
}

Order 2 (Burger):
{
  grandTotal: 369,
  transferAmount: 332,
  platformCommission: 37,
  transferId: "trf_abc456",
  transferStatus: "created",
  settlementStatus: "completed"
}
```

---

## 🚨 Troubleshooting

### Issue: Transfer Failed
```
Error: account not activated
```
**Solution:** Wait for KYC approval, or use test accounts in test mode.

### Issue: Invalid Account ID
```
Error: Bad request - The id provided does not exist
```
**Solution:** Verify `razorpayAccountId` in database matches linked account ID.

### Issue: Insufficient Balance
```
Error: Your account does not have enough balance
```
**Solution:** In test mode, balance is virtual. In live mode, ensure payment is captured first.

---

## 📞 Support

- **Razorpay Docs:** https://razorpay.com/docs/route/
- **Support:** support@razorpay.com
- **Dashboard:** https://dashboard.razorpay.com/

---

Ready to implement? Let's start with Step 1! 🚀

