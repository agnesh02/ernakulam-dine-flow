# 🚀 Deployment Guide

This guide covers deploying your RestaurantOS application to production.

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │─────▶│   Railway    │─────▶│ PostgreSQL  │
│  (Frontend) │      │  (Backend)   │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
```

## Option 1: Vercel + Railway (Recommended)

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset:** Vite
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

3. **Environment Variables** (Add in Vercel)
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```

4. **Deploy!**
   - Click "Deploy"
   - Your frontend will be live at `https://your-app.vercel.app`

### Backend Deployment (Railway)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service**
   - **Root Directory:** `server`
   - **Start Command:** `npm start`
   - **Build Command:** `npm install`

4. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will automatically provision and connect the database

5. **Environment Variables** (Add in Railway)
   ```
   PORT=3000
   CLIENT_URL=https://your-app.vercel.app
   JWT_SECRET=generate-a-strong-secret-key-here
   NODE_ENV=production
   DATABASE_URL=(automatically set by Railway PostgreSQL)
   ```

6. **Deploy Database Schema**
   - Open Railway terminal or run locally:
   ```bash
   cd server
   DATABASE_URL="your-railway-postgres-url" npx prisma db push
   DATABASE_URL="your-railway-postgres-url" npx prisma db seed
   ```

7. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Copy this and update `VITE_API_URL` in Vercel

### Update Frontend with Backend URL

1. Go back to Vercel
2. Update `VITE_API_URL` environment variable
3. Redeploy (Vercel will auto-redeploy on env change)

---

## Option 2: Render (All-in-One)

### Backend Deployment

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up

2. **Create PostgreSQL Database**
   - Click "New +"
   - Select "PostgreSQL"
   - Choose free tier
   - Note down the connection string

3. **Create Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub repository
   - Configure:
     - **Name:** restaurantos-backend
     - **Root Directory:** `server`
     - **Environment:** Node
     - **Build Command:** `npm install && npx prisma generate && npx prisma db push`
     - **Start Command:** `npm start`

4. **Environment Variables**
   ```
   DATABASE_URL=your-render-postgres-connection-string
   PORT=3000
   CLIENT_URL=https://your-frontend-url.onrender.com
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

### Frontend Deployment

1. **Create Static Site**
   - Click "New +"
   - Select "Static Site"
   - Connect same GitHub repository
   - Configure:
     - **Build Command:** `npm install && npm run build`
     - **Publish Directory:** `dist`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

---

## Option 3: DigitalOcean/VPS

### Server Setup

1. **Create Ubuntu Droplet**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE restaurantos;
   CREATE USER restaurant_user WITH PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE restaurantos TO restaurant_user;
   \q
   ```

3. **Clone and Setup Application**
   ```bash
   cd /var/www
   git clone https://github.com/yourusername/ernakulam-dine-flow.git
   cd ernakulam-dine-flow
   
   # Install and build frontend
   npm install
   npm run build
   
   # Install and setup backend
   cd server
   npm install
   npm run db:push
   npm run db:seed
   ```

4. **Setup PM2 for Backend**
   ```bash
   cd /var/www/ernakulam-dine-flow/server
   pm2 start index.js --name "restaurantos-api"
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/restaurantos
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend
       location / {
           root /var/www/ernakulam-dine-flow/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # WebSocket
       location /socket.io {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/restaurantos /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d your-domain.com
   ```

---

## Environment Variables Summary

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (server/.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=3000
CLIENT_URL=https://your-frontend-url.com
JWT_SECRET=super-secure-random-string-minimum-32-characters
NODE_ENV=production
```

---

## Post-Deployment Checklist

- [ ] Frontend is accessible
- [ ] Backend API responds at `/api/health`
- [ ] Database connection is working
- [ ] Staff can login
- [ ] Orders can be placed
- [ ] Real-time notifications work
- [ ] Menu items load correctly
- [ ] SSL certificate is installed (HTTPS)
- [ ] Environment variables are set
- [ ] CORS is configured correctly

---

## Monitoring & Maintenance

### Health Checks

**Frontend:**
```bash
curl https://your-app.com
```

**Backend:**
```bash
curl https://your-api.com/api/health
```

### Logs

**Vercel:**
- Dashboard → Your Project → Functions → Logs

**Railway:**
- Dashboard → Your Service → Deployments → View Logs

**VPS (PM2):**
```bash
pm2 logs restaurantos-api
pm2 monit
```

### Database Backups

**Railway/Render:**
- Automatic backups included

**VPS:**
```bash
# Create backup
pg_dump -U restaurant_user restaurantos > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U restaurant_user restaurantos < backup_20240101.sql
```

---

## Scaling Considerations

### Database
- Use connection pooling (Prisma includes this)
- Add read replicas for high traffic
- Implement caching (Redis) for menu items

### Backend
- Enable clustering in Node.js
- Use load balancer for multiple instances
- Implement rate limiting

### Frontend
- Use CDN for static assets
- Enable service worker for PWA
- Implement lazy loading

---

## Troubleshooting

### CORS Errors
Update `server/index.js`:
```javascript
app.use(cors({
  origin: ['https://your-frontend-url.com'],
  credentials: true
}));
```

### WebSocket Connection Failed
Ensure proxy passes WebSocket upgrade headers (Nginx/Apache config)

### Database Connection Timeout
Increase connection pool in Prisma:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_size = 10
}
```

---

## Support

For issues or questions:
- 📖 Check [README.md](./README.md)
- 🐛 Open [GitHub Issue](https://github.com/agnesh02Backup/ernakulam-dine-flow/issues)

**Good luck with your deployment! 🚀**

