/**
 * Setup MOCK Razorpay Linked Accounts (for testing without Route access)
 * 
 * This script creates fake account IDs in the database so you can test
 * the transfer logic WITHOUT actually having Razorpay Route enabled.
 * Transfers will fail, but you'll see all the calculation logic work.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Generate realistic-looking test account IDs
function generateMockAccountId(restaurantName) {
  const prefix = 'acc_TEST';
  const hash = restaurantName.replace(/\s/g, '').substring(0, 8);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}${hash}${random}`;
}

const mockRestaurantAccounts = [
  { name: 'Spice Junction', commissionRate: 0.10 },
  { name: 'Dragon Wok', commissionRate: 0.10 },
  { name: 'Pizza Palace', commissionRate: 0.10 },
  { name: 'Burger Barn', commissionRate: 0.10 },
  { name: 'Cafe Mocha', commissionRate: 0.10 },
];

async function setupMockAccounts() {
  console.log(`\n🎭 Setting up MOCK Razorpay Accounts (Testing Only)`);
  console.log(`================================================\n`);
  
  console.log(`⚠️  NOTE: These are FAKE account IDs for testing.`);
  console.log(`   Transfers will attempt but fail with 'account not found'.`);
  console.log(`   You'll see all the calculation logic work correctly.\n`);
  
  let updated = 0;
  
  for (const restaurant of mockRestaurantAccounts) {
    const mockAccountId = generateMockAccountId(restaurant.name);
    
    try {
      // First find the restaurant to get its ID
      const found = await prisma.restaurant.findFirst({
        where: { name: restaurant.name }
      });
      
      if (!found) {
        console.error(`❌ Restaurant '${restaurant.name}' not found in database\n`);
        continue;
      }
      
      // Update using the ID
      await prisma.restaurant.update({
        where: { id: found.id },
        data: {
          razorpayAccountId: mockAccountId,
          commissionRate: restaurant.commissionRate,
          settlementSchedule: 'instant',
        }
      });
      
      console.log(`✅ ${restaurant.name}`);
      console.log(`   Mock Account: ${mockAccountId}`);
      console.log(`   Commission: ${restaurant.commissionRate * 100}%\n`);
      
      updated++;
      
    } catch (error) {
      console.error(`❌ Failed to update ${restaurant.name}: ${error.message}\n`);
    }
  }
  
  console.log(`\n📊 Summary: Updated ${updated}/${mockRestaurantAccounts.length} restaurants`);
  
  // Verify
  console.log(`\n🔍 Verification:`);
  const restaurants = await prisma.restaurant.findMany({
    select: { name: true, razorpayAccountId: true, commissionRate: true }
  });
  
  restaurants.forEach(r => {
    const status = r.razorpayAccountId ? '✅' : '❌';
    console.log(`   ${status} ${r.name}: ${r.razorpayAccountId || 'No account'}`);
  });
  
  console.log(`\n✅ Mock setup complete!`);
  console.log(`\nWhat happens next:`);
  console.log(`   ✅ Transfer calculations will work`);
  console.log(`   ✅ Commission deductions will show`);
  console.log(`   ✅ You'll see detailed logs`);
  console.log(`   ❌ Actual transfers will fail (expected)`);
  console.log(`   ✅ Orders will be marked for manual settlement`);
  
  console.log(`\n📝 Next steps to enable REAL transfers:`);
  console.log(`   1. Contact Razorpay to enable Route feature`);
  console.log(`   2. Run: npm run setup-accounts`);
  console.log(`   3. Get real account IDs from Razorpay`);
  
  await prisma.$disconnect();
}

setupMockAccounts()
  .catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

