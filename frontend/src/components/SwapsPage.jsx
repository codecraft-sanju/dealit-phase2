import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { 
  RefreshCw, Check, X, MessageSquare, Package, Eye, AlertCircle, 
  ArrowRightLeft, ChevronLeft, ExternalLink, Truck, Users, MapPin, 
  Home, Hash, Phone, User as UserIcon, Loader2, 
  Clock, Coins 
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// CHANGED: Imported the newly created CountdownTimer component
import CountdownTimer from './CountdownTimer';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// CHANGED: Removed the CountdownTimer component from this file since it is now imported from CountdownTimer.jsx

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SwapsPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received');
  
  const [receivedSwaps, setReceivedSwaps] = useState([]);
  const [sentSwaps, setSentSwaps] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState({ id: null, message: '' });

  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [activeSwap, setActiveSwap] = useState(null);
  
  const [flowType, setFlowType] = useState('owner_accept'); 

  const savedAddresses = user?.savedAddresses || [];
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(savedAddresses.length > 0 ? 0 : -1);
  const [shippingCost, setShippingCost] = useState(60);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  
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

  const [autoCancelHours, setAutoCancelHours] = useState(24);
  const [auraPenalty, setAuraPenalty] = useState(50);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/public-settings`);
        if (res.data.success) {
          if (res.data.data.autoCancelHours) setAutoCancelHours(res.data.data.autoCancelHours);
          if (res.data.data.auraPenalty !== undefined) setAuraPenalty(res.data.data.auraPenalty);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedAddressIndex >= 0 && savedAddresses[selectedAddressIndex]) {
      const addr = savedAddresses[selectedAddressIndex];
      setFormData({
        fullName: addr.fullName || '', phone: addr.phone || '', houseNo: addr.houseNo || '',
        areaStreet: addr.areaStreet || '', landmark: addr.landmark || '', city: addr.city || '',
        state: addr.state || '', pincode: addr.pincode || ''
      });
    } else if (selectedAddressIndex === -1) {
      setFormData({
        fullName: user?.full_name || '', phone: user?.phone || '', houseNo: '',
        areaStreet: '', landmark: '', city: user?.city || '', state: '', pincode: ''
      });
    }
  }, [selectedAddressIndex, user]);

  useEffect(() => {
    const fetchDynamicShippingCost = async () => {
      if (formData.pincode && formData.pincode.length >= 6 && activeSwap) {
        setIsCalculatingShipping(true);
        setActionError({ id: null, message: '' });
        try {
          const res = await axios.post(`${API_URL}/orders/calculate-shipping`, {
            itemId: activeSwap.offeredItem._id, 
            pincode: formData.pincode
          }, { withCredentials: true });
          
          if (res.data.success) {
            setShippingCost(res.data.shippingCost);
          }
        } catch (err) {
          console.error('Error calculating dynamic shipping:', err);
          setActionError({ id: 'modal', message: 'Failed to calculate shipping. Check pincode.' });
        } finally {
          setIsCalculatingShipping(false);
        }
      }
    };
    const timeoutId = setTimeout(fetchDynamicShippingCost, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.pincode, activeSwap]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (selectedAddressIndex !== -1) setSelectedAddressIndex(-1);
  };

  useEffect(() => {
    if (!user) return;
    const fetchAllSwaps = async () => {
      setLoading(true);
      setActionError({ id: null, message: '' });
      try {
        const [receivedRes, sentRes] = await Promise.all([
          axios.get(`${API_URL}/barter/received`, { withCredentials: true }),
          axios.get(`${API_URL}/barter/sent`, { withCredentials: true })
        ]);
        
        setReceivedSwaps(receivedRes.data.data || []);
        setSentSwaps(sentRes.data.data || []);
      } catch (error) {
        console.error('Error fetching swaps:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSwaps();
  }, [user]); 

  if (!user) return <Navigate to="/login" />;

  const handleStatusUpdate = async (swapId, newStatus, extraPayload = {}) => {
    setProcessingId(swapId);
    setActionError({ id: null, message: '' }); 
    try {
      const response = await axios.put(`${API_URL}/barter/${swapId}/status`, 
        { status: newStatus, ...extraPayload },
        { withCredentials: true }
      );
      if (response.data.success) {
        const updatedStatus = response.data.data.status || newStatus;
        setReceivedSwaps(receivedSwaps.map(s => s._id === swapId ? { ...s, status: updatedStatus, expiresAt: response.data.data.expiresAt } : s));
        setSentSwaps(sentSwaps.map(s => s._id === swapId ? { ...s, status: updatedStatus, expiresAt: response.data.data.expiresAt } : s));
        
        if (updatedStatus === 'ACCEPTED') {
          navigate(`/deal/${swapId}`);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setActionError({ 
        id: swapId, 
        message: error.response?.data?.message || 'Failed to update status' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequesterPaymentComplete = async (swapId, extraPayload = {}) => {
    setProcessingId(swapId);
    setActionError({ id: null, message: '' });
    try {
      const response = await axios.put(`${API_URL}/barter/${swapId}/complete-payment`, 
        extraPayload,
        { withCredentials: true }
      );
      if (response.data.success) {
        const updatedStatus = response.data.data.status;
        setReceivedSwaps(receivedSwaps.map(s => s._id === swapId ? { ...s, status: updatedStatus } : s));
        setSentSwaps(sentSwaps.map(s => s._id === swapId ? { ...s, status: updatedStatus } : s));
        navigate(`/deal/${swapId}`);
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      setActionError({ id: 'modal', message: error.response?.data?.message || 'Failed to complete payment' });
    } finally {
      setProcessingId(null);
    }
  };

  const openAcceptFlow = (swap, type = 'owner_accept') => {
    setActiveSwap(swap);
    setFlowType(type);
    setAcceptModalOpen(true);
    setActionError({ id: null, message: '' });
  };

  const handleCourierPayment = async (e) => {
    e.preventDefault();
    if (!/\d/.test(formData.houseNo)) {
      setActionError({ id: 'modal', message: 'Please include at least one number in your House No.' });
      return;
    }
    
    setProcessingId(activeSwap._id);
    setActionError({ id: null, message: '' });

    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      setActionError({ id: 'modal', message: 'Failed to load Razorpay. Check internet connection.' });
      setProcessingId(null);
      return;
    }

    try {
      const orderResponse = await axios.post(`${API_URL}/payment/create-order`, 
        { amount: shippingCost }, { withCredentials: true }
      );
      const orderData = orderResponse.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Dealit',
        description: `Shipping Fee for Swap`,
        order_id: orderData.id,
        handler: async function (response) {
          const paymentData = {
            amount: shippingCost,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          };
          
          if (flowType === 'owner_accept') {
            await handleStatusUpdate(activeSwap._id, 'ACCEPTED', {
              shippingAddress: formData,
              paymentDetails: paymentData
            });
          } else if (flowType === 'requester_pay') {
            await handleRequesterPaymentComplete(activeSwap._id, {
              shippingAddress: formData,
              paymentDetails: paymentData
            });
          }
          setAcceptModalOpen(false);
        },
        prefill: {
          name: formData.fullName,
          email: user?.email || '',
          contact: formData.phone,
        },
        theme: { color: '#6B46C1' },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response) {
        setActionError({ id: 'modal', message: `Payment Failed! Reason: ${response.error.description}` });
        setProcessingId(null);
      });
      paymentObject.open();

    } catch (err) {
      setActionError({ id: 'modal', message: err.response?.data?.message || 'Payment initiation failed.' });
      setProcessingId(null);
    }
  };

  const displaySwaps = activeTab === 'received' ? receivedSwaps : sentSwaps;

  // --- CHANGES START HERE: Computed values for credit differences ---
  const targetValue = activeSwap?.requestedItem?.estimated_value || 0;
  const offeredValue = activeSwap?.offeredItem?.estimated_value || 0;
  const requiredCredits = Math.max(0, targetValue - offeredValue);
  const userCredits = user?.account_credits || 0;
  const hasEnoughCredits = flowType === 'requester_pay' ? userCredits >= requiredCredits : true;
  // --- CHANGES END HERE ---

  return (
    <div className="max-w-md mx-auto bg-[#f4f2f9] min-h-screen pb-2 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-40 bg-[#f4f2f9]">
        <div className="bg-[#6B46C1] pt-6 pb-12 px-5 md:px-8 rounded-b-[2rem] shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">My Swaps</h1>
              <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Review offers and lock deals</p>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-8 -mt-7 relative z-20 pb-4">
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-2">
            <button 
              onClick={() => { setActiveTab('received'); setActionError({ id: null, message: '' }); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'received' 
                  ? 'bg-[#EBE5F7] text-[#6B46C1] shadow-sm' 
                  : 'text-gray-500 hover:text-[#6B46C1] hover:bg-gray-50'
              }`}
            >
              Received ({receivedSwaps.length})
            </button>
            <button 
              onClick={() => { setActiveTab('sent'); setActionError({ id: null, message: '' }); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'sent' 
                  ? 'bg-[#EBE5F7] text-[#6B46C1] shadow-sm' 
                  : 'text-gray-500 hover:text-[#6B46C1] hover:bg-gray-50'
              }`}
            >
              Sent ({sentSwaps.length})
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 relative z-10">
        <div className="space-y-5">
          {loading ? (
            <div className="space-y-5">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-[2rem] p-5 md:p-7 animate-pulse">
                  <div className="h-6 w-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-24 w-full bg-gray-100 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : displaySwaps.length === 0 ? (
            <div className="text-center bg-white border border-gray-100 rounded-[2rem] py-16 px-6 shadow-sm">
              <div className="bg-[#f8f6ff] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-[#A388E1]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No trades found</h3>
              <p className="text-sm text-gray-500">You don't have any {activeTab} offers right now.</p>
            </div>
          ) : (
            displaySwaps.map((swap) => {
              // --- CHANGES START HERE: Card Level Credit Calculations ---
              const itemTargetVal = swap.requestedItem?.estimated_value || 0;
              const itemOfferVal = swap.offeredItem?.estimated_value || 0;
              const cardCreditDiff = Math.max(0, itemTargetVal - itemOfferVal);
              
              let creditMessage = '';
              let creditSubtext = '';
              let isDeducted = false;

              if (cardCreditDiff > 0) {
                if (activeTab === 'sent') {
                  if (swap.status === 'ACCEPTED') {
                    creditMessage = `${cardCreditDiff} Credits Deducted`;
                    creditSubtext = 'Paid from your wallet';
                    isDeducted = true;
                  } else if (swap.status === 'CANCELLED' || swap.status === 'REJECTED') {
                    creditMessage = `${cardCreditDiff} Credits Not Deducted`;
                    creditSubtext = 'Deal was closed or expired';
                  } else {
                    creditMessage = `${cardCreditDiff} Credits Required`;
                    creditSubtext = 'Will be deducted upon payment';
                  }
                } else {
                  creditMessage = `${cardCreditDiff} Credits Covered`;
                  creditSubtext = 'Requester pays the difference';
                }
              }
              // --- CHANGES END HERE ---

              return (
                <div key={swap._id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-[2rem] p-5 md:p-7">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-5 border-b border-gray-100 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        #{swap._id.substring(0, 8)}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                        swap.status === 'GHOSTING' ? 'bg-orange-100 text-orange-700' : 
                        swap.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                        swap.status === 'AWAITING_PAYMENT' ? 'bg-purple-100 text-purple-700' :
                        swap.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        swap.status === 'CANCELLED' ? 'bg-gray-200 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {swap.status.replace('_', ' ')} {swap.status === 'GHOSTING' && '👻'} {swap.status === 'CANCELLED' && '🚫'} {swap.status === 'AWAITING_PAYMENT' && '⏳'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                      {activeTab === 'received' && swap.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openAcceptFlow(swap, 'owner_accept')}
                            disabled={processingId === swap._id}
                            className="flex-1 md:flex-none bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {processingId === swap._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(swap._id, 'REJECTED')}
                            disabled={processingId === swap._id}
                            className="flex-1 md:flex-none bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#C5221F] px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}

                      {activeTab === 'sent' && swap.status === 'AWAITING_PAYMENT' && (
                        <button
                          onClick={() => openAcceptFlow(swap, 'requester_pay')}
                          disabled={processingId === swap._id}
                          className="flex-1 md:flex-none bg-[#6B46C1] hover:bg-[#5a3aa3] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          {processingId === swap._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Complete Payment
                        </button>
                      )}
                      
                      {swap.status === 'ACCEPTED' && (
                        <Link
                          to={`/deal/${swap._id}`}
                          className="flex-1 md:flex-none bg-[#F8F9FA] hover:bg-[#EBE5F7] text-[#6B46C1] px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-[#d6bcfa]"
                        >
                          <ExternalLink className="w-4 h-4" /> View Deal Details
                        </Link>
                      )}
                    </div>
                  </div>

                  {activeTab === 'received' && swap.status === 'PENDING' && (
                    <div className="mb-6 bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                      <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-orange-800 font-medium leading-relaxed w-full">
                        <span className="font-bold text-orange-900 block mb-1">Action Required:</span> 
                        Please accept or reject this offer within <span className="font-bold">{autoCancelHours} hours</span>.
                        <div className="text-red-600 font-bold flex items-center gap-1.5 mt-1.5 mb-1.5 bg-red-50/50 w-fit px-2 py-1 rounded-md border border-red-100">
                          <Clock className="w-3.5 h-3.5" /> Time Left: <span className="animate-pulse"><CountdownTimer createdAt={swap.created_at} hours={autoCancelHours} /></span>
                        </div>
                        Failure to respond will mark this as Ghosting and result in a <span className="font-bold text-red-600">{auraPenalty} Aura point penalty</span> on Dealit.
                      </div>
                    </div>
                  )}

                  {activeTab === 'received' && swap.status === 'AWAITING_PAYMENT' && (
                    <div className="mb-6 bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                      <Clock className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-purple-800 font-medium leading-relaxed w-full">
                        <span className="font-bold text-purple-900 block mb-1">Waiting for Partner:</span> 
                        You have accepted and paid your shipping. The requester has 24 hours to pay their side.
                        <div className="text-purple-600 font-bold flex items-center gap-1.5 mt-1.5 bg-purple-100/50 w-fit px-2 py-1 rounded-md border border-purple-200">
                          <Clock className="w-3.5 h-3.5" /> Time Left: <span className="animate-pulse"><CountdownTimer expiresAt={swap.expiresAt} /></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'sent' && swap.status === 'AWAITING_PAYMENT' && (
                    <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                      <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="text-xs text-green-800 font-medium leading-relaxed w-full">
                        <span className="font-bold text-green-900 block mb-1">Partner Accepted! </span> 
                        The owner has accepted your deal and paid shipping. Complete your payment to lock the deal.
                        <div className="text-red-600 font-bold flex items-center gap-1.5 mt-1.5 mb-1 bg-red-50/50 w-fit px-2 py-1 rounded-md border border-red-100">
                          <Clock className="w-3.5 h-3.5" /> Time Left: <span className="animate-pulse"><CountdownTimer expiresAt={swap.expiresAt} /></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'sent' && swap.status === 'PENDING' && (
                    <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                      <Clock className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-xs text-blue-800 font-medium leading-relaxed w-full">
                        <span className="font-bold text-blue-900 block mb-1">Awaiting Response:</span> 
                        The receiver has <span className="font-bold">{autoCancelHours} hours</span> to accept your offer.
                        <div className="text-blue-600 font-bold flex items-center gap-1.5 mt-1.5 bg-blue-100/50 w-fit px-2 py-1 rounded-md border border-blue-200">
                          <Clock className="w-3.5 h-3.5" /> Time Left: <span className="animate-pulse"><CountdownTimer createdAt={swap.created_at} hours={autoCancelHours} /></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {actionError.id === swap._id && (
                    <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-700 mb-0.5">Action Failed</p>
                        <p className="text-sm text-red-600">{actionError.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative">
                    <div className="flex-1 w-full bg-[#fcfbff] rounded-2xl p-4 md:p-5 border border-[#f0eaff]">
                      <p className="text-[10px] text-[#A388E1] font-extrabold uppercase tracking-wider mb-3">
                        {activeTab === 'received' ? 'They are offering' : 'You are requesting'}
                      </p>
                      <div className="flex items-center gap-4">
                        {swap.offeredItem?.images && swap.offeredItem.images[0] ? (
                           <img src={swap.offeredItem.images[0]} alt="Item" className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-gray-100 shadow-sm" />
                        ) : (
                           <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
                             <Package className="w-8 h-8 text-gray-300"/>
                           </div>
                        )}
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 line-clamp-1">{swap.offeredItem?.title || 'Unknown Item'}</h3>
                          <button className="text-[#805ad5] text-xs font-bold flex items-center gap-1 hover:underline bg-[#f4f2f9] px-2.5 py-1 rounded-md w-fit">
                            <Eye className="w-3.5 h-3.5" /> View Item
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:relative md:translate-x-0 md:translate-y-0 z-10">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-100 shadow-md">
                        <ArrowRightLeft className="w-5 h-5 text-[#A388E1] md:rotate-0 rotate-90" />
                      </div>
                    </div>

                    <div className="flex-1 w-full bg-[#fcfbff] rounded-2xl p-4 md:p-5 border border-[#f0eaff]">
                      <p className="text-[10px] text-[#A388E1] font-extrabold uppercase tracking-wider mb-3">
                        {activeTab === 'received' ? 'For your item' : 'From your items'}
                      </p>
                      <div className="flex items-center gap-4">
                        {swap.requestedItem?.images && swap.requestedItem.images[0] ? (
                           <img src={swap.requestedItem.images[0]} alt="Item" className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-gray-100 shadow-sm" />
                        ) : (
                           <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
                             <Package className="w-8 h-8 text-gray-300"/>
                           </div>
                        )}
                        <div>
                          <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 line-clamp-1">{swap.requestedItem?.title || 'Unknown Item'}</h3>
                          <p className="text-xs text-gray-500 font-medium mb-2">{swap.requestedItem?.condition || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* --- CHANGES START HERE: Visual badge indicating credit logic on the card itself --- */}
                  {cardCreditDiff > 0 && (
                    <div className="mt-5 bg-[#fff8f1] border border-[#ffeadd] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Coins className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-orange-900">{creditMessage}</span>
                          <span className="text-[11px] font-medium text-orange-700/80">{creditSubtext}</span>
                        </div>
                      </div>
                      {activeTab === 'sent' && !isDeducted && swap.status !== 'CANCELLED' && swap.status !== 'REJECTED' && (
                        <span className="text-xs font-black text-red-500 bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                          Action Pending
                        </span>
                      )}
                      {isDeducted && (
                        <span className="text-xs font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-md border border-green-100 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Paid
                        </span>
                      )}
                    </div>
                  )}
                  {/* --- CHANGES END HERE --- */}

                </div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {acceptModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:px-4"
          >
            <motion.div 
              initial={{ y: '100%', opacity: 0.5, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white w-full max-w-lg rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Shipping Details
                  </h2>
                </div>
                <button onClick={() => setAcceptModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-[#f8f9fb]">
                {actionError.id === 'modal' && (
                  <div className="mb-5 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{actionError.message}</p>
                  </div>
                )}

                <div className="mb-6 bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#6B46C1]" /> Deal Summary
                  </h3>
                  
                  {flowType === 'owner_accept' ? (
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>You are accepting <strong>{activeSwap?.offeredItem?.title}</strong> in exchange for your <strong>{activeSwap?.requestedItem?.title}</strong>.</p>
                      <div className="bg-purple-50 p-3 rounded-xl mt-3 flex gap-2 border border-purple-100">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-800">
                          Pay the shipping fee to lock this deal. The requester will then have 24 hours to pay their side. 
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>The owner accepted your offer for <strong>{activeSwap?.requestedItem?.title}</strong>!</p>
                      
                      {requiredCredits > 0 ? (
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-orange-800 flex items-center gap-1"><Coins className="w-3.5 h-3.5"/> Value Difference:</span>
                            <span className="text-sm font-black text-orange-700">{requiredCredits} Credits</span>
                          </div>
                          <p className="text-[11px] text-orange-700/80 leading-tight mb-2">
                            The requested item has a higher value than your offer. You need to pay the difference in credits to finalize the deal.
                          </p>
                          <div className="flex justify-between items-center text-xs pt-2 border-t border-orange-200/60 mt-2">
                            <span className="text-orange-900">Your Balance: <strong>{userCredits} Credits</strong></span>
                            {!hasEnoughCredits && <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-md">Insufficient</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-100 p-3 rounded-xl mt-2 text-xs text-green-800 flex gap-2">
                          <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          <p>No credit difference to pay. This is an equal or better value swap!</p>
                        </div>
                      )}

                      <div className="bg-purple-50 p-3 rounded-xl mt-3 flex gap-2 border border-purple-100">
                        <Truck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-800">
                          Pay your shipping fee below to fully lock the deal and generate the shipping labels.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <form id="courier-form" onSubmit={handleCourierPayment} className="space-y-5">
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-700">Select Delivery Address</p>
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto hide-scrollbar">
                        {savedAddresses.map((addr, idx) => (
                          <div 
                            key={idx} onClick={() => setSelectedAddressIndex(idx)}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedAddressIndex === idx ? 'border-[#6B46C1] bg-[#f8f6ff]' : 'border-gray-100 bg-white'
                            }`}
                          >
                            <h4 className="font-bold text-gray-900 text-sm mb-1">{addr.fullName}</h4>
                            <p className="text-xs text-gray-500 truncate">{addr.houseNo}, {addr.city} - {addr.pincode}</p>
                          </div>
                        ))}
                        <div 
                          onClick={() => setSelectedAddressIndex(-1)}
                          className={`p-3 text-center rounded-xl border-2 border-dashed cursor-pointer font-bold text-sm ${
                            selectedAddressIndex === -1 ? 'border-[#6B46C1] text-[#6B46C1] bg-[#f8f6ff]' : 'border-gray-200 text-gray-500 bg-white'
                          }`}
                        >
                          + Add New Address
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedAddressIndex === -1 || savedAddresses.length === 0) && (
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input type="text" name="fullName" placeholder="Full Name" required value={formData.fullName} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input type="tel" name="phone" placeholder="Phone" required value={formData.phone} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                        </div>
                      </div>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input type="text" name="houseNo" placeholder="House No. (Required)" required value={formData.houseNo} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                      </div>
                      
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input type="text" name="areaStreet" placeholder="Area, Street, Sector" required value={formData.areaStreet} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 opacity-50" />
                        <input type="text" name="landmark" placeholder="Landmark (Optional)" value={formData.landmark} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input type="text" name="city" placeholder="City" required value={formData.city} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                        </div>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input type="text" name="state" placeholder="State" required value={formData.state} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                        </div>
                      </div>

                      <div className="relative">
                        <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input type="text" name="pincode" placeholder="Pincode" required value={formData.pincode} onChange={handleInputChange} maxLength="6" className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6B46C1]" />
                      </div>

                    </div>
                  )}
                </form>
              </div>

              <div className="p-5 border-t border-slate-100 bg-white">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-gray-600 text-sm">Shipping Fee</span>
                  <span className="font-black text-[#6B46C1] text-lg">
                    {isCalculatingShipping ? <Loader2 className="w-5 h-5 animate-spin" /> : `₹ ${shippingCost}`}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit" form="courier-form"
                    disabled={processingId === activeSwap?._id || isCalculatingShipping || !hasEnoughCredits}
                    className="flex-1 bg-[#6B46C1] text-white rounded-xl font-bold shadow-md hover:bg-[#5a3aa3] transition disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    {processingId === activeSwap?._id ? <Loader2 className="w-5 h-5 animate-spin" /> : (!hasEnoughCredits ? 'Insufficient Credits' : 'Pay & Confirm')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SwapsPage;