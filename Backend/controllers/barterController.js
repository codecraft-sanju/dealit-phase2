const BarterRequest = require('../models/BarterRequest');
const Item = require('../models/Item');
const User = require('../models/User'); 
const Notification = require('../models/Notification');

const CreditSetting = require('../models/CreditSetting');


const crypto = require('crypto');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');

const { refundRazorpayPayment } = require('./paymentController');

const createBarterRequest = async (req, res) => {
  try {
    const { requestedItem, offeredItem, receiver, message } = req.body;

    const targetItem = await Item.findById(requestedItem);
    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'Target item not found' });
    }

    const offeredItemData = await Item.findById(offeredItem);
    if (!offeredItemData) {
      return res.status(404).json({ success: false, message: 'Offered item not found' });
    }

    if (offeredItemData.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only offer items that you own!' });
    }

    if (targetItem.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own item' });
    }

    const existingRequest = await BarterRequest.findOne({
      requester: req.user._id,
      item: requestedItem,
      status: { $in: ['PENDING', 'ACCEPTED', 'AWAITING_PAYMENT'] } 
    }).populate('owner', 'full_name');

    if (existingRequest) {
      const ownerName = existingRequest.owner?.full_name || 'the owner';
      return res.status(400).json({ 
        success: false, 
        message: `You have already sent a request for this item. Please wait for ${ownerName} to respond!` 
      });
    }

    const currentUser = await User.findById(req.user._id);
    
    const targetValue = targetItem.estimated_value || 0;
    const offeredValue = offeredItemData.estimated_value || 0;
    const requiredCredits = Math.max(0, targetValue - offeredValue);

    if (currentUser.account_credits < requiredCredits) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient Credits! This swap requires ${requiredCredits} credits to cover the difference, but you only have ${currentUser.account_credits}.`,
        insufficientCredits: true 
      });
    }

    const targetOwnerId = receiver || targetItem.owner;

    const newRequest = new BarterRequest({
      supabaseId: `mongo-barter-${Date.now()}`,
      requester: req.user._id,
      owner: targetOwnerId,
      item: requestedItem, 
      offered_item: offeredItem, 
      status: 'PENDING',
      message: message || 'I want to trade this item!',
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const savedRequest = await newRequest.save();

    await Notification.create({
      user: targetOwnerId,
      type: 'TRADE_ALERT',
      title: 'New Trade Offer! 🤝',
      message: `Aapke item "${targetItem.title}" ke badle ek naya offer aaya hai.`,
      metadata: { reason: 'new_offer', referenceId: savedRequest._id }
    });

    res.status(201).json({ success: true, data: savedRequest });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const formatRequestsForFrontend = (requests) => {
  return requests.map(req => ({
    _id: req._id,
    status: req.status,
    requestedItem: req.item,
    offeredItem: req.offered_item,
    receiver: req.owner,
    sender: req.requester,
    created_at: req.created_at
  }));
};

const getReceivedRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await BarterRequest.countDocuments({ owner: req.user._id });

    const requests = await BarterRequest.find({ owner: req.user._id })
      .populate('requester', 'full_name email phone') 
      .populate('item')
      .populate('offered_item')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: requests.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: formatRequestsForFrontend(requests) 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const total = await BarterRequest.countDocuments({ requester: req.user._id });

    const requests = await BarterRequest.find({ requester: req.user._id })
      .populate('owner', 'full_name email phone') 
      .populate('item')
      .populate('offered_item')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ 
      success: true, 
      count: requests.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: formatRequestsForFrontend(requests) 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getBarterRequestById = async (req, res) => {
  try {
    const request = await BarterRequest.findById(req.params.id)
      .populate('requester', 'full_name email phone city')
      .populate('owner', 'full_name email phone city')
      .populate('item')
      .populate('offered_item');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Barter request not found' });
    }

    if (request.requester._id.toString() !== req.user._id.toString() && request.owner._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to view this request' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateBarterRequest = async (req, res) => {
  try {
    let request = await BarterRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Barter request not found' });
    }

    if (request.requester.toString() !== req.user._id.toString() && request.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this request' });
    }

    req.body.updated_at = Date.now();

    request = await BarterRequest.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('item').populate('offered_item');

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteBarterRequest = async (req, res) => {
  try {
    const request = await BarterRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Barter request not found' });
    }

    if (request.requester.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Only the requester can delete this request' });
    }

    await request.deleteOne();
    res.status(200).json({ success: true, message: 'Barter request removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateSwapStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, shippingAddress, paymentDetails } = req.body; 
    const userId = req.user._id;

    const barter = await BarterRequest.findById(id)
      .populate('item offered_item')
      .populate('requester', 'full_name phone')
      .populate('owner', 'full_name phone');

    if (!barter) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (barter.owner._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    if (barter.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    if (status === 'ACCEPTED') {
      if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.houseNo || !shippingAddress.areaStreet || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
        return res.status(400).json({ 
          success: false, 
          message: 'Incomplete shipping address. Please fill all the fields.' 
        });
      }

      if (!paymentDetails || !paymentDetails.razorpay_payment_id) {
        return res.status(400).json({ success: false, message: 'Shipping payment details missing' });
      }

      const finalShippingCost = paymentDetails.amount; 
      
      // --- NAYA CHANGE START: Sanity check to prevent manual tampering of shipping cost to Rs 1 ---
      if (finalShippingCost < 30) {
        return res.status(400).json({ success: false, message: 'Invalid shipping amount detected.' });
      }
      // --- NAYA CHANGE END ---

      const rzpOrderId = paymentDetails.razorpay_order_id;
      const rzpPaymentId = paymentDetails.razorpay_payment_id;
      const { razorpay_signature } = paymentDetails;

      const body = rzpOrderId + "|" + rzpPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature. Shipping verification failed.' });
      }

      await Transaction.create({
        user: userId,
        amount: finalShippingCost, 
        razorpay_order_id: rzpOrderId,
        razorpay_payment_id: rzpPaymentId,
        razorpay_signature: razorpay_signature,
        status: 'success',
        transactionType: 'shipping_fee'
      });

      barter.ownerShippingAddress = shippingAddress;
      barter.ownerShippingCost = finalShippingCost;
      barter.owner_razorpay_order_id = rzpOrderId;
      barter.owner_razorpay_payment_id = rzpPaymentId;
      barter.ownerPaymentStatus = 'paid';
      
      barter.status = 'AWAITING_PAYMENT';
      barter.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

      await Notification.create({
        user: barter.requester._id,
        type: 'TRADE_ALERT',
        title: 'Action Required! ⏳',
        message: `${barter.owner.full_name} has accepted your swap and paid their shipping. Pay your shipping cost within 24 hours to confirm the deal.`,
        metadata: { reason: 'payment_pending', referenceId: barter._id }
      });

    } else if (status === 'REJECTED') {
      await Notification.create({
        user: barter.requester._id,
        type: 'TRADE_ALERT',
        title: 'Offer Declined ',
        message: `Aapka offer "${barter.item.title}" ke liye decline kar diya gaya hai.`,
        metadata: { reason: 'trade_rejected', referenceId: barter._id }
      });
      barter.status = status;
    }

    barter.updated_at = Date.now();
    await barter.save();

    res.status(200).json({ 
      success: true, 
      message: status === 'ACCEPTED' 
        ? 'Shipping paid! Waiting for the requester to complete their payment within 24 hours.' 
        : `Swap ${status.toLowerCase()} successfully`, 
      data: barter
    });

  } catch (error) {
    console.error('Error in updateSwapStatus:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message).join(' | ');
      return res.status(400).json({ success: false, message: `Validation Error: ${messages}` });
    }

    res.status(500).json({ success: false, message: 'Server error while updating swap status' });
  }
};

const completeSwapPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingAddress, paymentDetails } = req.body;
    const userId = req.user._id;

    const barter = await BarterRequest.findById(id)
      .populate('item offered_item')
      .populate('requester', 'full_name phone')
      .populate('owner', 'full_name phone');

    if (!barter) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    if (barter.requester._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this payment' });
    }

    if (barter.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({ success: false, message: 'This request is not waiting for payment' });
    }

    if (new Date() > barter.expiresAt) {
      return res.status(400).json({ success: false, message: 'Payment time has expired' });
    }

    // --- NAYA CHANGE START: Check credits BEFORE processing Razorpay to prevent trap ---
    const targetValue = barter.item.estimated_value || 0;
    const offeredValue = barter.offered_item.estimated_value || 0;
    const requiredCredits = Math.max(0, targetValue - offeredValue);

    const currentUser = await User.findById(userId);
    if (requiredCredits > 0 && currentUser.account_credits < requiredCredits) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient credits. You need ${requiredCredits} credits to cover the difference.` 
      });
    }
    // --- NAYA CHANGE END ---

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.houseNo || !shippingAddress.areaStreet || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      return res.status(400).json({ success: false, message: 'Incomplete shipping address.' });
    }

    if (!paymentDetails || !paymentDetails.razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Shipping payment details missing' });
    }

    const finalShippingCost = paymentDetails.amount; 

    // --- NAYA CHANGE START: Sanity Check ---
    if (finalShippingCost < 30) {
      return res.status(400).json({ success: false, message: 'Invalid shipping amount detected.' });
    }
    // --- NAYA CHANGE END ---

    const rzpOrderId = paymentDetails.razorpay_order_id;
    const rzpPaymentId = paymentDetails.razorpay_payment_id;
    const { razorpay_signature } = paymentDetails;

    const body = rzpOrderId + "|" + rzpPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    await Transaction.create({
      user: userId,
      amount: finalShippingCost, 
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
      razorpay_signature: razorpay_signature,
      status: 'success',
      transactionType: 'shipping_fee'
    });

    if (requiredCredits > 0) {
      // --- NAYA CHANGE START: Atomic deduction with fallback Razorpay refund ---
      const updatedRequester = await User.findOneAndUpdate(
        { _id: barter.requester._id, account_credits: { $gte: requiredCredits } },
        { $inc: { account_credits: -requiredCredits } },
        { new: true }
      );

      if (!updatedRequester) {
        // CRITICAL RACE CONDITION CAUGHT! User spent credits elsewhere. Refund their shipping fee!
        const refundRes = await refundRazorpayPayment(rzpPaymentId, finalShippingCost);
        
        if (refundRes.success) {
          await Transaction.create({
            user: userId,
            amount: finalShippingCost,
            razorpay_order_id: rzpOrderId,
            razorpay_payment_id: rzpPaymentId,
            status: 'success',
            transactionType: 'shipping_refund'
          });
        }
        
        return res.status(400).json({ 
          success: false, 
          message: 'Swap failed. You spent your credits while this was processing. Your shipping fee has been refunded.' 
        });
      }
      // --- NAYA CHANGE END ---

      await Notification.create({
        user: barter.requester._id,
        type: 'CREDIT_DEDUCTED',
        title: 'Trade Confirmed! ',
        message: `Aapka trade lock ho gaya hai. Difference cover karne ke liye ${requiredCredits} credits deduct hue.`,
        metadata: { amount: requiredCredits, reason: 'trade_difference', referenceId: barter._id }
      });
    }

    // Mark items as reserved
    await Item.findByIdAndUpdate(barter.item._id, { status: 'reserved' });
    await Item.findByIdAndUpdate(barter.offered_item._id, { status: 'reserved' });

    // Cancel other pending requests
    await BarterRequest.updateMany(
      {
        _id: { $ne: barter._id },
        status: { $in: ['PENDING', 'AWAITING_PAYMENT'] },
        $or: [
          { item: { $in: [barter.item._id, barter.offered_item._id] } },
          { offered_item: { $in: [barter.item._id, barter.offered_item._id] } }
        ]
      },
      { status: 'CANCELLED', updated_at: Date.now() }
    );

   
    await Order.create({
      buyer: barter.requester._id, 
      seller: barter.owner._id, 
      item: barter.item._id, 
      orderType: 'barter',
      barterRequestRef: barter._id,
      itemPrice: 0, 
      shippingCost: finalShippingCost,
      totalAmount: finalShippingCost, 
      shippingAddress: shippingAddress,
      orderStatus: 'pending',
      paymentStatus: 'paid', 
      isSellerPaid: true, 
      razorpay_order_id: rzpOrderId,
      razorpay_payment_id: rzpPaymentId,
    });

    
    await Order.create({
      buyer: barter.owner._id, 
      seller: barter.requester._id, 
      item: barter.offered_item._id, 
      orderType: 'barter',
      barterRequestRef: barter._id,
      itemPrice: 0, 
      shippingCost: barter.ownerShippingCost,
      totalAmount: barter.ownerShippingCost, 
      shippingAddress: barter.ownerShippingAddress,
      orderStatus: 'pending',
      paymentStatus: 'paid', 
      isSellerPaid: true, 
      razorpay_order_id: barter.owner_razorpay_order_id,
      razorpay_payment_id: barter.owner_razorpay_payment_id,
    });

    await Notification.create({
      user: barter.owner._id,
      type: 'ORDER_UPDATE',
      title: 'Deal Locked! 📦',
      message: `${barter.requester.full_name} has paid their shipping. Both orders are placed! Pack your item for dispatch.`,
      metadata: { referenceId: barter._id }
    });

    barter.requesterShippingAddress = shippingAddress;
    barter.requesterShippingCost = finalShippingCost;
    barter.requester_razorpay_order_id = rzpOrderId;
    barter.requester_razorpay_payment_id = rzpPaymentId;
    barter.requesterPaymentStatus = 'paid';
    
    barter.status = 'ACCEPTED';
    barter.updated_at = Date.now();
    await barter.save();

    res.status(200).json({ 
      success: true, 
      message: 'Deal completely locked and both orders placed successfully!', 
      data: barter
    });

  } catch (error) {
    console.error('Error in completeSwapPayment:', error);
    res.status(500).json({ success: false, message: 'Server error while completing swap payment' });
  }
};


