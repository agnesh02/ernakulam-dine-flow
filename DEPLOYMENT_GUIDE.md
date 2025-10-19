# 🚀 Ernakulam Dine Flow - Deployment Guide

## Architecture Overview

Your app has two parts:
1. **Frontend (Next.js)** → Deploy to **Vercel** ✅
2. **Backend (Express + Socket.io)** → Deploy to **Railway** ✅

This is the **recommended** architecture because:
- Vercel is optimized for Next.js (fast, CDN, zero config)
- Railway supports long-running servers (perfect for Socket.io)
- Both are free for hobby projects

---

## 📦 Step 1: Deploy Frontend to Vercel

### 1.1 Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin development
```

### 1.2 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your repository: `ernakulam-dine-flow`
5. **Root Directory**: Leave as `.` (root)
6. **Framework Preset**: Next.js (auto-detected)
7. Click **"Deploy"**

### 1.3 Set Environment Variables in Vercel
After deployment, go to **Settings → Environment Variables** and add:

```env
NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app/api
NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_ROcWTytWkpNMYw
```

**Note**: You'll get the `NEXT_PUBLIC_API_URL` from Railway in Step 2

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: `ernakulam-dine-flow`

### 2.2 Configure Root Directory
Railway needs to run from the `server/` folder:

1. In Railway dashboard, go to **Settings**
2. Under **"Root Directory"**, set: `server`
3. Under **"Start Command"**, set: `npm start`

**Important**: Railway may auto-detect Bun. If you see build errors, the `nixpacks.toml` file in the `server/` directory will force it to use npm instead.

### 2.3 Set Environment Variables in Railway
In Railway **Settings → Variables**, add:

```env
DATABASE_URL = mongodb+srv://restodb:restodbaccess@cluster0.g0ugzmi.mongodb.net/ernakulam_dine_flow?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = your-super-secret-jwt-key-here
RAZORPAY_KEY_ID = rzp_test_ROcWTytWkpNMYw
RAZORPAY_KEY_SECRET = D7Rg3jYzCEq0ZoDudo0GWGt0
PORT = 3001
NODE_ENV = production
CLIENT_URL = https://your-frontend-url.vercel.app
```

### 2.4 Get Your Backend URL
1. Railway will auto-generate a URL like: `your-app.railway.app`
2. Copy this URL
3. Go back to **Vercel** and update `NEXT_PUBLIC_API_URL` to:
   ```
   https://your-app.railway.app/api
   ```

---

## 🗄️ Step 3: Database Setup (MongoDB Atlas)

Your database is already configured! Just verify:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. In **Network Access**, ensure `0.0.0.0/0` is whitelisted (allows Railway)
3. Database should be: `ernakulam_dine_flow`

---

## 🔧 Step 4: Update CORS for Production

Your backend needs to accept requests from your Vercel frontend.

**File**: `server/index.js` (lines 32-43)

The CORS is already configured to use `process.env.CLIENT_URL`, so just make sure you set `CLIENT_URL` in Railway to your Vercel URL.

---

## ✅ Step 5: Test Your Deployment

1. **Test Frontend**: Visit your Vercel URL
2. **Test Backend**: Visit `https://your-app.railway.app/api/health`
3. **Test Full App**:
   - Open customer interface
   - Browse restaurants
   - Place an order
   - Check real-time updates

---

## 🎯 Alternative: Deploy Everything to Railway

If you want everything in one place:

### Option A: Railway Only (Simpler)
1. Deploy backend to Railway (as above)
2. Deploy frontend to Railway as separate service:
   - Root Directory: `.` (root)
   - Start Command: `npm start`
   - Build Command: `npm run build`

### Option B: Render (Free Alternative to Railway)
1. Frontend → Vercel (still best for Next.js)
2. Backend → [Render](https://render.com) (free tier available)

---

## 📋 Environment Variables Summary

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw
```

### Backend (server/.env)
```env
PORT=3001
DATABASE_URL=mongodb+srv://restodb:restodbaccess@...
JWT_SECRET=your-super-secret-jwt-key-here
RAZORPAY_KEY_ID=rzp_test_ROcWTytWkpNMYw
RAZORPAY_KEY_SECRET=D7Rg3jYzCEq0ZoDudo0GWGt0
NODE_ENV=production
CLIENT_URL=https://your-frontend.vercel.app
```

---

## 🔍 Troubleshooting

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Verify Railway backend is running
- Check browser console for CORS errors

### Backend CORS errors
- Update `CLIENT_URL` in Railway to your Vercel URL
- Redeploy backend after updating env vars

### Socket.io not connecting
- Verify backend is on Railway (not Vercel)
- Check browser console for WebSocket errors
- Ensure `CLIENT_URL` matches frontend URL

---

## 💰 Cost Breakdown

- **Vercel**: Free (Hobby plan)
- **Railway**: $5/month after free trial (500 hours/month free)
- **MongoDB Atlas**: Free (M0 cluster, 512MB)
- **Total**: ~$5/month

---

## 🚀 Quick Deploy Commands

```bash
# 1. Commit your changes
git add .
git commit -m "Ready for production"
git push origin development

# 2. Deploy frontend (auto-deploys from GitHub on Vercel)
# 3. Deploy backend (auto-deploys from GitHub on Railway)

# 4. Test
curl https://your-backend.railway.app/api/health
```

---

## ✨ You're Done!

Your app is now live with:
- ⚡ Fast Next.js frontend on Vercel's CDN
- 🔌 Real-time Socket.io on Railway
- 🗄️ MongoDB Atlas cloud database
- 💳 Razorpay payment integration

Enjoy your deployed restaurant management system! 🎉

