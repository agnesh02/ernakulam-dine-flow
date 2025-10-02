# RestaurantOS Backend

Express.js backend with MongoDB (via Prisma) and Socket.io.

## Quick Start

```bash
# Install dependencies
npm install

# Setup database (generate + push + seed)
npm run db:setup

# Start development server
npm run dev
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create free account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create M0 cluster (free tier - 512MB)
3. Get connection string
4. Update `.env` file

See [../MONGODB_SETUP.md](../MONGODB_SETUP.md) for detailed guide.

### Local MongoDB

```bash
# Install MongoDB Community Server
# Then update .env:
DATABASE_URL="mongodb://localhost:27017/restaurantos"
```

## Scripts

```bash
npm run dev          # Start dev server with nodemon
npm start            # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to MongoDB
npm run db:migrate   # Create migration (not needed for MongoDB)
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio GUI
npm run db:setup     # Complete database setup (generate + push + seed)
```

## Environment Variables

Create `.env` file:

```env
# MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurantos?retryWrites=true&w=majority"

# OR Local MongoDB
# DATABASE_URL="mongodb://localhost:27017/restaurantos"

PORT=3000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## API Endpoints

See [../API_REFERENCE.md](../API_REFERENCE.md) for complete documentation.

**Public:**
- POST /api/auth/login
- GET /api/menu
- POST /api/orders
- POST /api/orders/:id/payment

**Protected (Staff):**
- GET /api/orders
- PATCH /api/orders/:id/status
- PATCH /api/menu/:id/availability

## Database Schema

**Collections:**
- staff - Staff members with hashed PINs
- menuitem - Menu items
- order - Orders with status tracking
- orderitem - Items in each order

## Default Credentials

**Staff PIN:** `1234`

Created during seeding.

## Tech Stack

- Express.js
- Prisma (MongoDB)
- Socket.io
- JWT
- bcrypt
- CORS

## Production

```bash
# Set environment variables
export DATABASE_URL="mongodb+srv://..."
export JWT_SECRET="strong-random-secret"
export NODE_ENV="production"

# Start server
npm start
```

Use MongoDB Atlas for production database (free tier available).

