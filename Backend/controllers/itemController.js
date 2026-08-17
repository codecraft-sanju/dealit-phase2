// itemController.js
const Item = require('../models/Item');
const User = require('../models/User'); 
const CreditSetting = require('../models/CreditSetting'); 
const mongoose = require('mongoose');

const { queueNotification } = require('../services/queue');
const sendEmail = require('../utils/sendEmail');
const AuraLog = require('../models/AuraLog'); 

const applyDiscountSimulation = (item, isEnabled) => {
  const itemObj = item.toObject ? item.toObject() : { ...item };
  if (!isEnabled || !itemObj.estimated_value || itemObj.estimated_value <= 0) return itemObj;

  const charCode = String(itemObj._id).slice(-1).charCodeAt(0);
  let discount = 0;
  
  if (charCode % 5 === 0) discount = 18;
  else if (charCode % 5 === 1) discount = 10;
  else if (charCode % 5 === 2) discount = 15;

  if (discount > 0) {
    itemObj.discount_percentage = discount;
    itemObj.original_value = Math.round(itemObj.estimated_value / (1 - discount / 100));
  }
  return itemObj;
};

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
    const { category, sort } = req.query;
    // CHANGES MADE HERE: Setup for pagination. Default limit is 20 for infinite scroll.
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

    let sortCondition = { created_at: -1 }; 
    if (sort === 'value_asc') sortCondition = { estimated_value: 1 };
    if (sort === 'value_desc') sortCondition = { estimated_value: -1 };

    const total = await Item.countDocuments(queryCondition);

    // Fetch strictly paginated items
    const items = await Item.find(queryCondition)
      .populate('owner', 'full_name city email')
      .sort(sortCondition)
      .skip(skip)
      .limit(limit);
    
    const setting = await CreditSetting.findOne();
    const modifiedItems = items.map(item => applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false));

    if (sort === 'discount_desc') {
      modifiedItems.sort((a, b) => (Number(b.discount_percentage) || 0) - (Number(a.discount_percentage) || 0));
    }

    res.status(200).json({ 
      success: true, 
      count: modifiedItems.length, 
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: modifiedItems 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ created_at: -1 });
    const setting = await CreditSetting.findOne();
    const modifiedItems = items.map(item => applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false));
    res.status(200).json({ success: true, count: modifiedItems.length, data: modifiedItems });
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
    
    const setting = await CreditSetting.findOne();
    const modifiedItem = applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false);

    res.status(200).json({ success: true, data: modifiedItem });
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

    if (updateData.status === 'active' && item.status !== 'active') { 
      try {
        const owner = await User.findById(item.owner);
        
        if (owner) {
          owner.aura_points = (owner.aura_points || 0) + 10;

          await AuraLog.create({
            user: owner._id,
            reason: "Item Approved by Admin",
            points: 10,
            type: "positive"
          });

          queueNotification({
            user: owner._id,
            type: 'AURA_UPDATE',
            title: 'Item Approved! 🎉',
            message: `Your item "${item.title}" has been approved. You have been rewarded with 10 Aura points for your contribution!`,
            metadata: { reason: 'item_approved', referenceId: item._id, imageUrl: item.images?.[0] }
          });

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
              const rewardedCount = owner.rewardedListingsCount || 0;

              if (rewardedCount < setting.maxListingsRewarded) {
                creditsToGive = setting.creditsPerListing;
                detailedMessage = `You received the standard reward of ${creditsToGive} credits for successfully listing your item "${item.title}".`;
                owner.rewardedListingsCount = rewardedCount + 1;
              } else {
                creditsToGive = 0;
                detailedMessage = `Your item "${item.title}" was approved, but you did not receive credits because you have already reached the maximum reward limit of ${setting.maxListingsRewarded} rewarded listings.`;
              }
            }

            if (creditsToGive > 0) {
              owner.account_credits = (owner.account_credits || 0) + creditsToGive;
              queueNotification({
                user: owner._id,
                type: 'CREDIT_ADDED',
                title: 'Credits Received! 💰',
                message: detailedMessage,
                metadata: { referenceId: item._id, amount: creditsToGive, imageUrl: item.images?.[0] }
              });
            } else {
              queueNotification({
                user: owner._id,
                type: 'SYSTEM_ALERT',
                title: 'Credit Limit Reached ℹ️',
                message: detailedMessage,
                metadata: { referenceId: item._id, amount: 0, imageUrl: item.images?.[0] }
              });
            }
          } else {
            queueNotification({
              user: owner._id,
              type: 'SYSTEM_ALERT',
              title: 'Credit System Paused ⏸️',
              message: `Your item "${item.title}" was approved, but the credit reward system is currently paused by the administration.`,
              metadata: { referenceId: item._id, amount: 0, imageUrl: item.images?.[0] }
            });
          }

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

    const setting = await CreditSetting.findOne();
    const modifiedItem = applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false);

    res.status(200).json({ success: true, data: modifiedItem });
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
    const { q, category, minCredits, maxCredits, sort, page = 1, limit = 20 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    // Base condition
    let queryCondition = {
      status: 'active',
      estimated_value: { $gt: 0 }
    };

    
    if (q && q.trim() !== '') {
      queryCondition.$text = { $search: q };
    }

    // 2. Apply Filters
    if (category && category !== 'All') {
      queryCondition.category = category;
    }
    
    if (minCredits || maxCredits) {
      queryCondition.estimated_value = { ...queryCondition.estimated_value };
      if (minCredits) queryCondition.estimated_value.$gte = Number(minCredits);
      if (maxCredits) queryCondition.estimated_value.$lte = Number(maxCredits);
    }

    // 3. Apply Sorting
    let sortCondition = { created_at: -1 }; // Default Newestif (sort === 'value_asc') sortCondition = { estimated_value: 1 };
    if (sort === 'value_desc') sortCondition = { estimated_value: -1 };
    // If searching text and no sort is specified, sort by relevance score
    if (q && !sort) sortCondition = { score: { $meta: "textScore" } };

  
    const [total, items] = await Promise.all([
      Item.countDocuments(queryCondition),
      Item.find(queryCondition, q && !sort ? { score: { $meta: "textScore" } } : {})
        .populate('owner', 'full_name city email profilePic')
        .sort(sortCondition)
        .skip(skip)
        .limit(limitNumber)
    ]);

    
    const setting = await CreditSetting.findOne();
    const modifiedItems = items.map(item => applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false));

    res.status(200).json({
      success: true,
      count: modifiedItems.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      data: modifiedItems
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

    const setting = await CreditSetting.findOne();
    const modifiedItems = relatedItems.map(item => applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false));

    res.status(200).json({ success: true, count: modifiedItems.length, data: modifiedItems });
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

const getItemsByIds = async (req, res) => {
  try {
    const { itemIds } = req.body; 

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const validIds = itemIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const items = await Item.find({
      _id: { $in: validIds },
      status: 'active'
    }).populate('owner', 'full_name city email');

    const setting = await CreditSetting.findOne();
    let modifiedItems = items.map(item => applyDiscountSimulation(item, setting?.isDiscountSimulationEnabled || false));
    const orderedItems = [];
    validIds.forEach(id => {
      const found = modifiedItems.find(item => item._id.toString() === id);
      if (found) {
        orderedItems.push(found);
      }
    });

    res.status(200).json({
      success: true,
      count: orderedItems.length,
      data: orderedItems
    });
  } catch (error) {
    console.error('Error fetching batch items:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching recently viewed items' });
  }
};

const getSitemap = async (req, res) => {
  try {
    const items = await Item.find({ status: 'active' }).select('_id updated_at');
    const frontendUrl = 'https://dealiit.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    const staticPages = ['', '/items', '/search', '/help-support', '/privacy', '/terms'];
    staticPages.forEach(page => {
      xml += `\n  <url>\n    <loc>${frontendUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>`;
    });

    items.forEach(item => {
      const lastModDate = item.updated_at ? new Date(item.updated_at).toISOString() : new Date().toISOString();
      xml += `\n  <url>\n    <loc>${frontendUrl}/item/${item._id}</loc>\n    <lastmod>${lastModDate}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`;
    });

    xml += `\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
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
  getExploreData,
  getItemsByIds,
  getSitemap
};