import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Staff login with PIN
router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ error: 'Valid 4-digit PIN required' });
    }

    // Find staff by comparing hashed PIN
    const allStaff = await prisma.staff.findMany({
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisine: true,
            image: true,
          },
        },
      },
    });
    let staff = null;

    for (const s of allStaff) {
      const isMatch = await bcrypt.compare(pin, s.pin);
      if (isMatch) {
        staff = s;
        break;
      }
    }

    if (!staff) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Generate JWT token with restaurant context
    const token = jwt.sign(
      { 
        id: staff.id, 
        name: staff.name, 
        role: staff.role,
        restaurantId: staff.restaurantId,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        restaurantId: staff.restaurantId,
        restaurant: staff.restaurant,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token', valid: false });
  }
});

export default router;

