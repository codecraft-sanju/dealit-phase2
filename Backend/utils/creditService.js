const User = require('../models/User');
const Notification = require('../models/Notification');

// Function to Add Credits & Send Notification
const addCredits = async (userId, amount, title, message, reason, referenceId = null) => {
  try {
    // 1. User ke credits update karo
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { account_credits: amount } },
      { new: true }
    );

    // 2. Notification create karo
    await Notification.create({
      user: userId,
      type: 'CREDIT_ADDED',
      title: title,
      message: message,
      metadata: {
        amount: amount,
        reason: reason,
        referenceId: referenceId
      }
    });

    return user;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

// Function to Deduct Credits & Send Notification
const deductCredits = async (userId, amount, title, message, reason, referenceId = null) => {
  try {
    const user = await User.findById(userId);
    if (user.account_credits < amount) {
      throw new Error('Insufficient credits');
    }

    // 1. User ke credits update karo
    user.account_credits -= amount;
    await user.save();

    // 2. Notification create karo
    await Notification.create({
      user: userId,
      type: 'CREDIT_DEDUCTED',
      title: title,
      message: message,
      metadata: {
        amount: amount,
        reason: reason,
        referenceId: referenceId
      }
    });

    return user;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
};

module.exports = {
  addCredits,
  deductCredits
};