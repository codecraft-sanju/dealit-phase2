import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, User, Home, Hash, 
  Truck, Coins, AlertCircle, CheckCircle, Wallet, ShoppingBag 
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const CheckoutPage = ({ user, setUser }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [shippingCost, setShippingCost] = useState(60); // Default, settings se aayega
  
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    addressLine: '',
    city: user?.city || '',
    state: '',
    pincode: ''
  });

  const [error, setError] = useState('');

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
  const totalAmount = itemPrice + shippingCost;
  const hasEnoughCredits = user?.account_credits >= totalAmount;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!hasEnoughCredits) return;
    
    setProcessing(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/orders/checkout`, {
        itemId: item._id,
        shippingAddress: formData
      }, { withCredentials: true });

      if (response.data.success) {
        // Update global user state (credits deduct ho gaye hain)
        const updatedUser = {
          ...user,
          account_credits: user.account_credits - totalAmount
        };
        setUser(updatedUser);
        localStorage.setItem('dealit_user', JSON.stringify(updatedUser));

        // Success! Order page ya dashboard par bhej do
        alert('Order Placed Successfully! 🎉');
        navigate('/dashboard'); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while placing order.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (!item) return <div className="min-h-screen bg-gray-900 text-white p-10 text-center">Item not found.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-20">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-md sticky top-0 z-30 border-b border-gray-700">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          
          {/* 1. Item Summary */}
          <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700 mb-4">
            <div className="flex gap-4">
              <img 
                src={item.images?.[0] || 'https://via.placeholder.com/100'} 
                alt={item.title} 
                className="w-20 h-20 object-cover rounded-xl border border-gray-700"
              />
              <div className="flex-1">
                <h2 className="font-bold text-lg leading-tight">{item.title}</h2>
                <p className="text-gray-400 text-sm">{item.category} • {item.condition}</p>
                <div className="mt-2 flex items-center gap-1.5 text-yellow-500">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold text-lg">{itemPrice} Credits</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            {/* 2. Shipping Address */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">Shipping Address</h3>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <input type="text" name="fullName" placeholder="Full Name" required value={formData.fullName} onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:border-emerald-500 outline-none transition-all" />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <input type="tel" name="phone" placeholder="Mobile Number" required value={formData.phone} onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:border-emerald-500 outline-none transition-all" />
                </div>

                <div className="relative">
                  <Home className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <textarea name="addressLine" placeholder="House No, Area, Street..." required rows="2" value={formData.addressLine} onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:border-emerald-500 outline-none transition-all resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input type="text" name="city" placeholder="City" required value={formData.city} onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all" />
                  <input type="text" name="state" placeholder="State" required value={formData.state} onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none transition-all" />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <input type="text" name="pincode" placeholder="Pincode" required value={formData.pincode} onChange={handleInputChange}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:border-emerald-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* 3. Order Summary & Credit Check */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-500" /> Bill Summary
              </h3>
              
              <div className="space-y-3 text-gray-300">
                <div className="flex justify-between">
                  <span>Item Value</span>
                  <span className="flex items-center gap-1 font-bold text-white">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" /> {itemPrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span className="flex items-center gap-1 font-bold text-white">
                    <Coins className="w-3.5 h-3.5 text-yellow-500" /> {shippingCost}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between text-lg">
                  <span className="font-black text-white uppercase tracking-tight">Total Amount</span>
                  <span className="flex items-center gap-1 font-black text-emerald-400">
                    <Coins className="w-5 h-5 text-yellow-500" /> {totalAmount}
                  </span>
                </div>
              </div>

              {/* Balance Warning */}
              <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${hasEnoughCredits ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                {hasEnoughCredits ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-emerald-400 text-sm font-bold">Credits Available</p>
                      <p className="text-gray-400 text-xs mt-0.5">You have {user.account_credits} credits in your wallet.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-red-400 text-sm font-bold">Insufficient Balance</p>
                      <p className="text-gray-400 text-xs mt-0.5">You need {totalAmount - user.account_credits} more credits to buy this.</p>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-xs text-center font-bold">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              {hasEnoughCredits ? (
                <button 
                  type="submit" 
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-4 rounded-xl mt-6 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                >
                  {processing ? 'Processing Order...' : 'Confirm & Place Order'}
                </button>
              ) : (
                <Link 
                  to="/wallet" 
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black text-lg py-4 rounded-xl mt-6 transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Wallet className="w-6 h-6" /> Get More Credits
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;