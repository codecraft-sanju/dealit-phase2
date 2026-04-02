const Category = require('../models/Category');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }); // name ke hisaab se A-Z sort
    
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
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    // NAYA: Text ko format karna (e.g. "  hAmPeR " -> "Hamper")
    const trimmedName = name.trim();
    const formattedName = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1).toLowerCase();

    // NAYA: Case-insensitive check (regex use karke)
    const categoryExists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${formattedName}$`, 'i') } 
    });

    if (categoryExists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

  
    const category = await Category.create({ name: formattedName });

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
  } catch (error) { res.status(500).json({ success: false }); }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};