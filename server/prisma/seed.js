import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create staff members
  const hashedPin = await bcrypt.hash('1234', 10);
  
  // Delete existing staff to avoid duplicates
  await prisma.staff.deleteMany({});
  
  const staff = await prisma.staff.create({
    data: {
      name: 'Demo Staff',
      pin: hashedPin,
      role: 'staff',
    },
  });

  console.log('✅ Created staff:', staff.name);

  // Delete existing data in correct order (to avoid foreign key violations)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.menuItem.deleteMany({});
  
  console.log('✅ Cleared existing data');
  
  const menuItems = [
    {
      name: 'Chicken Biryani',
      category: 'mains',
      price: 299,
      description: 'Aromatic basmati rice with tender chicken pieces, served with raita and pickle',
      prepTime: 25,
      tags: ['bestseller', 'spicy', 'signature'],
      isAvailable: true,
      isVegetarian: false,
    },
    {
      name: 'Masala Dosa',
      category: 'mains',
      price: 149,
      description: 'Crispy crepe with spiced potato filling, served with sambar and chutneys',
      prepTime: 15,
      tags: ['bestseller', 'value', 'healthy'],
      isAvailable: true,
      isVegetarian: true,
    },
    {
      name: 'Fish Curry',
      category: 'mains',
      price: 249,
      description: 'Traditional Kerala fish curry with coconut milk and spices',
      prepTime: 20,
      tags: ['signature', 'spicy'],
      isAvailable: false,
      isVegetarian: false,
    },
    {
      name: 'Filter Coffee',
      category: 'beverages',
      price: 45,
      description: 'Traditional South Indian filter coffee, strong and aromatic',
      prepTime: 5,
      tags: ['bestseller', 'value'],
      isAvailable: true,
      isVegetarian: true,
    },
    {
      name: 'Mango Lassi',
      category: 'beverages',
      price: 75,
      description: 'Refreshing yogurt-based drink with fresh mango',
      prepTime: 3,
      tags: ['healthy', 'new'],
      isAvailable: true,
      isVegetarian: true,
    },
    {
      name: 'Samosa',
      category: 'appetizers',
      price: 89,
      description: 'Crispy fried pastry with savory potato and pea filling',
      prepTime: 10,
      tags: ['value', 'spicy'],
      isAvailable: true,
      isVegetarian: true,
    },
    {
      name: 'Gulab Jamun',
      category: 'desserts',
      price: 79,
      description: 'Sweet milk dumplings in warm sugar syrup',
      prepTime: 8,
      tags: ['bestseller'],
      isAvailable: false,
      isVegetarian: true,
    },
    {
      name: 'Tandoori Chicken',
      category: 'mains',
      price: 349,
      description: 'Marinated chicken grilled in tandoor, served with mint chutney',
      prepTime: 30,
      tags: ['chefs-special', 'premium', 'spicy'],
      isAvailable: true,
      isVegetarian: false,
    },
  ];

  const createdMenuItems = [];
  for (const item of menuItems) {
    const created = await prisma.menuItem.create({
      data: item,
    });
    createdMenuItems.push(created);
  }

  console.log('✅ Created', createdMenuItems.length, 'menu items');

  // Create sample orders for demonstration
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      status: 'preparing',
      orderType: 'dine-in',
      totalAmount: 598,
      serviceCharge: 30,
      gst: 108,
      grandTotal: 736,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      orderItems: {
        create: [
          {
            menuItemId: createdMenuItems[0].id, // Chicken Biryani
            quantity: 2,
            price: 299,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample order:', order1.orderNumber);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

