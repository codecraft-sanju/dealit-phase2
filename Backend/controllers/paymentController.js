const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction');

const { queueNotification } = require('../services/queue');

const Order = require('../models/Order');
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CREDIT_PACKS = {
  'starter': { price: 49, credits: 50 },
  'popular': { price: 99, credits: 110 },
  'pro': { price: 199, credits: 250 }
};

const verifyRazorpayConnection = () => {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    console.log('Razorpay Connected Successfully');
    return true;
  } else {
    console.error('Razorpay Connection Failed: Missing Keys in .env');
    return false;
  }
};

const refundRazorpayPayment = async (paymentId, amount) => {
  try {
    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount: amount * 100, 
      speed: 'optimum'
    });
    return { success: true, data: refund };
  } catch (error) {
    console.error('Razorpay Refund Error:', error);
    return { success: false, error };
  }
};

const fetchRazorpayPaymentInfo = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error fetching Razorpay payment info:', error);
    return { success: false, error };
  }
};

const createOrder = async (req, res) => {
  try {
    const { packId, customAmount, amount } = req.body; 

    let amountToCharge = 0;
    let creditsToAward = 0;

    if (packId === 'custom') {
      if (!customAmount || customAmount < 10) {
        return res.status(400).json({ success: false, message: 'Invalid custom amount' });
      }
      amountToCharge = customAmount;
      creditsToAward = customAmount;
    } else if (CREDIT_PACKS[packId]) {
      amountToCharge = CREDIT_PACKS[packId].price;
      creditsToAward = CREDIT_PACKS[packId].credits;
    } else if (amount) {
      amountToCharge = amount;
      creditsToAward = amount;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid pack selected or amount missing' });
    }

    // --- ADDED: Professional Razorpay Customer Creation Logic ---
    const user = await User.findById(req.user._id);
    let customerId = user.razorpay_customer_id;

    // Agar customer id nahi hai toh pehle Razorpay me customer banayenge
    if (!customerId) {
      try {
        const customer = await razorpayInstance.customers.create({
          name: user.full_name || 'Dealit User',
          email: user.email,
          contact: user.phone || undefined,
          fail_existing: 0
        });
        customerId = customer.id;
        user.razorpay_customer_id = customerId;
        await user.save();
      } catch (custErr) {
        console.error("Failed to create Razorpay Customer:", custErr);
    
      }
    }
    

    const options = {
      amount: amountToCharge * 100, 
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      ...(customerId && { customer_id: customerId }), // ADDED: Required for saving cards
      notes: {
        userId: req.user._id.toString(),
        creditsToAward: creditsToAward.toString()
      }
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user._id; 

    const existingTransaction = await Transaction.findOne({ razorpay_payment_id });
    if (existingTransaction) {
      return res.status(400).json({ success: false, message: 'Payment already processed.' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(razorpay_signature, 'hex');
    
    let isAuthentic = false;
    if (expectedBuffer.length === signatureBuffer.length) {
        isAuthentic = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    if (isAuthentic) {
      const orderDetails = await razorpayInstance.orders.fetch(razorpay_order_id);

      if (orderDetails.status !== 'paid') {
          return res.status(400).json({ success: false, message: 'Payment incomplete at Razorpay end.' });
      }

      const actualAmountInINR = orderDetails.amount / 100; 
      const creditsToAdd = orderDetails.notes && orderDetails.notes.creditsToAward 
                           ? parseInt(orderDetails.notes.creditsToAward) 
                           : actualAmountInINR;

    
      const newTransaction = new Transaction({
        user: userId,
        amount: actualAmountInINR,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: 'success',
        transactionType: 'wallet_recharge'
      });
      await newTransaction.save();

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { account_credits: creditsToAdd } }, 
        { new: true }
      ).select('-password'); 

      queueNotification({
        user: userId,
        type: 'CREDIT_ADDED',
        title: 'Wallet Recharged! 💳',
        message: `${creditsToAdd} credits have been successfully added to your account.`,
        metadata: { 
          amount: actualAmountInINR, 
          reason: 'wallet_recharge',
          referenceId: newTransaction._id 
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment verified, transaction saved, and credits added successfully',
        user: updatedUser,
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid Signature. Payment Verification Failed.' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error during verification' });
  }
};

const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;

    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const actualAmountInINR = paymentEntity.amount / 100;
      const userId = paymentEntity.notes ? paymentEntity.notes.userId : null;
      
      const creditsToAdd = paymentEntity.notes && paymentEntity.notes.creditsToAward 
                           ? parseInt(paymentEntity.notes.creditsToAward) 
                           : actualAmountInINR;
      
      const existingTransaction = await Transaction.findOne({ razorpay_payment_id: paymentId });
      
      if (!existingTransaction && userId) {
         const newTransaction = new Transaction({
           user: userId,
           amount: actualAmountInINR,
           razorpay_order_id: orderId,
           razorpay_payment_id: paymentId,
           razorpay_signature: 'verified_via_webhook',
           status: 'success',
           transactionType: 'wallet_recharge'
         });
         await newTransaction.save();

         await User.findByIdAndUpdate(
           userId,
           { $inc: { account_credits: creditsToAdd } }
         );

        
         queueNotification({
           user: userId,
           type: 'CREDIT_ADDED',
           title: 'Wallet Recharged! ',
           message: `${creditsToAdd} credits have been successfully added to your account.`,
           metadata: { 
             amount: actualAmountInINR, 
             reason: 'wallet_recharge',
             referenceId: newTransaction._id 
           }
         });
      }
    } 
  
    else if (event === 'refund.processed') {
      const refundEntity = req.body.payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      const order = await Order.findOne({ razorpay_payment_id: paymentId, paymentStatus: 'refund_processing' }).populate('item');
      
      if (order) {
         order.paymentStatus = 'refunded';
         await order.save();

         queueNotification({
           user: order.buyer,
           type: 'CREDIT_ADDED',
           title: 'Bank Refund Successful ',
           message: `₹${order.shippingCost} shipping refund has been successfully processed by your bank.`,
           metadata: { amount: order.shippingCost, reason: 'bank_refund_success', referenceId: order._id, imageUrl: order.item?.images?.[0] }
         });
      }
    }
   
    else if (event === 'refund.failed') {
      const refundEntity = req.body.payload.refund.entity;
      const paymentId = refundEntity.payment_id;

      const order = await Order.findOne({ razorpay_payment_id: paymentId, paymentStatus: 'refund_processing' }).populate('item');
      
      if (order) {
         order.paymentStatus = 'refund_failed';
         await order.save();
         queueNotification({
           user: order.buyer,
           type: 'SYSTEM_ALERT',
           title: 'Refund Failed ⚠️',
           message: `Your bank rejected the ₹${order.shippingCost} shipping refund. Please contact support.`,
           metadata: { amount: order.shippingCost, reason: 'bank_refund_failed', referenceId: order._id, imageUrl: order.item?.images?.[0] }
         });
      }
    }
    

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
};


const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id; 
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'all';
    
    const skip = (page - 1) * limit;

    let query = { user: userId };
    if (type !== 'all') {
      query.transactionType = type;
    }

    const totalTransactions = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total: totalTransactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      hasMore: page < Math.ceil(totalTransactions / limit),
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching transactions' });
  }
};


const getSavedPaymentMethods = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.razorpay_customer_id) {
      return res.status(200).json({ success: true, data: [] });
    }

    const tokens = await razorpayInstance.customers.fetchTokens(user.razorpay_customer_id);
    res.status(200).json({ success: true, data: tokens.items || [] });
  } catch (error) {
    console.error('Error fetching saved methods:', error);
  
    res.status(200).json({ success: true, data: [] });
  }
};
const deleteSavedPaymentMethod = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user || !user.razorpay_customer_id) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    await razorpayInstance.customers.deleteToken(user.razorpay_customer_id, tokenId);
    res.status(200).json({ success: true, message: 'Payment method removed successfully.' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payment method.' });
  }
};

