# Multi-Restaurant Food Court Migration Guide

## Overview
Successfully transformed the Ernakulam Dine Flow app from a single-restaurant system to a multi-restaurant food court platform (similar to Swiggy/Zomato food court model).

## Key Changes

### 1. Database Schema (Prisma)
**File: `server/prisma/schema.prisma`**

Added new `Restaurant` model with the following fields:
- `id`, `name`, `description`, `cuisine`, `image`
- `rating`, `preparationTime`, `isActive`
- Relations to `MenuItem`, `Staff`, and `Order`

Updated existing models:
- **MenuItem**: Added `restaurantId` and `restaurant` relation
- **Staff**: Added `restaurantId` and `restaurant` relation
- **Order**: Added `restaurantId` and `restaurant` relation

### 2. Seed Data
**File: `server/prisma/seed.js`**

Created comprehensive seed data for **5 restaurants**:
1. **Spice Junction** (Indian) - 7 menu items
2. **Dragon Wok** (Chinese) - 6 menu items
3. **Pizza Palace** (Italian) - 6 menu items
4. **Burger Barn** (Fast Food) - 6 menu items
5. **Cafe Mocha** (Cafe) - 6 menu items

Each restaurant has:
- Unique cuisine type and menu items
- Dedicated staff member with unique PIN
- Rating and preparation time
- Restaurant-specific emoji/icon

**Staff Login PINs:**
- 🍛 Spice Junction: **1234**
- 🥡 Dragon Wok: **2345**
- 🍕 Pizza Palace: **3456**
- 🍔 Burger Barn: **4567**
- ☕ Cafe Mocha: **5678**

### 3. Backend API Routes

#### New: Restaurant Management
**File: `server/routes/restaurant.js`**
- `GET /api/restaurants` - List all restaurants (public)
- `GET /api/restaurants/:id` - Get single restaurant with menu
- `POST /api/restaurants` - Create restaurant (admin only)
- `PUT /api/restaurants/:id` - Update restaurant (admin only)
- `PATCH /api/restaurants/:id/status` - Toggle active status (admin only)
- `DELETE /api/restaurants/:id` - Delete restaurant (admin only)
- `GET /api/restaurants/:id/stats` - Get restaurant statistics (staff)

#### Updated: Menu Routes
**File: `server/routes/menu.js`**
- Added `restaurantId` query parameter to filter menus
- All menu items now include restaurant information
- Staff can only manage menu items from their restaurant (unless admin)
- Menu creation requires `restaurantId`

#### Updated: Order Routes
**File: `server/routes/order.js`**
- Orders automatically detect restaurant from menu items
- **Important**: All items in an order must be from the same restaurant
- Orders include restaurant information in responses
- Socket events now emit to restaurant-specific rooms
- Prepayment flow validates restaurant consistency

#### Updated: Staff Routes
**File: `server/routes/staff.js`**
- Staff members are now tied to specific restaurants
- Staff can only see/manage staff from their restaurant (unless admin)
- `restaurantId` required when creating staff

#### Updated: Auth Routes
**File: `server/routes/auth.js`**
- JWT tokens now include `restaurantId`
- Login response includes restaurant information
- Staff object includes restaurant details

### 4. Socket.IO Updates
**File: `server/index.js`**

Enhanced real-time communication:
- Added restaurant-specific rooms: `staff:{restaurantId}`
- Staff join both general `staff` room and their restaurant-specific room
- Orders emit to both general and restaurant-specific staff rooms
- Customers still use order-specific rooms: `customer:{orderId}`

**File: `src/lib/socket.ts`**
- Updated `joinStaffRoom()` to accept optional `restaurantId`
- Staff components pass restaurant ID when joining

### 5. Frontend Components

#### New: Restaurant Selection
**File: `src/components/customer/RestaurantSelection.tsx`**

Beautiful restaurant grid showing:
- Restaurant name, description, cuisine
- Rating and preparation time
- Number of available menu items
- Clickable cards with hover effects
- Loading skeleton states

#### Updated: Customer App
**File: `src/components/customer/CustomerApp.tsx`**

Major flow changes:
1. Shows `RestaurantSelection` when no restaurant is selected
2. Persists selected restaurant to localStorage
3. Passes selected restaurant to `DigitalMenu`
4. Includes "Back to Restaurants" functionality
5. Clears cart when changing restaurants

#### Updated: Digital Menu
**File: `src/components/customer/DigitalMenu.tsx`**

Enhancements:
- Restaurant header showing selected restaurant info
- Fetches menu items filtered by selected restaurant
- "Back to Restaurants" button in header
- Validates all cart items are from same restaurant
- Shows restaurant rating, cuisine, and prep time

#### Updated: Order Status
**File: `src/components/customer/OrderStatus.tsx`**

Added restaurant information display:
- Restaurant emoji/icon, name, and cuisine
- "Ordered from" label
- Shows restaurant details at top of order summary

#### Updated: Staff Dashboard
**File: `src/components/staff/StaffDashboard.tsx`**

Restaurant context display:
- Shows staff's restaurant in header
- Restaurant emoji, name, and cuisine
- Joins restaurant-specific socket room

#### Updated: Order Management
**File: `src/components/staff/OrderManagement.tsx`**
- Joins restaurant-specific socket room
- Receives only orders for staff's restaurant

### 6. API Client
**File: `src/lib/api.ts`**

Added restaurant API:
```typescript
restaurantAPI.getAll(activeOnly)
restaurantAPI.getById(id)
restaurantAPI.getStats(id)
restaurantAPI.create(data)
restaurantAPI.update(id, data)
restaurantAPI.updateStatus(id, isActive)
restaurantAPI.delete(id)
```

