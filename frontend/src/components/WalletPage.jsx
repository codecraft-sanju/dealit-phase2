import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Coins, CreditCard, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// NAYA: Props mein setUser bhi receive kar rahe hain
const WalletPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  // Yeh predefined packages hain user ke liye
  const packages = [
    { id: 1, credits: 100, price: 100, tag: 'Starter' },
    { id: 2, credits: 500, price: 500, tag: 'Most Popular', highlight: true },
    { id: 3, credits: 1000, price: 1000, tag: 'Pro Trader' }
  ];

  useEffect(() => {
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
  }, []);

  const handlePayment = async (amount) => {
    if (!amount || amount <= 0) return;
    setProcessing(true);

    // Step 1: Check if Razorpay script loaded
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.');
      setProcessing(false);
      return;
    }

    try {
      // Step 2: Backend se order create karo
      const orderResponse = await axios.post(
        `${API_URL}/payment/create-order`, 
        { amount },
        { withCredentials: true }
      );

      const orderData = orderResponse.data.data;

      // Step 3: Razorpay Popup config
      const options = {
        key: 'rzp_test_SNwkfTU2QHMrsu', // Tumhari Test Key
        amount: orderData.amount, 
        currency: orderData.currency,
        name: 'Dealit',
        description: `Add ${amount} Credits to Wallet`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Step 4: Payment success hone par Backend me verify karo
            const verifyResponse = await axios.post(
              `${API_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: amount,
              },
              { withCredentials: true }
            );

            if (verifyResponse.data.success) {
              // LOCAL UPDATE: Wallet page ka data instantly update
              setProfileData((prev) => ({
                ...prev,
                account_credits: prev.account_credits + amount
              }));
              
              // GLOBAL UPDATE: Navbar aur puri app ka data instantly update
              const updatedUser = verifyResponse.data.user;
              setUser(updatedUser);
              localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
              
              // Custom input clear kar do
              setCustomAmount('');
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
          color: '#10b981', // Emerald 500 theme se match karne ke liye
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        alert(`Payment Failed! Reason: ${response.error.description}`);
      });

      // Open the Razorpay Popup
      paymentObject.open();

    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Could not start payment process. Please try again.');
    } finally {
      // Button ko wapas normal state me le aao popup khulne ke baad
      setProcessing(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    handlePayment(Number(customAmount));
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/profile" className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition border border-gray-700 hover:border-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-8 h-8 text-emerald-400" /> My Wallet
          </h1>
          <p className="text-gray-400 text-sm">Manage your credits and transactions.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 py-20 font-medium animate-pulse">Loading wallet details...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Current Balance */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl border border-gray-700 shadow-xl overflow-hidden relative">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
              
              <div className="p-8 relative z-10 text-center">
                <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <Coins className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-gray-400 font-bold tracking-widest text-xs uppercase mb-1">Available Balance</p>
                <h2 className="text-5xl font-black text-white mb-2 flex justify-center items-end gap-1">
                  {profileData?.account_credits || 0} <span className="text-xl text-yellow-500 mb-1">🪙</span>
                </h2>
                <p className="text-sm text-gray-500">1 Credit = ₹1 INR</p>
              </div>
              <div className="bg-gray-900/80 p-4 border-t border-gray-700 flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4" /> 100% Secure Transactions
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" /> Why buy credits?
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                  Offer trades for high-value items even if your items are worth less.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                  Use credits to balance the gap in estimated value.
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                  Credits never expire and stay in your wallet forever.
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT COLUMN: Buy Credits Packages */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-3xl border border-gray-700 shadow-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Add Credits</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {packages.map((pkg) => (
                  <div 
                    key={pkg.id} 
                    className={`relative p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${
                      pkg.highlight 
                        ? 'border-yellow-500 bg-yellow-500/5 shadow-lg shadow-yellow-500/10 hover:bg-yellow-500/10' 
                        : 'border-gray-700 bg-gray-900/50 hover:border-emerald-500/50 hover:bg-gray-800'
                    }`}
                    onClick={() => handlePayment(pkg.price)}
                  >
                    {pkg.highlight && (
                      <div className="absolute top-0 inset-x-0 bg-yellow-500 text-black text-[10px] font-black tracking-widest text-center py-1 uppercase">
                        {pkg.tag}
                      </div>
                    )}
                    {!pkg.highlight && (
                      <div className="absolute top-2 right-2 text-[10px] font-bold text-gray-500 uppercase">
                        {pkg.tag}
                      </div>
                    )}

                    <Coins className={`w-10 h-10 mb-3 transition-transform duration-300 group-hover:scale-110 ${pkg.highlight ? 'text-yellow-500 mt-4' : 'text-gray-400'}`} />
                    <h3 className="text-2xl font-black text-white flex items-center gap-1">
                      {pkg.credits}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium mb-4">Credits</p>
                    
                    <button 
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                        pkg.highlight 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-md' 
                          : 'bg-gray-700 hover:bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20'
                      }`}
                      disabled={processing}
                    >
                      Pay ₹{pkg.price} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Custom Amount Field */}
              <div className="border-t border-gray-700 pt-8 mt-4">
                <h3 className="text-lg font-bold text-white mb-4">Custom Amount</h3>
                <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-400 font-bold">₹</span>
                    </div>
                    <input 
                      type="number" 
                      min="10"
                      required
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Enter amount (Min ₹10)"
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                      disabled={processing}
                    />
                    {customAmount && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-emerald-400 font-medium text-sm flex items-center gap-1">
                          = {customAmount} <Coins className="w-4 h-4 text-yellow-500" />
                        </span>
                      </div>
                    )}
                  </div>
                  <button 
                    type="submit"
                    disabled={!customAmount || customAmount < 10 || processing}
                    className={`sm:w-auto w-full px-8 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                      !customAmount || customAmount < 10 || processing
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" /> {processing ? 'Processing...' : 'Buy Now'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;