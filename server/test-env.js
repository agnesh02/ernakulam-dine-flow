import dotenv from 'dotenv';

console.log('Loading .env file...');
dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'Found' : 'Not found');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Not found');

// List all environment variables that contain our keys
const relevantVars = Object.keys(process.env).filter(key => 
  key.includes('DATABASE') || 
  key.includes('RAZORPAY') || 
  key.includes('JWT') ||
  key.includes('VITE')
);

console.log('Relevant environment variables:', relevantVars);
