const Category = require('../models/Category');
const Item = require('../models/Item'); // NAYA: Item model import kiya taaki distinct categories nikal sakein

const getCategories = async (req, res) => {
  try {
    const { activeOnly } = req.query; // Frontend se aane wala query parameter check kar rahe hain
    
    let queryCondition = { isActive: true };

    // Agar Home page ne activeOnly=true bheja hai
    if (activeOnly === 'true') {
      // Sirf unhi items ki categories nikalo jo active hain aur jinki value 0 se zyada hai
      const activeCategoryNames = await Item.distinct('category', {
        status: 'active',
        estimated_value: { $gt: 0 }
      });
      
      // Query me condition add kar do ki category ka naam in active names me hona chahiye
      queryCondition.name = { $in: activeCategoryNames };
    }

    const categories = await Category.find(queryCondition).sort({ name: 1 }); // name ke hisaab se A-Z sort
    
    res.status(200).json({ 
      success: true, 
      count: categories.length,
      data: categories 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server Error while fetching categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, icon, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // Text ko format karna (e.g. "  hAmPeR " -> "Hamper")
    const trimmedName = name.trim();
    const formattedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();

    // Case-insensitive check (regex use karke)
    const categoryExists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${formattedName}$`, 'i') } 
    });

    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const category = await Category.create({ 
      name: formattedName,
      icon: icon || 'Package',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ 
      success: true, 
      data: category 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server Error while creating category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) { 
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server Error while updating category' }); 
  }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) { 
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server Error while deleting category' }); 
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};