# Quick Test Guide - Split Payments

## ✅ Setup Complete!

All restaurants now have mock Razorpay accounts configured:

```
✅ Spice Junction - 10% commission
✅ Dragon Wok - 10% commission  
✅ Pizza Palace - 10% commission
✅ Burger Barn - 10% commission
✅ Cafe Mocha - 10% commission
```

---

## 🧪 Test Split Payments NOW

### Step 1: Start Servers

**Backend should already be running** (nodemon will auto-restart)

If not:
```bash
cd server
npm start
```

**Frontend:**
```bash
npm run dev
```

### Step 2: Place Multi-Restaurant Order

1. Open http://localhost:5173
2. Click **"Customer Page"**
3. Select **Pizza Palace** → Add items (e.g., Margherita Pizza)
4. Click **"← Back"**
5. Select **Burger Barn** → Add more items (e.g., Classic Burger)
6. Click **"Place Order"**
7. Select **"Pay Now"**
8. Use test card:
   ```
   Card: 4111 1111 1111 1111
   CVV: 123
   Expiry: 12/25
   ```

### Step 3: Watch Backend Console

You should see:

```
💸 Initiating automatic transfers to restaurants...

💰 Processing transfer for Order ORD-001:
   Restaurant: Pizza Palace
   Total Amount: ₹492
   Platform Commission (10%): ₹49
   Transfer Amount: ₹443
   Creating transfer to account: acc_TESTPizzaPalBZUY4QKN...
   
❌ Transfer failed for Pizza Palace:
   Error: The id provided does not exist

💰 Processing transfer for Order ORD-002:
   Restaurant: Burger Barn
   Total Amount: ₹369
   Platform Commission (10%): ₹37
   Transfer Amount: ₹332
   Creating transfer to account: acc_TESTBurgerBaCEEDG16P...

❌ Transfer failed for Burger Barn:
   Error: The id provided does not exist

📊 Transfer Summary:
   Total Orders: 2
   Successful: 0
   Failed: 2
   Total Transferred to Restaurants: ₹0
   Total Platform Commission: ₹0
   ⚠️ 2 transfer(s) failed - check logs above

⚠️ Order ORD-001 marked for manual settlement
⚠️ Order ORD-002 marked for manual settlement

✅ Sending success response to frontend
```

---

## ✅ What This Proves

Even though transfers fail (expected!), you can see:

1. ✅ **Commission Calculated Correctly:**
   - Pizza: ₹492 × 10% = ₹49
   - Burger: ₹369 × 10% = ₹37
   - Total Commission: ₹86

2. ✅ **Transfer Amounts Correct:**
   - Pizza: ₹492 - ₹49 = ₹443
   - Burger: ₹369 - ₹37 = ₹332
   - Total to Restaurants: ₹775

3. ✅ **Total Adds Up:**
   - Customer Paid: ₹861
   - Restaurants Get: ₹775
   - Platform Keeps: ₹86
   - **₹775 + ₹86 = ₹861** ✅

4. ✅ **Transfer Attempts Made:**
   - System tries to transfer to each restaurant
   - Fails because accounts are fake (expected!)

5. ✅ **Error Handling Works:**
   - Orders still created successfully
   - Marked for manual settlement
   - Customer sees success

---

## 📊 Check Database

Your orders will have these fields populated:

```javascript
{
  "_id": "...",
  "orderNumber": "ORD-001",
  "grandTotal": 492,
  "razorpayPaymentId": "pay_test123",
  "transferId": null,  // Would be "trf_xyz" if successful
  "transferAmount": null,  // Would be 443
  "platformCommission": null,  // Would be 49
  "transferStatus": "failed",  // Because account doesn't exist
  "settlementStatus": "pending",  // Needs manual settlement
  "settledAt": null
}
```

---

## 🎯 Expected Results

### ✅ SUCCESS Indicators:
- [x] Payment completes successfully
- [x] 2 orders created (one per restaurant)
- [x] Console shows transfer calculations
- [x] Commission amounts correct
- [x] Transfer attempts logged
- [x] Orders marked for manual settlement
- [x] Frontend shows success

### ❌ EXPECTED Failures:
- [x] Transfer API calls fail (account doesn't exist)
- [x] No money actually transferred
- [x] settlementStatus = "pending"

---

## 🚀 Next: Enable REAL Transfers

To make money ACTUALLY transfer:

### Option 1: Contact Razorpay (For Production)

Email: support@razorpay.com
```
Subject: Enable Razorpay Route

Hi Razorpay Team,

Please enable the Route feature for my account.
Account ID: [Your Account ID from dashboard]
Use Case: Food court marketplace with split payments

Thanks!
```

Wait 1-2 business days for approval.

### Option 2: Create Real Test Accounts

Once Route is enabled:

```bash
cd server
npm run setup-accounts
```

This will:
1. Create real Razorpay linked accounts
2. Update database with real account IDs
3. Enable actual money transfers in test mode

---

## 🔍 Troubleshooting

### Server won't start?
```bash
cd server
npx prisma generate
npm start
```

### No transfer logs?
Check that:
1. Payment completed successfully
2. Backend console is visible
3. Orders were created

### Wrong amounts?
Commission rate is set to 10% in database.
To change:
```javascript
await prisma.restaurant.update({
  where: { name: 'Pizza Palace' },
  data: { commissionRate: 0.15 } // 15%
});
```

---

## 📚 Documentation

- **`RAZORPAY_ROUTE_SETUP.md`** - Complete Razorpay Route setup
- **`PAYMENT_DISTRIBUTION_REALITY.md`** - How payment distribution works
- **`MULTI_RESTAURANT_PAYMENT_SUMMARY.md`** - Payment flows explained
- **`TEST_SPLIT_PAYMENT.md`** - Detailed testing instructions

---

## 💡 Summary

**Current Status:** ✅ READY FOR TESTING

- Mock accounts linked
- Transfer logic implemented
- Commission calculations working
- Error handling in place
- Just needs Razorpay Route to activate real transfers

**Test it now!** 🚀

