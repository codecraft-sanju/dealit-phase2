// DealDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Check, ArrowLeft, MessageSquare, Package, User, ShieldAlert, Phone, Calendar, Copy, Clock, X, AlertCircle, Truck, Coins, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; 
import { getOptimizedCloudinaryUrl } from './HomePage'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// CountdownTimer for AWAITING_PAYMENT state
const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      if (!expiresAt) return '00h 00m 00s';
      
      const expireDate = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expireDate - now;

      if (diff <= 0) return '00h 00m 00s';

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      return `${h}h ${m}m ${s}s`;
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt]);

  return <span>{timeLeft}</span>;
};

const DealDetailsPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: deal, isLoading: loading, error } = useQuery({
    queryKey: ['dealDetails', id],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/barter/${id}`, { withCredentials: true });
      if (!response.data.success) {
        throw new Error('Failed to load deal details.');
      }
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, 
  });

  const handleCopyId = () => {
    if (deal) {
      navigator.clipboard.writeText(deal._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative overflow-hidden">
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] px-5 py-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 bg-white/20 rounded-full animate-pulse"></div>
            <div className="space-y-2 flex-1">
              <div className="w-32 h-5 bg-white/20 rounded animate-pulse"></div>
              <div className="w-20 h-3 bg-white/20 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"></div>

        <div className="max-w-xl mx-auto px-5 md:px-8 pt-24 relative z-20">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-gray-100 text-center">
            
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-5 animate-pulse"></div>
            
            <div className="w-48 h-8 bg-gray-200 rounded-lg mx-auto mb-3 animate-pulse"></div>
            <div className="w-32 h-4 bg-gray-200 rounded mx-auto mb-6 animate-pulse"></div>
            
            <div className="w-full h-3 bg-gray-200 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="w-4/5 h-3 bg-gray-200 rounded mx-auto mb-8 animate-pulse"></div>

            <div className="bg-[#fcfbff] rounded-2xl p-5 mb-6 text-left border border-[#f0eaff]">
              <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-20 h-2 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col">
                  <div className="w-20 h-2 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-24 w-full bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                  <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col">
                  <div className="w-20 h-2 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-24 w-full bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
                  <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm mt-4 space-y-3">
                <div className="w-32 h-2 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="flex justify-between items-center">
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="w-full h-14 bg-gray-200 rounded-xl mb-4 animate-pulse"></div>
            <div className="w-full h-20 bg-gray-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-500 mb-4">{error?.message || 'Deal not found'}</h2>
        <button onClick={() => navigate('/swaps')} className="bg-[#6B46C1] text-white px-6 py-2 rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  const isRequester = user?._id === deal.requester?._id;
  
  const counterpart = (isRequester ? deal.owner : deal.requester) || {};
  const counterpartItem = (isRequester ? deal.item : deal.offered_item) || {};
  const myItem = (isRequester ? deal.offered_item : deal.item) || {};

  const dealDate = new Date(deal.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const dealStatus = deal.status || 'PENDING';
  const isAccepted = dealStatus === 'ACCEPTED';
  const isAwaitingPayment = dealStatus === 'AWAITING_PAYMENT';

  // Determine my shipping cost based on role in deal
  const myShippingCost = isRequester
    ? (deal.requesterShippingCost ?? deal.shippingCost ?? 0)
    : (deal.ownerShippingCost ?? deal.shippingCost ?? 0);

  const counterpartShippingCost = isRequester
    ? (deal.ownerShippingCost ?? 0)
    : (deal.requesterShippingCost ?? 0);

  const formatMoney = (val) => val ? Number(val).toFixed(2) : '0.00';

  const myRawBreakdown = isRequester
    ? { base: deal.requesterBaseShippingCost, fee: deal.requesterPlatformFee, gst: deal.requesterGstAmount }
    : { base: deal.ownerBaseShippingCost, fee: deal.ownerPlatformFee, gst: deal.ownerGstAmount };

  // FIX: Properly checking for null/undefined instead of truthy to allow 0 base rate
  const myShippingBreakdown = myRawBreakdown.base != null ? {
    baseShipping: formatMoney(myRawBreakdown.base),
    platformFee: formatMoney(myRawBreakdown.fee),
    gstAmount: formatMoney(myRawBreakdown.gst),
    totalShippingCost: formatMoney(myShippingCost)
  } : null;

  // FIX: Calculate actual credits deducted based on estimated values
  const counterpartVal = counterpartItem?.estimated_value || 0;
  const myVal = myItem?.estimated_value || 0;
  const calculatedDeduction = Math.max(0, counterpartVal - myVal);

  const getStatusConfig = () => {
    switch (dealStatus) {
      case 'ACCEPTED':
        return {
          title: 'Deal Locked! 🎉',
          message: 'Congratulations! The barter request has been completed. You can now contact your exchange partner.',
          icon: <Check className="w-10 h-10 text-[#137333]" />,
          bgConfig: 'bg-[#E6F4EA]',
          borderColor: 'border-white'
        };
      case 'AWAITING_PAYMENT':
        return {
          title: 'Awaiting Payment ⏳',
          message: isRequester 
            ? 'The owner accepted! Please complete your shipping payment within 24 hours to lock this deal.' 
            : 'You accepted! Waiting for the requester to complete their payment within 24 hours.',
          icon: <Clock className="w-10 h-10 text-purple-500" />,
          bgConfig: 'bg-purple-100',
          borderColor: 'border-white'
        };
      case 'PENDING':
        return {
          title: 'Offer Pending ⏳',
          message: isRequester 
            ? 'Waiting for the other party to review your offer.' 
            : 'You have a pending offer. Head to your Swaps page to accept or reject it.',
          icon: <Clock className="w-10 h-10 text-amber-500" />,
          bgConfig: 'bg-amber-50',
          borderColor: 'border-white'
        };
      case 'REJECTED':
        return {
          title: 'Offer Rejected ❌',
          message: 'This barter offer was declined.',
          icon: <X className="w-10 h-10 text-red-500" />,
          bgConfig: 'bg-red-50',
          borderColor: 'border-white'
        };
      default: 
        return {
          title: 'Deal Inactive 🚫',
          message: 'This barter deal is no longer active or was cancelled.',
          icon: <AlertCircle className="w-10 h-10 text-gray-500" />,
          bgConfig: 'bg-gray-100',
          borderColor: 'border-white'
        };
    }
  };

  const statusDisplay = getStatusConfig();
  const whatsappMessage = `Hi ${counterpart?.full_name || 'there'}! 👋\n\nWe just locked a deal on *Dealit*! 🎉\n\nI will be exchanging my *${myItem?.title || 'Item'}* for your *${counterpartItem?.title || 'Item'}*.\n\nLet me know how you would like to proceed with the exchange. We can plan a meetup or coordinate via courier, whichever works best for you. Let's discuss!\n\nDeal ID: #${deal._id?.substring(0, 8)}`;

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-10 font-sans relative">
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] px-5 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/swaps')} 
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide text-white leading-tight">Deal Summary</h1>
            <div className="flex items-center gap-1.5 text-purple-200">
              <p className="text-xs font-medium">#{deal._id?.substring(0, 8)}</p>
              <button onClick={handleCopyId} className="hover:text-white transition-colors" title="Copy Deal ID">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"></div>

      <div className="max-w-xl mx-auto px-5 md:px-8 pt-24 relative z-20">
        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl border border-gray-100 text-center">
          
          <div className={`w-20 h-20 ${statusDisplay.bgConfig} rounded-full flex items-center justify-center mx-auto mb-5 border-4 ${statusDisplay.borderColor} shadow-lg`}>
            {statusDisplay.icon}
          </div>

          <h2 className="text-3xl font-black text-gray-900 mb-2">{statusDisplay.title}</h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-bold uppercase mb-4 tracking-wide">
            <Calendar className="w-4 h-4" /> 
            <span>Date: {dealDate}</span>
          </div>
          
          <p className="text-sm text-gray-500 mb-4 font-medium">
            {statusDisplay.message}
          </p>

          {/* AWAITING PAYMENT Timer Alert */}
          {isAwaitingPayment && (
            <div className={`mb-8 ${isRequester ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'} border p-4 rounded-xl flex items-start justify-center gap-3 shadow-sm`}>
              <Clock className={`w-5 h-5 ${isRequester ? 'text-orange-500' : 'text-purple-500'} shrink-0`} />
              <div className={`text-xs ${isRequester ? 'text-orange-800' : 'text-purple-800'} font-medium leading-relaxed text-left`}>
                <span className="font-bold block mb-1">{isRequester ? 'Action Required!' : 'Waiting on Partner'}</span> 
                {isRequester ? 'Complete your payment now to lock this deal.' : 'The deal will auto-cancel if they don\'t pay.'}
                <div className="text-red-600 font-bold flex items-center gap-1.5 mt-1.5 bg-red-50/50 w-fit px-2 py-1 rounded-md border border-red-100">
                  <Clock className="w-3.5 h-3.5" /> Time Left: <span className="animate-pulse"><CountdownTimer expiresAt={deal.expiresAt} /></span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#fcfbff] rounded-2xl p-5 mb-6 text-left border border-[#f0eaff]">

            {/* Partner Info */}
            <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 bg-[#EBE5F7] rounded-full flex items-center justify-center">
                {counterpart?.profilePic ? (
                  <img src={getOptimizedCloudinaryUrl(counterpart.profilePic)} alt="Owner" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-[#6B46C1]" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-[#A388E1] font-extrabold uppercase tracking-wider mb-0.5">Your Partner</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{counterpart?.full_name || 'Unknown User'}</p>
                <p className="text-sm text-gray-600 font-medium">
                  {isAccepted ? (counterpart?.phone || 'Phone not available') : '+91 XXXXX XXXXX'}
                </p>
              </div>
              {isAccepted && counterpart?.phone && (
                <a href={`tel:${counterpart.phone}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm">
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>

            {/* Item Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Link to={`/item/${counterpartItem?._id}`} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col hover:border-purple-300 transition-colors group">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 group-hover:text-purple-500">They are bringing</p>
                <div className="h-24 w-full bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                  {counterpartItem?.images && counterpartItem.images.length > 0 ? (
                    <img src={getOptimizedCloudinaryUrl(counterpartItem.images[0])} alt={counterpartItem?.title || 'Item'} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-800 line-clamp-2">{counterpartItem?.title || 'Unknown Item'}</p>
              </Link>

              <Link to={`/item/${myItem?._id}`} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex flex-col hover:border-purple-300 transition-colors group">
                <p className="text-[10px] text-[#A388E1] font-bold uppercase mb-2 group-hover:text-purple-600">You are giving</p>
                <div className="h-24 w-full bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                  {myItem?.images && myItem.images.length > 0 ? (
                    <img src={getOptimizedCloudinaryUrl(myItem.images[0])} alt={myItem?.title || 'Item'} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <p className="text-sm font-bold text-gray-800 line-clamp-2">{myItem?.title || 'Unknown Item'}</p>
              </Link>
            </div>

            {/* Swap Details & Credits */}
            <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm mt-4">
              <h3 className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider mb-3">Swap Details & Credits</h3>
              <div className="space-y-2 text-sm text-gray-700 font-medium">
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">Value of {myItem?.title || 'Item'}:</span>
                  <span className="whitespace-nowrap font-bold">{myVal} 🪙</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">Value of {counterpartItem?.title || 'Item'}:</span>
                  <span className="whitespace-nowrap font-bold">{counterpartVal} 🪙</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-2">
                  <span>Wallet Deduction:</span>
                  <span className={`font-bold ${isAccepted ? 'text-red-500' : 'text-gray-400'}`}>
                    {isAccepted ? `-${calculatedDeduction}` : 'Pending'} 🪙
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Fee Breakdown */}
            {(isAccepted || isAwaitingPayment) && (
              <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm mt-3">
                <h3 className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-[#A388E1]" /> Your Shipping Fee Paid
                </h3>

                {myShippingBreakdown ? (
                  <div className="space-y-2 text-sm text-gray-600 font-medium">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Base Delivery Charge</span>
                      <span>₹ {myShippingBreakdown.baseShipping}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Platform Fee (2%)</span>
                      <span>₹ {myShippingBreakdown.platformFee}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 pb-2">
                      <span>GST (18%)</span>
                      <span>₹ {myShippingBreakdown.gstAmount}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-bold text-gray-900">
                      <span>Total Shipping Paid</span>
                      <span className="text-[#6B46C1]">₹ {myShippingBreakdown.totalShippingCost}</span>
                    </div>

                    {/* Partner's shipping */}
                    {isAccepted && counterpartShippingCost > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3 h-3 text-gray-400" /> Partner's Shipping Paid
                        </span>
                        <span className="font-bold text-gray-700">₹ {formatMoney(counterpartShippingCost)}</span>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-[#A388E1] shrink-0 mt-0.5" />
                      <p className="text-[11px] text-gray-500 leading-snug">
                        Shipping includes base delivery charge + 2% platform fee + 18% GST. Each party pays their own shipping separately.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">
                    {isAwaitingPayment && !isRequester
                      ? 'Your shipping has been paid. Waiting for partner.'
                      : 'Shipping fee details will appear once payment is complete.'}
                  </p>
                )}
              </div>
            )}

          </div>

          {isAwaitingPayment && isRequester && (
            <button
              onClick={() => navigate('/swaps?tab=sent')}
              className="w-full bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-black text-lg py-4 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mb-4"
            >
              Complete Payment Now
            </button>
          )}

          {isAccepted ? (
            counterpart?.phone ? (
              <a 
                href={`https://wa.me/${counterpart.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-black text-lg py-4 px-4 rounded-xl transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 mb-4"
              >
                <MessageSquare className="w-5 h-5" /> Chat on WhatsApp
              </a>
            ) : (
              <button disabled className="w-full bg-gray-100 text-gray-400 font-bold text-lg py-4 px-4 rounded-xl cursor-not-allowed border border-gray-200 mb-4">
                No Phone Number Available
              </button>
            )
          ) : (
            <div className="w-full bg-gray-50 text-gray-400 font-bold text-sm py-4 px-4 rounded-xl border border-gray-200 mb-4 flex flex-col items-center justify-center gap-1">
              <ShieldAlert className="w-5 h-5 text-gray-400" />
              Contact details hidden until the deal is fully accepted.
            </div>
          )}

          {isAccepted && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">Safety Tip</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Always meet in well-lit, public places or use trusted courier services. Thoroughly check the item condition before completing the exchange.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DealDetailsPage;