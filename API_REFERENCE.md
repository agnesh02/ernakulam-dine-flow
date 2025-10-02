# 📡 API Reference

Base URL: `http://localhost:3000/api` (Development)

## Authentication

All staff endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Auth Endpoints

### Login Staff
```http
POST /api/auth/login
Content-Type: application/json

{
  "pin": "1234"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "staff": {
    "id": "clx...",
    "name": "Demo Staff",
    "role": "staff"
  }
}
```

### Verify Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "clx...",
    "name": "Demo Staff",
    "role": "staff"
  }
}
```

---

## 🍽️ Menu Endpoints

### Get All Menu Items
```http
GET /api/menu
```

**Query Parameters:**
- `available` (optional): `true` to get only available items

**Response:**
```json
[
  {
    "id": "menu-1",
    "name": "Chicken Biryani",
    "category": "mains",
    "price": 299,
    "description": "Aromatic basmati rice...",
    "prepTime": 25,
    "rating": 4.8,
    "isAvailable": true,
    "image": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Single Menu Item
```http
GET /api/menu/:id
```

### Update Menu Item Availability (Auth Required)
```http
PATCH /api/menu/:id/availability
Authorization: Bearer <token>
Content-Type: application/json

{
  "isAvailable": false
}
```

### Create Menu Item (Auth Required)
```http
POST /api/menu
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Paneer Tikka",
  "category": "appetizers",
  "price": 199,
  "description": "Grilled cottage cheese...",
  "prepTime": 15,
  "rating": 4.5,
  "isAvailable": true
}
```

### Update Menu Item (Auth Required)
```http
PUT /api/menu/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "price": 299,
  ...
}
```

### Delete Menu Item (Auth Required)
```http
DELETE /api/menu/:id
Authorization: Bearer <token>
```

---

## 📦 Order Endpoints

### Create Order (Public)
```http
POST /api/orders
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": "menu-1",
      "quantity": 2,
      "notes": "Extra spicy"
    }
  ],
  "customerEmail": "customer@example.com",
  "customerPhone": "+919876543210"
}
```

**Response:**
```json
{
  "id": "clx...",
  "orderNumber": "ORD-123456789",
  "status": "pending",
  "totalAmount": 598,
  "serviceCharge": 30,
  "gst": 108,
  "grandTotal": 736,
  "paymentStatus": "unpaid",
  "paymentMethod": null,
  "customerEmail": "customer@example.com",
  "customerPhone": "+919876543210",
  "orderItems": [
    {
      "id": "item-1",
      "quantity": 2,
      "price": 299,
      "notes": "Extra spicy",
      "menuItem": {
        "id": "menu-1",
        "name": "Chicken Biryani",
        "prepTime": 25
      }
    }
  ],
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### Get Order by ID (Public)
```http
GET /api/orders/:id
```

### Get All Orders (Auth Required)
```http
GET /api/orders
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `paid`, `preparing`, `ready`, `served`)

### Update Order Status (Auth Required)
```http
PATCH /api/orders/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "preparing"
}
```

**Valid Statuses:**
- `pending` - Order placed, awaiting payment
- `paid` - Payment received
- `preparing` - Being prepared in kitchen
- `ready` - Ready to serve
- `served` - Delivered to customer
- `cancelled` - Cancelled

### Mark Order as Paid (Public - Mock Payment)
```http
POST /api/orders/:id/payment
Content-Type: application/json

{
  "paymentMethod": "upi"
}
```

**Payment Methods:**
- `upi`
- `card`
- `cash`

### Get Order Statistics (Auth Required)
```http
GET /api/orders/stats/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalOrders": 25,
  "pendingOrders": 3,
  "preparingOrders": 5,
  "readyOrders": 2,
  "totalRevenue": 15000
}
```

---

## 👥 Staff Endpoints

### Get All Staff (Auth Required)
```http
GET /api/staff
Authorization: Bearer <token>
```

### Create Staff Member (Auth Required)
```http
POST /api/staff
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "pin": "5678",
  "role": "staff"
}
```

**Roles:**
- `staff` - Regular staff member
- `manager` - Manager (future use)
- `admin` - Admin (future use)

---

## 🔌 WebSocket Events

### Connect to Socket.io
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling']
});
```

### Client Events (Emit)

#### Join Staff Room
```javascript
socket.emit('join:staff');
```

#### Join Customer Order Room
```javascript
socket.emit('join:customer', orderId);
```

### Server Events (Listen)

#### New Order Placed
```javascript
socket.on('order:new', (order) => {
  console.log('New order:', order);
});
```

#### Order Status Updated
```javascript
socket.on('order:statusUpdate', (data) => {
  console.log('Status updated:', data);
  // data: { orderId, status, order }
});
```

#### Payment Received
```javascript
socket.on('order:paid', (order) => {
  console.log('Order paid:', order);
});
```

---

## 🧪 Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin":"1234"}'
```

### Get Menu
```bash
curl http://localhost:3000/api/menu
```

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"menuItemId":"menu-1","quantity":2}
    ]
  }'
```

### Update Order Status (with auth)
```bash
TOKEN="your-jwt-token-here"

curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'
```

---

## 🚨 Error Responses

All errors follow this format:
```json
{
  "error": "Error message here"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (valid token but insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📊 Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:
- Rate limiting middleware (express-rate-limit)
- API key authentication for public endpoints
- Request throttling per IP/user

---

## 🔒 Security Best Practices

1. **Always use HTTPS in production**
2. **Store JWT_SECRET securely** (use environment variables)
3. **Rotate JWT tokens** regularly
4. **Validate all inputs** on the server side
5. **Use parameterized queries** (Prisma handles this)
6. **Implement request size limits**
7. **Add CORS whitelist** for production

---

## 📚 Prisma Schema Reference

### Models

**Staff**
- `id` - String (cuid)
- `name` - String
- `pin` - String (hashed)
- `role` - String (default: "staff")
- `createdAt` - DateTime
- `updatedAt` - DateTime

**MenuItem**
- `id` - String (cuid)
- `name` - String
- `category` - String
- `price` - Int (in rupees)
- `description` - String
- `prepTime` - Int (minutes)
- `rating` - Float
- `isAvailable` - Boolean
- `image` - String? (optional)
- `createdAt` - DateTime
- `updatedAt` - DateTime

**Order**
- `id` - String (cuid)
- `orderNumber` - String (unique)
- `status` - String
- `totalAmount` - Int
- `serviceCharge` - Int
- `gst` - Int
- `grandTotal` - Int
- `paymentStatus` - String
- `paymentMethod` - String?
- `customerEmail` - String?
- `customerPhone` - String?
- `createdAt` - DateTime
- `updatedAt` - DateTime

**OrderItem**
- `id` - String (cuid)
- `orderId` - String
- `menuItemId` - String
- `quantity` - Int
- `price` - Int
- `notes` - String?
- `createdAt` - DateTime

---

**Happy API Testing! 🚀**

