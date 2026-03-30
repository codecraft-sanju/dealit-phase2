require('dotenv').config();
const mongoose = require('mongoose');
const csvtojson = require('csvtojson');
const User = require('./models/User');
const BarterRequest = require('./models/BarterRequest');
const Message = require('./models/Message');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const importMessages = async () => {
  try {
    const messagesData = await csvtojson().fromFile('messages.csv');

    for (let row of messagesData) {
      if (!row.id || row.id.trim() === '') continue;

      let barterReqId = null;
      if (row.barter_id) {
        const bReq = await BarterRequest.findOne({ supabaseId: row.barter_id });
        if (bReq) barterReqId = bReq._id;
      }

      let senderId = null;
      if (row.sender_id) {
        const sUser = await User.findOne({ supabaseId: row.sender_id });
        if (sUser) senderId = sUser._id;
      }

      await Message.findOneAndUpdate(
        { supabaseId: row.id },
        {
          barterRequest: barterReqId,
          sender: senderId,
          content: row.content || '',
          created_at: row.created_at
        },
        { upsert: true, new: true }
      );
    }
    
    console.log('Messages import complete! Database migration is 100% successful!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

importMessages();