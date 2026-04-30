import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Coins, CreditCard, ChevronRight, Check, MoreHorizontal, Plus, Package, Sparkles, Copy, Users, Target, Share2, History, ArrowDownLeft, XCircle, Clock, X, Truck, Filter, List, Loader2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [appSettings, setAppSettings] = useState({ 
    isReferralSystemEnabled: true, 
    referralRewardCredits: 40,
    maxReferralLimit: 5,
    milestoneReferralReward: 100 
  });
  
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [showCelebration, setShowCelebration] = useState(false);
  const [addedAmount, setAddedAmount] = useState(0);

  // NAYA: Pagination & History States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const profileResponse = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        setProfileData(profileResponse.data.data);

        try {
          const settingsRes = await axios.get(`${API_URL}/admin/public-settings`); 
          if(settingsRes.data.success) {
            setAppSettings(settingsRes.data.data);
          }
        } catch (setErr) {
          console.log("Using fallback settings");
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // API Call Function for Transactions
  const fetchTransactions = async (pageNum, currentType, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setTxLoading(true);
      setTransactions([]); // Reset on new filter
    }

    try {
      const txRes = await axios.get(`${API_URL}/payment/transactions`, { 
        params: { page: pageNum, limit: 10, type: currentType },
        withCredentials: true 
      });
      
      if (txRes.data.success) {
        if (isLoadMore) {
          setTransactions(prev => [...prev, ...txRes.data.data]);
        } else {
          setTransactions(txRes.data.data);
        }
        setHasMore(txRes.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.log("Error fetching transactions", error);
    } finally {
      setTxLoading(false);
      setLoadingMore(false);
    }
  };

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    setFilterType('all');
    fetchTransactions(1, 'all', false);
  };

  const handleFilterChange = (newType) => {
    if (filterType === newType) return;
    setFilterType(newType);
    fetchTransactions(1, newType, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchTransactions(page + 1, filterType, true);
    }
  };

  const handleCopyCode = () => {
    if(profileData?.referralCode) {
      navigator.clipboard.writeText(profileData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!profileData?.referralCode) return;

    const referralLink = `${window.location.origin}/register?ref=${profileData.referralCode}`;
    const shareData = {
      title: 'Join me on Dealit!',
      text: `Hey! I use Dealit to exchange unused items. Sign up using my link and we both get bonus credits!`,
      url: referralLink
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(referralLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

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
              
              setAddedAmount(amount);
              setShowCelebration(true);
              
              setTimeout(() => {
                setShowCelebration(false);
              }, 5500);
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

  const coinGradients = [
    'radial-gradient(circle, #FFF099 20%, #FBBF24 80%, #D97706 100%)',
    'radial-gradient(circle, #FEF08A 20%, #F59E0B 80%, #B45309 100%)',
    'radial-gradient(circle, #FDE047 20%, #EAB308 80%, #92400E 100%)'
  ];

  const currentReferrals = profileData?.totalReferrals || 0;
  const maxReferrals = appSettings.maxReferralLimit || 5;
  const progressPercent = Math.min((currentReferrals / maxReferrals) * 100, 100);
  const isLimitReached = currentReferrals >= maxReferrals;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-2 md:max-w-7xl relative">
      
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm flex justify-between items-center px-5 py-4 md:px-8 transition-all">
        <Link to="/" className="p-2 -ml-2 text-gray-700 hover:text-[#A388E1] hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Earn Credits</h1>
        <button className="p-2 -mr-2 text-gray-700 hover:text-[#A388E1] hover:bg-gray-50 rounded-full transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-8 md:px-8 mt-4">
        
        <div className="space-y-6 mt-2">
          
          <div className={`mx-5 md:mx-0 bg-gradient-to-r from-[#A388E1] to-[#b7a3eb] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden transition-all duration-1000 ${showCelebration ? 'shadow-yellow-400/50 scale-[1.02]' : 'shadow-[#A388E1]/30'}`}>
            
            {loading ? (
              <div className="flex items-center gap-3 mb-4 relative z-10 animate-pulse">
                <div className="w-10 h-10 bg-white/30 rounded-full"></div>
                <div className="h-10 w-32 bg-white/30 rounded-2xl"></div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className={`bg-yellow-400 p-1.5 rounded-full transition-transform duration-700 ${showCelebration ? 'rotate-180 scale-110' : ''}`}>
                  <Coins className="w-6 h-6 text-yellow-900" />
                </div>
                <span className="text-4xl font-black relative">
                  {profileData?.account_credits || 0}
                  
                  {showCelebration && (
                    <span className="absolute -top-6 -right-16 text-2xl text-yellow-300 font-black floating-up drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] flex items-center">
                      +{addedAmount} <Sparkles className="w-4 h-4 ml-1 animate-spin" />
                    </span>
                  )}
                  
                  <span className="text-xl font-medium opacity-90 ml-1">credits</span>
                </span>
              </div>
            )}

            <div className="inline-block bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs font-medium z-10 relative border border-white/10">
              ₹ 1 = 1 credit
            </div>
            
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
              <Package className="w-32 h-32" />
            </div>
          </div>

          <div className="mx-5 md:mx-0">
            <button onClick={openHistoryModal} className="w-full bg-white border border-gray-200 py-3.5 rounded-2xl flex justify-center items-center gap-2 font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-[#A388E1]/50 transition-all active:scale-[0.98]">
              <History className="w-5 h-5 text-[#A388E1]" /> View Transaction History
            </button>
          </div>

          <div className="px-5 md:px-0 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ways to Earn Credits</h2>

            {appSettings.isReferralSystemEnabled && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-5 relative overflow-hidden mb-4 border border-emerald-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start relative z-10 mb-4">
                  <div>
                    <h3 className="font-black text-gray-900 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-600" /> Refer & Earn Milestone
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      Invite friends to Dealit and unlock rewards!
                    </p>
                  </div>
                </div>

                <div className="mb-5 relative z-10 bg-white/60 p-3.5 rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {currentReferrals} / {maxReferrals} Friends Joined</span>
                    <span className="text-emerald-600">{Math.round(progressPercent)}%</span>
                  </div>
                  
                  <div className="h-2.5 w-full bg-emerald-200/50 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute top-0 left-0 bottom-0 w-full bg-white/20 animate-pulse"></div>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5 text-xs font-medium text-gray-600">
                    <li className="flex items-center gap-1.5">
                      <Check className={`w-3.5 h-3.5 ${currentReferrals >= 1 ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <span className={currentReferrals >= 1 ? 'text-gray-800' : ''}>1st Friend: <strong className="text-emerald-600">+{appSettings.referralRewardCredits} Credits</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className={`w-3.5 h-3.5 ${isLimitReached ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <span className={isLimitReached ? 'text-gray-800' : ''}>Reach {maxReferrals} Friends: <strong className="text-emerald-600">+{appSettings.milestoneReferralReward} Bonus Credits!</strong></span>
                    </li>
                  </ul>
                </div>
                
                {isLimitReached ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 py-3 px-4 rounded-xl text-center relative z-10 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Milestone Completed! Awesome Job.</span>
                  </div>
                ) : profileData?.referralCode ? (
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="bg-white border border-emerald-200 px-4 py-2.5 rounded-xl font-black text-gray-800 tracking-wider flex-1 text-center shadow-inner">
                        {profileData.referralCode}
                      </div>
                      <button 
                        onClick={handleCopyCode}
                        className={`p-2.5 rounded-xl transition flex items-center justify-center shadow-sm ${copied ? 'bg-emerald-500 text-white' : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                        title="Copy Code"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                    <button 
                      onClick={handleShare}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm ${shareCopied ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                    >
                      {shareCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      {shareCopied ? 'Link Copied' : 'Share Invite Link'}
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic bg-white/50 p-2 rounded-lg border border-emerald-100 relative z-10">
                    Generating your code...
                  </div>
                )}

                <div className="absolute right-[-15px] bottom-[-15px] w-32 h-32 bg-emerald-200/40 rounded-full opacity-50 flex items-center justify-center pointer-events-none">
                  <Target className="w-16 h-16 text-emerald-500/20" />
                </div>
              </div>
            )}

            <div className="bg-[#F8F6FF] rounded-3xl p-5 relative overflow-hidden mb-4 border border-[#EBE5F7] hover:shadow-md transition-shadow">
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
              
              <div className="absolute right-[-10px] bottom-[-10px] w-28 h-28 bg-[#EBE5F7] rounded-full opacity-50 flex items-center justify-center">
                <Wallet className="w-12 h-12 text-[#A388E1]" />
              </div>
            </div>

            <div className="bg-[#F8F6FF] rounded-3xl p-5 relative overflow-hidden mb-4 border border-[#EBE5F7] hover:shadow-md transition-shadow">
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

              {showPaymentForm && (
                <form onSubmit={handleCustomSubmit} className="mt-5 pt-5 border-t border-[#EBE5F7] relative z-10 animate-in slide-in-from-top-2 duration-300">
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
                        className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#A388E1] font-bold shadow-inner"
                        disabled={processing}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!customAmount || customAmount < 10 || processing}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 ${
                        !customAmount || customAmount < 10 || processing
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#FFE28A] text-gray-900 hover:bg-[#FFD75E] shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {processing ? '...' : 'Pay'} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              <div className="absolute right-[-10px] top-[10px] w-24 h-24 bg-[#EBE5F7] rounded-full opacity-50 flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-[#A388E1]" />
              </div>
            </div>

            <div className="bg-[#FFF9E5] rounded-3xl p-5 relative overflow-hidden border border-[#FFE28A]/50 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 mb-1">Got unused items?</h3>
              <h4 className="font-bold text-gray-900 mb-1 text-sm">Sell them to earn credits now!</h4>
              <p className="text-xs text-gray-600 font-medium mb-4 w-2/3 relative z-10 leading-relaxed">
                Get credits instantly by trading in items you no longer use.
              </p>
              <Link to="/add-item" className="bg-[#FFE28A] text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#FFD75E] transition relative z-10">
                <Plus className="w-4 h-4" /> List Item
              </Link>

              <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-[#FFE28A]/30 rounded-full flex items-center justify-center">
                <Package className="w-10 h-10 text-yellow-600" />
              </div>
            </div>

          </div>
        </div>
      </div>

      <AnimatePresence>
        {showHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl flex flex-col min-h-[85vh] max-h-[85vh] md:min-h-[80vh] md:max-h-[80vh] relative"
            >
              
              {/* Drag Handle Indicator */}
              <div className="absolute top-0 w-full flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>

              <div className="p-5 pt-8 md:pt-5 border-b border-gray-100 flex justify-between items-center bg-[#f8f6ff] shrink-0">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#6B46C1]" /> Transaction History
                </h2>
                <button 
                  onClick={() => setShowHistoryModal(false)} 
                  className="text-gray-400 hover:text-gray-600 p-2 bg-white rounded-full shadow-sm active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-3 border-b border-gray-100 bg-white shrink-0 flex gap-2 overflow-x-auto hide-scrollbar flex-nowrap">
                <button 
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'all' ? 'bg-[#6B46C1] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <List className="w-3.5 h-3.5" /> All History
                </button>
                <button 
                  onClick={() => handleFilterChange('wallet_recharge')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'wallet_recharge' ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <Wallet className="w-3.5 h-3.5" /> Recharges
                </button>
                <button 
                  onClick={() => handleFilterChange('shipping_fee')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'shipping_fee' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <Truck className="w-3.5 h-3.5" /> Shipping
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 bg-gray-50">
                {txLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 pt-10">
                    <div className="w-8 h-8 border-4 border-[#A388E1] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-500">Loading history...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center pt-10">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Filter className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">No Records Found</h3>
                    <p className="text-sm text-gray-500">No transactions match your current filter.</p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-6">
                    <AnimatePresence mode="popLayout">
                      {transactions.map((tx) => {
                        const isShipping = tx.transactionType === 'shipping_fee';
                        const isSuccess = tx.status === 'success';
                        const isFailed = tx.status === 'failed';

                        return (
                          <motion.div 
                            key={tx._id}
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${
                                isShipping 
                                  ? 'bg-blue-50 text-blue-600' 
                                  : isSuccess ? 'bg-emerald-50 text-emerald-600' : isFailed ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                              }`}>
                                {isShipping ? <Truck className="w-5 h-5" /> : (isSuccess ? <ArrowDownLeft className="w-5 h-5" /> : isFailed ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm capitalize">
                                  {tx.transactionType ? tx.transactionType.replace('_', ' ') : 'Wallet Recharge'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                  {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-black text-sm ${isShipping ? 'text-gray-800' : isSuccess ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {isShipping ? '-' : (isSuccess ? '+' : '')}
                                {isShipping ? '₹' : ''}{tx.amount} 
                                {!isShipping && <span className="text-[10px] font-bold text-gray-500 ml-1">CR</span>}
                              </p>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${tx.status === 'success' ? 'text-emerald-500' : tx.status === 'failed' ? 'text-red-500' : 'text-orange-500'}`}>
                                {tx.status}
                              </p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {/* NAYA: Load More Button */}
                    {hasMore && (
                      <div className="flex justify-center pt-4 pb-2">
                        <button 
                          onClick={handleLoadMore} 
                          disabled={loadingMore}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#EBE5F7] rounded-full text-sm font-bold text-[#6B46C1] hover:bg-[#F8F6FF] transition-colors shadow-sm disabled:opacity-50 active:scale-95"
                        >
                          {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4 rotate-90" />}
                          {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const size = Math.random() * 16 + 12; 
            const isSparkle = i % 5 === 0; 

            if (isSparkle) {
              const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                width: `${size}px`,
                height: `${size}px`,
                color: '#FDE047',
              };
              return (
                <div key={i} className="coin-piece flex items-center justify-center" style={style}>
                  <Sparkles size={size} />
                </div>
              );
            }

            const style = {
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 2.5 + 2}s`, 
              animationDelay: `${Math.random() * 0.3}s`,
              background: coinGradients[Math.floor(Math.random() * coinGradients.length)],
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: '1px solid #D97706',
              boxShadow: 'inset 0 0 4px rgba(217, 119, 6, 0.6), 0 2px 4px rgba(0,0,0,0.2)',
            };
            return <div key={i} className="coin-piece" style={style} />;
          })}
        </div>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes coinFall {
          0% { 
            transform: translateY(-10vh) rotateX(0deg) rotateY(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(110vh) rotateX(1080deg) rotateY(720deg); 
            opacity: 0; 
          }
        }
        .coin-piece {
          position: absolute;
          top: -10%;
          z-index: 50;
          animation: coinFall linear forwards;
        }
        
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(15px) scale(0.9); }
          20% { opacity: 1; transform: translateY(0px) scale(1.1); }
          80% { opacity: 1; transform: translateY(-30px) scale(1); }
          100% { opacity: 0; transform: translateY(-45px) scale(0.9); }
        }
        .floating-up {
          animation: floatUp 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default WalletPage;