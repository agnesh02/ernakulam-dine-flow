# Ernakulam Dine Flow - Restaurant Management System

A modern restaurant management system built with Next.js 15, featuring real-time order tracking, payment integration, and multi-restaurant support.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (Atlas or local)
- npm or yarn

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Environment Setup

Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_here
```

Create a `.env` file in the `server/` directory:
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/ernakulam_dine_flow
JWT_SECRET=your-super-secret-jwt-key
RAZORPAY_KEY_ID=your_razorpay_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
PORT=3000
NODE_ENV=development
```

### Running the Application

```bash
# Run both frontend and backend together (recommended)
npm run dev:full

# Or run separately:
npm run dev          # Frontend only (port 3000)
npm run dev:server   # Backend only (port 3000)
```

### Build for Production

```bash
# Build frontend
npm run build
npm start

# Build backend (runs in server/ directory)
cd server
npm start
```

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI)
- **State Management**: TanStack Query
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form + Zod
- **Payments**: Razorpay

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Prisma ORM
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Payment Gateway**: Razorpay

## 📱 Features

### Customer Interface
- Browse digital menu with images and descriptions
- Real-time order status tracking
- Multiple payment options (Cash, UPI, Card)
- Multi-restaurant ordering support
- Split payment functionality
- Order history

### Staff Interface
- PIN-based authentication
- Real-time order management
- Menu control (availability, pricing)
- Order history and analytics
- Multi-restaurant management
- Table management (coming soon)

## 🛠️ Project Structure

```
ernakulam-dine-flow/
├── app/                    # Next.js App Router
│   ├── customer/          # Customer interface route
│   ├── staff/             # Staff interface route
│   ├── components/        # React components
│   │   ├── customer/     # Customer UI components
│   │   ├── staff/        # Staff UI components
│   │   └── ui/           # shadcn/ui components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   │   ├── api.ts        # API client
│   │   ├── socket.ts     # Socket.io client
│   │   └── razorpay.ts   # Razorpay integration
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── providers.tsx      # Client-side providers
│
├── server/               # Backend API
│   ├── prisma/          # Database schema & migrations
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── middleware/      # Express middleware
│
└── public/              # Static assets
```

## 📋 Available Scripts

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# Backend
npm run dev:server   # Start backend dev server
npm run server:install   # Install backend dependencies
npm run server:setup     # Setup database

# Combined
npm run dev:full     # Run frontend + backend together
npm run setup        # Complete project setup
```

## 🔧 Configuration

### Next.js Configuration
See `next.config.js` for:
- Webpack configuration (Socket.io support)
- Build optimization
- Custom settings

### Database Setup
```bash
cd server
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional: Seed test data
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy the `.next` output directory
3. Set environment variables in hosting platform

### Backend (Railway/Heroku/VPS)
1. Push to Git repository
2. Set environment variables
3. Database connection string
4. Deploy from `server/` directory

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
npx kill-port 3000

# Or change port in next.config.js and server/.env
```

### Database Connection Issues
- Verify MongoDB connection string
- Check network access in MongoDB Atlas
- Ensure database user has proper permissions

### Socket.io Not Connecting
- Check CORS settings in `server/index.js`
- Verify `NEXT_PUBLIC_API_URL` matches backend URL
- Ensure both frontend and backend are running

## 📄 License

Private - All Rights Reserved

## 👥 Support

For issues and questions, please contact the development team.

---

**Note**: This is a Next.js application. The migration from Vite to Next.js is complete and all features are functional.
