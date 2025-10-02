import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all menu items (public - for customers)
router.get('/', async (req, res) => {
  try {
    const { available } = req.query;
    
    const where = available === 'true' ? { isAvailable: true } : {};
    
    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
});

// Update menu item availability (staff only)
router.patch('/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Create menu item (staff only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, description, prepTime, rating, isAvailable, image } = req.body;

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        category,
        price,
        description,
        prepTime,
        rating: rating || 4.0,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        image,
      },
    });

    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

// Update menu item (staff only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, prepTime, rating, isAvailable, image } = req.body;

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        category,
        price,
        description,
        prepTime,
        rating,
        isAvailable,
        image,
      },
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item (staff only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.delete({
      where: { id },
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;

