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

  // Create menu items
  // Delete existing menu items first
  await prisma.menuItem.deleteMany({});
  
  const menuItems = [
    {
      name: 'Chicken Biryani',
      category: 'mains',
      price: 299,
      description: 'Aromatic basmati rice with tender chicken pieces, served with raita and pickle',
      prepTime: 25,
      rating: 4.8,
      isAvailable: true,
    },
    {
      name: 'Masala Dosa',
      category: 'mains',
      price: 149,
      description: 'Crispy crepe with spiced potato filling, served with sambar and chutneys',
      prepTime: 15,
      rating: 4.6,
      isAvailable: true,
    },
    {
      name: 'Fish Curry',
      category: 'mains',
      price: 249,
      description: 'Traditional Kerala fish curry with coconut milk and spices',
      prepTime: 20,
      rating: 4.7,
      isAvailable: false,
    },
    {
      name: 'Filter Coffee',
      category: 'beverages',
      price: 45,
      description: 'Traditional South Indian filter coffee, strong and aromatic',
      prepTime: 5,
      rating: 4.5,
      isAvailable: true,
    },
    {
      name: 'Mango Lassi',
      category: 'beverages',
      price: 75,
      description: 'Refreshing yogurt-based drink with fresh mango',
      prepTime: 3,
      rating: 4.4,
      isAvailable: true,
    },
    {
      name: 'Samosa',
      category: 'appetizers',
      price: 89,
      description: 'Crispy fried pastry with savory potato and pea filling',
      prepTime: 10,
      rating: 4.3,
      isAvailable: true,
    },
    {
      name: 'Gulab Jamun',
      category: 'desserts',
      price: 79,
      description: 'Sweet milk dumplings in warm sugar syrup',
      prepTime: 8,
      rating: 4.6,
      isAvailable: false,
    },
    {
      name: 'Tandoori Chicken',
      category: 'mains',
      price: 349,
      description: 'Marinated chicken grilled in tandoor, served with mint chutney',
      prepTime: 30,
      rating: 4.9,
      isAvailable: true,
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
  await prisma.order.deleteMany({});
  
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      status: 'preparing',
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

