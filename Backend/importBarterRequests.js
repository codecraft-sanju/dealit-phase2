require('dotenv').config();
const mongoose = require('mongoose');
const csvtojson = require('csvtojson');
const User = require('./models/User');
const Item = require('./models/Item');
const BarterRequest = require('./models/BarterRequest');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const importBarterRequests = async () => {
  try {
    const requestsData = await csvtojson().fromFile('barter_requests.csv');

    for (let row of requestsData) {
      if (!row.id || row.id.trim() === '') continue;

      let requesterId = null;
      if (row.requester_id) {
        const reqUser = await User.findOne({ supabaseId: row.requester_id });
        if (reqUser) requesterId = reqUser._id;
      }

      let ownerId = null;
      if (row.owner_id) {
        const ownUser = await User.findOne({ supabaseId: row.owner_id });
        if (ownUser) ownerId = ownUser._id;
      }

      let targetItemId = null;
      if (row.item_id) {
        const tItem = await Item.findOne({ supabaseId: row.item_id });
        if (tItem) targetItemId = tItem._id;
      }

      let offeredItemId = null;
      if (row.offered_item_id) {
        const oItem = await Item.findOne({ supabaseId: row.offered_item_id });
        if (oItem) offeredItemId = oItem._id;
      }

      const reqAccepted = row.requester_accepted === 'true';
      const ownAccepted = row.owner_accepted === 'true';

      await BarterRequest.findOneAndUpdate(
        { supabaseId: row.id },
        {
          requester: requesterId,
          owner: ownerId,
          item: targetItemId,
          offered_item: offeredItemId,
          status: row.status,
          message: row.message,
          requester_accepted: reqAccepted,
          owner_accepted: ownAccepted,
          delivery_method: row.delivery_method,
          created_at: row.created_at,
          updated_at: row.updated_at
        },
        { upsert: true, new: true }
      );
    }
    
    console.log('Barter Requests import complete!');
    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

importBarterRequests();