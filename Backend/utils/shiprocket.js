// utils/shiprocket.js
const axios = require('axios');

// CHANGED: Updated Base URL from 'payload' to 'external'
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

/**
 * Shiprocket API se auth token generate karta hai.
 * Yeh token har aage aane wali request me chahiye hoga.
 */
const getShiprocketToken = async () => {
  try {
    // CHANGED: Updated endpoint from '/user/login/' to '/auth/login'
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    });
    
    // Return token
    return response.data.token;
  } catch (error) {
    console.error('Shiprocket Login Error:', error.response?.data || error.message);
    throw new Error('Failed to connect to shipping partner.');
  }
};

/**
 * Pincode aur weight ke hisab se estimated cost calculate karta hai.
 */
const checkServiceability = async (pickupPincode, deliveryPincode, weight, dimensions) => {
  try {
    const token = await getShiprocketToken();
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // Calculate volumetric weight
    const length = dimensions?.length || 10;
    const width = dimensions?.width || 10;
    const height = dimensions?.height || 10;
    
    const volumetricWeight = (length * width * height) / 5000;
    const finalWeight = Math.max(weight, volumetricWeight);

    const payload = {
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: finalWeight,
      cod: 0 // Hum prepaid le rahe hain Razorpay se
    };

    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/serviceability/`,
      { params: payload, ...config }
    );

    const data = response.data;
    
    // Agar route serviceable nahi hai
    if (data.status === 404 || !data.data || !data.data.available_courier_companies) {
      throw new Error('Shipping not available for this route.');
    }

    // Sabse sasta courier option dhoondo
    const couriers = data.data.available_courier_companies;
    const sortedCouriers = couriers.sort((a, b) => a.rate - b.rate);
    
    const cheapestRate = sortedCouriers[0].rate;
    
    // Total cost return karo (thoda buffer margin add karna better hota hai + GST)
    const finalCost = Math.ceil(cheapestRate * 1.18); 

    return finalCost;

  } catch (error) {
    console.error('Shiprocket Serviceability Error:', error.response?.data || error.message);
    throw new Error('Failed to calculate shipping cost. Check pincodes.');
  }
};


const createShiprocketOrder = async (orderData) => {
  try {
    const token = await getShiprocketToken();
    
    const config = {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      }
    };

    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      orderData,
      config
    );

    return response.data;
  } catch (error) {
    console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
    throw new Error('Failed to create order on Shiprocket.');
  }
};

module.exports = {
  getShiprocketToken,
  checkServiceability,
  createShiprocketOrder 
};