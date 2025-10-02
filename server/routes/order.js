import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate order number
const generateOrderNumber = () => {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};

// Create new order (public - for customers)
router.post('/', async (req, res) => {
  try {
    const { items, customerEmail, customerPhone, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ error: `${menuItem.name} is currently unavailable` });
      }

      const itemTotal = menuItem.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
      });
    }

    const serviceCharge = Math.round(totalAmount * 0.05);
    const gst = Math.round(totalAmount * 0.18);
    const grandTotal = totalAmount + serviceCharge + gst;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        totalAmount,
        serviceCharge,
        gst,
        grandTotal,
        customerEmail,
        customerPhone,
        paymentMethod: paymentMethod || 'cash', // Store payment method preference
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Emit socket event to staff
    const io = req.app.get('io');
    io.to('staff').emit('order:new', order);

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get single order (public - for customers to check status)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get all orders (staff only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;

    const where = status ? { status } : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (staff only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'paid', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Emit socket event to customer
    const io = req.app.get('io');
    io.to(`customer:${id}`).emit('order:statusUpdate', { orderId: id, status, order });
    
    // Also notify staff
    io.to('staff').emit('order:statusUpdate', { orderId: id, status, order });

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Mark order as paid (mock payment endpoint)
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || 'cash',
        status: 'paid',
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`customer:${id}`).emit('order:paid', order);
    io.to('staff').emit('order:paid', order);

    res.json(order);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get order statistics (staff only)
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, pendingOrders, preparingOrders, readyOrders] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: today },
        },
      }),
      prisma.order.count({
        where: {
          status: 'pending',
          createdAt: { gte: today },
        },
      }),
      prisma.order.count({
        where: {
          status: 'preparing',
          createdAt: { gte: today },
        },
      }),
      prisma.order.count({
        where: {
          status: 'ready',
          createdAt: { gte: today },
        },
      }),
    ]);

    const totalRevenue = await prisma.order.aggregate({
      where: {
        paymentStatus: 'paid',
        createdAt: { gte: today },
      },
      _sum: {
        grandTotal: true,
      },
    });

    res.json({
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      totalRevenue: totalRevenue._sum.grandTotal || 0,
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ error: 'Failed to fetch order statistics' });
  }
});

export default router;

