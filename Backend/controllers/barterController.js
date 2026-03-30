const BarterRequest = require('../models/BarterRequest');
const Item = require('../models/Item');
const User = require('../models/User'); // User model chahiye balance check ke liye

const createBarterRequest = async (req, res) => {
  try {
    const { requestedItem, offeredItem, receiver, message, delivery_method } = req.body;

    const targetItem = await Item.findById(requestedItem);
    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'Target item not found' });
    }

    if (targetItem.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot make an offer on your own item' });
    }

    // --- NAYA LOGIC: Account Credits Check Karein ---
    const currentUser = await User.findById(req.user._id);
    
    // Agar target item ki value jyada hai user ke account credits se
    if (currentUser.account_credits < targetItem.estimated_value) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient Credits! This item requires ${targetItem.estimated_value} credits, but you only have ${currentUser.account_credits}. Please buy more credits.`,
        insufficientCredits: true // Frontend ko pata chalega ki popup/modal dikhana hai
      });
    }
    // ------------------------------------------------

    const newRequest = new BarterRequest({
      supabaseId: `mongo-barter-${Date.now()}`,
      requester: req.user._id,
      owner: receiver || targetItem.owner,
      item: requestedItem, 
      offered_item: offeredItem, 
      status: 'PENDING',
      message: message || 'I want to trade this item!',
      delivery_method: delivery_method || 'mutual',
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const savedRequest = await newRequest.save();
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
      .populate('requester', 'full_name email')
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
      .populate('owner', 'full_name email')
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
// --- NAYA FUNCTION: Swap Accept/Reject Handle Karne Ke Liye ---
const updateSwapStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' ya 'REJECTED' aayega frontend se
    const userId = req.user._id;

    // 1. Swap request find karo
    const barter = await BarterRequest.findById(id);

    if (!barter) {
      return res.status(404).json({ success: false, message: 'Swap request not found' });
    }

    // 2. Check karo ki jo user accept/reject kar raha hai, kya wahi owner (receiver) hai?
    if (barter.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    // 3. Status update karo
    barter.status = status;
    barter.updated_at = Date.now();
    await barter.save();

    // 4. Agar ACCEPT ho gaya, toh dono items ko 'swapped' mark kar do
    if (status === 'ACCEPTED') {
      await Item.findByIdAndUpdate(barter.item, { status: 'swapped' });
      await Item.findByIdAndUpdate(barter.offered_item, { status: 'swapped' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Swap ${status.toLowerCase()} successfully`, 
      data: barter 
    });

  } catch (error) {
    console.error(error);
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