# Razorpay Integration Setup Guide

## 🚀 Quick Setup for Testing

### 1. **Get Razorpay Test Credentials**

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up/Login with your account
3. Go to **Settings** → **API Keys**
4. Generate **Test Keys** (not Live keys for testing)
5. Copy your **Key ID** and **Key Secret**

### 2. **Configure Environment Variables**

#### Single `.env` file in root folder (automatically synced to server):
```bash
# ==========================================
# ERNAKULAM DINE FLOW - ENVIRONMENT CONFIG
# ==========================================

# ==========================================
# FRONTEND CONFIGURATION
# ==========================================
# API URL - Points to your Express backend
VITE_API_URL=http://localhost:3000/api

# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here

# ==========================================
# BACKEND CONFIGURATION
# ==========================================
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/ernakulam_dine_flow?retryWrites=true&w=majority&appName=Cluster0'

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_razorpay_secret_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Note:** The `.env` file is automatically copied to the `server/` directory for Prisma compatibility. If you update the root `.env` file, run `sync-env.bat` to sync it to the server directory.

### 3. **Test Cards for Razorpay**

Use these test card numbers for testing payments:

| Card Type | Card Number | CVV | Expiry | Name |
|-----------|-------------|-----|--------|------|
| **Visa** | 4111 1111 1111 1111 | 123 | Any future date | Any name |
| **Mastercard** | 5555 5555 5555 4444 | 123 | Any future date | Any name |
| **RuPay** | 6070 0000 0000 0000 | 123 | Any future date | Any name |

**UPI Testing:**
- Use any UPI ID ending with `@razorpay` (e.g., `test@razorpay`)
- Or use `success@razorpay` for successful payments

### 4. **How It Works**

#### Payment Flow:
1. **Customer** selects "Pay Now (Online)"
2. **Frontend** creates order in database
3. **Backend** creates Razorpay order
4. **Razorpay** payment modal opens
5. **Customer** completes payment
6. **Backend** verifies payment signature
7. **Order** marked as paid
8. **Real-time** notifications sent to staff

#### Security Features:
- ✅ Payment signature verification
- ✅ Server-side payment validation
- ✅ Secure order creation
- ✅ Real-time status updates

### 5. **Testing the Integration**

1. **Start the servers:**
   ```bash
   npm run dev:full
   ```

2. **Test Payment Flow:**
   - Add items to cart
   - Click "Place Order"
   - Choose "Pay Now (Online)"
   - Use test card: `4111 1111 1111 1111`
   - CVV: `123`, Expiry: Any future date
   - Complete payment

3. **Verify Results:**
   - Check staff dashboard for new paid order
   - Check customer order status
   - Verify payment method shows "💳 Online"

### 6. **Production Setup**

When ready for production:

1. **Switch to Live Keys:**
   - Generate Live API keys from Razorpay dashboard
   - Update environment variables
   - Test with real small amounts first

2. **Webhook Setup:**
   - Configure webhook URL in Razorpay dashboard
   - Handle payment notifications
   - Implement retry logic for failed payments

3. **Security Enhancements:**
   - Use environment variables for all secrets
   - Implement proper error handling
   - Add payment logging
   - Set up monitoring

### 7. **Troubleshooting**

#### Common Issues:

**"Razorpay SDK not loaded"**
- Check internet connection
- Verify script loading in browser console

**"Invalid payment signature"**
- Check RAZORPAY_KEY_SECRET is correct
- Verify signature generation logic

**"Order not found"**
- Check order creation in database
- Verify order ID is passed correctly

**Payment modal not opening**
- Check browser console for errors
- Verify Razorpay key ID is correct
- Check amount is in paise (multiply by 100)

### 8. **Razorpay Dashboard Features**

- **Test Transactions:** View all test payments
- **Webhooks:** Monitor payment events
- **Analytics:** Track payment success rates
- **Settlements:** Manage payouts (Live mode)

### 9. **Support**

- **Razorpay Docs:** [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **Test Cards:** [https://razorpay.com/docs/payment-gateway/test-cards/](https://razorpay.com/docs/payment-gateway/test-cards/)
- **Support:** Available in Razorpay dashboard

---

## 🎯 **Ready to Test!**

Your Razorpay integration is now ready for testing. Use the test cards above to simulate real payments without any money being charged.
