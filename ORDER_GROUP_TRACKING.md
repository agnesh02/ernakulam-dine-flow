# Multi-Restaurant Order Tracking Implementation

## Overview
Implemented comprehensive order tracking for multi-restaurant orders, ensuring customers can track ALL orders from their food court purchase, not just the first one.

## Problem
Previously, when customers ordered from multiple restaurants:
- Only the FIRST order was tracked
- Customers couldn't see status of other orders
- No way to view all related orders together

## Solution: Order Group System

### Backend Changes

#### 1. Database Schema (`server/prisma/schema.prisma`)
```prisma
model Order {
  // ... other fields
  orderGroupId   String?     // Links multiple orders from same transaction
  
  @@index([orderGroupId])  // Index for fast lookup
}
```

#### 2. Order Creation (`server/routes/order.js`)
- Generate a **single `orderGroupId`** for multi-restaurant transactions
- Assign same `orderGroupId` to ALL orders in the transaction
- Return `orderGroupId` in API response

```javascript
// Generate group ID only for multi-restaurant orders
const orderGroupId = itemsByRestaurant.size > 1 ? generateOrderGroupId() : null;

// Assign to each order
const order = await prisma.order.create({
  data: {
    orderGroupId,  // Links related orders
    // ... other fields
  }
});

// Return in response
res.json({
  orders: createdOrders,
  orderGroupId,  // Frontend uses this for tracking
});
```

#### 3. New API Endpoint
```javascript
// GET /orders/group/:orderGroupId
// Fetches all orders in a group
router.get('/group/:orderGroupId', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { orderGroupId },
    include: { restaurant, orderItems, menuItem }
  });
  
  res.json({ orders, totalOrders: orders.length, orderGroupId });
});
```

### Frontend Changes

#### 1. API Client (`src/lib/api.ts`)
```typescript
export const orderAPI = {
  getByGroupId: async (orderGroupId: string) => {
    const response = await fetch(`${API_BASE_URL}/orders/group/${orderGroupId}`);
    return response.json();
  },
};
```

#### 2. DigitalMenu Component
- Updated to pass `orderGroupId` (if available) to parent component
- Falls back to first order for single-restaurant orders

```typescript
// Pass orderGroupId for multi-restaurant, first order for single
onOrderPlaced(result.orderGroupId || firstOrder);
```

#### 3. CustomerApp Component
- Added `orderGroupId` state (persisted in localStorage)
- Updated `handleOrderPlaced` to handle both:
  - **String** = orderGroupId (multi-restaurant)
  - **Object** = order (single restaurant)

```typescript
const [orderGroupId, setOrderGroupId] = useState<string | null>(() => {
  return localStorage.getItem('currentOrderGroupId');
});

const handleOrderPlaced = (orderOrGroupId: string | { id: string }) => {
  if (typeof orderOrGroupId === 'string') {
    // Multi-restaurant: store group ID
    setOrderGroupId(orderOrGroupId);
    localStorage.setItem('currentOrderGroupId', orderOrGroupId);
  } else {
    // Single restaurant: store order
    setOrderId(orderOrGroupId.id);
    localStorage.setItem('currentOrderId', orderOrGroupId.id);
  }
};
```

#### 4. OrderStatus Component
- **Detects** if `orderGroupId` is present
- **Fetches** all orders in the group
- **Displays** multi-restaurant view with:
  - Summary header (total restaurants, total amount, overall status)
  - Individual restaurant cards showing:
    - Restaurant name and cuisine
    - Order number and items
    - Individual status badge and timeline
    - Real-time updates for each order

