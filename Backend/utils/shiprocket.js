// utils/shiprocket.js
const axios = require('axios');
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

const getShiprocketToken = async () => {
  try {

    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    });
    
    return response.data.token;
  } catch (error) {
    console.error('Shiprocket Login Error:', error.response?.data || error.message);
    throw new Error('Failed to connect to shipping partner.');
  }
};

const checkServiceability = async (pickupPincode, deliveryPincode, weight, dimensions) => {
  try {
    const token = await getShiprocketToken();
    
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    const length = dimensions?.length || 10;
    const width = dimensions?.width || 10;
    const height = dimensions?.height || 10;
    
    const volumetricWeight = (length * width * height) / 5000;
    const finalWeight = Math.max(weight, volumetricWeight);

    const payload = {
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: finalWeight,
      cod: 0 
    };

    const response = await axios.get(
      `${SHIPROCKET_BASE_URL}/courier/serviceability/`,
      { params: payload, ...config }
    );

    const data = response.data;
    
    if (data.status === 404 || !data.data || !data.data.available_courier_companies) {
      throw new Error('Shipping not available for this route.');
    }

    const couriers = data.data.available_courier_companies;
    const sortedCouriers = couriers.sort((a, b) => a.rate - b.rate);
    
    const cheapestRate = sortedCouriers[0].rate;
    
    const finalCost = Math.ceil(cheapestRate * 1.18); 

    return finalCost;

  } catch (error) {
    console.error('Shiprocket Serviceability Error:', error.response?.data || error.message);
    throw new Error('Failed to calculate shipping cost. Check pincodes.');
  }
};

const addPickupLocation = async (seller) => {
  try {
    const token = await getShiprocketToken();
    const config = { 
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      } 
    };

    const locationName = `SEL_${seller._id.toString().substring(0, 8)}_${Date.now().toString().slice(-4)}`;

    const payload = {
      pickup_location: locationName,
      name: seller.full_name,
      email: seller.email,
      phone: seller.phone,
      address: seller.pickupAddress.addressLine,
      city: seller.pickupAddress.city,
      state: seller.pickupAddress.state,
      country: "India",
      pin_code: seller.pickupAddress.pincode
    };

    const response = await axios.post(`${SHIPROCKET_BASE_URL}/settings/company/addpickup`, payload, config);
    
    if (response.data && response.data.pickup_id) {
      return locationName; 
    }
    return "Primary"; 
  } catch (error) {
    console.error('Shiprocket Add Pickup Location Error:', error.response?.data || error.message);
    return "Primary"; 
  }
};
// <-- NAYA CHANGE END -->

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
  createShiprocketOrder,
  addPickupLocation 
};