import Razorpay from 'razorpay';

// Initialize Razorpay with test credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // Test key
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'thisisasecret', // Test secret
});

export default razorpay;
