import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Coins, CreditCard, ChevronRight, Check, MoreHorizontal, Plus, Package } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const WalletPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false); // New state to toggle payment form smoothly

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        setProfileData(response.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handlePayment = async (amount) => {
    if (!amount || amount <= 0) return;
    setProcessing(true);

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.');
      setProcessing(false);
      return;
    }

    try {
      const orderResponse = await axios.post(
        `${API_URL}/payment/create-order`, 
        { amount },
        { withCredentials: true }
      );

      const orderData = orderResponse.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: 'Dealit',
        description: `Add ${amount} Credits to Wallet`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              `${API_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            if (verifyResponse.data.success) {
              setProfileData((prev) => ({
                ...prev,
                account_credits: prev.account_credits + amount
              }));
              
              const updatedUser = verifyResponse.data.user;
              setUser(updatedUser);
              localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
              
              setCustomAmount('');
              setShowPaymentForm(false);
              alert(`🎉 Success! ${amount} Credits have been added to your wallet.`);
            }
          } catch (error) {
            console.error('Verification failed', error);
            alert('Payment verified but credits could not be added. Please contact support.');
          }
        },
        prefill: {
          name: profileData?.full_name || '',
          email: profileData?.email || '',
          contact: profileData?.phone || '',
        },
        theme: {
          color: '#A388E1',
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        alert(`Payment Failed! Reason: ${response.error.description}`);
      });

      paymentObject.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Could not start payment process. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    handlePayment(Number(customAmount));
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 md:max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-6 pb-4 md:px-8">
        <Link to="/" className="text-gray-800 hover:text-[#A388E1] transition">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Earn Credits</h1>
        <button className="text-gray-800 hover:text-[#A388E1] transition">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {loading ? (
        <div className="text-center text-[#A388E1] py-20 font-medium animate-pulse">Loading wallet details...</div>
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-8 md:px-8">
          
          <div className="space-y-6">
            {/* Top Purple Banner */}
            <div className="mx-5 md:mx-0 bg-gradient-to-r from-[#A388E1] to-[#b7a3eb] rounded-3xl p-5 text-white shadow-lg shadow-[#A388E1]/30 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-yellow-400 p-1.5 rounded-full z-10">
                  <Coins className="w-6 h-6 text-yellow-900" />
                </div>
                <span className="text-3xl font-bold z-10">{profileData?.account_credits || 0} <span className="text-xl font-normal opacity-90">credits</span></span>
              </div>
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs font-medium z-10 relative">
                ₹ 1 = 1 credit
              </div>
              
              {/* Decorative elements to mimic the 3D assets */}
              <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                <Package className="w-32 h-32" />
              </div>
            </div>

            <div className="px-5 md:px-0 mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Ways to Earn Credits</h2>

              {/* Card 1: List Items */}
              <div className="bg-[#F8F6FF] rounded-3xl p-5 relative overflow-hidden mb-4 border border-[#EBE5F7]">
                <h3 className="font-bold text-gray-900 mb-3">List Items to Earn Credits</h3>
                <ul className="space-y-2 mb-5 w-2/3 relative z-10">
                  <li className="flex items-start gap-2 text-xs text-gray-600 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    List an item to earn instant credits.
                  </li>
                  <li className="flex items-start gap-2 text-xs text-gray-600 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    If your item gets approved and goes live, receive extra credits!
                  </li>
                </ul>
                <Link to="/add-item" className="bg-[#FFE28A] text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#FFD75E] transition relative z-10">
                  <Plus className="w-4 h-4" /> List an Item
                </Link>
                
                {/* Visual Graphic Placeholder */}
                <div className="absolute right-[-10px] bottom-[-10px] w-28 h-28 bg-[#EBE5F7] rounded-full opacity-50 flex items-center justify-center">
                  <Wallet className="w-12 h-12 text-[#A388E1]" />
                </div>
              </div>

              {/* Card 2: Buy Credits */}
              <div className="bg-[#F8F6FF] rounded-3xl p-5 relative overflow-hidden mb-4 border border-[#EBE5F7]">
                <div className="w-2/3 relative z-10">
                  <h3 className="font-bold text-gray-900 mb-1">Buy Credits</h3>
                  <p className="text-xs text-gray-500 font-medium mb-4">
                    Get credits instantly by buying them with real money.
                  </p>
                  <div className="inline-block bg-white border border-[#EBE5F7] px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm mb-4">
                    ₹ 1 = 1 credit
                  </div>
                  <br/>
                  <button 
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className="bg-[#A388E1] text-white px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#8b70ca] transition"
                  >
                    <Coins className="w-4 h-4" /> Add Credits
                  </button>
                </div>

                {/* Form expansion for Custom Amount Payment */}
                {showPaymentForm && (
                  <form onSubmit={handleCustomSubmit} className="mt-5 pt-5 border-t border-[#EBE5F7] relative z-10">
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                        <input 
                          type="number" 
                          min="10"
                          required
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Amount (Min 10)"
                          className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A388E1]/50 font-bold"
                          disabled={processing}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={!customAmount || customAmount < 10 || processing}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 ${
                          !customAmount || customAmount < 10 || processing
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#FFE28A] text-gray-900 hover:bg-[#FFD75E] shadow-sm'
                        }`}
                      >
                        {processing ? '...' : 'Pay'} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Visual Graphic Placeholder */}
                <div className="absolute right-[-10px] top-[10px] w-24 h-24 bg-[#EBE5F7] rounded-full opacity-50 flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-[#A388E1]" />
                </div>
              </div>

              {/* Card 3: Sell Items */}
              <div className="bg-[#FFF9E5] rounded-3xl p-5 relative overflow-hidden border border-[#FFE28A]/50">
                <h3 className="font-bold text-gray-900 mb-1">Got unused items?</h3>
                <h4 className="font-bold text-gray-900 mb-1 text-sm">Sell them to earn credits now!</h4>
                <p className="text-xs text-gray-600 font-medium mb-4 w-2/3 relative z-10 leading-relaxed">
                  Get credits instantly by trading in items you no longer use.
                </p>
                <Link to="/add-item" className="bg-[#FFE28A] text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#FFD75E] transition relative z-10">
                  <Plus className="w-4 h-4" /> List Item
                </Link>

                {/* Visual Graphic Placeholder */}
                <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-[#FFE28A]/30 rounded-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-yellow-600" />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;