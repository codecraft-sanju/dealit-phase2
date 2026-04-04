const Item = require('../models/Item');

const createItem = async (req, res) => {
  try {
    const { title, description, category, condition, images, preferred_item, estimated_value } = req.body;

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
      created_at: Date.now(),
      updated_at: Date.now()
    });

    const savedItem = await newItem.save();
    res.status(201).json({ success: true, data: savedItem });
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
      .sort({ created_at: -1 }); // Latest pehle

  
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

module.exports = {
  createItem,
  getItems,
  getMyItems, 
  getItemById,
  updateItem,
  deleteItem,
  searchItems 
};