const autoCancelOverdueBarters = async () => {
  try {
    const now = new Date();

    const overdueAwaiting = await BarterRequest.find({
      status: 'AWAITING_PAYMENT',
      expiresAt: { $lte: now }
    }).populate('owner requester');

    for (const barter of overdueAwaiting) {
      try {
        if (barter.ownerPaymentStatus === 'paid' && barter.owner_razorpay_payment_id) {
          
          const refundRes = await refundRazorpayPayment(barter.owner_razorpay_payment_id, barter.ownerShippingCost);

          if (refundRes.success) {
            await Transaction.create({
              user: barter.owner._id,
              amount: barter.ownerShippingCost,
              razorpay_order_id: barter.owner_razorpay_order_id,
              razorpay_payment_id: barter.owner_razorpay_payment_id,
              transactionType: 'shipping_refund',
              status: 'success'
            });
            barter.ownerPaymentStatus = 'refunded'; 
          } else {
             console.error(`Refund failed for barter ${barter._id}`);
          }
        }

        barter.status = 'CANCELLED';
        barter.updated_at = now;
        await barter.save();

        await Notification.create({
          user: barter.owner._id,
          type: 'SYSTEM',
          title: 'Swap Cancelled & Refunded 🚫',
          message: `The requester didn't pay within 24 hours. The swap is cancelled and your shipping fee of ₹${barter.ownerShippingCost} has been refunded.`,
          metadata: { referenceId: barter._id }
        });

        await Notification.create({
          user: barter.requester._id,
          type: 'SYSTEM',
          title: 'Swap Timeout ⏰',
          message: `You didn't complete the shipping payment in 24 hours. The swap request has been cancelled.`,
          metadata: { referenceId: barter._id }
        });

      } catch (innerError) {
        console.error(`Failed to auto-cancel AWAITING_PAYMENT barter ${barter._id}:`, innerError);
      }
    }

  
    const cancelHours = 24;
    const cancelThreshold = new Date(Date.now() - cancelHours * 60 * 60 * 1000);

    const overduePending = await BarterRequest.find({
      status: 'PENDING',
      created_at: { $lt: cancelThreshold }
    });

    for (const request of overduePending) {
      try {
        request.status = 'CANCELLED';
        request.updated_at = now;
        await request.save();

        await Notification.create({
          user: request.requester,
          type: 'TRADE_ALERT',
          title: 'Offer Auto-Cancelled ⏱️',
          message: `Aapka offer automatically cancel ho gaya hai kyunki 24 hours tak koi response nahi mila. Aap ab apna item kisi aur ko offer kar sakte hain.`,
          metadata: { reason: 'auto_cancel_barter', referenceId: request._id }
        });

        await Notification.create({
          user: request.owner,
          type: 'TRADE_ALERT',
          title: 'Offer Expired ⏳',
          message: `Ek pending offer expire ho gaya hai kyunki 24 hours tak koi response nahi mila.`,
          metadata: { reason: 'auto_cancel_barter', referenceId: request._id }
        });
      } catch (innerErr) {
         console.error(`Failed to auto-cancel PENDING barter ${request._id}:`, innerErr);
      }
    }

  } catch (error) {
    console.error('Error in autoCancelOverdueBarters cron job:', error);
  }
};


module.exports = {
  createBarterRequest,
  getReceivedRequests,
  getSentRequests,
  getBarterRequestById,
  updateBarterRequest,
  deleteBarterRequest,
  updateSwapStatus,
  completeSwapPayment,
  
  autoCancelOverdueBarters 

};