// itemController.js
const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 
const mongoose = require('mongoose');


const { queueNotification } = require('../services/queue');

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

    // CHANGED: Added imageUrl to metadata
    queueNotification({
      user: req.user._id,
      type: 'SYSTEM',
      title: 'Item Submitted! 📦',
      message: `Your item "${title}" has been successfully submitted for review. You will receive your credit reward once the admin approves it.`,
      metadata: { reason: 'item_pending_review', referenceId: savedItem._id, imageUrl: savedItem.images?.[0] }
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
    const { category } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let queryCondition = { 
      status: 'active',
      estimated_value: { $gt: 0 } 
    };

    if (category && category !== 'All') {
      queryCondition.category = category;
    }

    const total = await Item.countDocuments(queryCondition);

    const items = await Item.find(queryCondition)
      .populate('owner', 'full_name city email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({ 
      success: true, 
      count: items.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: items 
    });
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

    const isOwner = item.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this item' });
    }

    let updateData = {};
    const { awarded_credits } = req.body; 

    if (isAdmin) {
      updateData = { ...req.body };
    } else {
      const allowedFields = ['title', 'description', 'category', 'condition', 'images', 'preferred_item', 'weight', 'dimensions'];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      if (item.status === 'rejected') {
        updateData.status = 'pending';
      }
    }

    updateData.updated_at = Date.now();
    
    // IF ITEM STATUS CHANGES TO ACTIVE
    if (updateData.status === 'active' && item.status !== 'active') { 
      try {
        const owner = await User.findById(item.owner);
        
        if (owner) {
          // 1. AURA POINTS LOGIC
          owner.aura_points = (owner.aura_points || 0) + 10;

          await AuraLog.create({
            user: owner._id,
            reason: "Item Approved by Admin",
            points: 10,
            type: "positive"
          });

          // CHANGED: Added imageUrl to metadata
          queueNotification({
            user: owner._id,
            type: 'AURA_UPDATE',
            title: 'Item Approved! 🎉',
            message: `Your item "${item.title}" has been approved. You have been rewarded with 10 Aura points for your contribution!`,
            metadata: { reason: 'item_approved', referenceId: item._id, imageUrl: item.images?.[0] }
          });

          // 2. CREDIT SYSTEM LOGIC WITH LIFETIME TRACKER
          let setting = await CreditSetting.findOne();
          if (!setting) {
            setting = { isCreditSystemEnabled: true, creditsPerListing: 50, maxListingsRewarded: 3 };
          }

          if (setting.isCreditSystemEnabled) {
            let creditsToGive = 0;
            let detailedMessage = '';

            if (awarded_credits !== undefined && awarded_credits !== null && awarded_credits !== '') {
              creditsToGive = Number(awarded_credits);
              detailedMessage = `Admin has manually awarded you ${creditsToGive} credits for your approved item "${item.title}".`;
            } else {
              // LOOPHOLE FIXED HERE
              const rewardedCount = owner.rewardedListingsCount || 0;

              if (rewardedCount < setting.maxListingsRewarded) {
                creditsToGive = setting.creditsPerListing;
                detailedMessage = `You received the standard reward of ${creditsToGive} credits for successfully listing your item "${item.title}".`;
                
                // Increase lifetime count
                owner.rewardedListingsCount = rewardedCount + 1;
              } else {
                creditsToGive = 0;
                detailedMessage = `Your item "${item.title}" was approved, but you did not receive credits because you have already reached the maximum reward limit of ${setting.maxListingsRewarded} rewarded listings.`;
              }
            }

            if (creditsToGive > 0) {
              owner.account_credits = (owner.account_credits || 0) + creditsToGive;
              
              // CHANGED: Added imageUrl to metadata
              queueNotification({
                user: owner._id,
                type: 'CREDIT_ADDED',
                title: 'Credits Received! 💰',
                message: detailedMessage,
                metadata: { referenceId: item._id, amount: creditsToGive, imageUrl: item.images?.[0] }
              });
            } else {
              // CHANGED: Added imageUrl to metadata
              queueNotification({
                user: owner._id,
                type: 'SYSTEM_ALERT',
                title: 'Credit Limit Reached ℹ️',
                message: detailedMessage,
                metadata: { referenceId: item._id, amount: 0, imageUrl: item.images?.[0] }
              });
            }
          } else {
            // CHANGED: Added imageUrl to metadata
            queueNotification({
              user: owner._id,
              type: 'SYSTEM_ALERT',
              title: 'Credit System Paused ⏸️',
              message: `Your item "${item.title}" was approved, but the credit reward system is currently paused by the administration.`,
              metadata: { referenceId: item._id, amount: 0, imageUrl: item.images?.[0] }
            });
          }

          // Save both Aura, Credits, and RewardedCount
          await owner.save();
        }
      } catch (rewardError) {
        console.error("Error giving rewards (Aura/Credits): ", rewardError);
      }
    }
    
    item = await Item.findByIdAndUpdate(req.params.id, updateData, { 
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

const getExploreData = async (req, res) => {
  try {
    const topCategories = await Item.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    const categories = topCategories.map(cat => cat._id).filter(Boolean);

    const recentItems = await Item.aggregate([
      { $match: { status: 'active' } },
      { $sample: { size: 10 } }
    ]);

    const trendingSearches = [...new Set(recentItems.map(item => {
      return item.title.split(' ').slice(0, 2).join(' ');
    }))].slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        categories,
        trendingSearches
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
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
  getRelatedItems,
  getExploreData
};