# RestaurantOS - Full-Stack Restaurant Management System

A modern, full-stack restaurant management system built with React, Express, PostgreSQL, and Socket.io for real-time order management.

## 🎉 Features

### Customer Features
- 📱 **Digital Menu** - Browse menu items with search and category filters
- 🛒 **Order Placement** - Add items to cart and place orders
- 📊 **Real-time Order Tracking** - Track order status from placed to served
- 💳 **Payment Integration** - Mock payment system (UPI/Card)

### Staff Features
- 🔐 **PIN-based Authentication** - Secure staff login with JWT
- 📦 **Order Management** - View and manage all orders in real-time
- 🍽️ **Menu Control** - Toggle menu item availability
- 🔔 **Live Notifications** - Real-time alerts for new orders via Socket.io

### Technical Features
- ⚡ **Real-time Updates** - Socket.io for instant order notifications
- 🔒 **Secure Authentication** - JWT-based staff authentication
- 🗄️ **PostgreSQL Database** - Robust data persistence with Prisma ORM
- 📡 **RESTful API** - Clean API architecture
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS & shadcn/ui

## 🏗️ Project Structure

```
ernakulam-dine-flow/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── customer/        # Customer-facing components
│   │   ├── staff/           # Staff dashboard components
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts           # API client functions
│   │   └── socket.ts        # Socket.io client setup
│   └── ...
├── server/                   # Backend (Express + Node.js)
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   ├── prisma/              # Database schema & migrations
│   └── index.js             # Server entry point
└── ...
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (Atlas free tier or local installation)
- **npm** or **pnpm**

### Installation

#### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/agnesh02Backup/ernakulam-dine-flow.git
cd ernakulam-dine-flow

# Run the complete setup (installs all dependencies and sets up database)
npm run setup
```

#### Option 2: Manual Setup

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server
npm install

# 3. Set up database
npm run db:setup  # This runs: prisma generate + prisma db push + seed
cd ..
```

### Database Configuration

1. **MongoDB Atlas (Recommended - FREE!):**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free M0 cluster
   - Get your connection string
   - See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed steps

2. **Update the database connection string** in `server/.env`:
   ```env
   DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurantos?retryWrites=true&w=majority"
   ```

3. **Alternative: Local MongoDB:**
   - Install MongoDB Community Server
   - Use: `DATABASE_URL="mongodb://localhost:27017/restaurantos"`

### Environment Variables

#### Frontend (.env in root)
```env
VITE_API_URL=http://localhost:3000/api
```

#### Backend (server/.env)
```env
# Database (MongoDB)
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/restaurantos?retryWrites=true&w=majority"

# Server
PORT=3000
CLIENT_URL=http://localhost:5173

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=development
```

## 🎮 Running the Application

### Development Mode

#### Run Everything Together (Recommended)
```bash
npm run dev:full
```
This starts both frontend (port 5173) and backend (port 3000) concurrently.

#### Run Separately
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run dev:server
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api
- **Prisma Studio:** Run `cd server && npm run db:studio` (database GUI)

### Default Login Credentials

**Staff PIN:** `1234`

You can create more staff members using the API or Prisma Studio.

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - Staff login with PIN
- `GET /api/auth/verify` - Verify JWT token

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu?available=true` - Get available items only
- `PATCH /api/menu/:id/availability` - Toggle availability (Auth required)

### Orders
- `POST /api/orders` - Create new order (Public)
- `GET /api/orders/:id` - Get order by ID
- `GET /api/orders` - Get all orders (Auth required)
- `PATCH /api/orders/:id/status` - Update order status (Auth required)
- `POST /api/orders/:id/payment` - Mark order as paid

### Staff
- `GET /api/staff` - Get all staff (Auth required)
- `POST /api/staff` - Create new staff member (Auth required)

## 🔌 WebSocket Events

### Client → Server
- `join:staff` - Join staff room for notifications
- `join:customer` - Join customer order room

### Server → Client
- `order:new` - New order placed
- `order:statusUpdate` - Order status changed
- `order:paid` - Payment received

## 🛠️ Database Management

```bash
cd server

# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 📦 Building for Production

### Frontend
```bash
npm run build
# Output: dist/
```

### Backend
The backend runs directly with Node.js. No build step needed.

## 🚢 Deployment

### Frontend (Vercel/Netlify)
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`

### Backend (Railway/Render/Heroku)
1. Deploy the `server` directory
2. Add PostgreSQL database addon
3. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. Start command: `npm start`

### Database (Production)
- Use MongoDB Atlas (free M0 tier)
- Push schema: `npm run db:push`
- Seed data: `npm run db:seed`

## 🗒️ Notes

### Table Management
The table management feature is temporarily commented out. To re-enable:
1. Open `src/components/staff/StaffDashboard.tsx`
2. Uncomment the table management tab and content
3. Add table tracking to the database schema

### Future Enhancements
- [ ] Real payment gateway integration (Stripe, Razorpay)
- [ ] Table management system
- [ ] Staff roles & permissions
- [ ] Kitchen display system (KDS)
- [ ] Analytics dashboard
- [ ] Multi-restaurant support
- [ ] Mobile apps (React Native)

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# For MongoDB Atlas:
# 1. Check internet connection
# 2. Verify IP is whitelisted (0.0.0.0/0 for development)
# 3. Check username/password in connection string

# For local MongoDB:
# Check if MongoDB is running
mongosh --eval "db.version()"
```

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5173
npx kill-port 5173
```

### Prisma Issues
```bash
cd server
npx prisma generate
npx prisma db push --force-reset  # ⚠️ This deletes all data!
```

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ for modern restaurants

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Happy Coding! 🍽️**
