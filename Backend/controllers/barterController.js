const BarterRequest = require('../models/BarterRequest');
const Item = require('../models/Item');
const User = require('../models/User'); 
// CHANGED: Notification model import kiya
const Notification = require('../models/Notification');

const createBarterRequest = async (req, res) => {
  try {
    const { requestedItem, offeredItem, receiver, message, delivery_method } = req.body;

    const targetItem = await Item.findById(requestedItem);
    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'Target item not found' });
    }

    const offeredItemData = await Item.findById(offeredItem);
    if (!offeredItemData) {
      return res.status(404).json({ success: false, message: 'Offered item not found' });
    }

    if (targetItem.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own item' });
    }

    // --- NAYA LOGIC: Spam Protection (Check existing request) ---
    const existingRequest = await BarterRequest.findOne({
      requester: req.user._id,
      item: requestedItem,
      status: { $in: ['PENDING', 'ACCEPTED'] } // Agar pehle se pending ya accepted hai
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already sent a request for this item. Please wait for the owner to respond!' 
      });
    }
    // -------------------------------------------------------------

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
      delivery_method: delivery_method || 'mutual',
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const savedRequest = await newRequest.save();

    // CHANGED: Target item ke owner ko naye offer ki notification bheji
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
    const requests = await BarterRequest.find({ owner: req.user._id })
      .populate('requester', 'full_name email phone') // UPDATE: Phone number add kiya
      .populate('item')
      .populate('offered_item')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, count: requests.length, data: formatRequestsForFrontend(requests) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const requests = await BarterRequest.find({ requester: req.user._id })
      .populate('owner', 'full_name email phone') // UPDATE: Phone number add kiya
      .populate('item')
      .populate('offered_item')
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, count: requests.length, data: formatRequestsForFrontend(requests) });
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
    const { status } = req.body; 
    const userId = req.user._id;

    // 1. item aur offered_item ke sath requester aur owner ka name aur phone bhi populate karo
    const barter = await BarterRequest.findById(id)
      .populate('item offered_item')
      .populate('requester', 'full_name phone')
      .populate('owner', 'full_name phone');

    if (!barter) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    // Kyunki ab owner populate ho chuka hai, toh owner._id check karna hoga
    if (barter.owner._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    if (barter.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    let matchData = null;

    if (status === 'ACCEPTED') {
      const targetValue = barter.item.estimated_value || 0;
      const offeredValue = barter.offered_item.estimated_value || 0;
      const requiredCredits = Math.max(0, targetValue - offeredValue);

      if (requiredCredits > 0) {
        const updatedRequester = await User.findOneAndUpdate(
          { _id: barter.requester._id, account_credits: { $gte: requiredCredits } },
          { $inc: { account_credits: -requiredCredits } },
          { new: true }
        );

        if (!updatedRequester) {
          return res.status(400).json({ 
            success: false, 
            message: 'Cannot accept swap. The requester no longer has enough credits.' 
          });
        }

        // CHANGED: Agar credit diff tha, toh requester ko deduction ki notification
        await Notification.create({
          user: barter.requester._id,
          type: 'CREDIT_DEDUCTED',
          title: 'Trade Accepted! ',
          message: `Aapka trade offer accept ho gaya hai. Difference cover karne ke liye ${requiredCredits} credits deduct hue.`,
          metadata: { amount: requiredCredits, reason: 'trade_difference', referenceId: barter._id }
        });
      } else {
         // CHANGED: Agar koi credit diff nahi tha, toh sirf acceptance ki notification
         await Notification.create({
          user: barter.requester._id,
          type: 'TRADE_ALERT',
          title: 'Trade Accepted! ',
          message: `Aapka offer accept ho gaya hai! Deal lock karke chat start karein.`,
          metadata: { reason: 'trade_accepted', referenceId: barter._id }
        });
      }

      // 2. 'swapped' ki jagah 'reserved' status set karo taaki deal process me dikhe
      await Item.findByIdAndUpdate(barter.item._id, { status: 'reserved' });
      await Item.findByIdAndUpdate(barter.offered_item._id, { status: 'reserved' });

      await BarterRequest.updateMany(
        {
          _id: { $ne: barter._id },
          status: 'PENDING',
          $or: [
            { item: { $in: [barter.item._id, barter.offered_item._id] } },
            { offered_item: { $in: [barter.item._id, barter.offered_item._id] } }
          ]
        },
        { status: 'CANCELLED', updated_at: Date.now() }
      );

      // 3. Frontend ke liye WhatsApp contact data taiyar karo
      matchData = {
        owner: {
          name: barter.owner.full_name,
          phone: barter.owner.phone,
          item: barter.item.title
        },
        requester: {
          name: barter.requester.full_name,
          phone: barter.requester.phone,
          offered_item: barter.offered_item.title
        }
      };
    } else if (status === 'REJECTED') {
      // CHANGED: Reject hone par requester ko notify karo
      await Notification.create({
        user: barter.requester._id,
        type: 'TRADE_ALERT',
        title: 'Offer Declined ',
        message: `Aapka offer "${barter.item.title}" ke liye decline kar diya gaya hai.`,
        metadata: { reason: 'trade_rejected', referenceId: barter._id }
      });
    }

    barter.status = status;
    barter.updated_at = Date.now();
    await barter.save();

    res.status(200).json({ 
      success: true, 
      message: status === 'ACCEPTED' ? 'Deal Locked Successfully! You can now chat on WhatsApp.' : `Swap ${status.toLowerCase()} successfully`, 
      data: barter,
      matchData: matchData 
    });

  } catch (error) {
    console.error('Error in updateSwapStatus:', error);
    res.status(500).json({ success: false, message: 'Server error while updating swap status' });
  }
};

module.exports = {
  createBarterRequest,
  getReceivedRequests,
  getSentRequests,
  getBarterRequestById,
  updateBarterRequest,
  deleteBarterRequest,
  updateSwapStatus
};