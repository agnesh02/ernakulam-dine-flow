import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import razorpay from '../config/razorpay.js';
import crypto from 'crypto';

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
    const { items, customerEmail, customerPhone, paymentMethod, orderType } = req.body;

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
        orderType: orderType || 'dine-in', // Default to dine-in if not specified
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

// Create Razorpay order for prepayment (WITHOUT creating restaurant order first)
router.post('/create-prepayment', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Calculate totals (same logic as order creation)
    let totalAmount = 0;
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
    }

    const serviceCharge = Math.round(totalAmount * 0.05);
    const gst = Math.round(totalAmount * 0.18);
    const grandTotal = totalAmount + serviceCharge + gst;

    // Generate temporary receipt number
    const receiptNumber = `PREPAY-${Date.now().toString().slice(-8)}`;

    // Create Razorpay order WITHOUT creating restaurant order
    const razorpayOrder = await razorpay.orders.create({
      amount: grandTotal * 100, // Convert to paise
      currency: 'INR',
      receipt: receiptNumber,
      notes: {
        itemCount: items.length,
        totalAmount: totalAmount,
        serviceCharge: serviceCharge,
        gst: gst,
        grandTotal: grandTotal,
      },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: grandTotal,
      currency: 'INR',
      receipt: receiptNumber,
      items: items, // Return items for order creation after payment
    });
  } catch (error) {
    console.error('Error creating prepayment order:', error);
    res.status(500).json({ error: 'Failed to create prepayment order' });
  }
});

// Create Razorpay order for payment (existing orders)
router.post('/:id/create-payment', async (req, res) => {
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

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: order.grandTotal * 100, // Convert to paise
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: order.grandTotal,
      currency: 'INR',
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify prepayment and CREATE order (only after payment succeeds)
router.post('/verify-prepayment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, orderType } = req.body;

    console.log('🔍 Verify prepayment called:', {
      razorpay_order_id,
      razorpay_payment_id,
      has_signature: !!razorpay_signature,
      items_count: items?.length
    });

    if (!items || items.length === 0) {
      console.error('❌ No items provided');
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Verify payment signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'thisisasecret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log('🔐 Signature verification:', {
      expected: expectedSignature.substring(0, 10) + '...',
      received: razorpay_signature?.substring(0, 10) + '...',
      match: expectedSignature === razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      return res.status(400).json({ error: 'Invalid payment signature - Payment verification failed' });
    }

    console.log('✅ Payment signature verified successfully');

    // Payment verified! Now create the actual order
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
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

    // Create order with PAID status
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        orderType: orderType || 'dine-in', // Default to dine-in if not specified
        totalAmount,
        serviceCharge,
        gst,
        grandTotal,
        paymentMethod: 'online',
        paymentStatus: 'paid', // Already paid!
        status: 'paid', // Mark as paid immediately
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

    console.log('✅ Order created successfully:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      grandTotal: order.grandTotal,
      status: order.status,
      paymentStatus: order.paymentStatus
    });

    // NOW emit socket event to staff (order is confirmed and paid)
    const io = req.app.get('io');
    io.to('staff').emit('order:new', order);
    io.emit('order:paid', { orderId: order.id, order });

    console.log('✅ Sending success response to frontend');
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Error verifying prepayment:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Failed to verify prepayment and create order' });
  }
});

// Verify Razorpay payment and mark order as paid (for existing orders)
router.post('/:id/verify-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'thisisasecret')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update order as paid
    const order = await prisma.order.update({
      where: { id },
      data: {
        paymentStatus: 'paid',
        paymentMethod: 'online',
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

    // Emit socket event for payment confirmation
    const io = req.app.get('io');
    io.to('staff').emit('order:paid', { orderId: id, order });
    io.emit('order:statusUpdate', { orderId: id, order });

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Mark order as paid (for cash payments)
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

// Cancel order (for failed/cancelled payments)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    // Update order status to cancelled
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
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
    io.to('staff').emit('order:cancelled', { orderId: id, order });

    res.json(order);
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Remove individual item from order (staff only)
router.delete('/:orderId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    // Get the order first
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    // Check if order can be modified (not served or cancelled)
    if (order.status === 'served' || order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot modify completed or cancelled orders' });
    }

    // Find the item to remove
    const itemToRemove = order.orderItems.find(item => item.id === itemId);
    if (!itemToRemove) {
      return res.status(404).json({ error: 'Item not found in order' });
    }

    // Delete the order item
    await prisma.orderItem.delete({
      where: { id: itemId },
    });

    // Get remaining items
    const remainingItems = order.orderItems.filter(item => item.id !== itemId);

    // If no items left, cancel the order
    if (remainingItems.length === 0) {
      const cancelledOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
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
      io.to('staff').emit('order:cancelled', { orderId, order: cancelledOrder });
      io.to(`customer:${orderId}`).emit('order:statusUpdate', { 
        orderId, 
        status: 'cancelled', 
        order: cancelledOrder 
      });

      return res.json({ 
        message: 'Last item removed, order cancelled',
        order: cancelledOrder 
      });
    }

    // Recalculate totals
    let newTotalAmount = 0;
    remainingItems.forEach(item => {
      newTotalAmount += item.price * item.quantity;
    });

    const newServiceCharge = Math.round(newTotalAmount * 0.05);
    const newGst = Math.round(newTotalAmount * 0.18);
    const newGrandTotal = newTotalAmount + newServiceCharge + newGst;

    // Update order with new totals
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: newTotalAmount,
        serviceCharge: newServiceCharge,
        gst: newGst,
        grandTotal: newGrandTotal,
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
    io.to('staff').emit('order:itemRemoved', { orderId, itemId, order: updatedOrder });
    io.to(`customer:${orderId}`).emit('order:statusUpdate', { 
      orderId, 
      status: updatedOrder.status, 
      order: updatedOrder 
    });

    res.json({ 
      message: 'Item removed successfully',
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error removing order item:', error);
    res.status(500).json({ error: 'Failed to remove item from order' });
  }
});

// Update item quantity in order (staff only)
router.patch('/:orderId/items/:itemId/quantity', authenticateToken, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Get the order first
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    // Check if order can be modified
    if (order.status === 'served' || order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot modify completed or cancelled orders' });
    }

    // Find the item to update
    const itemToUpdate = order.orderItems.find(item => item.id === itemId);
    if (!itemToUpdate) {
      return res.status(404).json({ error: 'Item not found in order' });
    }

    // Update the item quantity
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity: parseInt(quantity) },
    });

    // Recalculate totals
    let newTotalAmount = 0;
    order.orderItems.forEach(item => {
      if (item.id === itemId) {
        newTotalAmount += item.price * parseInt(quantity);
      } else {
        newTotalAmount += item.price * item.quantity;
      }
    });

    const newServiceCharge = Math.round(newTotalAmount * 0.05);
    const newGst = Math.round(newTotalAmount * 0.18);
    const newGrandTotal = newTotalAmount + newServiceCharge + newGst;

    // Update order with new totals
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        totalAmount: newTotalAmount,
        serviceCharge: newServiceCharge,
        gst: newGst,
        grandTotal: newGrandTotal,
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
    io.to('staff').emit('order:itemUpdated', { orderId, itemId, quantity, order: updatedOrder });
    io.to(`customer:${orderId}`).emit('order:statusUpdate', { 
      orderId, 
      status: updatedOrder.status, 
      order: updatedOrder 
    });

    res.json({ 
      message: 'Item quantity updated successfully',
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ error: 'Failed to update item quantity' });
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

