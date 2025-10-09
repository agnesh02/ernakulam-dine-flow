import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

// Get all staff (requires authentication)
router.get('/', async (req, res) => {
  try {
    const { restaurantId } = req.query;
    
    const where = {};
    
    // Filter by restaurant - if staff, use their restaurant; if admin, allow filtering
    if (req.user.role !== 'admin' && req.user.restaurantId) {
      where.restaurantId = req.user.restaurantId;
    } else if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisine: true,
          },
        },
        createdAt: true,
      },
    });

    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// Create new staff member (requires authentication)
router.post('/', async (req, res) => {
  try {
    const { name, pin, role, restaurantId } = req.body;

    if (!name || !pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Name and 4-digit PIN required' });
    }

    // Determine restaurant - use provided or staff's own restaurant
    const finalRestaurantId = restaurantId || req.user.restaurantId;

    if (!finalRestaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Only admin can create staff for other restaurants
    if (req.user.role !== 'admin' && restaurantId && restaurantId !== req.user.restaurantId) {
      return res.status(403).json({ error: 'You can only create staff for your own restaurant' });
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    const newStaff = await prisma.staff.create({
      data: {
        name,
        pin: hashedPin,
        role: role || 'staff',
        restaurantId: finalRestaurantId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        restaurantId: true,
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisine: true,
          },
        },
        createdAt: true,
      },
    });

    res.status(201).json(newStaff);
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

export default router;

