import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all restaurants (public - for customers)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    const where = active === 'true' ? { isActive: true } : {};
    
    const restaurants = await prisma.restaurant.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            menuItems: { where: { isAvailable: true } },
            orders: true,
          },
        },
      },
    });

    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get single restaurant with menu
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: { category: 'asc' },
        },
        _count: {
          select: {
            menuItems: { where: { isAvailable: true } },
            orders: true,
          },
        },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Create restaurant (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, cuisine, image, rating, preparationTime } = req.body;

    // Only allow admin role to create restaurants
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create restaurants' });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        description,
        cuisine,
        image,
        rating: rating || 4.0,
        preparationTime: preparationTime || 20,
        isActive: true,
      },
    });

    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ error: 'Failed to create restaurant' });
  }
});

// Update restaurant (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, cuisine, image, rating, preparationTime, isActive } = req.body;

    // Only allow admin role to update restaurants
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update restaurants' });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name,
        description,
        cuisine,
        image,
        rating,
        preparationTime,
        isActive,
      },
    });

    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Toggle restaurant active status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Only allow admin role to toggle restaurant status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update restaurant status' });
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { isActive },
    });

    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant status:', error);
    res.status(500).json({ error: 'Failed to update restaurant status' });
  }
});

// Delete restaurant (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only allow admin role to delete restaurants
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete restaurants' });
    }

    await prisma.restaurant.delete({
      where: { id },
    });

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ error: 'Failed to delete restaurant' });
  }
});

// Get restaurant statistics (staff only)
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, totalRevenue, totalMenuItems, activeMenuItems] = await Promise.all([
      prisma.order.count({
        where: {
          restaurantId: id,
          createdAt: { gte: today },
        },
      }),
      prisma.order.aggregate({
        where: {
          restaurantId: id,
          paymentStatus: 'paid',
          createdAt: { gte: today },
        },
        _sum: {
          grandTotal: true,
        },
      }),
      prisma.menuItem.count({
        where: { restaurantId: id },
      }),
      prisma.menuItem.count({
        where: {
          restaurantId: id,
          isAvailable: true,
        },
      }),
    ]);

    res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.grandTotal || 0,
      totalMenuItems,
      activeMenuItems,
    });
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant statistics' });
  }
});

export default router;

