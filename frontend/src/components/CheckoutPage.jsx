import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, User, Home, Hash, 
  Truck, Coins, AlertCircle, CheckCircle, Wallet, ShoppingBag, Plus, Check, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;


const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", 
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", 
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", 
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];


const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


const calculateFrontendFees = (base) => {
  const platformFee = parseFloat((base * 0.02).toFixed(2));
  const gstAmount = parseFloat((base * 0.18).toFixed(2));
  const totalShippingCost = Math.round(base + platformFee + gstAmount);
  return {
    baseShipping: base,
    platformFee,
    gstAmount,
    totalShippingCost
  };
};


const CheckoutPage = ({ user, setUser }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState(60); 
  
  const [feeBreakdown, setFeeBreakdown] = useState(null);
  
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [autoCancelHours, setAutoCancelHours] = useState(24);

  const [currentStep, setCurrentStep] = useState(1);
  
  const savedAddresses = user?.savedAddresses || [];
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(savedAddresses.length > 0 ? 0 : -1);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    houseNo: '',
    areaStreet: '',
    landmark: '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });

  const [filteredStates, setFilteredStates] = useState(INDIAN_STATES);
  const [showStateDropdown, setShowStateDropdown] = useState(false);


  const [error, setError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else if (window.scrollY < 10) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        const itemRes = await axios.get(`${API_URL}/items/${itemId}`);
        if (itemRes.data.success) {
          setItem(itemRes.data.data);
        }

        const settingsRes = await axios.get(`${API_URL}/admin/public-settings`);
        if (settingsRes.data.success) {
        
          const baseRate = settingsRes.data.data.flatShippingCost !== undefined ? settingsRes.data.data.flatShippingCost : 60;
          const fees = calculateFrontendFees(baseRate);
          setShippingCost(fees.totalShippingCost);
          setFeeBreakdown(fees);
 
          
          if (settingsRes.data.data.autoCancelHours) {
            setAutoCancelHours(settingsRes.data.data.autoCancelHours);
          }
        }
      } catch (err) {
        setError('Failed to load checkout details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [itemId]);

 
  useEffect(() => {
    if (selectedAddressIndex >= 0 && savedAddresses[selectedAddressIndex]) {
      const addr = savedAddresses[selectedAddressIndex];
      setFormData({
        fullName: addr.fullName || '',
        phone: addr.phone || '',
        houseNo: addr.houseNo || '',
        areaStreet: addr.areaStreet || '',
        landmark: addr.landmark || '',
        city: addr.city || '',
        state: addr.state || '',
        pincode: addr.pincode || ''
      });
    } else if (selectedAddressIndex === -1) {

      setFormData({
        fullName: user?.full_name || '',
        phone: user?.phone || '',
        houseNo: '',
        areaStreet: '',
        landmark: '',
        city: user?.city || '',
        state: '',
        pincode: ''
      });
    }
  }, [selectedAddressIndex]);


  useEffect(() => {
    const fetchDynamicShippingCost = async () => {
      if (formData.pincode && formData.pincode.length >= 6) {
        setIsCalculatingShipping(true);
        setError('');
        try {
          const res = await axios.post(`${API_URL}/orders/calculate-shipping`, {
            itemId,
            pincode: formData.pincode
          }, { withCredentials: true });
          
          if (res.data.success) {
            setShippingCost(res.data.shippingCost);
       
            setFeeBreakdown(res.data.feeBreakdown);
  
          }
        } catch (err) {
          console.error('Error calculating dynamic shipping:', err);
          setError(err.response?.data?.message || 'Failed to calculate shipping. Please check address or contact support.');
 
          setShippingCost(null);
          setFeeBreakdown(null);

        } finally {
          setIsCalculatingShipping(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchDynamicShippingCost();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.pincode, itemId]);

  const handleInputChange = (e) => {

    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'state') {
      const filtered = INDIAN_STATES.filter(stateName =>
        stateName.toLowerCase().startsWith(value.toLowerCase()) || 
        stateName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredStates(filtered);
      setShowStateDropdown(true);
    }

    if (selectedAddressIndex !== -1) {
      setSelectedAddressIndex(-1);
    }
    
    if (error) setError('');
   
  };


  const handleStateSelect = (stateName) => {
    setFormData({ ...formData, state: stateName });
    setShowStateDropdown(false);
    if (error) setError('');
  };
  


  const handleContinueToSummary = () => {
    if (selectedAddressIndex === -1) {
      if (!formData.fullName || !formData.phone || !formData.houseNo || !formData.areaStreet || !formData.city || !formData.state || !formData.pincode) {
        setError('Please fill all required address fields before continuing.');
        return;
      }
      if (!/\d/.test(formData.houseNo)) {
        setError('Please include at least one number in your House No. (e.g., Flat 4B, Plot 12)');
        return;
      }
      if (formData.pincode.length < 6) {
        setError('Please enter a valid 6-digit pincode.');
        return;
      }
    }
    setError('');
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
 

  const itemPrice = item?.estimated_value || 0;
  const hasEnoughCredits = user?.account_credits >= itemPrice;

  const processFinalOrder = async (paymentDetails = null) => {
    try {
      const checkoutRes = await axios.post(`${API_URL}/orders/checkout`, {
        itemId: item._id,
        shippingAddress: formData,
        paymentDetails: paymentDetails 
      }, { withCredentials: true });

      if (checkoutRes.data.success) {
        const updatedAddresses = [...savedAddresses];
        const isAddressExist = updatedAddresses.some(addr => addr.houseNo === formData.houseNo && addr.pincode === formData.pincode);
        if (!isAddressExist) {
          updatedAddresses.push(formData);
        }

        const updatedUser = {
          ...user,
          account_credits: user.account_credits - itemPrice,
          savedAddresses: updatedAddresses
        };
        setUser(updatedUser);
        localStorage.setItem('dealit_user', JSON.stringify(updatedUser));

        alert('Order Placed Successfully! 🎉');
        navigate('/orders'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Order creation failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!hasEnoughCredits) return;

    if (!/\d/.test(formData.houseNo)) {
      setError('Please include at least one number in your House No. (e.g., Flat 4B, Plot 12)');
      return;
    }
    
    setProcessing(true);
    setError('');

    if (shippingCost === 0) {
       return processFinalOrder(null);
    }

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setError('Failed to load Razorpay SDK. Please check your internet connection.');
      setProcessing(false);
      return;
    }

    try {
      const orderResponse = await axios.post(
        `${API_URL}/payment/create-order`,
        { amount: shippingCost },
        { withCredentials: true }
      );

      const orderData = orderResponse.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Dealit',
        description: `Shipping Charges for ${item.title}`,
        order_id: orderData.id,
        handler: async function (response) {
          const paymentData = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };
          processFinalOrder(paymentData);
        },
        prefill: {
          name: formData.fullName || user?.full_name || '',
          email: user?.email || '',
          contact: formData.phone || user?.phone || '',
        },
        theme: {
          color: '#6B46C1',
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        setError(`Payment Failed! Reason: ${response.error.description}`);
        setProcessing(false); 
      });

      paymentObject.open();

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while initiating payment.');
      setProcessing(false);
    }
  };


  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    }
  };

 
  if (loading) return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative overflow-x-hidden">
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] py-5 shadow-md">
        <div className="max-w-md mx-auto md:max-w-3xl px-5 md:px-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse border border-white/10 shrink-0"></div>
          <div className="flex flex-col justify-center space-y-2">
            <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
      </header>

      <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0 animate-pulse" />

      <div className="max-w-md mx-auto md:max-w-3xl px-5 md:px-8 pt-28 relative z-20">
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          
        
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 bg-gray-200 rounded-[1.2rem] shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              <div className="h-8 w-28 bg-gray-200 rounded-full mt-2"></div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            
         
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5 animate-pulse">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="h-6 w-40 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-14 w-full bg-gray-200 rounded-xl"></div>
                <div className="h-14 w-full bg-gray-200 rounded-xl"></div>
                <div className="h-14 w-full bg-gray-200 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-14 w-full bg-gray-200 rounded-xl"></div>
                  <div className="h-14 w-full bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>

         
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                
                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-center">
                  <div className="h-6 w-28 bg-gray-200 rounded"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded"></div>
                </div>

                <div className="h-14 w-full bg-gray-200 rounded-xl mt-6"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );


  if (!item) return <div className="min-h-screen bg-[#f4f2f9] text-gray-900 p-10 text-center font-bold">Item not found.</div>;

  return (
    
    <div className="min-h-screen bg-[#f4f2f9] pb-24 font-sans relative overflow-x-hidden">
 
      
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] transition-all duration-300 ease-in-out shadow-md ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-md mx-auto md:max-w-3xl px-5 md:px-8 flex items-center gap-4 text-white">
          <button 
       
            onClick={() => currentStep === 2 ? setCurrentStep(1) : navigate(-1)} 
         
            className={`p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm border border-white/10 ${
              isScrolled ? 'scale-90' : 'scale-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col justify-center">
            <h1 className={`font-bold tracking-wide leading-tight transition-all duration-300 ${
              isScrolled ? 'text-xl' : 'text-2xl'
            }`}>
              
              {currentStep === 1 ? 'Delivery Address' : 'Review & Pay'}
            
            </h1>
            <p className={`text-purple-200 font-medium transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-sm mt-0.5'
            }`}>
           
              {currentStep === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
       
            </p>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"
      />

      <div className="max-w-md mx-auto md:max-w-3xl px-5 md:px-8 pt-28 relative z-20">
        
     
        <AnimatePresence mode="wait">
          
     
          {currentStep === 1 && (
            <motion.div 
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 md:space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#EBE5F7] p-2 rounded-xl text-[#6B46C1]">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">Where should we deliver?</h3>
                  </div>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedAddresses.map((addr, idx) => (
                        <div 
                          key={idx}
                     
                          onClick={() => { setSelectedAddressIndex(idx); setError(''); }}
              
                          className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                            selectedAddressIndex === idx 
                              ? 'border-[#6B46C1] bg-[#f8f6ff] shadow-sm' 
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          {selectedAddressIndex === idx && (
                            <div className="absolute top-3 right-3 bg-[#6B46C1] text-white rounded-full p-1">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                          <h4 className="font-bold text-gray-900 text-sm mb-1">{addr.fullName}</h4>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed truncate">
                            {addr.houseNo}, {addr.areaStreet} <br/>
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      ))}
                      
                      <div 
                    
                        onClick={() => { setSelectedAddressIndex(-1); setError(''); }}
                        
                        className={`relative p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] ${
                          selectedAddressIndex === -1 
                            ? 'border-[#6B46C1] bg-[#f8f6ff] text-[#6B46C1]' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 bg-gray-50/50'
                        }`}
                      >
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-sm font-bold">Add New Address</span>
                      </div>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {(selectedAddressIndex === -1 || savedAddresses.length === 0) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" name="fullName" placeholder="Full Name" required value={formData.fullName} onChange={handleInputChange}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                      </div>

                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="tel" name="phone" placeholder="Mobile Number" required value={formData.phone} onChange={handleInputChange}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <Home className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                          <input type="text" name="houseNo" placeholder="House No. / Flat No. / Road No." required value={formData.houseNo} onChange={handleInputChange}
                            className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                          <input type="text" name="areaStreet" placeholder="Area, Street, Sector" required value={formData.areaStreet} onChange={handleInputChange}
                            className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 opacity-50" />
                          <input type="text" name="landmark" placeholder="Landmark (Optional)" value={formData.landmark} onChange={handleInputChange}
                            className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input type="text" name="city" placeholder="City" required value={formData.city} onChange={handleInputChange}
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl px-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                        
                        {/* --> MODIFICATION START: Replaced State input with Autocomplete Dropdown */}
                        <div className="relative w-full">
                          <input 
                            type="text" 
                            name="state" 
                            placeholder="State" 
                            required 
                            value={formData.state} 
                            onChange={handleInputChange}
                            autoComplete="off"
                            onFocus={(e) => {
                               if (e.target.value) {
                                 const filtered = INDIAN_STATES.filter(s => 
                                   s.toLowerCase().startsWith(e.target.value.toLowerCase()) || 
                                   s.toLowerCase().includes(e.target.value.toLowerCase())
                                 );
                                 setFilteredStates(filtered);
                               } else {
                                 setFilteredStates(INDIAN_STATES);
                               }
                               setShowStateDropdown(true);
                            }}
                            onBlur={() => setTimeout(() => setShowStateDropdown(false), 200)}
                            className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl px-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" 
                          />
                          
                          <AnimatePresence>
                            {showStateDropdown && filteredStates.length > 0 && (
                              <motion.ul 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-48 overflow-y-auto overflow-x-hidden"
                              >
                                {filteredStates.map((stateName) => (
                                  <li 
                                    key={stateName} 
                                    onClick={() => handleStateSelect(stateName)}
                                    className="px-4 py-3 text-sm text-gray-700 hover:bg-[#f8f6ff] hover:text-[#6B46C1] font-medium cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                  >
                                    {stateName}
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </div>
                     
                      </div>

                      <div className="relative">
                        <Hash className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" name="pincode" placeholder="Pincode (6 Digits)" required value={formData.pincode} onChange={handleInputChange} maxLength="6"
                          className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {error && currentStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-800 font-bold mb-0.5">Alert</p>
                      <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </div>

            
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 md:relative md:bg-transparent md:border-none md:shadow-none md:p-0">
                <div className="max-w-md mx-auto md:max-w-3xl">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinueToSummary}
                    className="w-full mb-16 bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-bold text-lg py-4 rounded-xl shadow-md shadow-[#6B46C1]/20 transition-all flex items-center justify-center gap-2"
                  >
                    Continue to Summary <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

            </motion.div>
          )}

        
          {currentStep === 2 && (
            <motion.div 
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 md:space-y-6"
            >
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="w-20 h-20 bg-[#f8f6ff] rounded-[1.2rem] overflow-hidden shrink-0 border border-gray-100">
                  <img 
                    src={item.images?.[0] || 'https://via.placeholder.com/100'} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg text-gray-900 leading-tight">{item.title}</h2>
                  <p className="text-gray-500 text-xs font-medium mt-1">{item.category} • {item.condition}</p>
                  <div className="mt-2 inline-flex bg-[#FFF4D2] border border-[#FFE28A]/50 px-3 py-1.5 rounded-full items-center gap-1.5 shadow-sm">
                    <Coins className="w-4 h-4 text-yellow-600" />
                    <span className="font-bold text-xs text-gray-900">{itemPrice} Credits</span>
                  </div>
                </div>
              </div>

       
              <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[#EBE5F7] p-2 rounded-xl text-[#6B46C1] shrink-0 mt-1">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Delivering to {formData.fullName.split(' ')[0] || 'You'}</h4>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                      {formData.houseNo}, {formData.areaStreet}, {formData.city}, {formData.pincode}
                    </p>
                  </div>
                </div>
                <button onClick={() => setCurrentStep(1)} className="text-[#6B46C1] text-sm font-bold px-2 py-1 bg-[#EBE5F7] rounded-lg mt-1">Edit</button>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                  <div className="bg-[#EBE5F7] p-2 rounded-xl text-[#6B46C1]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">Bill Summary</h3>
                </div>
                
                <div className="space-y-3 text-gray-600 font-medium text-sm">
                  <div className="flex justify-between items-center">
                    <span>Item Value (Will be deducted)</span>
                    <span className="flex items-center gap-1 font-bold text-gray-900">
                      <Coins className="w-4 h-4 text-yellow-500" /> {itemPrice} Credits
                    </span>
                  </div>

                
                  {shippingCost > 0 && feeBreakdown && !isCalculatingShipping && !error && (
                    <>
                      <div className="flex justify-between items-center text-gray-500 mt-2">
                        <span>Base Delivery Charge</span>
                        <span>₹ {feeBreakdown.baseShipping}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500">
                        <span>Platform Fee (2%)</span>
                        <span>₹ {feeBreakdown.platformFee}</span>
                      </div>
                      <div className="flex justify-between items-center text-gray-500 pb-2">
                        <span>GST (18%)</span>
                        <span>₹ {feeBreakdown.gstAmount}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span>Total Shipping Fee {shippingCost > 0 ? '(Pay via Razorpay)' : ''}</span>
                    <span className={`flex items-center gap-1 font-bold ${isCalculatingShipping ? 'text-gray-400' : error ? 'text-red-500' : shippingCost === 0 ? 'text-emerald-500' : 'text-gray-900'}`}>
                      {isCalculatingShipping ? 'Calculating...' : error ? 'Failed' : shippingCost === 0 ? 'FREE' : `₹ ${shippingCost}`}
                    </span>
                  </div>
                  

                  <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-center text-lg">
                    <span className="font-bold text-gray-900">Total to Pay</span>
                  
                    <span className="font-black text-[#6B46C1]">
                      {isCalculatingShipping ? '...' : error ? 'Failed' : shippingCost === 0 ? 'FREE' : `₹ ${shippingCost}`}
                    </span>
              
                  </div>
                </div>

                {error && currentStep === 2 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-red-800 font-bold mb-0.5">Alert</p>
                      <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                     <p className="text-xs text-blue-800 font-medium leading-relaxed">
                       <span className="font-bold text-blue-900 block mb-1">Buyer Protection Guarantee</span> 
                       If the seller fails to dispatch your item within <span className="font-bold">{autoCancelHours} hours</span>, your order will be automatically cancelled, and your credits will be fully refunded to your wallet.
                     </p>
                  </div>
                </div>

                <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 border ${hasEnoughCredits ? 'bg-[#f0fdf4] border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  {hasEnoughCredits ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-emerald-700 text-sm font-bold">Credits Available</p>
                        <p className="text-emerald-600/80 text-xs mt-1 font-medium">You have {user.account_credits} credits in your wallet to cover the item value.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-700 text-sm font-bold">Insufficient Credits</p>
                        <p className="text-red-600/80 text-xs mt-1 font-medium">You need {itemPrice - user.account_credits} more credits to claim this item.</p>
                      </div>
                    </>
                  )}
                </div>

              </div>

            
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-40 md:relative md:bg-transparent md:border-none md:shadow-none md:p-0">
                <div className="max-w-md mx-auto md:max-w-3xl">
                  {hasEnoughCredits ? (
                    <motion.button 
                    
                      whileHover={!error ? { scale: 1.01 } : {}}
                      whileTap={!error ? { scale: 0.98 } : {}}
                      onClick={handlePlaceOrder} 
                      disabled={processing || isCalculatingShipping || !!error}
                      className={`w-full mb-16 text-white font-bold text-lg py-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                        error 
                          ? 'bg-gray-400 shadow-none' 
                          : 'bg-[#6B46C1] hover:bg-[#5a3aa3] shadow-md shadow-[#6B46C1]/20'
                      }`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5  border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : isCalculatingShipping ? 'Calculating Shipping...' : error ? 'Fix Error to Continue' : shippingCost === 0 ? 'Place Order' : `Pay ₹${shippingCost} & Place Order`}
                    </motion.button>
                  
                  ) : (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      <Link 
                        to="/wallet" 
                        className="w-full mb-16 bg-[#FFF4D2] hover:bg-[#FFE28A] text-yellow-800 font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm border border-[#FFE28A]/50"
                      >
                        <Wallet className="w-5 h-5" /> Get More Credits
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      

      </div>
    </div>
  );
};

export default CheckoutPage;