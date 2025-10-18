/**
 * Setup Test Razorpay Linked Accounts for Restaurants
 * 
 * This script creates test linked accounts in Razorpay and updates
 * the database with the account IDs so transfers can work.
 */

import Razorpay from 'razorpay';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Test restaurant details for linked accounts
const testRestaurantAccounts = [
  {
    name: 'Spice Junction',
    email: 'spice@testfoodcourt.com',
    phone: '9999999991',
    legalName: 'Spice Junction Test Restaurant',
  },
  {
    name: 'Dragon Wok',
    email: 'dragon@testfoodcourt.com',
    phone: '9999999992',
    legalName: 'Dragon Wok Test Restaurant',
  },
  {
    name: 'Pizza Palace',
    email: 'pizza@testfoodcourt.com',
    phone: '9999999993',
    legalName: 'Pizza Palace Test Restaurant',
  },
  {
    name: 'Burger Barn',
    email: 'burger@testfoodcourt.com',
    phone: '9999999994',
    legalName: 'Burger Barn Test Restaurant',
  },
  {
    name: 'Cafe Mocha',
    email: 'cafe@testfoodcourt.com',
    phone: '9999999995',
    legalName: 'Cafe Mocha Test Restaurant',
  }
];

async function createLinkedAccount(restaurantData) {
  try {
    console.log(`\n📝 Creating linked account for ${restaurantData.name}...`);
    
    const accountData = {
      email: restaurantData.email,
      phone: restaurantData.phone,
      type: 'route',
      legal_business_name: restaurantData.legalName,
      business_type: 'individual',
      contact_name: `${restaurantData.name} Manager`,
      profile: {
        category: 'food',
        subcategory: 'restaurant',
      },
      notes: {
        restaurant_name: restaurantData.name,
        test_account: 'true',
      }
    };

    const account = await razorpay.accounts.create(accountData);
    
    console.log(`✅ Account created successfully!`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Status: ${account.status}`);
    console.log(`   Email: ${account.email}`);
    
    return {
      restaurantName: restaurantData.name,
      accountId: account.id,
      status: account.status,
      email: account.email,
    };
    
  } catch (error) {
    console.error(`❌ Failed to create account for ${restaurantData.name}`);
    
    if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
      if (error.error.description.includes('Route')) {
        console.error(`\n⚠️  RAZORPAY ROUTE NOT ENABLED!`);
        console.error(`   You need to enable Route feature first.`);
        console.error(`   Contact Razorpay support: support@razorpay.com`);
        console.error(`   Or enable in dashboard if available.`);
      } else {
        console.error(`   Error: ${error.error.description}`);
      }
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    return {
      restaurantName: restaurantData.name,
      accountId: null,
      error: error.message,
    };
  }
}

async function updateDatabaseWithAccounts(accounts) {
  console.log(`\n💾 Updating database with account IDs...`);
  
  let updated = 0;
  let failed = 0;
  
  for (const account of accounts) {
    if (!account.accountId) {
      console.log(`   ⏭️  Skipping ${account.restaurantName} - no account ID`);
      failed++;
      continue;
    }
    
    try {
      await prisma.restaurant.update({
        where: { name: account.restaurantName },
        data: {
          razorpayAccountId: account.accountId,
          commissionRate: 0.10, // 10% platform commission
          settlementSchedule: 'instant',
        }
      });
      
      console.log(`   ✅ Updated ${account.restaurantName}`);
      updated++;
      
    } catch (error) {
      console.error(`   ❌ Failed to update ${account.restaurantName}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Database Update Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  
  return { updated, failed };
}

async function verifySetup() {
  console.log(`\n🔍 Verifying setup...`);
  
  const restaurants = await prisma.restaurant.findMany({
    select: {
      name: true,
      razorpayAccountId: true,
      commissionRate: true,
    }
  });
  
  console.log(`\n📋 Current Restaurant Accounts:`);
  restaurants.forEach(restaurant => {
    const status = restaurant.razorpayAccountId ? '✅' : '❌';
    console.log(`   ${status} ${restaurant.name}`);
    if (restaurant.razorpayAccountId) {
      console.log(`      Account: ${restaurant.razorpayAccountId}`);
      console.log(`      Commission: ${restaurant.commissionRate * 100}%`);
    } else {
      console.log(`      No linked account`);
    }
  });
}

async function main() {
  console.log(`\n🚀 Setting up Test Razorpay Linked Accounts`);
  console.log(`================================================\n`);
  
  console.log(`📌 Environment:`);
  console.log(`   Razorpay Key: ${process.env.RAZORPAY_KEY_ID?.substring(0, 15)}...`);
  console.log(`   Mode: ${process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test') ? 'TEST' : 'LIVE'}`);
  
  // Step 1: Create linked accounts
  console.log(`\n📝 Step 1: Creating linked accounts in Razorpay...`);
  const accounts = [];
  
  for (const restaurant of testRestaurantAccounts) {
    const account = await createLinkedAccount(restaurant);
    accounts.push(account);
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Step 2: Update database
  console.log(`\n📝 Step 2: Updating database...`);
  await updateDatabaseWithAccounts(accounts);
  
  // Step 3: Verify
  console.log(`\n📝 Step 3: Verification...`);
  await verifySetup();
  
  console.log(`\n✅ Setup complete!`);
  console.log(`\nYou can now test split payments:`);
  console.log(`   1. Place a multi-restaurant order`);
  console.log(`   2. Pay with test card (4111 1111 1111 1111)`);
  console.log(`   3. Check console for transfer logs`);
  console.log(`   4. Verify in Razorpay dashboard under Route → Transfers`);
  
  await prisma.$disconnect();
}

main()
  .catch(error => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

