# Payment Flows - Multi-Restaurant Orders

## Overview
The system supports **two payment methods** with different handling for multi-restaurant orders.

---

## 1. 💳 Online Payment (Razorpay Prepayment)

### Flow:
```
Customer adds items → Place Order → Pay Now (Razorpay) → Orders Created
```

### How It Works:

#### Step 1: Calculate Combined Total
```javascript
// POST /orders/create-prepayment
// Calculates SINGLE combined total for ALL restaurants

totalAmount = 0
for each item:
  totalAmount += item.price × quantity

serviceCharge = totalAmount × 0.05
gst = totalAmount × 0.18
grandTotal = totalAmount + serviceCharge + gst

// Creates ONE Razorpay order for combined amount
razorpayOrder = {
  amount: grandTotal × 100,  // e.g., ₹850 for Pizza + Burger
  currency: 'INR',
  receipt: 'PREPAY-12345'
}
```

#### Step 2: Customer Pays Combined Amount
- **Razorpay modal opens**
- Customer pays **₹850** (combined total)
- Payment captured by Razorpay

#### Step 3: Create Separate Orders After Payment
```javascript
// POST /orders/verify-prepayment
// After payment verified, creates SEPARATE orders per restaurant

Payment Verified ✅

Group items by restaurant:
- Pizza Palace items → Create Order #ORD-001 (₹450, status: 'paid')
- Burger Barn items → Create Order #ORD-002 (₹400, status: 'paid')

Both orders linked by orderGroupId: 'GRP-1728...'
```

### Payment Distribution:
```
Customer Pays: ₹850 (combined)
   ↓
System Creates:
   • Order #ORD-001 (Pizza Palace): ₹450 [PAID]
   • Order #ORD-002 (Burger Barn): ₹400 [PAID]
   
orderGroupId: GRP-1728123456-9876
```

### Key Points:
✅ **Single Payment** - Customer pays once for all restaurants  
✅ **Separate Orders** - Each restaurant gets their own order record  
✅ **Auto-Paid Status** - All orders marked as `paid` immediately  
✅ **Amount Breakdown** - Each order has correct restaurant-specific total  

---

## 2. 💵 Cash Payment (Pay After Meal)

### Flow:
```
Customer adds items → Place Order (Cash) → Orders Created → Eat → Pay Later
```

### How It Works:

#### Step 1: Create Separate Orders Immediately
```javascript
// POST /orders (paymentMethod: 'cash')
// Creates SEPARATE orders for each restaurant immediately

Group items by restaurant:
- Pizza Palace items → Create Order #ORD-003 (₹450, status: 'pending', paymentStatus: 'unpaid')
- Burger Barn items → Create Order #ORD-004 (₹400, status: 'pending', paymentStatus: 'unpaid')

Both orders linked by orderGroupId: 'GRP-1728...'
```

#### Step 2: Customer Eats Meal
- Each restaurant prepares their items independently
- Order statuses update: `pending → preparing → ready → served`

#### Step 3: Payment After Meal
**⚠️ CURRENT LIMITATION:**
```
BillPayment component currently handles SINGLE order only:
- Shows total for ONE order
- Marks ONE order as paid

For multi-restaurant orders:
- Customer needs to pay EACH restaurant separately
- OR pay combined amount at one counter (manual distribution)
```

### Current Cash Payment:
```
Order Group: GRP-1728123456-9876
   ↓
Separate Payments Required:
   • Order #ORD-003 (Pizza Palace): ₹450 [Pay at Pizza counter]
   • Order #ORD-004 (Burger Barn): ₹400 [Pay at Burger counter]
```

---

## Payment Amount Calculation

### Per-Restaurant Calculation:
```javascript
// Each restaurant's order calculated independently

Restaurant Total:
   Item 1: ₹200 × 2 = ₹400
   Item 2: ₹150 × 1 = ₹150
   ─────────────────────────
   Subtotal:        ₹550
   
Service Charge (5%): ₹27.50 → ₹28 (rounded)
GST (18%):          ₹99.00 → ₹99 (rounded)
   ─────────────────────────
   Grand Total:     ₹677
```

