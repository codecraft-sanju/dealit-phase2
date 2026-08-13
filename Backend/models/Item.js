const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  supabaseUserId: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  condition: { type: String },
  images: [{ type: String }],
  preferred_item: { type: String },
  
  status: { 
    type: String, 
    enum: ['pending', 'active', 'rejected','reserved', 'swapped'], 
    default: 'pending' 
  },
  
  rejection_reason: { type: String },
  estimated_value: { type: Number, default: 0 },
  
  weight: { 
    type: Number, 
    required: true,
    default: 0.5 // Default 500g in Kg
  },
  dimensions: {
    length: { type: Number, default: 10 }, // cm me
    width: { type: Number, default: 10 },  // cm me
    height: { type: Number, default: 10 }  // cm me
  },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});


itemSchema.index({ title: 'text', category: 'text', condition: 'text' });
itemSchema.index({ status: 1, created_at: -1 });
itemSchema.index({ owner: 1, status: 1, created_at: -1 });
itemSchema.index({ status: 1, estimated_value: 1, category: 1 });


const syncCategoryCount = async function (categoryName) {
  if (!categoryName) return;
  try {
    const Category = mongoose.model('Category');
   
    const Item = mongoose.model('Item'); 
  
    const count = await Item.countDocuments({
      category: categoryName,
      status: 'active',
      estimated_value: { $gt: 0 }
    });
    
    await Category.findOneAndUpdate(
      { name: categoryName },
      { activeItemsCount: count }
    );
  } catch (error) {
    console.error(`Failed to sync count for category: ${categoryName}`, error);
  }
};


itemSchema.post('save', async function (doc) {
  await syncCategoryCount.bind(this)(doc.category);
});


itemSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  if (doc) {
    await syncCategoryCount.bind(this)(doc.category);
  }
});


itemSchema.pre('findOneAndUpdate', async function () {
  this._oldDoc = await this.model.findOne(this.getQuery());
});

itemSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await syncCategoryCount.bind(this)(doc.category);
    
    if (this._oldDoc && this._oldDoc.category !== doc.category) {
      await syncCategoryCount.bind(this)(this._oldDoc.category);
    }
  }
});


module.exports = mongoose.model('Item', itemSchema);