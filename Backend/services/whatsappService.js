const CreditSetting = require('../models/CreditSetting');

const sendWhatsAppMessage = async (toPhoneNumber, templateName) => {
  try {
    const setting = await CreditSetting.findOne();
    
    if (setting && setting.isWhatsAppNotificationEnabled === false) {
      return; 
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    let cleanPhone = toPhoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    const payload = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en_US" } 
        }
    };

    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("WhatsApp API Error:", data);
    }
  } catch (error) {
    console.error("Error in WhatsApp Service:", error);
  }
};

module.exports = { sendWhatsAppMessage };