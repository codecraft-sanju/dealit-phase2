const Message = require('../models/Message');
const BarterRequest = require('../models/BarterRequest');

const sendMessage = async (req, res) => {
  try {
    const { barterRequestId, content } = req.body;

    const barterRequest = await BarterRequest.findById(barterRequestId);
    
    if (!barterRequest) {
      return res.status(404).json({ success: false, message: 'Barter request not found' });
    }

    if (barterRequest.requester.toString() !== req.user._id.toString() && 
        barterRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to send messages in this thread' });
    }

    const newMessage = new Message({
      supabaseId: `mongo-msg-${Date.now()}`,
      barterRequest: barterRequestId,
      sender: req.user._id,
      content,
      created_at: Date.now()
    });

    const savedMessage = await newMessage.save();
    await savedMessage.populate('sender', 'full_name email');

    res.status(201).json({ success: true, data: savedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMessages = async (req, res) => {
  try {
    const barterRequest = await BarterRequest.findById(req.params.barterId);
    
    if (!barterRequest) {
      return res.status(404).json({ success: false, message: 'Barter request not found' });
    }

    if (barterRequest.requester.toString() !== req.user._id.toString() && 
        barterRequest.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ barterRequest: req.params.barterId })
      .populate('sender', 'full_name email')
      .sort({ created_at: 1 });

    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  sendMessage,
  getMessages
};