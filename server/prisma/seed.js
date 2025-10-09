import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for multi-restaurant food court...');

  // Clear existing data in correct order (to avoid foreign key violations)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.restaurant.deleteMany({});
  
  console.log('✅ Cleared existing data');

  // Create Restaurants
  const restaurants = [
    {
      name: 'Spice Junction',
      description: 'Authentic Indian cuisine with traditional flavors',
      cuisine: 'Indian',
      isActive: true,
      rating: 4.5,
      preparationTime: 25,
      image: '🍛',
    },
    {
      name: 'Dragon Wok',
      description: 'Fresh Chinese and Asian fusion delicacies',
      cuisine: 'Chinese',
      isActive: true,
      rating: 4.3,
      preparationTime: 20,
      image: '🥡',
    },
    {
      name: 'Pizza Palace',
      description: 'Wood-fired pizzas and Italian specialties',
      cuisine: 'Italian',
      isActive: true,
      rating: 4.6,
      preparationTime: 18,
      image: '🍕',
    },
    {
      name: 'Burger Barn',
      description: 'Gourmet burgers and fast food favorites',
      cuisine: 'Fast Food',
      isActive: true,
      rating: 4.2,
      preparationTime: 15,
      image: '🍔',
    },
    {
      name: 'Cafe Mocha',
      description: 'Coffee, desserts and light bites',
      cuisine: 'Cafe',
      isActive: true,
      rating: 4.4,
      preparationTime: 10,
      image: '☕',
    },
  ];

  const createdRestaurants = [];
  for (const restaurant of restaurants) {
    const created = await prisma.restaurant.create({
      data: restaurant,
    });
    createdRestaurants.push(created);
    console.log(`✅ Created restaurant: ${created.name}`);
  }

  // Create Staff for each restaurant with UNIQUE PINs
  const staffPins = ['1234', '2345', '3456', '4567', '5678'];
  
  for (let i = 0; i < createdRestaurants.length; i++) {
    const restaurant = createdRestaurants[i];
    const pin = staffPins[i];
    const hashedPin = await bcrypt.hash(pin, 10);
    
    const staff = await prisma.staff.create({
      data: {
        name: `${restaurant.name} Staff`,
        pin: hashedPin,
        role: 'staff',
        restaurantId: restaurant.id,
      },
    });
    console.log(`✅ Created staff for ${restaurant.name} (PIN: ${pin})`);
  }

  // Menu items for Spice Junction (Indian)
  const spiceJunctionMenu = [
    {
      name: 'Chicken Biryani',
      category: 'mains',
      price: 299,
      description: 'Aromatic basmati rice with tender chicken pieces, served with raita and pickle',
      prepTime: 25,
      tags: ['bestseller', 'spicy', 'signature'],
      isAvailable: true,
      isVegetarian: false,
      restaurantId: createdRestaurants[0].id,
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
      restaurantId: createdRestaurants[0].id,
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
      restaurantId: createdRestaurants[0].id,
    },
    {
      name: 'Paneer Tikka',
      category: 'appetizers',
      price: 199,
      description: 'Grilled cottage cheese marinated in Indian spices',
      prepTime: 20,
      tags: ['bestseller', 'spicy'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[0].id,
    },
    {
      name: 'Samosa',
      category: 'appetizers',
      price: 89,
      description: 'Crispy fried pastry with savory potato and pea filling',
      prepTime: 10,
      tags: ['value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[0].id,
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
      restaurantId: createdRestaurants[0].id,
    },
    {
      name: 'Gulab Jamun',
      category: 'desserts',
      price: 79,
      description: 'Sweet milk dumplings in warm sugar syrup',
      prepTime: 8,
      tags: ['bestseller'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[0].id,
    },
  ];

  // Menu items for Dragon Wok (Chinese)
  const dragonWokMenu = [
    {
      name: 'Hakka Noodles',
      category: 'mains',
      price: 179,
      description: 'Stir-fried noodles with vegetables and soy sauce',
      prepTime: 15,
      tags: ['bestseller', 'value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[1].id,
    },
    {
      name: 'Chicken Manchurian',
      category: 'mains',
      price: 249,
      description: 'Crispy chicken in tangy and spicy sauce',
      prepTime: 20,
      tags: ['bestseller', 'spicy'],
      isAvailable: true,
      isVegetarian: false,
      restaurantId: createdRestaurants[1].id,
    },
    {
      name: 'Fried Rice',
      category: 'mains',
      price: 169,
      description: 'Wok-tossed rice with vegetables and choice of protein',
      prepTime: 12,
      tags: ['value', 'healthy'],
      isAvailable: true,
      isVegetarian: false,
      restaurantId: createdRestaurants[1].id,
    },
    {
      name: 'Spring Rolls',
      category: 'appetizers',
      price: 129,
      description: 'Crispy vegetable spring rolls with sweet chili sauce',
      prepTime: 10,
      tags: ['value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[1].id,
    },
    {
      name: 'Hot & Sour Soup',
      category: 'appetizers',
      price: 99,
      description: 'Spicy and tangy soup with vegetables',
      prepTime: 8,
      tags: ['spicy', 'healthy'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[1].id,
    },
    {
      name: 'Green Tea',
      category: 'beverages',
      price: 49,
      description: 'Traditional Chinese green tea',
      prepTime: 2,
      tags: ['healthy'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[1].id,
    },
  ];

  // Menu items for Pizza Palace (Italian)
  const pizzaPalaceMenu = [
    {
      name: 'Margherita Pizza',
      category: 'mains',
      price: 299,
      description: 'Classic pizza with fresh mozzarella, basil, and tomato sauce',
      prepTime: 18,
      tags: ['bestseller', 'signature'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[2].id,
    },
    {
      name: 'Pepperoni Pizza',
      category: 'mains',
      price: 379,
      description: 'Loaded with pepperoni and mozzarella cheese',
      prepTime: 18,
      tags: ['bestseller', 'premium'],
      isAvailable: true,
      isVegetarian: false,
      restaurantId: createdRestaurants[2].id,
    },
    {
      name: 'Pasta Alfredo',
      category: 'mains',
      price: 249,
      description: 'Creamy fettuccine pasta with parmesan cheese',
      prepTime: 15,
      tags: ['signature'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[2].id,
    },
    {
      name: 'Garlic Bread',
      category: 'appetizers',
      price: 99,
      description: 'Toasted bread with garlic butter and herbs',
      prepTime: 8,
      tags: ['value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[2].id,
    },
    {
      name: 'Caesar Salad',
      category: 'appetizers',
      price: 159,
      description: 'Crisp romaine lettuce with Caesar dressing and croutons',
      prepTime: 10,
      tags: ['healthy'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[2].id,
    },
    {
      name: 'Tiramisu',
      category: 'desserts',
      price: 149,
      description: 'Classic Italian coffee-flavored dessert',
      prepTime: 5,
      tags: ['premium', 'signature'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[2].id,
    },
  ];

  // Menu items for Burger Barn (Fast Food)
  const burgerBarnMenu = [
    {
      name: 'Classic Burger',
      category: 'mains',
      price: 199,
      description: 'Juicy beef patty with lettuce, tomato, and special sauce',
      prepTime: 12,
      tags: ['bestseller', 'value'],
      isAvailable: true,
      isVegetarian: false,
      restaurantId: createdRestaurants[3].id,
    },
    {
      name: 'Chicken Burger',
      category: 'mains',
      price: 189,
      description: 'Crispy fried chicken with mayo and pickles',
      prepTime: 12,
      tags: ['bestseller'],
      isAvailable: true,
      isVegetarian: false,
      restaurantId: createdRestaurants[3].id,
    },
    {
      name: 'Veggie Burger',
      category: 'mains',
      price: 169,
      description: 'Plant-based patty with fresh vegetables',
      prepTime: 10,
      tags: ['healthy', 'value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[3].id,
    },
    {
      name: 'French Fries',
      category: 'appetizers',
      price: 99,
      description: 'Crispy golden fries with ketchup',
      prepTime: 8,
      tags: ['value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[3].id,
    },
    {
      name: 'Onion Rings',
      category: 'appetizers',
      price: 119,
      description: 'Crispy battered onion rings',
      prepTime: 10,
      tags: [],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[3].id,
    },
    {
      name: 'Milkshake',
      category: 'beverages',
      price: 129,
      description: 'Thick and creamy milkshake in various flavors',
      prepTime: 5,
      tags: ['premium'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[3].id,
    },
  ];

  // Menu items for Cafe Mocha (Cafe)
  const cafeMochaMenu = [
    {
      name: 'Cappuccino',
      category: 'beverages',
      price: 89,
      description: 'Espresso with steamed milk and foam',
      prepTime: 5,
      tags: ['bestseller'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[4].id,
    },
    {
      name: 'Latte',
      category: 'beverages',
      price: 99,
      description: 'Smooth espresso with steamed milk',
      prepTime: 5,
      tags: ['bestseller'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[4].id,
    },
    {
      name: 'Filter Coffee',
      category: 'beverages',
      price: 45,
      description: 'Traditional South Indian filter coffee',
      prepTime: 3,
      tags: ['value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[4].id,
    },
    {
      name: 'Chocolate Cake',
      category: 'desserts',
      price: 129,
      description: 'Rich chocolate cake with chocolate ganache',
      prepTime: 5,
      tags: ['premium'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[4].id,
    },
    {
      name: 'Cheesecake',
      category: 'desserts',
      price: 149,
      description: 'Creamy New York style cheesecake',
      prepTime: 5,
      tags: ['premium', 'signature'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[4].id,
    },
    {
      name: 'Croissant',
      category: 'appetizers',
      price: 79,
      description: 'Buttery and flaky French pastry',
      prepTime: 5,
      tags: ['value'],
      isAvailable: true,
      isVegetarian: true,
      restaurantId: createdRestaurants[4].id,
    },
  ];

  // Create all menu items
  const allMenuItems = [
    ...spiceJunctionMenu,
    ...dragonWokMenu,
    ...pizzaPalaceMenu,
    ...burgerBarnMenu,
    ...cafeMochaMenu,
  ];

  const createdMenuItems = [];
  for (const item of allMenuItems) {
    const created = await prisma.menuItem.create({
      data: item,
    });
    createdMenuItems.push(created);
  }

  console.log('✅ Created', createdMenuItems.length, 'menu items across all restaurants');

  // Create some sample orders
  const spiceJunctionItems = createdMenuItems.filter(item => item.restaurantId === createdRestaurants[0].id);
  if (spiceJunctionItems.length > 0) {
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
        restaurantId: createdRestaurants[0].id,
        orderItems: {
          create: [
            {
              menuItemId: spiceJunctionItems[0].id,
              quantity: 2,
              price: 299,
            },
          ],
        },
      },
    });
    console.log('✅ Created sample order:', order1.orderNumber);
  }

  console.log('🎉 Multi-restaurant food court seed completed!');
  console.log(`📊 Summary:`);
  console.log(`   - ${createdRestaurants.length} restaurants`);
  console.log(`   - ${createdMenuItems.length} menu items`);
  console.log(`   - Staff PINs:`);
  console.log(`     • Spice Junction: 1234`);
  console.log(`     • Dragon Wok: 2345`);
  console.log(`     • Pizza Palace: 3456`);
  console.log(`     • Burger Barn: 4567`);
  console.log(`     • Cafe Mocha: 5678`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
