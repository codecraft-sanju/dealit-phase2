const Item = require('../models/Item');
const User = require('../models/User'); 

const getPendingItems = async (req, res) => {
  try {
    const items = await Item.find({ status: 'pending' }).populate('owner', 'full_name email phone').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateItemStatus = async (req, res) => {
  try {
    // NAYA: rejection_reason bhi req.body se receive karenge
    const { status, rejection_reason } = req.body; 

    if (!['active', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    // Update object setup
    const updateData = { 
      status: status, 
      updated_at: Date.now() 
    };

    // Agar item reject ho raha hai toh reason dalo, warna reason ko clear kar do
    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason || 'No reason provided by admin.';
    } else {
      updateData.rejection_reason = ''; 
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'full_name email');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllItems = async (req, res) => {
  try {
    const items = await Item.find({}).populate('owner', 'full_name email phone').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ created_at: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getPendingItems,
  updateItemStatus,
  getAllItems, 
  getAllUsers, 
  deleteUser   
};