### Multi-Restaurant Combined:
```
Pizza Palace Order:
   Subtotal:        ₹400
   Service Charge:   ₹20
   GST:             ₹72
   Total:           ₹492

Burger Barn Order:
   Subtotal:        ₹300
   Service Charge:   ₹15
   GST:             ₹54
   Total:           ₹369

COMBINED PAYMENT (Online): ₹861
SEPARATE PAYMENTS (Cash):  ₹492 + ₹369 = ₹861
```

---

## Database Storage

### Order Records:
```javascript
// Pizza Palace Order
{
  id: "order123",
  orderNumber: "ORD-001",
  orderGroupId: "GRP-1728123456-9876",  // Links to Burger order
  restaurantId: "pizza-palace-id",
  totalAmount: 400,
  serviceCharge: 20,
  gst: 72,
  grandTotal: 492,
  paymentStatus: "paid",      // For online payment
  paymentMethod: "online",
  status: "paid"
}

// Burger Barn Order
{
  id: "order124",
  orderNumber: "ORD-002",
  orderGroupId: "GRP-1728123456-9876",  // Same group ID
  restaurantId: "burger-barn-id",
  totalAmount: 300,
  serviceCharge: 15,
  gst: 54,
  grandTotal: 369,
  paymentStatus: "paid",
  paymentMethod: "online",
  status: "paid"
}
```

---

## API Endpoints

### Create Prepayment (Online)
```
POST /orders/create-prepayment
Body: { items: [...] }

Response: {
  razorpayOrderId: "order_xyz",
  amount: 850,          // COMBINED total
  currency: "INR"
}
```

### Verify & Create Orders (Online)
```
POST /orders/verify-prepayment
Body: {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  items: [...]
}

Response: {
  orders: [order1, order2],  // Separate orders
  orderGroupId: "GRP-...",
  totalOrders: 2
}
```

### Create Cash Orders
```
POST /orders
Body: {
  items: [...],
  paymentMethod: "cash"
}

Response: {
  orders: [order1, order2],  // Separate unpaid orders
  orderGroupId: "GRP-...",
  totalOrders: 2
}
```

---

## Suggested Improvements

### For Cash Payments with Multiple Restaurants:

#### Option 1: Combined Cash Payment
```javascript
// Add to BillPayment component
if (orderGroupId) {
  // Fetch ALL orders in group
  const groupOrders = await orderAPI.getByGroupId(orderGroupId);
  
  // Show combined total
  const totalAmount = groupOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  
  // Pay all at once
  await Promise.all(
    groupOrders.map(order => orderAPI.markPaid(order.id, paymentMethod))
  );
}
```

#### Option 2: Individual Restaurant Payments
```javascript
// Show separate payment buttons per restaurant
{groupOrders.map(order => (
  <PaymentCard
    restaurant={order.restaurant}
    amount={order.grandTotal}
    onPay={() => orderAPI.markPaid(order.id, method)}
  />
))}
```

#### Option 3: QR Code Split
```
Generate unique QR codes per restaurant
Customer scans at each counter to pay individually
```

---

## Current Status

### ✅ Working:
- Online payment with combined total
- Separate order creation per restaurant
- Order group tracking
- Real-time status updates per restaurant

### ⚠️ Limitation:
- Cash payment `BillPayment` component only handles single order
- Multi-restaurant cash orders need manual payment distribution

### 🔧 Quick Fix Needed:
Update `BillPayment.tsx` to:
1. Accept `orderGroupId` prop
2. Detect multi-restaurant orders
3. Show combined payment option OR individual payment cards
4. Mark all orders as paid together

---

## Summary

**Online Payment (Razorpay):**
- ✅ Customer pays ONCE for all restaurants
- ✅ System creates separate tracked orders
- ✅ Fully implemented and working

**Cash Payment:**
- ✅ Separate orders created immediately
- ⚠️ Payment UI needs update for multi-restaurant
- 💡 Recommended: Add combined payment view in BillPayment component

**Bottom Line:**  
Online payment is **fully functional** for multi-restaurant orders. Cash payment needs a UI update to handle paying for multiple orders at once.

