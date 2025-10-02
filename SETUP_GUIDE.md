# 🚀 Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v18+ (`node --version`)
- ✅ MongoDB Atlas account (free) or local MongoDB
- ✅ npm (`npm --version`)

## Step-by-Step Setup

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/agnesh02Backup/ernakulam-dine-flow.git
cd ernakulam-dine-flow

# Install all dependencies (frontend + backend + database setup)
npm run setup
```

This single command will:
- Install frontend dependencies
- Install backend dependencies
- Generate Prisma client
- Push database schema
- Seed the database with sample data

### 2. Configure Database

**Option A: MongoDB Atlas (Recommended - FREE!)**

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free account
3. Create M0 cluster (free tier)
4. Get connection string
5. Update `server/.env`:

```env
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurantos?retryWrites=true&w=majority"
```

**See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed instructions**

**Option B: Local MongoDB**

```bash
# Install and start MongoDB locally
# Then update server/.env:
DATABASE_URL="mongodb://localhost:27017/restaurantos"
```

### 4. Run the Application

```bash
# Start both frontend and backend together
npm run dev:full
```

**OR run separately:**

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd server && npm run dev
```

### 5. Access the Application

Open your browser:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api

### 6. Test the Application

#### Customer Flow:
1. Click on "Customer Interface" tab
2. Browse menu items
3. Add items to cart
4. Place an order
5. View order status in real-time

#### Staff Flow:
1. Click on "Staff Interface" tab
2. Enter PIN: `1234`
3. View incoming orders
4. Update order status
5. Manage menu availability

## Common Issues & Solutions

### ❌ "EADDRINUSE: address already in use"
```bash
# Kill the process using the port
npx kill-port 3000
npx kill-port 5173
```

### ❌ Database Connection Failed
```bash
# For MongoDB Atlas:
# 1. Check internet connection
# 2. Verify IP is whitelisted (Network Access in Atlas)
# 3. Check username/password in connection string

# For Local MongoDB (Windows):
net start MongoDB

# For Local MongoDB (Mac):
brew services start mongodb-community

# For Local MongoDB (Linux):
sudo systemctl start mongod
```

### ❌ Prisma Client Not Generated
```bash
cd server
npx prisma generate
npm run db:push
```

### ❌ "relation does not exist"
```bash
cd server
npm run db:push
npm run db:seed
```

## Verify Installation

### Check Frontend
```bash
curl http://localhost:5173
# Should return HTML
```

### Check Backend
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","message":"Server is running"}
```

### Check Database
```bash
cd server
npm run db:studio
# Opens Prisma Studio in browser
```

## Environment Files

### Root `.env`
```env
VITE_API_URL=http://localhost:3000/api
```

### `server/.env`
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurantos?schema=public"
PORT=3000
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

## Development Workflow

### Adding New Menu Items
1. Go to Staff Dashboard → Menu tab
2. Items are fetched from database
3. Toggle availability using the switch

**OR via Prisma Studio:**
```bash
cd server
npm run db:studio
# Navigate to MenuItem table and add entries
```

### Creating New Staff Members
```bash
curl -X POST http://localhost:3000/api/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"John Doe","pin":"5678","role":"staff"}'
```

### Resetting Database
```bash
cd server
npx prisma db push --force-reset  # ⚠️ Deletes all data!
npm run db:seed  # Re-seed with sample data
```

## Next Steps

1. ✅ Test customer order flow
2. ✅ Test staff dashboard
3. ✅ Verify real-time notifications
4. 📝 Customize menu items
5. 🎨 Customize branding/theme
6. 🚀 Deploy to production

## Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Add PostgreSQL addon on Railway
4. Update environment variables

### Option 2: Single Server (VPS/DigitalOcean)
1. Install Node.js (MongoDB not needed - use Atlas!)
2. Clone repository
3. Run setup commands
4. Use PM2 to manage processes
5. Set up Nginx reverse proxy
6. Use MongoDB Atlas for database

## Need Help?

- 📖 Read the full [README.md](./README.md)
- 🐛 Check [GitHub Issues](https://github.com/agnesh02Backup/ernakulam-dine-flow/issues)
- 💬 Open a new issue for support

---

**Happy Building! 🎉**

