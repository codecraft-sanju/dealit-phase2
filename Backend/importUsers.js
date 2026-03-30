require('dotenv').config();
const mongoose = require('mongoose');
const csvtojson = require('csvtojson');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const importUsers = async () => {
  try {
    const usersData = await csvtojson().fromFile('users.csv');

    for (let row of usersData) {
      if (!row.id || row.id.trim() === '') {
        continue;
      }

      const userName = row.full_name && row.full_name.trim() !== '' ? row.full_name : 'Unknown User';

      await User.findOneAndUpdate(
        { supabaseId: row.id },
        {
          full_name: userName,
          email: row.email,
          phone: row.phone,
          city: row.city,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        { upsert: true, new: true, runValidators: true }
      );
    }
    
    console.log('Data import complete!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

importUsers();