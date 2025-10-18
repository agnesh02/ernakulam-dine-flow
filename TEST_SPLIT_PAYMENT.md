# Testing Split Payments - Quick Guide

## 🎯 What We're Testing

Customer pays **₹861** → Automatically splits to:
- Pizza Palace: ₹443 (after 10% commission)
- Burger Barn: ₹332 (after 10% commission)
- Platform keeps: ₹86 (10% commission)

---

## ⚡ Quick Test (Without Razorpay Route - Simulation)

**Since Razorpay Route requires approval, the code will:**
- ✅ Calculate correct transfer amounts
- ✅ Calculate platform commission
- ✅ Log what WOULD be transferred
- ⚠️ Skip actual transfer (no linked accounts yet)
- ✅ Mark orders for manual settlement

### Expected Console Output:

```
💸 Initiating transfers for 2 order(s)...
   Payment ID: pay_test123

💰 Processing transfer for Order ORD-001:
   Restaurant: Pizza Palace
   Total Amount: ₹492
   Platform Commission (10%): ₹49
   Transfer Amount: ₹443
   ⚠️  Pizza Palace has no linked Razorpay account. Skipping transfer.
   Order will be marked for manual settlement.

💰 Processing transfer for Order ORD-002:
   Restaurant: Burger Barn
   Total Amount: ₹369
   Platform Commission (10%): ₹37
   Transfer Amount: ₹332
   ⚠️  Burger Barn has no linked Razorpay account. Skipping transfer.
   Order will be marked for manual settlement.

📊 Transfer Summary:
   Total Orders: 2
   Successful: 0
   Failed: 2
   Total Transferred to Restaurants: ₹0
   Total Platform Commission: ₹0
   ⚠️  2 transfer(s) failed - check logs above
```

**This is EXPECTED until you set up Razorpay Route accounts!**

---

## 🧪 Step-by-Step Test

### 1. Apply Database Changes

```bash
cd server
npx prisma db push
```

**Expected Output:**
```
✓ Schema pushed to database
✓ New fields added to Restaurant and Order models
```

### 2. Start Backend

```bash
cd server
npm start
```

**Look for:**
```
[SERVER] Server running on http://localhost:5000
[SERVER] MongoDB connected successfully
```

### 3. Start Frontend

```bash
# New terminal
npm run dev
```

### 4. Place Multi-Restaurant Order

1. **Open** http://localhost:5173
2. **Go to Customer Page**
3. **Select Pizza Palace** → Add items (e.g., Margherita Pizza)
4. **Back to Restaurants**
5. **Select Burger Barn** → Add items (e.g., Classic Burger)
6. **Click "Place Order"**
7. **Select "Pay Now" (Razorpay)**

### 5. Use Test Card

```
Card: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Test User
```

### 6. Check Backend Console

You should see:

```
✅ Payment signature verified successfully

💸 Initiating automatic transfers to restaurants...

💰 Processing transfer for Order ORD-xxxxx:
   Restaurant: Pizza Palace
   Total Amount: ₹492
   Platform Commission (10%): ₹49
   Transfer Amount: ₹443
   ⚠️  Pizza Palace has no linked Razorpay account. Skipping transfer.

💰 Processing transfer for Order ORD-xxxxx:
   Restaurant: Burger Barn
   Total Amount: ₹369
   Platform Commission (10%): ₹37
   Transfer Amount: ₹332
   ⚠️  Burger Barn has no linked Razorpay account. Skipping transfer.

📊 Transfer Summary:
   Total Orders: 2
   Successful: 0
   Failed: 2

⚠️  Order ORD-xxxxx marked for manual settlement
⚠️  Order ORD-xxxxx marked for manual settlement
```

**This proves the calculation works correctly!**

---

## 🔑 To Enable REAL Transfers

### Option 1: Full Razorpay Route Setup

Follow `RAZORPAY_ROUTE_SETUP.md`:

