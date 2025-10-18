import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import razorpay from '../config/razorpay.js';
import crypto from 'crypto';
import { transferForOrderGroup } from '../services/paymentTransfer.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate order number
const generateOrderNumber = () => {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
};

// Helper function to generate order group ID
const generateOrderGroupId = () => {
  const prefix = 'GRP';
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Create new order (public - for customers)
// MULTI-RESTAURANT: Creates separate orders per restaurant
router.post('/', async (req, res) => {
  try {
    const { items, customerEmail, customerPhone, paymentMethod, orderType, existingOrderGroupId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Group items by restaurant
    const itemsByRestaurant = new Map();

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { restaurant: true },
      });

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ error: `${menuItem.name} is currently unavailable` });
      }

      // Group by restaurant
      if (!itemsByRestaurant.has(menuItem.restaurantId)) {
        itemsByRestaurant.set(menuItem.restaurantId, {
          restaurant: menuItem.restaurant,
          items: [],
        });
      }

      itemsByRestaurant.get(menuItem.restaurantId).items.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
      });
    }

    // Create separate order for EACH restaurant
    const createdOrders = [];
    const io = req.app.get('io');
    
    // Use existing orderGroupId if provided (for continuous ordering), or generate new one for multi-restaurant orders
    const orderGroupId = existingOrderGroupId || (itemsByRestaurant.size > 1 ? generateOrderGroupId() : null);

    for (const [restaurantId, { restaurant, items: restaurantItems }] of itemsByRestaurant) {
      // Calculate totals for this restaurant
      let restaurantTotal = 0;
      for (const item of restaurantItems) {
        restaurantTotal += item.price * item.quantity;
      }

      const serviceCharge = Math.round(restaurantTotal * 0.05);
      const gst = Math.round(restaurantTotal * 0.18);
      const grandTotal = restaurantTotal + serviceCharge + gst;

      // Create order for this restaurant
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          orderGroupId, // Link orders from same transaction
          orderType: orderType || 'dine-in',
          totalAmount: restaurantTotal,
          serviceCharge,
          gst,
          grandTotal,
          customerEmail,
          customerPhone,
          paymentMethod: paymentMethod || 'cash',
          restaurantId,
          orderItems: {
            create: restaurantItems,
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
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

      createdOrders.push(order);

      // Emit socket event to this restaurant's staff
      io.to(`staff:${restaurantId}`).emit('order:new', order);
    }

    // Also emit to general staff room
    io.to('staff').emit('order:new', { orders: createdOrders });

    // Return all created orders with group ID
    res.status(201).json({
      message: `Created ${createdOrders.length} order(s)`,
      orders: createdOrders,
      totalOrders: createdOrders.length,
      orderGroupId, // Return the group ID for tracking
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders in a group (public - for tracking multi-restaurant orders)
// MUST BE BEFORE /:id route to avoid conflict
router.get('/group/:orderGroupId', async (req, res) => {
  try {
    const { orderGroupId } = req.params;
    
    const orders = await prisma.order.findMany({
      where: { orderGroupId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisine: true,
            image: true,
            preparationTime: true,
          },
        },
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: 'No orders found for this group' });
    }

    res.json({
      orders,
      totalOrders: orders.length,
      orderGroupId,
    });
  } catch (error) {
    console.error('Error fetching order group:', error);
    res.status(500).json({ error: 'Failed to fetch order group' });
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
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisine: true,
            image: true,
            preparationTime: true,
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
    const { status, restaurantId } = req.query;

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    // Filter by restaurant - if staff, use their restaurant; if admin, allow filtering
    if (req.user.role !== 'admin' && req.user.restaurantId) {
      where.restaurantId = req.user.restaurantId;
    } else if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            cuisine: true,
            image: true,
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

    // Emit socket event to customer
    const io = req.app.get('io');
    io.to(`customer:${id}`).emit('order:statusUpdate', { orderId: id, status, order });
    
    // Also notify restaurant-specific staff and general staff
    io.to(`staff:${order.restaurantId}`).emit('order:statusUpdate', { orderId: id, status, order });
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

    // Calculate totals - MULTI-RESTAURANT SUPPORT
    let totalAmount = 0;
    const restaurantIds = new Set();
    
    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { restaurant: true },
      });

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({ error: `${menuItem.name} is currently unavailable` });
      }

      // Track all restaurants in this order
      restaurantIds.add(menuItem.restaurantId);

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
// MULTI-RESTAURANT: Creates separate orders per restaurant
router.post('/verify-prepayment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, orderType, existingOrderGroupId } = req.body;

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

    // Group items by restaurant
    const itemsByRestaurant = new Map();

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        include: { restaurant: true },
      });

      if (!menuItem) {
        return res.status(404).json({ error: `Menu item ${item.menuItemId} not found` });
      }

      // Group by restaurant
      if (!itemsByRestaurant.has(menuItem.restaurantId)) {
        itemsByRestaurant.set(menuItem.restaurantId, {
          restaurant: menuItem.restaurant,
          items: [],
        });
      }

      itemsByRestaurant.get(menuItem.restaurantId).items.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
      });
    }

    // Create separate PAID order for EACH restaurant
    const createdOrders = [];
    const io = req.app.get('io');
    
    // Use existing orderGroupId if provided (for continuous ordering), or generate new one for multi-restaurant orders
    const orderGroupId = existingOrderGroupId || (itemsByRestaurant.size > 1 ? generateOrderGroupId() : null);

    for (const [restaurantId, { restaurant, items: restaurantItems }] of itemsByRestaurant) {
      // Calculate totals for this restaurant
      let restaurantTotal = 0;
      for (const item of restaurantItems) {
        restaurantTotal += item.price * item.quantity;
      }

      const serviceCharge = Math.round(restaurantTotal * 0.05);
      const gst = Math.round(restaurantTotal * 0.18);
      const grandTotal = restaurantTotal + serviceCharge + gst;

      // Create PAID order for this restaurant
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          orderGroupId, // Link orders from same transaction
          orderType: orderType || 'dine-in',
          totalAmount: restaurantTotal,
          serviceCharge,
          gst,
          grandTotal,
          paymentMethod: 'online',
          paymentStatus: 'paid',
          status: 'paid',
          restaurantId,
          orderItems: {
            create: restaurantItems,
          },
        },
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
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

      createdOrders.push(order);

      console.log(`✅ Order created for ${restaurant.name}:`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
      });

      // Emit socket event to this restaurant's staff
      io.to(`staff:${restaurantId}`).emit('order:new', order);
      io.emit('order:paid', { orderId: order.id, order });
    }

    // Also emit to general staff room
    io.to('staff').emit('order:new', { orders: createdOrders });

    console.log(`✅ Created ${createdOrders.length} order(s) successfully`);
    
    // NEW: Automatically transfer payments to restaurants
    let transferResults = [];
    try {
      console.log('\n💸 Initiating automatic transfers to restaurants...');
      transferResults = await transferForOrderGroup(createdOrders, razorpay_payment_id);
      
      // Update orders with transfer information
      for (let i = 0; i < createdOrders.length; i++) {
        const order = createdOrders[i];
        const transferResult = transferResults[i];

        if (transferResult.success) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              razorpayPaymentId: razorpay_payment_id,
              transferId: transferResult.transferId,
              transferAmount: transferResult.transferAmount,
              platformCommission: transferResult.platformCommission,
              transferStatus: transferResult.transferStatus,
              settlementStatus: 'completed',
              settledAt: new Date(),
            }
          });
          console.log(`✅ Order ${order.orderNumber} updated with transfer info`);
        } else {
          // Mark for manual settlement if transfer failed
          await prisma.order.update({
            where: { id: order.id },
            data: {
              razorpayPaymentId: razorpay_payment_id,
              transferStatus: 'failed',
              settlementStatus: 'pending',
            }
          });
          console.warn(`⚠️  Order ${order.orderNumber} marked for manual settlement`);
        }
      }
    } catch (transferError) {
      console.error('❌ Error during transfer process:', transferError);
      // Don't fail the order creation, just log it
      transferResults = createdOrders.map(order => ({
        success: false,
        orderId: order.id,
        error: 'Transfer service unavailable',
        message: 'Order created but automatic transfer failed. Will be settled manually.'
      }));
    }
    
    console.log('✅ Sending success response to frontend');
    
    res.json({ 
      success: true, 
      orders: createdOrders,
      message: `Payment successful! Created ${createdOrders.length} order(s)`,
      totalOrders: createdOrders.length,
      orderGroupId, // Return the group ID for tracking
      transfers: transferResults, // Include transfer information
    });
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