```typescript
// Fetch all orders in group
useEffect(() => {
  if (orderGroupId) {
    const response = await orderAPI.getByGroupId(orderGroupId);
    setGroupOrders(response.orders);
  }
}, [orderGroupId]);

// Render multi-restaurant view
if (orderGroupId && groupOrders.length > 0) {
  return (
    <>
      <Card>  {/* Summary */}
        <h3>Your Food Court Order</h3>
        <p>{groupOrders.length} restaurants • Total: ₹{totalAmount}</p>
      </Card>
      
      {groupOrders.map(order => (
        <Card key={order.id}>  {/* Individual restaurant */}
          <RestaurantInfo {...order.restaurant} />
          <OrderItems items={order.orderItems} />
          <StatusTimeline status={order.status} />
        </Card>
      ))}
    </>
  );
}
```

## Real-Time Updates

### Socket.IO Integration
- Each order in a group joins its own customer room
- Socket listeners update specific order in state
- All orders refresh independently

```typescript
// Join all order rooms
groupOrders.forEach(order => {
  joinCustomerRoom(order.id);
});

// Update specific order on status change
onOrderStatusUpdate((data) => {
  setGroupOrders(prev => 
    prev.map(order => 
      order.id === data.orderId ? { ...order, ...data.order } : order
    )
  );
});
```

## User Experience

### Before (❌ Broken)
1. Customer orders from Pizza Palace + Burger Barn
2. Only Pizza Palace order tracked
3. Burger Barn order invisible
4. Customer confused about second order

### After (✅ Fixed)
1. Customer orders from Pizza Palace + Burger Barn
2. **Order Status** shows:
   - "Your Food Court Order"
   - "2 restaurants • Total: ₹850"
   - **Pizza Palace** card:
     - Order #ORD-123456
     - Items: Margherita Pizza, Garlic Bread
     - Status: Preparing
   - **Burger Barn** card:
     - Order #ORD-123457
     - Items: Classic Burger, Fries
     - Status: Ready
3. Real-time updates for each restaurant independently
4. Clear visibility of entire order

## Testing Checklist

✅ **Single Restaurant Order**
- [x] Creates order without orderGroupId
- [x] Tracks single order normally
- [x] Backward compatible

✅ **Multi-Restaurant Order**
- [x] Generates unique orderGroupId
- [x] Assigns same groupId to all orders
- [x] Returns groupId in response

✅ **Order Tracking**
- [x] Fetches all orders in group via `/orders/group/:id`
- [x] Displays summary with total amount
- [x] Shows individual restaurant cards
- [x] Status badges for each order
- [x] Compact status timeline per restaurant

✅ **Persistence**
- [x] orderGroupId saved in localStorage
- [x] Restored on page refresh
- [x] Switches between single/multi views correctly

✅ **Real-Time**
- [x] Socket rooms joined for each order
- [x] Status updates for individual orders
- [x] UI refreshes when any order updates

## Files Modified

### Backend
- ✅ `server/prisma/schema.prisma` - Added `orderGroupId` field
- ✅ `server/routes/order.js` - Generate and assign group IDs
- ✅ Database - Schema updated via `prisma db push`

### Frontend
- ✅ `src/lib/api.ts` - Added `getByGroupId` method
- ✅ `src/components/customer/DigitalMenu.tsx` - Pass groupId to parent
- ✅ `src/components/customer/CustomerApp.tsx` - Handle groupId state
- ✅ `src/components/customer/OrderStatus.tsx` - Multi-restaurant UI

## Benefits

1. **Complete Visibility**: Customers see ALL their orders
2. **Independent Tracking**: Each restaurant's progress shown separately
3. **Real-Time Updates**: All orders update live
4. **Better UX**: Clear grouping and status for food court scenario
5. **Backward Compatible**: Single-restaurant orders work as before

## Next Steps (Optional Enhancements)

1. **Order History**: List all past order groups
2. **Push Notifications**: Notify when ANY order in group is ready
3. **Analytics**: Track multi-restaurant ordering patterns
4. **Staff View**: Show grouped orders in staff dashboard
5. **Split Payment**: Support paying for orders individually

---

**Status**: ✅ Fully Implemented & Tested
**Date**: October 9, 2025