const downloadWalletStatement = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const transactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-disposition', `attachment; filename="Dealit_Statement_${Date.now()}.pdf"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    
    doc.fillColor('#6B46C1').fontSize(28).font('Helvetica-Bold').text('Dealit', 50, 45);
    doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold').text('STATEMENT OF ACCOUNT', 400, 55, { align: 'right' });
    doc.moveTo(50, 85).lineTo(545, 85).lineWidth(2).strokeColor('#A388E1').stroke();

   
    doc.moveDown(2);
    
    doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Account Holder:', 50, 105);
    doc.fillColor('#111827').fontSize(14).font('Helvetica-Bold').text(user.full_name || 'Dealit User', 50, 120);
    doc.fillColor('#4B5563').fontSize(10).font('Helvetica').text(user.email, 50, 138);

    doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Date Generated:', 400, 105, { align: 'right' });
    doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold').text(new Date().toLocaleDateString('en-IN'), 400, 120, { align: 'right' });

    doc.fillColor('#666666').fontSize(10).font('Helvetica').text('Available Balance:', 400, 150, { align: 'right' });
    doc.fillColor('#10B981').fontSize(18).font('Helvetica-Bold').text(`${user.account_credits} CR`, 400, 165, { align: 'right' });

    // --- 3. TABLE HEADER ---
    let y = 230; 
    doc.rect(50, y, 495, 30).fill('#F3F4F6');
    
    doc.fillColor('#4B5563').fontSize(9).font('Helvetica-Bold');
    doc.text('DATE', 60, y + 10, { width: 90 });
    doc.text('DESCRIPTION', 160, y + 10, { width: 170 });
    doc.text('STATUS', 340, y + 10, { width: 80 });
    doc.text('AMOUNT', 430, y + 10, { width: 105, align: 'right' });

    y += 30;

    // --- 4. TABLE ROWS ---
    if (transactions.length === 0) {
        doc.fillColor('#9CA3AF').font('Helvetica').fontSize(10);
        doc.text('No transactions found for this account.', 50, y + 20, { align: 'center', width: 495 });
    } else {
        transactions.forEach((tx, index) => {
            if (y > 750) {
                doc.addPage();
                y = 50; 
            }

            if (index % 2 === 0) {
                doc.rect(50, y, 495, 35).fill('#FAFAFA');
            }

            const date = new Date(tx.createdAt || tx.created_at).toLocaleDateString('en-IN');
            
            const typeText = (tx.transactionType || 'wallet_recharge')
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            const status = tx.status.toUpperCase();
            const isShipping = tx.transactionType === 'shipping_fee';
            const isSuccess = tx.status === 'success';

            let amountStr = tx.amount.toString();
            let amountColor = '#111827';
            
            if (isShipping) {
                amountStr = `- Rs. ${amountStr}`;
            } else {
                amountStr = `+ ${amountStr} CR`;
                if(isSuccess) amountColor = '#10B981'; 
            }

            if (tx.status === 'failed') amountColor = '#EF4444'; 

            let statusColor = '#F59E0B'; 
            if (isSuccess) statusColor = '#10B981'; 
            if (tx.status === 'failed') statusColor = '#EF4444'; 

            // Exact X/Y coordinates so text will NEVER overlap
            doc.fillColor('#6B7280').fontSize(9).font('Helvetica');
            doc.text(date, 60, y + 12, { width: 90 });
            
            doc.fillColor('#111827').font('Helvetica-Bold');
            doc.text(typeText, 160, y + 12, { width: 170 });
            
            doc.fillColor(statusColor).font('Helvetica-Bold');
            doc.text(status, 340, y + 12, { width: 80 });
            
            doc.fillColor(amountColor).font('Helvetica-Bold');
            doc.text(amountStr, 430, y + 12, { width: 105, align: 'right' });

            doc.moveTo(50, y + 35).lineTo(545, y + 35).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
            
            y += 35; 
        });
    }

    // --- 5. FOOTER ---
    doc.moveDown(3);
    if (doc.y > 750) doc.addPage();
    
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica');
    doc.text('This is a computer-generated statement and does not require a physical signature.', 50, doc.y, { align: 'center', width: 495 });
    doc.moveDown(0.5);
    doc.text(`Dealit © ${new Date().getFullYear()} - dealiit.com`, { align: 'center', width: 495 });

    doc.end();

  } catch (error) {
    console.error('Error generating statement:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate statement' });
    }
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  razorpayWebhook,
  getUserTransactions,
  verifyRazorpayConnection,
  refundRazorpayPayment,
  fetchRazorpayPaymentInfo,
  getSavedPaymentMethods, 
  deleteSavedPaymentMethod ,
  downloadWalletStatement
};