import Razorpay from 'razorpay';

// Initialize Razorpay with credentials from environment
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } else {
    console.warn('⚠️  Razorpay credentials not configured. Payment transfers will be disabled.');
  }
} catch (error) {
  console.warn('⚠️  Razorpay initialization failed:', error.message);
}

/**
 * Transfer payment to a restaurant's linked Razorpay account
 * @param {Object} order - Order object with restaurant details
 * @param {string} paymentId - Razorpay payment ID to transfer from
 * @returns {Promise<Object>} Transfer result
 */
async function transferToRestaurant(order, paymentId) {
  if (!razorpay) {
    console.warn('⚠️  Razorpay not initialized. Skipping transfer.');
    return {
      success: false,
      reason: 'razorpay_not_configured',
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurant: order.restaurant.name,
      amount: order.grandTotal,
      message: 'Razorpay is not configured'
    };
  }

  try {
    // Calculate platform commission
    const commissionRate = order.restaurant.commissionRate || 0.10;
    const platformCommission = Math.round(order.grandTotal * commissionRate);
    const transferAmount = order.grandTotal - platformCommission;

    console.log(`\n💰 Processing transfer for Order ${order.orderNumber}:`);
    console.log(`   Restaurant: ${order.restaurant.name}`);
    console.log(`   Total Amount: ₹${order.grandTotal}`);
    console.log(`   Platform Commission (${commissionRate * 100}%): ₹${platformCommission}`);
    console.log(`   Transfer Amount: ₹${transferAmount}`);

    // Check if restaurant has a linked Razorpay account
    if (!order.restaurant.razorpayAccountId) {
      console.warn(`⚠️  ${order.restaurant.name} has no linked Razorpay account. Skipping transfer.`);
      console.warn(`   Order will be marked for manual settlement.`);
      
      return {
        success: false,
        reason: 'no_linked_account',
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurant: order.restaurant.name,
        amount: order.grandTotal,
        message: 'Restaurant does not have a linked account configured'
      };
    }

    // Create transfer via Razorpay Route API
    console.log(`   Creating transfer to account: ${order.restaurant.razorpayAccountId}...`);
    
    const transfer = await razorpay.transfers.create({
      account: order.restaurant.razorpayAccountId,
      amount: transferAmount * 100, // Convert rupees to paise
      currency: 'INR',
      source: paymentId, // Link to the original payment
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurant.name,
        platformCommission: platformCommission,
        transferAmount: transferAmount,
      }
    });

    console.log(`✅ Transfer created successfully!`);
    console.log(`   Transfer ID: ${transfer.id}`);
    console.log(`   Status: ${transfer.status}`);

    return {
      success: true,
      transferId: transfer.id,
      transferAmount: transferAmount,
      platformCommission: platformCommission,
      transferStatus: transfer.status,
      recipient: order.restaurant.name,
      recipientAccount: order.restaurant.razorpayAccountId,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };

  } catch (error) {
    console.error(`❌ Transfer failed for ${order.restaurant.name}:`);
    console.error(`   Error: ${error.message}`);
    
    // Handle specific Razorpay errors
    let errorReason = 'transfer_failed';
    if (error.error && error.error.code) {
      errorReason = error.error.code;
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.error?.code,
      errorReason: errorReason,
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipient: order.restaurant.name,
    };
  }
}

/**
 * Transfer payments for all orders in a group (multi-restaurant orders)
 * @param {Array} orders - Array of order objects
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Array>} Array of transfer results
 */
async function transferForOrderGroup(orders, paymentId) {
  console.log(`\n💸 Initiating transfers for ${orders.length} order(s)...`);
  console.log(`   Payment ID: ${paymentId}`);
  
  const results = [];
  
  // Process transfers sequentially to avoid rate limits
  for (const order of orders) {
    const result = await transferToRestaurant(order, paymentId);
    results.push(result);
    
    // Small delay between transfers to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTransferred = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.transferAmount, 0);
  const totalCommission = results
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.platformCommission, 0);
  
  console.log(`\n📊 Transfer Summary:`);
  console.log(`   Total Orders: ${results.length}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total Transferred to Restaurants: ₹${totalTransferred}`);
  console.log(`   Total Platform Commission: ₹${totalCommission}`);
  
  if (failed > 0) {
    console.warn(`   ⚠️  ${failed} transfer(s) failed - check logs above`);
  }
  
  return results;
}

/**
 * Fetch transfer status from Razorpay
 * @param {string} transferId - Razorpay transfer ID
 * @returns {Promise<Object>} Transfer details
 */
async function getTransferStatus(transferId) {
  if (!razorpay) {
    return {
      success: false,
      error: 'Razorpay is not configured'
    };
  }

  try {
    const transfer = await razorpay.transfers.fetch(transferId);
    return {
      success: true,
      transfer: {
        id: transfer.id,
        status: transfer.status,
        amount: transfer.amount / 100, // Convert paise to rupees
        recipient: transfer.recipient,
        processedAt: transfer.processed_at,
        notes: transfer.notes,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export {
  transferToRestaurant,
  transferForOrderGroup,
  getTransferStatus,
};