1. **Request Route access** from Razorpay
2. **Create test linked accounts:**
   ```bash
   curl -X POST https://api.razorpay.com/v1/accounts \
     -u TEST_KEY_ID:TEST_KEY_SECRET \
     -d '{
       "email": "pizza@test.com",
       "phone": "9999999991",
       "type": "route",
       "legal_business_name": "Pizza Palace Test",
       "business_type": "individual"
     }'
   ```
3. **Save account ID** (e.g., `acc_PizzaTestXYZ`)
4. **Update database:**
   ```javascript
   await prisma.restaurant.update({
     where: { name: 'Pizza Palace' },
     data: {
       razorpayAccountId: 'acc_PizzaTestXYZ',
       commissionRate: 0.10
     }
   });
   ```
5. **Test again** → See real transfers!

### Option 2: Temporary Test Accounts

Update seed data with dummy account IDs to see the flow:

```javascript
// server/prisma/seed.js
const restaurants = [
  {
    name: 'Spice Junction',
    razorpayAccountId: 'acc_TestSpice123', // Dummy for testing
    commissionRate: 0.10,
    // ... other fields
  },
  // ... other restaurants
];
```

**Note:** Transfers will still fail, but you'll see the API call attempt.

---

## 📊 What to Check in Database

After placing an order, check MongoDB:

```javascript
// Order with transfer tracking
{
  "_id": "...",
  "orderNumber": "ORD-001",
  "grandTotal": 492,
  
  // NEW FIELDS:
  "razorpayPaymentId": "pay_test123",
  "transferId": null,              // Would be "trf_xyz" if successful
  "transferAmount": null,          // Would be 443
  "platformCommission": null,      // Would be 49
  "transferStatus": "failed",      // Because no linked account
  "settlementStatus": "pending",   // Needs manual settlement
  "settledAt": null
}
```

---

## 🎬 Demo Video Script

**What to show:**

1. **Show Console:** "Watch the transfer calculations"
2. **Place Order:** Multi-restaurant cart
3. **Pay:** Razorpay test card
4. **Console Output:**
   ```
   💰 Pizza: ₹492 total
      Platform: ₹49
      Restaurant: ₹443 ✅
   
   💰 Burger: ₹369 total
      Platform: ₹37
      Restaurant: ₹332 ✅
   ```
5. **Database:** Show transfer fields populated

---

## ✅ Success Criteria

Even without Razorpay Route, you should verify:

1. ✅ **Calculations are correct:**
   - Platform commission = 10% of order total
   - Transfer amount = 90% of order total
   - Numbers match restaurant orders

2. ✅ **Console logs show:**
   - Individual order breakdowns
   - Transfer attempts
   - Summary with totals

3. ✅ **Database records:**
   - `platformCommission` calculated
   - `transferAmount` calculated  
   - `settlementStatus` set to "pending"

4. ✅ **Order still created successfully:**
   - Customer sees order
   - Staff sees order
   - No errors in payment flow

---

## 🚀 Next Steps

1. **Test the calculation logic** (works now!)
2. **Request Razorpay Route** access
3. **Create linked accounts** for restaurants
4. **Update `razorpayAccountId`** in database
5. **Test again** → See real transfers!

---

## 📞 Troubleshooting

### Error: Cannot find module '../services/paymentTransfer.js'

```bash
# Make sure the file exists:
ls server/services/paymentTransfer.js

# If not, create it from the code above
```

### Error: Cannot read property 'razorpayAccountId' of undefined

Restaurant data not loaded. Check:
```bash
cd server
npm run db:seed
```

### No transfer logs appearing

Check:
1. Payment verification succeeded?
2. Orders created successfully?
3. Console shows payment ID?

---

## 💡 What You'll Learn

Even in "simulation mode" (without Route), you'll see:
- ✅ How commission is calculated
- ✅ How amounts are split per restaurant
- ✅ Settlement tracking in database
- ✅ Error handling for missing accounts
- ✅ Manual settlement marking

**The system is ready! Just needs Razorpay Route to activate real transfers.**

