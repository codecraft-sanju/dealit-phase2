require('dotenv').config();
const mongoose = require('mongoose');
const csvtojson = require('csvtojson');
const User = require('./models/User');
const Item = require('./models/Item');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const importItems = async () => {
  try {
    const itemsData = await csvtojson().fromFile('items.csv');

    for (let row of itemsData) {
      if (!row.id || row.id.trim() === '') continue;

      let ownerId = null;
      if (row.user_id) {
        const user = await User.findOne({ supabaseId: row.user_id });
        if (user) {
          ownerId = user._id;
        }
      }

      let imagesArray = [];
      if (row.images) {
        try {
          let cleanImageString = row.images.replace(/""/g, '"');
          imagesArray = JSON.parse(cleanImageString);
        } catch (e) {}
      }

      const itemTitle = row.title ? row.title.trim() : 'Untitled Item';

      await Item.findOneAndUpdate(
        { supabaseId: row.id },
        {
          owner: ownerId,
          supabaseUserId: row.user_id,
          title: itemTitle,
          description: row.description,
          category: row.category ? row.category.trim() : '',
          condition: row.condition,
          images: imagesArray,
          preferred_item: row.preferred_item,
          status: row.status,
          estimated_value: Number(row.estimated_value) || 0,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        { upsert: true, new: true }
      );
    }
    
    console.log('Items import complete!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

importItems();