Updated existing APIs:
- `menuAPI.getAll()` - Added `restaurantId` parameter
- `orderAPI.getAll()` - Added `restaurantId` parameter

## Important Business Rules

### Order Rules
1. ✅ **Multi-Restaurant Orders**: Customers can order from multiple restaurants in a single order (true food court experience!)
2. **Restaurant Tracking**: Backend tracks all restaurants involved in each order
3. **Smart Notifications**: All involved restaurant staff receive notifications for their items
4. **Cart Grouping**: Cart displays items grouped by restaurant for clarity

### Staff Permissions
1. **Restaurant Scope**: Staff can only see/manage data from their assigned restaurant
2. **Admin Override**: Admin role can access all restaurants
3. **Create Restrictions**: Staff can only create items for their own restaurant

### Socket Communication
1. **Restaurant Rooms**: Orders emit to `staff:{restaurantId}` for targeted updates
2. **General Room**: Also emit to general `staff` room for admin dashboard
3. **Customer Rooms**: Unchanged - still use `customer:{orderId}`

## Migration Steps

### For New Deployments
1. Update database schema: `npx prisma db push`
2. Run seed script: `npm run seed` (in server directory)
3. Start backend: `npm run dev`
4. Start frontend: `npm run dev`

### For Existing Deployments
⚠️ **Breaking Changes** - This is a major schema change!

1. **Backup your data** before proceeding
2. You'll need to:
   - Create Restaurant records
   - Assign existing MenuItems to restaurants
   - Assign existing Staff to restaurants
   - Link existing Orders to restaurants
3. Consider creating a migration script for production data

## Staff Login Credentials

Each restaurant has its own staff account with a **unique PIN**:

| Restaurant | PIN | Emoji |
|------------|-----|-------|
| Spice Junction | **1234** | 🍛 |
| Dragon Wok | **2345** | 🥡 |
| Pizza Palace | **3456** | 🍕 |
| Burger Barn | **4567** | 🍔 |
| Cafe Mocha | **5678** | ☕ |

**To test different restaurants:**
1. Go to Staff Dashboard
2. Login with a specific PIN
3. You'll see only that restaurant's orders and menu
4. Try different PINs to switch between restaurants!

## Testing Checklist

### Customer Flow
- [ ] Restaurant selection screen displays all restaurants
- [ ] Can select a restaurant and view its menu
- [ ] Can only add items from selected restaurant to cart
- [ ] Order shows restaurant information
- [ ] Can go back to restaurant selection (clears cart)
- [ ] Selected restaurant persists on page reload

### Staff Flow
- [ ] Staff login shows restaurant in header
- [ ] Staff see only their restaurant's orders
- [ ] New orders arrive via restaurant-specific socket
- [ ] Menu management filtered to staff's restaurant
- [ ] Cannot modify other restaurants' data

### Order Flow
- [ ] Orders created with correct restaurant association
- [ ] Mixed restaurant items rejected with clear error
- [ ] Restaurant info visible in order details
- [ ] Payment flow works with restaurant context
- [ ] Real-time updates work per restaurant

## API Endpoints Summary

### New Endpoints
```
GET    /api/restaurants              - List restaurants
GET    /api/restaurants/:id          - Get restaurant details
POST   /api/restaurants              - Create restaurant (admin)
PUT    /api/restaurants/:id          - Update restaurant (admin)
PATCH  /api/restaurants/:id/status   - Toggle status (admin)
DELETE /api/restaurants/:id          - Delete restaurant (admin)
GET    /api/restaurants/:id/stats    - Get statistics
```

### Updated Endpoints
```
GET /api/menu?restaurantId=xxx           - Filter menu by restaurant
GET /api/orders?restaurantId=xxx         - Filter orders by restaurant
GET /api/staff?restaurantId=xxx          - Filter staff by restaurant
```

## Configuration

### Environment Variables
No new environment variables required. Existing setup works as-is.

### Database
- MongoDB with Prisma ORM
- All existing collections updated with new fields
- New `Restaurant` collection

## Future Enhancements

Potential improvements for the multi-restaurant system:

1. **Restaurant Analytics Dashboard** - Comparative analytics across restaurants
2. **Cross-Restaurant Promotions** - Bundle deals from multiple restaurants
3. **Restaurant Operating Hours** - Time-based availability
4. **Multiple Orders** - Allow customers to place concurrent orders from different restaurants
5. **Restaurant Search & Filters** - Search by cuisine, rating, prep time
6. **Restaurant Reviews** - Customer ratings and feedback
7. **Restaurant Admin Portal** - Self-service restaurant management

## Notes

- **Cart Persistence**: Cart persists when switching restaurants (allows multi-restaurant orders!)
- **localStorage Keys**: Added `selectedRestaurant` to existing cart and order keys
- **Socket Rooms**: Dual emission to all involved restaurants + general staff room
- **Restaurant Grouping**: Cart UI automatically groups items by restaurant
- **Smart Notifications**: Each restaurant only notified about their items
- **Backward Compatibility**: Admin can still see all data across restaurants

## Support

For questions or issues:
1. Check the API documentation in `API_REFERENCE.md`
2. Review the Prisma schema in `server/prisma/schema.prisma`
3. Test with the seeded data (5 restaurants, multiple staff accounts)

---

**Migration Status**: ✅ Complete
**Last Updated**: October 9, 2025
**Breaking Changes**: Yes - requires database migration
**Backward Compatible**: No - schema changes required

