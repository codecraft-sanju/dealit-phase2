import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';

import { ArrowLeft, Wallet, Coins, CreditCard, ChevronRight, Check, MoreHorizontal, Plus, Package, Sparkles, Copy, Users, Target, Share2, History, ArrowDownLeft, XCircle, Clock, X, Truck, Filter, List, Loader2, RefreshCcw, Zap, HelpCircle, FileText, Download, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CoinCelebration from './CoinCelebration';

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

const CREDIT_PACKS = [
  { id: 'starter', price: 49, credits: 50, label: 'Starter', bonus: '+1 Bonus' },
  { id: 'popular', price: 99, credits: 110, label: 'Most Popular', bonus: '+11 Bonus', highlight: true },
  { id: 'pro', price: 199, credits: 250, label: 'Best Value', bonus: '+51 Bonus' }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const WalletPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  /* --- MODIFIED: Added state for the 3-dots dropdown menu --- */
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const fetchTransactions = async (pageNum, currentType, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setTxLoading(true);
      setTransactions([]);
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

  
  const handlePayment = async (packId, amount = null) => {
    if (packId === 'custom' && (!amount || amount < 10)) return;
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
        /* --- MODIFIED: Sending packId and customAmount to the backend --- */
        { 
          packId: packId,
          customAmount: amount 
        },
        { withCredentials: true }
      );

      const orderData = orderResponse.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY, 
        amount: orderData.amount, 
        currency: orderData.currency,
        name: 'Dealit',
        description: `Add Credits to Wallet`,
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
              const updatedUser = verifyResponse.data.user;
              
              /* --- MODIFIED: Calculate actual added amount directly from the validated backend response --- */
              const actualAddedAmount = updatedUser.account_credits - profileData.account_credits;

              setProfileData((prev) => ({
                ...prev,
                account_credits: updatedUser.account_credits
              }));
              
              setUser(updatedUser);
              localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
              
              setCustomAmount('');
              setShowPaymentForm(false);
              
              /* --- MODIFIED: Set the celebration amount using the actual backend calculation --- */
              setAddedAmount(actualAddedAmount);
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

const handleDownloadStatement = async () => {
  try {
    const response = await axios.get(`${API_URL}/payment/statement`, {
      withCredentials: true,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const isApp = window.localStorage.getItem('is_dealit_app') === 'true';

    if (isApp && window.ReactNativeWebView) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_PDF',
          base64: base64data,
          filename: 'Dealit_Wallet_Statement.pdf'
        }));
      };
    } else {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Dealit_Wallet_Statement.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error downloading statement:', error);
    alert('Failed to download statement. Please try again.');
  }
};

 
  const handleCustomSubmit = (e) => {
    e.preventDefault();
    handlePayment('custom', Number(customAmount));
  };

  if (!user) return <Navigate to="/login" />;

  const currentReferrals = profileData?.totalReferrals || 0;
  const maxReferrals = appSettings.maxReferralLimit || 5;
  const progressPercent = Math.min((currentReferrals / maxReferrals) * 100, 100);
  const isLimitReached = currentReferrals >= maxReferrals;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-2 md:max-w-7xl relative">
      
      {/* --- MODIFIED: Header now includes the functional dropdown menu with Framer Motion --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm flex justify-between items-center px-5 py-4 md:px-8 transition-all">
        <Link to="/" className="p-2 -ml-2 text-gray-700 hover:text-[#A388E1] hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900">Earn Credits</h1>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-2 text-gray-700 hover:text-[#A388E1] hover:bg-gray-50 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
              >
                <div className="py-2">
                  <Link 
                    to="/help-support" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    Help & Support
                  </Link>
                  <Link 
                    to="/terms" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-gray-400" />
                    How Credits Work
                  </Link>
                
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDownloadStatement();
                    }}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                    Download Statement
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <Link 
                    to="/refund-policy" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-600 hover:bg-red-50"
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Refund Policy
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* --- END MODIFIED --- */}

      <div className="md:grid md:grid-cols-2 md:gap-8 md:px-8 mt-4">
        
        <div className="space-y-6 mt-2">
          
          <div className={`mx-5 md:mx-0 bg-gradient-to-br from-[#A388E1] via-[#8c67d6] to-[#6b46c1] rounded-3xl p-5 text-white shadow-[0_8px_20px_rgba(163,136,225,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] relative overflow-hidden transition-all duration-1000 ${showCelebration ? 'shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-[1.02]' : ''}`}>
            
            {/* Continuous Glossy Shimmer Line */}
            <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[glare_4s_infinite_ease-in-out] pointer-events-none z-0"></div>
            
            {loading ? (
              <div className="flex items-center gap-3 mb-4 relative z-10 animate-pulse">
                <div className="w-10 h-10 bg-white/30 rounded-full"></div>
                <div className="h-10 w-32 bg-white/30 rounded-2xl"></div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 relative z-10">
                
                {/* --- PREMIUM 3D COIN (Auto-Flips every 5s & on Celebration) --- */}
                <motion.div 
                  animate={showCelebration 
                    ? { rotateY: [0, 360], scale: [1, 1.2, 1] } 
                    : { rotateY: [0, 360, 360] }
                  }
                  transition={showCelebration 
                    ? { duration: 0.8, ease: "easeOut" } 
                    : { duration: 5, repeat: Infinity, times: [0, 0.15, 1], ease: "easeInOut" }
                  }
                  className="w-max shrink-0 origin-center"
                >
                  <div className="relative w-10 h-10 rounded-full shadow-[0_4px_10px_rgba(217,119,6,0.6),inset_0_-3px_5px_rgba(146,64,14,0.6),inset_0_2px_4px_rgba(255,255,255,0.9)] border border-[#FEF08A] bg-gradient-to-br from-[#FEF08A] via-[#F59E0B] to-[#92400E] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-[3px] rounded-full border-[0.5px] border-[#92400E]/50 bg-gradient-to-tl from-[#FEF08A]/20 via-transparent to-[#D97706]/40 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                      <span className="font-black text-[#78350F] text-sm tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">Cr</span>
                    </div>
                    {/* Premium Glare sweep inside the coin */}
                    <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] animate-[glare_3s_infinite_ease-in-out]"></div>
                  </div>
                </motion.div>
                {/* ----------------------- */}

                <span className="text-4xl font-black relative drop-shadow-md">
                  {profileData?.account_credits || 0}
                  
                  {showCelebration && (
                    <span className="absolute -top-6 -right-16 text-2xl text-yellow-300 font-black floating-up drop-shadow-[0_0_10px_rgba(253,224,71,1)] flex items-center">
                      +{addedAmount} <Sparkles className="w-4 h-4 ml-1 animate-spin" />
                    </span>
                  )}
                  
                  <span className="text-xl font-medium opacity-90 ml-1">credits</span>
                </span>
              </div>
            )}

            <div className="inline-block bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-xs font-medium z-10 relative border border-white/20 shadow-sm">
              ₹ 1 = 1 credit
            </div>
            
            <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
              <Package className="w-32 h-32" />
            </div>
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

            {/* --- MODIFIED: Buy Credits Section is now above List Items --- */}
            <div className="bg-[#F8F6FF] rounded-3xl p-5 relative overflow-hidden mb-4 border border-[#EBE5F7] hover:shadow-md transition-shadow">
              <div className="w-full relative z-10">
                <h3 className="font-bold text-gray-900 mb-1">Buy Credits</h3>
                <p className="text-xs text-gray-500 font-medium mb-4 w-2/3">
                  Get credits instantly by buying them with real money.
                </p>
                
                <div className="flex flex-row items-center gap-3">
                  <button 
                    onClick={() => setShowPaymentForm(!showPaymentForm)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 transition-all duration-300 relative overflow-hidden group ${
                      showPaymentForm 
                      ? 'bg-white border border-gray-200 text-gray-700 shadow-sm hover:bg-gray-50'
                      : 'bg-gradient-to-r from-[#A388E1] to-[#805ad5] text-white shadow-[0_4px_12px_rgba(163,136,225,0.3)] hover:shadow-[0_6px_15px_rgba(163,136,225,0.4)] hover:-translate-y-0.5'
                    }`}
                  >
                    {!showPaymentForm && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] animate-[glare_3s_infinite_ease-in-out]"></div>}
                    <Coins className="w-4 h-4 relative z-10" /> 
                    <span className="relative z-10">{showPaymentForm ? 'Cancel' : 'Add Credits'}</span>
                  </button>
                  <button 
                    onClick={openHistoryModal} 
                    className="bg-white border border-[#EBE5F7] text-[#A388E1] px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-sm hover:bg-[#F0ECF9] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                  >
                    <History className="w-4 h-4" /> History
                  </button>
                </div>
              </div>

              {/* Added: Premium Credit Packs Display */}
              <AnimatePresence>
                {showPaymentForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="relative z-10 overflow-hidden"
                  >
                    <div className="pt-5 border-t border-[#EBE5F7] space-y-6">
                      
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-3 gap-3"
                      >
                        {CREDIT_PACKS.map((pack) => (
                          <motion.button
                            key={pack.id}
                            variants={itemVariants}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={processing}
                            /* --- MODIFIED: Added 'group' class to trigger hover animations for the internal token --- */
                            onClick={() => handlePayment(pack.id)}
                            className={`relative pt-4 pb-3 px-2 rounded-2xl flex flex-col items-center justify-center text-center transition-shadow duration-300 group ${
                              pack.highlight 
                                ? 'bg-gradient-to-br from-[#A388E1] via-[#8c67d6] to-[#6b46c1] text-white shadow-[0_8px_20px_rgba(163,136,225,0.4)] ring-2 ring-[#A388E1]/50 border-none' 
                                : 'bg-white border-2 border-gray-100 hover:border-[#A388E1]/30 hover:shadow-md'
                            }`}
                          >
                            {pack.highlight && (
                              <div className="absolute -top-3 bg-gradient-to-r from-[#FFE28A] to-[#F59E0B] text-yellow-900 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-yellow-900" /> Popular
                              </div>
                            )}
                            
                            {/* --- MODIFIED: Replaced generic Coins icon with a 3D premium token --- */}
                            <div className={`relative mb-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${pack.highlight ? 'w-10 h-10' : 'w-8 h-8'}`}>
                              <div className="absolute inset-0 rounded-full shadow-[0_4px_10px_rgba(217,119,6,0.4),inset_0_-2px_4px_rgba(146,64,14,0.6),inset_0_2px_3px_rgba(255,255,255,0.9)] border border-[#FEF08A] bg-gradient-to-br from-[#FEF08A] via-[#F59E0B] to-[#92400E] flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-[2px] rounded-full border-[0.5px] border-[#92400E]/50 bg-gradient-to-tl from-[#FEF08A]/20 via-transparent to-[#D97706]/40 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
                                  <span className={`font-black text-[#78350F] tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] ${pack.highlight ? 'text-xs' : 'text-[10px]'}`}>Cr</span>
                                </div>
                                <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] group-hover:animate-[glare_1.5s_ease-in-out]"></div>
                              </div>
                            </div>
                            {/* --- END MODIFIED --- */}
                            
                            <div className="flex items-baseline gap-0.5 mb-1">
                              <span className={`text-xl font-black leading-none tracking-tight ${pack.highlight ? 'text-white' : 'text-gray-900'}`}>
                                {pack.credits}
                              </span>
                            </div>
                            
                            <span className={`text-[9px] font-bold uppercase tracking-wider mb-3 ${pack.highlight ? 'text-purple-200' : 'text-gray-400'}`}>
                              Credits
                            </span>
                            
                            <div className={`mt-auto py-1.5 px-3 rounded-xl text-xs font-black w-full transition-colors ${
                              pack.highlight 
                                ? 'bg-white/20 text-white backdrop-blur-sm border border-white/10' 
                                : 'bg-gray-50 text-gray-700 group-hover:bg-[#F8F6FF] group-hover:text-[#6B46C1]'
                            }`}>
                              ₹{pack.price}
                            </div>
                            
                            <div className={`absolute -bottom-2.5 px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wide shadow-sm flex items-center gap-1 ${
                              pack.highlight 
                                ? 'bg-[#FFE28A] text-yellow-900 border border-yellow-400' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {pack.highlight && <Sparkles className="w-2.5 h-2.5 text-yellow-700" />}
                              {pack.bonus}
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-[#EBE5F7] to-[#EBE5F7] flex-1"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-[#F8F6FF] px-2">OR CUSTOM AMOUNT</span>
                        <div className="h-px bg-gradient-to-r from-[#EBE5F7] via-[#EBE5F7] to-transparent flex-1"></div>
                      </div>

                      <form onSubmit={handleCustomSubmit} className="relative">
                        <div className="flex gap-2 items-center bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm focus-within:border-[#A388E1] focus-within:ring-2 focus-within:ring-[#A388E1]/20 transition-all">
                          <div className="relative flex-1 flex items-center">
                            <span className="pl-4 text-gray-500 font-bold text-lg">₹</span>
                            <input 
                              type="number" 
                              min="10"
                              required
                              value={customAmount}
                              onChange={(e) => setCustomAmount(e.target.value)}
                              placeholder="Amount (Min ₹10)"
                              className="w-full bg-transparent pl-2 pr-3 py-2 text-sm focus:outline-none font-bold text-gray-900 placeholder:text-gray-400"
                              disabled={processing}
                            />
                          </div>
                          <button 
                            type="submit"
                            disabled={!customAmount || customAmount < 10 || processing}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-1 relative overflow-hidden ${
                              !customAmount || customAmount < 10 || processing
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-black hover:shadow-md hover:-translate-y-0.5'
                            }`}
                          >
                            <span className="relative z-10">{processing ? 'Processing...' : 'Pay Now'}</span> 
                            {!processing && <ChevronRight className="w-4 h-4 relative z-10" />}
                          </button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* --- END MODIFIED --- */}

              <div className="absolute right-[-10px] top-[10px] w-24 h-24 bg-[#EBE5F7] rounded-full opacity-50 flex items-center justify-center pointer-events-none">
                <CreditCard className="w-10 h-10 text-[#A388E1]" />
              </div>
            </div>

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
              <Link to="/add-item" className="bg-[#FFE28A] text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(250,204,21,0.25)] hover:bg-[#FFD75E] transition relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-[glare_2.5s_infinite_ease-in-out]"></div>
                <Plus className="w-4 h-4 relative z-10" /> <span className="relative z-10">List an Item</span>
              </Link>
              
              <div className="absolute right-[-10px] bottom-[-10px] w-28 h-28 bg-[#EBE5F7] rounded-full opacity-50 flex items-center justify-center">
                <Wallet className="w-12 h-12 text-[#A388E1]" />
              </div>
            </div>

            <div className="bg-[#FFF9E5] rounded-3xl p-5 relative overflow-hidden border border-[#FFE28A]/50 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-900 mb-1">Got unused items?</h3>
              <h4 className="font-bold text-gray-900 mb-1 text-sm">Sell them to earn credits now!</h4>
              <p className="text-xs text-gray-600 font-medium mb-4 w-2/3 relative z-10 leading-relaxed">
                Get credits instantly by trading in items you no longer use.
              </p>
              <Link to="/add-item" className="bg-gradient-to-r from-[#FFE28A] to-[#FFD75E] text-gray-900 px-5 py-2.5 rounded-full text-sm font-bold inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(250,204,21,0.25)] hover:shadow-[0_6px_15px_rgba(250,204,21,0.3)] hover:-translate-y-0.5 transition-all relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-[glare_3s_infinite_ease-in-out]"></div>
                <Plus className="w-4 h-4 relative z-10" /> <span className="relative z-10">List Item</span>
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

              {/* RESTORED: Horizontal Scroll Layout for Filters */}
              <div className="px-5 py-3 border-b border-gray-100 bg-white shrink-0 flex gap-2 overflow-x-auto hide-scrollbar flex-nowrap">
                <button 
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'all' ? 'bg-gradient-to-r from-[#6B46C1] to-[#805ad5] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <List className="w-3.5 h-3.5" /> All History
                </button>
                <button 
                  onClick={() => handleFilterChange('wallet_recharge')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'wallet_recharge' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <Wallet className="w-3.5 h-3.5" /> Recharges
                </button>
                <button 
                  onClick={() => handleFilterChange('shipping_fee')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'shipping_fee' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <Truck className="w-3.5 h-3.5" /> Shipping
                </button>
                <button 
                  onClick={() => handleFilterChange('order_refund')}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'order_refund' ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Refunds
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
                        const txType = tx.transactionType || 'wallet_recharge';
                        const isShipping = txType === 'shipping_fee';
                        const isRefund = txType === 'order_refund' || txType === 'shipping_refund';
                        const isRecharge = txType === 'wallet_recharge';
                        const isSuccess = tx.status === 'success';
                        const isFailed = tx.status === 'failed';

                        let IconComponent = Clock;
                        let iconBg = 'bg-orange-50 text-orange-600';

                        if (isRefund) {
                          IconComponent = RefreshCcw;
                          iconBg = 'bg-purple-50 text-[#6B46C1]';
                        } else if (isShipping) {
                          IconComponent = Truck;
                          iconBg = 'bg-blue-50 text-blue-600';
                        } else if (isSuccess) {
                          IconComponent = ArrowDownLeft;
                          iconBg = 'bg-emerald-50 text-emerald-600';
                        } else if (isFailed) {
                          IconComponent = XCircle;
                          iconBg = 'bg-red-50 text-red-600';
                        }

                        let displayName = txType.replace('_', ' ');
                        let subText = '';

                        if (txType === 'order_refund') {
                          displayName = 'Credits Refunded';
                          subText = 'Instantly returned to Wallet';
                        } else if (txType === 'shipping_refund') {
                          displayName = 'Shipping Refunded';
                          subText = 'Sent to bank (takes 3-5 days)';
                        } else if (txType === 'wallet_recharge') {
                          displayName = 'Credits Purchased';
                          subText = 'Added to Wallet';
                        } else if (txType === 'shipping_fee') {
                          displayName = 'Shipping Paid';
                          subText = 'Online payment via Razorpay';
                        }

                        let amountPrefix = '+';
                        if (isShipping) amountPrefix = '-';
                        if (isFailed) amountPrefix = '';

                        let currencySymbol = (isShipping || txType === 'shipping_refund' || isRecharge) ? '₹' : '';
                        let showCr = !currencySymbol;

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
                              <div className={`p-2.5 rounded-xl ${iconBg}`}>
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm capitalize">
                                  {displayName}
                                </p>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                                  {new Date(tx.createdAt || tx.created_at).toLocaleDateString()} at {new Date(tx.createdAt || tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {subText}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`font-black text-sm ${isShipping ? 'text-gray-800' : isSuccess || isRefund ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {amountPrefix}
                                {currencySymbol}{tx.amount} 
                                {showCr && <span className="text-[10px] font-bold text-gray-500 ml-1">CR</span>}
                              </p>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isSuccess ? 'text-emerald-500' : isFailed ? 'text-red-500' : 'text-orange-500'}`}>
                                {tx.status}
                              </p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

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

      {showCelebration && <CoinCelebration coinCount={40} />}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes glare {
          0%, 20% { transform: translateX(-150%) skewX(-25deg); }
          80%, 100% { transform: translateX(250%) skewX(-25deg); }
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