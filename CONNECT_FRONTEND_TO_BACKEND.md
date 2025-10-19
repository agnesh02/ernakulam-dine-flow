# 🔗 Connect Vercel Frontend to Railway Backend

## Current Status
✅ Frontend deployed on Vercel  
⏳ Backend needs to be deployed on Railway  
⏳ Frontend needs backend URL

---

## 📋 Step-by-Step Guide

### Step 1: Deploy Backend to Railway First

If you haven't deployed the backend yet:

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository: `ernakulam-dine-flow`
4. **Important**: Set Root Directory to `server`
5. Set environment variables (see below)

### Step 2: Get Your Railway Backend URL

After deploying to Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Settings** tab
4. Find **"Domains"** section
5. Railway will show a URL like:
   ```
   https://your-app-name.railway.app
   ```
6. **Copy this URL** - you'll need it!

### Step 3: Set Environment Variables in Vercel

Now configure your Vercel frontend to connect to the backend:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

#### Variable 1: API URL
```
Name:  NEXT_PUBLIC_API_URL
Value: https://your-app-name.railway.app/api
```
**Note**: Add `/api` at the end!

#### Variable 2: Razorpay Key
```
Name:  NEXT_PUBLIC_RAZORPAY_KEY_ID
Value: rzp_test_ROcWTytWkpNMYw
```

4. **Select all environments**: Production, Preview, Development
5. Click **Save**

### Step 4: Redeploy Frontend

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

OR simply push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin development
```

---

## 🔍 How to Verify It's Working

### Check 1: Environment Variables in Vercel
1. Go to Vercel project → Settings → Environment Variables
2. You should see:
   - ✅ `NEXT_PUBLIC_API_URL`
   - ✅ `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Check 2: Backend Health Check
Open this URL in your browser:
```
https://your-app-name.railway.app/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Check 3: Frontend Console
1. Open your Vercel app
2. Press F12 (Developer Tools)
3. Go to Console tab
4. Check the API calls - they should point to your Railway URL

---

## ⚙️ Backend Environment Variables (Railway)

Don't forget to set these in Railway too:

```env
DATABASE_URL = mongodb+srv://restodb:restodbaccess@cluster0.g0ugzmi.mongodb.net/ernakulam_dine_flow?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET = your-super-secret-jwt-key-here
RAZORPAY_KEY_ID = rzp_test_ROcWTytWkpNMYw
RAZORPAY_KEY_SECRET = D7Rg3jYzCEq0ZoDudo0GWGt0
PORT = 3001
NODE_ENV = production
CLIENT_URL = https://your-vercel-app.vercel.app
```

**Important**: Set `CLIENT_URL` to your Vercel URL for CORS to work!

---

## 🎯 Quick Checklist

- [ ] Backend deployed to Railway
- [ ] Got Railway backend URL
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel (with `/api` at the end)
- [ ] Set `NEXT_PUBLIC_RAZORPAY_KEY_ID` in Vercel
- [ ] Set `CLIENT_URL` in Railway (your Vercel URL)
- [ ] Redeployed frontend on Vercel
- [ ] Tested backend health endpoint
- [ ] Tested frontend app

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- **Check**: Does `NEXT_PUBLIC_API_URL` end with `/api`?
- **Check**: Is the Railway backend actually running?
- **Check**: Open browser console and look for errors

### CORS errors
- **Fix**: Make sure `CLIENT_URL` in Railway matches your Vercel URL exactly
- **Fix**: Include `https://` in the URL

### Environment variables not working
- **Fix**: After adding variables, you MUST redeploy
- **Fix**: Make sure variables are set for "Production" environment

---

## 📝 Example URLs

```
Frontend (Vercel):  https://ernakulam-dine-flow.vercel.app
Backend (Railway):  https://ernakulam-dine-flow.railway.app
API Endpoint:       https://ernakulam-dine-flow.railway.app/api

Vercel Environment Variable:
NEXT_PUBLIC_API_URL = https://ernakulam-dine-flow.railway.app/api
```

---

## 🎉 Once Everything is Connected

Your app will work like this:

```
Customer/Staff Browser
       ↓
   Vercel (Frontend)
       ↓ API calls to NEXT_PUBLIC_API_URL
   Railway (Backend)
       ↓
   MongoDB Atlas
```

Socket.io will also connect automatically using the same URL!

---

Need help? Check:
- `DEPLOYMENT_GUIDE.md` for full deployment steps
- `VERCEL_SETUP.md` for Vercel-specific issues

