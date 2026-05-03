const axios = require('axios');
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

const IS_TEST_MODE = process.env.SHIPROCKET_TEST_MODE === 'true'; 

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

const verifyShiprocketConnection = async () => {
  try {
    await getShiprocketToken();
    console.log('Shiprocket Connected Successfully');
    return true;
  } catch (error) {
    console.error('Shiprocket Connection Failed:', error.message);
    return false;
  }
};

const checkServiceability = async (pickupPincode, deliveryPincode, weight, dimensions) => {
  if (IS_TEST_MODE) return 60;

  try {
    const token = await getShiprocketToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

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

    const response = await axios.get(`${SHIPROCKET_BASE_URL}/courier/serviceability/`, { params: payload, ...config });
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
  if (IS_TEST_MODE) return "Primary";

  try {
    const token = await getShiprocketToken();
    const config = { 
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } 
    };

    const locationName = `SEL_${seller._id.toString().substring(0, 8)}_${Date.now().toString().slice(-4)}`;

    let cleanPhone = seller.phone ? seller.phone.replace(/\D/g, '') : '';
    if (cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

    const houseNo = seller.pickupAddress?.houseNo || '';
    const areaStreet = seller.pickupAddress?.areaStreet || '';
    const finalAddress = `${houseNo} ${areaStreet}`.trim();

    const payload = {
      pickup_location: locationName,
      name: seller.full_name,
      email: seller.email,
      phone: cleanPhone,
      address: finalAddress || "Not Provided",
      address_2: seller.pickupAddress?.landmark || "",
      city: seller.pickupAddress?.city || "",
      state: seller.pickupAddress?.state || "",
      country: "India",
      pin_code: seller.pickupAddress?.pincode || ""
    };

    const response = await axios.post(`${SHIPROCKET_BASE_URL}/settings/company/addpickup`, payload, config);
    
    if (response.data && response.data.pickup_id) {
      return locationName; 
    }
    return "Primary"; 
  } catch (error) {
    console.error('Shiprocket Add Pickup Location Error:', error.response?.data || error.message);
    
    // CHANGED: Yahan hum ab silently "Primary" return karne ki jagah error throw kar rahe hain
    if (error.response && error.response.data) {
      if (error.response.data.errors) {
        const errorDetails = Object.values(error.response.data.errors).flat().join(' | ');
        throw new Error(`Validation Error: ${errorDetails}`);
      }
      if (error.response.data.message) {
        const apiMsg = error.response.data.message;
        throw new Error(typeof apiMsg === 'string' ? apiMsg : JSON.stringify(apiMsg));
      }
    }
    throw new Error('Failed to add pickup location. Please check your pickup address details.');
  }
};

const createShiprocketOrder = async (orderData) => {
  if (IS_TEST_MODE) {
    return { order_id: "TEST_ORD_" + Date.now(), shipment_id: "TEST_SHIP_" + Date.now(), status: "NEW" };
  }

  try {
    const token = await getShiprocketToken();
    const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, orderData, config);
    return response.data;
  } catch (error) {
    console.error('Shiprocket Create Order Error:', error.response?.data || error.message);
    
    // CHANGED: Specific error frontend ke liye bhejna
    if (error.response && error.response.data && error.response.data.message) {
      const apiMsg = error.response.data.message;
      throw new Error(typeof apiMsg === 'string' ? apiMsg : JSON.stringify(apiMsg));
    }
    throw new Error('Failed to create order on Shiprocket.');
  }
};

const generateAWB = async (shipment_id) => {
  if (IS_TEST_MODE) return { awb_code: "TEST_AWB_987654321", courier_name: "Test Express" };

  try {
    const token = await getShiprocketToken();
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
      { shipment_id: parseInt(shipment_id) }, 
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.awb_assign_status === 0 || !response.data.response?.data) {
      console.error("Shiprocket AWB Assignment Failed internally:", response.data);
      throw new Error(response.data.message || 'Shiprocket could not assign AWB. Low wallet balance or invalid route.');
    }

    return response.data.response.data; 
  } catch (error) {
    console.error('Shiprocket Generate AWB Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to generate AWB tracking number.');
  }
};

const generateLabel = async (shipment_id) => {
  if (IS_TEST_MODE) return "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"; 

  try {
    const token = await getShiprocketToken();
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/generate/label`,
      { shipment_id: [parseInt(shipment_id)] }, 
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );

    if (response.data.label_created === 0 || !response.data.label_url) {
      console.error("Shiprocket Label generation failed internally:", response.data);
      throw new Error(response.data.response || 'Shiprocket is still processing the label. Please try again in 1-2 minutes.');
    }

    return response.data.label_url; 
  } catch (error) {
    console.error('Shiprocket Generate Label Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to generate Shipping Label.');
  }
};

module.exports = {
  getShiprocketToken,
  checkServiceability,
  createShiprocketOrder,
  addPickupLocation,
  verifyShiprocketConnection,
  generateAWB,
  generateLabel
};