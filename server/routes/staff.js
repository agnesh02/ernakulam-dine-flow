import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

// Get all staff (requires authentication)
router.get('/', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      select: {
        id: true,
        name: true,
        role: true,
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
    const { name, pin, role } = req.body;

    if (!name || !pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Name and 4-digit PIN required' });
    }

    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    const newStaff = await prisma.staff.create({
      data: {
        name,
        pin: hashedPin,
        role: role || 'staff',
      },
      select: {
        id: true,
        name: true,
        role: true,
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

