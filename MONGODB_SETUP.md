# 🍃 MongoDB Setup Guide

This project uses **MongoDB** instead of PostgreSQL. Here's how to set it up!

## ⭐ Option 1: MongoDB Atlas (Recommended - FREE!)

MongoDB Atlas provides a **free cloud database** - no local installation needed!

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Sign Up"** (or Sign In if you have an account)
3. Complete registration

### Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select a cloud provider (AWS recommended)
4. Choose a region close to you
5. Click **"Create"**
6. Wait 1-3 minutes for cluster creation

### Step 3: Create Database User

1. In the **"Security"** tab, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `restaurantadmin` (or your choice)
5. Click **"Autogenerate Secure Password"** and **COPY IT**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

### Step 4: Allow Network Access

1. Go to **"Network Access"** tab
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - This adds `0.0.0.0/0`
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go back to **"Database"** tab
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://restaurantadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Update `.env` File

1. Open `server/.env`
2. Replace `<password>` with the password you copied earlier
3. Add database name after `.net/`:
   ```env
   DATABASE_URL="mongodb+srv://restaurantadmin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/restaurantos?retryWrites=true&w=majority"
   ```

### Step 7: Setup Database

```bash
cd server
npm run db:generate
npm run db:push
npm run db:seed
```

### ✅ Done! Your MongoDB is Ready!

---

## Option 2: Local MongoDB

If you prefer to run MongoDB locally:

### Windows

1. **Download MongoDB Community Server**
   - Go to https://www.mongodb.com/try/download/community
   - Download Windows installer
   - Run installer (default settings are fine)

2. **Start MongoDB**
   ```powershell
   # MongoDB should start automatically as a service
   # Check if running:
   net start MongoDB
   ```

3. **Update `.env`**
   ```env
   DATABASE_URL="mongodb://localhost:27017/restaurantos"
   ```

### macOS

```bash
# Install via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Update .env
DATABASE_URL="mongodb://localhost:27017/restaurantos"
```

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Update .env
DATABASE_URL="mongodb://localhost:27017/restaurantos"
```

---

## 🔧 Setup Database Schema

After configuring your MongoDB connection:

```bash
cd server

# Generate Prisma Client
npm run db:generate

# Push schema to MongoDB
npm run db:push

# Seed sample data
npm run db:seed
```

---

## 🎯 Verify Installation

### Check Connection
```bash
cd server
npx prisma db push
```

If successful, you'll see:
```
✅ The database is now in sync with your Prisma schema.
```

### Open Prisma Studio
```bash
cd server
npm run db:studio
```

Opens http://localhost:5555 - you should see your collections:
- Staff
- MenuItem
- Order
- OrderItem

---

## 🌐 MongoDB Atlas Features

**Why use Atlas?**
- ✅ **FREE** 512MB storage
- ✅ No installation required
- ✅ Automatic backups
- ✅ Cloud-hosted (accessible anywhere)
- ✅ Built-in monitoring
- ✅ Easy to scale

**Free Tier Limits:**
- 512 MB Storage
- Shared RAM
- Shared vCPU
- Perfect for development and small apps!

---

## 📊 Database GUI Tools

### Prisma Studio (Built-in)
```bash
cd server
npm run db:studio
```

### MongoDB Compass (Official GUI)
1. Download: https://www.mongodb.com/try/download/compass
2. Connect using your connection string
3. Browse collections visually

### VS Code Extension
- Install "MongoDB for VS Code"
- Connect using connection string
- Browse directly in VS Code

---

## 🔍 Common Issues

### Issue: "Authentication failed"
**Solution:** 
- Double-check username and password in connection string
- Ensure password is URL-encoded (no special chars like @, #, %)

### Issue: "IP not whitelisted"
**Solution:**
- Go to Network Access in Atlas
- Add `0.0.0.0/0` (allows all IPs)

### Issue: "Database not found"
**Solution:**
- MongoDB creates database automatically
- Run `npm run db:seed` to populate data

### Issue: "Connection timeout"
**Solution:**
- Check internet connection
- Verify cluster is running in Atlas
- Check firewall settings

---

## 🔒 Security Tips

### Development
- Use `0.0.0.0/0` for IP whitelist (easy access)
- Store connection string in `.env` (never commit!)

### Production
- Whitelist only your server's IP
- Use strong passwords
- Enable MongoDB Atlas encryption
- Rotate passwords regularly
- Use environment variables

---

## 📈 Monitoring (Atlas)

1. Go to MongoDB Atlas dashboard
2. Click on your cluster
3. View:
   - **Metrics** - Performance graphs
   - **Real-time** - Current operations
   - **Query Profiler** - Slow queries

---

## 🚀 Next Steps

After setup:

1. ✅ Verify connection works
2. ✅ Run seed script
3. ✅ Start your app: `npm run dev:full`
4. ✅ Test customer flow
5. ✅ Test staff flow

---

## 💡 MongoDB vs PostgreSQL

**Why MongoDB for this project?**

| Feature | MongoDB | PostgreSQL |
|---------|---------|------------|
| Setup | ⭐⭐⭐⭐⭐ Atlas free cloud | ⭐⭐⭐ Needs local install |
| Schema | Flexible, JSON-like | Strict, relational |
| Scaling | Horizontal (easy) | Vertical (harder) |
| Learning Curve | Easier for beginners | Steeper |
| Free Hosting | MongoDB Atlas | Limited options |

For this restaurant app, MongoDB provides:
- ✅ Easy free cloud hosting
- ✅ Flexible order structure
- ✅ Fast development
- ✅ Easy to learn

---

## 🆘 Need Help?

**MongoDB Atlas Support:**
- [Documentation](https://docs.atlas.mongodb.com/)
- [Community Forums](https://www.mongodb.com/community/forums/)

**Prisma + MongoDB:**
- [Prisma MongoDB Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)

---

**Happy MongoDB Setup! 🍃**

