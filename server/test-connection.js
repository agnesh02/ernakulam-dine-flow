// Test MongoDB connection
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Connected to MongoDB successfully');
    
    // Test a simple query
    const staffCount = await prisma.staff.count();
    console.log(`✅ Found ${staffCount} staff members`);
    
    // Test restaurants
    const restaurantCount = await prisma.restaurant.count();
    console.log(`✅ Found ${restaurantCount} restaurants`);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
