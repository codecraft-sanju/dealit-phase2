const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const AuraLog = require('../models/AuraLog'); 

const createItem = async (req, res) => {
  try {
    const { title, description, category, condition, images, preferred_item, estimated_value, weight, dimensions } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let setting = await CreditSetting.findOne();
    if (!setting) {
      setting = { maxAllowedListings: 5 }; 
    }
    
    const maxLimit = setting.maxAllowedListings !== undefined ? setting.maxAllowedListings : 5;

    const actualItemCount = await Item.countDocuments({ owner: req.user._id });

    if (actualItemCount >= maxLimit) {
      return res.status(400).json({ 
        success: false, 
        message: `You can list a maximum of ${maxLimit} products.` 
      });
    }

    const newItem = new Item({
      supabaseId: `mongo-${Date.now()}`,
      owner: req.user._id,
      title,
      description,
      category,
      condition,
      images: images || [],
      preferred_item,
      status: 'pending', 
      estimated_value: estimated_value || 0,
      weight: weight || 0.5,
      dimensions: dimensions || { length: 10, width: 10, height: 10 },
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const savedItem = await newItem.save();

    user.listedProductsCount = actualItemCount + 1;
    await user.save();

    await Notification.create({
      user: req.user._id,
      type: 'SYSTEM',
      title: 'Item Submitted! 📦',
      message: `Your item "${title}" has been submitted for review. You will receive credits upon approval.`,
      metadata: { reason: 'item_pending_review', referenceId: savedItem._id }
    });

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER; 
      const emailMessage = `A new item "${title}" has been submitted for review.\n\nCategory: ${category}\nCondition: ${condition}\nEstimated Value: ${estimated_value || 0}\n\nPlease login to the admin panel to accept or reject this item.`;
      
      await sendEmail({
        email: adminEmail,
        subject: `Action Required: New Item "${title}" Pending Review`,
        message: emailMessage
      });
    } catch (emailError) {
      console.error('Error sending email to admin:', emailError);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Product listed successfully! You will receive credits once the admin approves it.', 
      data: savedItem 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getItems = async (req, res) => {
  try {
    const { category, limit } = req.query;

    let queryCondition = { 
      status: 'active',
      estimated_value: { $gt: 0 } 
    };

    if (category && category !== 'All') {
      queryCondition.category = category;
    }

    let itemsQuery = Item.find(queryCondition)
      .populate('owner', 'full_name city email')
      .sort({ created_at: -1 });

    if (limit) {
      itemsQuery = itemsQuery.limit(parseInt(limit, 10));
    }

    const items = await itemsQuery;
    
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ created_at: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'full_name city email');
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateItem = async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to update this item' });
    }

    req.body.updated_at = Date.now();

    // ⚡ NAYA CHANGE: Admin Approval & Aura Point Logic Start
    if (req.body.status === 'active' && item.status !== 'active') {
      try {
        const owner = await User.findById(item.owner);
        
        if (owner) {
          owner.aura_points = (owner.aura_points || 0) + 10;
          await owner.save();

          await AuraLog.create({
            user: owner._id,
            reason: "Item Approved by Admin",
            points: 10,
            type: "positive"
          });

          await Notification.create({
            user: owner._id,
            type: 'AURA_UPDATE',
            title: 'Item Approved! 🎉',
            message: `Your item "${item.title}" has been approved by admin. You received 10 Aura points!`,
            metadata: { reason: 'item_approved', referenceId: item._id }
          });
        }
      } catch (auraError) {
        console.error("Error giving Aura points: ", auraError);
      }
    }
    // ⚡ NAYA CHANGE END

    item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this item' });
    }

    await item.deleteOne();

    const user = await User.findById(req.user._id);
    if (user) {
      const actualItemCount = await Item.countDocuments({ owner: req.user._id });
      user.listedProductsCount = actualItemCount;
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const searchItems = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a search query' 
      });
    }

    const searchRegex = new RegExp(q, 'i');

    const items = await Item.find({
      status: 'active',
      estimated_value: { $gt: 0 },
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ]
    })
    .populate('owner', 'full_name city email profilePic')
    .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error while searching items' 
    });
  }
};

const getRelatedItems = async (req, res) => {
  try {
    const itemId = req.params.id;

    const currentItem = await Item.findById(itemId);
    if (!currentItem) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const sameCategoryItems = await Item.find({
      _id: { $ne: itemId },
      category: currentItem.category,
      status: 'active',
      estimated_value: { $gt: 0 }
    }).limit(6);

    const excludedIds = [
      new mongoose.Types.ObjectId(itemId),
      ...sameCategoryItems.map(item => item._id)
    ];

    const randomItems = await Item.aggregate([
      { $match: { _id: { $nin: excludedIds }, status: 'active', estimated_value: { $gt: 0 } } },
      { $sample: { size: 6 } }
    ]);

    const relatedItems = [...sameCategoryItems, ...randomItems];

    res.status(200).json({ success: true, count: relatedItems.length, data: relatedItems });
  } catch (error) {
    console.error('Error fetching related items:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching related items' });
  }
};

module.exports = {
  createItem,
  getItems,
  getMyItems, 
  getItemById,
  updateItem,
  deleteItem,
  searchItems,
  getRelatedItems
};