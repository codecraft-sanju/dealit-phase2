// sendEmail.js
const nodemailer = require('nodemailer');
const CreditSetting = require('../models/CreditSetting'); 

const sendEmail = async (options) => {
  try {
    if (options.isNotification) {
      const setting = await CreditSetting.findOne();
      if (setting && setting.isEmailNotificationEnabled === false) {
        return; 
      }
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: options.subject,
      text: options.message
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;