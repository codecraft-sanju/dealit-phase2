import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, User, Home, Hash, 
  Truck, Coins, AlertCircle, CheckCircle, Wallet, ShoppingBag 
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// ---> NEW: Added Razorpay script loader function
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = ({ user, setUser }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState(60); // Default, settings se aayega
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    addressLine: user?.addressLine || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || ''
  });

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
        // 1. Fetch Item Details
        const itemRes = await axios.get(`${API_URL}/items/${itemId}`);
        if (itemRes.data.success) {
          setItem(itemRes.data.data);
        }

        // 2. Fetch Shipping Cost from Admin Settings
        const settingsRes = await axios.get(`${API_URL}/admin/public-settings`);
        if (settingsRes.data.success) {
          setShippingCost(settingsRes.data.data.flatShippingCost || 60);
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const itemPrice = item?.estimated_value || 0;
  // ---> CHANGED: Total amount logic removed. Now checking credits ONLY against itemPrice
  const hasEnoughCredits = user?.account_credits >= itemPrice;

  // ---> CHANGED: Updated handlePlaceOrder with Razorpay flow
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!hasEnoughCredits) return;
    
    setProcessing(true);
    setError('');

    // Step 1: Load Razorpay
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setError('Failed to load Razorpay SDK. Please check your internet connection.');
      setProcessing(false);
      return;
    }

    try {
      // Step 2: Create Razorpay order for SHIPPING COST only
      // Backend par ek endpoint hona chahiye jo sirf shipping ka order create kare
      const orderResponse = await axios.post(
        `${API_URL}/payment/create-order`, // Modify this if your backend needs a specific route for shipping vs wallet
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
          try {
            // Step 3: Payment success ke baad backend par final checkout call karein
            const checkoutRes = await axios.post(`${API_URL}/orders/checkout`, {
              itemId: item._id,
              shippingAddress: formData,
              paymentDetails: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            }, { withCredentials: true });

            if (checkoutRes.data.success) {
              // Update global user state (SIRF item value ke credits deduct honge yaha)
              const updatedUser = {
                ...user,
                account_credits: user.account_credits - itemPrice,
                addressLine: formData.addressLine,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                full_name: formData.fullName,
                phone: formData.phone
              };
              setUser(updatedUser);
              localStorage.setItem('dealit_user', JSON.stringify(updatedUser));

              // Success! Order page ya dashboard par bhej do
              alert('Payment & Order Placed Successfully! 🎉');
              navigate('/dashboard'); 
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Payment successful but order creation failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
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
        setProcessing(false); // Enable button again
      });

      paymentObject.open();

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while initiating payment.');
      setProcessing(false);
    }
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
    <div className="min-h-screen bg-[#f4f2f9] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6B46C1]"></div>
    </div>
  );

  if (!item) return <div className="min-h-screen bg-[#f4f2f9] text-gray-900 p-10 text-center font-bold">Item not found.</div>;

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative overflow-x-hidden">
      
      {/* Header aligned with ProfilePage theme */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] transition-all duration-300 ease-in-out shadow-md ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-md mx-auto md:max-w-3xl px-5 md:px-8 flex items-center gap-4 text-white">
          <button 
            onClick={() => navigate(-1)} 
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
              Checkout
            </h1>
            <p className={`text-purple-200 font-medium transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-sm mt-0.5'
            }`}>
              Complete your order
            </p>
          </div>
        </div>
      </header>

      {/* Background swoosh */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"
      />

      <div className="max-w-md mx-auto md:max-w-3xl px-5 md:px-8 pt-28 relative z-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:gap-6"
        >
          
          {/* 1. Item Summary */}
          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
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
          </motion.div>

          <form onSubmit={handlePlaceOrder} className="space-y-4 md:space-y-6">
            
            {/* 2. Shipping Address */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="bg-[#EBE5F7] p-2 rounded-xl text-[#6B46C1]">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-gray-800">Shipping Details</h3>
              </div>

              <div className="space-y-4">
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

                <div className="relative">
                  <Home className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <textarea name="addressLine" placeholder="House No, Area, Street..." required rows="2" value={formData.addressLine} onChange={handleInputChange}
                    className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="city" placeholder="City" required value={formData.city} onChange={handleInputChange}
                    className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl px-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                  <input type="text" name="state" placeholder="State" required value={formData.state} onChange={handleInputChange}
                    className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl px-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400" />
                  <input type="text" name="pincode" placeholder="Pincode" required value={formData.pincode} onChange={handleInputChange}
                    className="w-full bg-[#f8f6ff] border border-gray-100 rounded-xl pl-11 pr-4 py-3.5 focus:border-[#6B46C1] focus:bg-white focus:ring-4 focus:ring-[#6B46C1]/10 outline-none transition-all text-gray-800 placeholder-gray-400 font-medium" />
                </div>
              </div>
            </motion.div>

            {/* 3. Order Summary & Credit Check */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4 mb-4">
                <div className="bg-[#EBE5F7] p-2 rounded-xl text-[#6B46C1]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-gray-800">Bill Summary</h3>
              </div>
              
              {/* ---> CHANGED: Bill Summary UI */}
              <div className="space-y-3 text-gray-600 font-medium text-sm">
                <div className="flex justify-between items-center">
                  <span>Item Value (Will be deducted)</span>
                  <span className="flex items-center gap-1 font-bold text-gray-900">
                    <Coins className="w-4 h-4 text-yellow-500" /> {itemPrice} Credits
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping Fee (Pay via Razorpay)</span>
                  <span className="flex items-center gap-1 font-bold text-gray-900">
                    ₹ {shippingCost}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-4 mt-2 flex justify-between items-center text-lg">
                  <span className="font-bold text-gray-900">Total to Pay</span>
                  <span className="font-black text-[#6B46C1]">
                    ₹ {shippingCost}
                  </span>
                </div>
              </div>

              {/* ---> CHANGED: Balance Warning now checks only itemPrice */}
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

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center font-bold">
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              {hasEnoughCredits ? (
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={processing}
                  className="w-full bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-bold text-lg py-4 rounded-xl mt-6 transition-all shadow-md shadow-[#6B46C1]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : `Pay ₹${shippingCost} & Place Order`}
                </motion.button>
              ) : (
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Link 
                    to="/wallet" 
                    className="w-full bg-[#FFF4D2] hover:bg-[#FFE28A] text-yellow-800 font-bold text-lg py-4 rounded-xl mt-6 transition-all flex items-center justify-center gap-2 shadow-sm border border-[#FFE28A]/50"
                  >
                    <Wallet className="w-5 h-5" /> Get More Credits
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </form>

        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;