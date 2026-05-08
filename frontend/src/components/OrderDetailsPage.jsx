import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, CheckCircle, Clock, MapPin, Phone, User, ArrowLeft, Coins, Package, ExternalLink, X, FileText, Loader2, AlertCircle, Info, ChevronRight, RefreshCcw, Calendar } from 'lucide-react'; 
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const CountdownTimer = ({ createdAt, hours }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      if (!createdAt || !hours) return '00h 00m 00s';
      
      const expireDate = new Date(createdAt).getTime() + hours * 60 * 60 * 1000;
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
  }, [createdAt, hours]);

  return <span>{timeLeft}</span>;
};

// --> MODIFICATION START: Stepper Component Added
const OrderTrackingStepper = ({ currentStatus }) => {
  const steps = [
    { id: 'pending', label: 'Placed', icon: Clock },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'in_transit', label: 'In Transit', icon: MapPin },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const getActiveIndex = () => {
    if (currentStatus === 'cancelled') return -1;
    const statusIndex = steps.findIndex(step => step.id === currentStatus);
    return statusIndex >= 0 ? statusIndex : 0;
  };

  const activeIndex = getActiveIndex();
  const progressWidth = activeIndex >= 0 ? `${(activeIndex / (steps.length - 1)) * 100}%` : '0%';

  if (currentStatus === 'cancelled') return null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 mb-6 overflow-hidden">
      <div className="relative px-2 sm:px-4">
        {/* Background empty line */}
        <div className="absolute top-5 left-0 w-full h-1.5 bg-gray-100 rounded-full"></div>
        
        {/* Animated filling line */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: progressWidth }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute top-5 left-0 h-1.5 bg-[#6B46C1] rounded-full z-0"
        />

        {/* Steps */}
        <div className="relative z-10 flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center w-[4.5rem] sm:w-20">
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 z-10 ${
                    isCompleted ? 'bg-[#6B46C1] text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  <StepIcon className="w-4 h-4" />
                </motion.div>
                <span className={`mt-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center leading-tight ${
                  isCompleted ? 'text-[#6B46C1]' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
// --> MODIFICATION END

const OrderDetailsPage = ({ user }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const searchParams = new URLSearchParams(location.search);
  const userType = searchParams.get('type') || 'purchases'; 

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchData, setDispatchData] = useState({ weight: 0.5, length: 10, width: 10, height: 10 });
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState(''); 

  const [downloadingLabel, setDownloadingLabel] = useState(false);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState(null);
  const [fetchingTracking, setFetchingTracking] = useState(false);

  useEffect(() => {
    if (liveTrackingData) {
      console.log("Live Tracking Data Full Object:", liveTrackingData);
    }
  }, [liveTrackingData]);

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

  const fetchOrderDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/orders/${orderId}`, { withCredentials: true });
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert('Order not found or access denied');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    if (order?.trackingDetails?.awb_code && order.orderStatus !== 'cancelled' && !liveTrackingData) {
      const fetchSilentTracking = async () => {
        try {
          const res = await axios.get(`${API_URL}/orders/${orderId}/track`, { withCredentials: true });
          if (res.data.success && isMounted) {
            setLiveTrackingData(res.data.data.tracking_data);
          }
        } catch (err) {
          console.error('Background tracking fetch failed');
        }
      };
      fetchSilentTracking();
    }
    
    return () => { isMounted = false; };
  }, [order?.trackingDetails?.awb_code, orderId]);

  const handleUpdateStatus = async (newStatus, reason = '') => {
    try {
      const res = await axios.put(`${API_URL}/orders/${orderId}/status`, 
        { status: newStatus, cancellationReason: reason }, 
        { withCredentials: true }
      );
      if (res.data.success) {
        fetchOrderDetails();
        alert(`Order marked as ${newStatus}`);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDispatchOrder = async (e) => {
    e.preventDefault();
    setDispatching(true);
    setDispatchError('');

    try {
      const res = await axios.post(
        `${API_URL}/orders/${orderId}/dispatch`, 
        dispatchData, 
        { withCredentials: true }
      );
      if (res.data.success) {
        alert('Order Dispatched! Shiprocket pickup scheduled.');
        setShowDispatchModal(false);
        fetchOrderDetails();
      }
    } catch (err) {
      setDispatchError(err.response?.data?.message || 'Failed to dispatch order. Please check details.');
    } finally {
      setDispatching(false);
    }
  };

  const handleDownloadLabel = async () => {
    setDownloadingLabel(true);
    try {
      const res = await axios.post(
        `${API_URL}/orders/${orderId}/generate-label`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
         if (res.data.labelUrl) {
            const link = document.createElement('a');
            link.href = res.data.labelUrl;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            fetchOrderDetails(); 
         } else {
            alert('Shiprocket is still processing the label. Please try again in 1 minute.');
         }
      } else {
         alert(res.data.message || 'Failed to generate label.');
      }
    } catch (err) {
       alert(err.response?.data?.message || 'Failed to generate shipping label. Ensure you have balance in Shiprocket wallet.');
    } finally {
       setDownloadingLabel(false);
    }
  };

  const submitCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    await handleUpdateStatus('cancelled', cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
    setCancelling(false);
  };

  const handleViewLiveTracking = async () => {
    if (!order?.trackingDetails?.awb_code) return;
    
    setShowTrackingModal(true);
    
    if (liveTrackingData) return;

    setFetchingTracking(true);
    try {
      const res = await axios.get(`${API_URL}/orders/${orderId}/track`, { withCredentials: true });
      if (res.data.success) {
        setLiveTrackingData(res.data.data.tracking_data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load tracking data');
      setShowTrackingModal(false);
    } finally {
      setFetchingTracking(false);
    }
  };

  const getEstimatedDelivery = () => {
    if (!order) return { date: '', source: '' };
   
    const expectedStr = liveTrackingData?.etd || 
                        liveTrackingData?.shipment_track?.[0]?.expected_date || 
                        order.trackingDetails?.expected_date;

    if (expectedStr && expectedStr.trim() !== '') {
      const expectedDate = new Date(expectedStr);
      if (!isNaN(expectedDate.getTime())) {
        return {
          date: expectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          source: 'shiprocket'
        };
      }
    }

    const baseDate = new Date(order.createdAt || order.created_at);
    const minDate = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const minStr = minDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const maxStr = maxDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    
    if (order.trackingDetails?.awb_code || order.orderStatus === 'shipped' || order.orderStatus === 'in_transit') {
      return {
        date: `${minStr} - ${maxStr}`,
        source: 'in_transit'
      };
    }

    return {
      date: `${minStr} - ${maxStr}`,
      source: 'standard'
    };
  };

  const trackingActivities = (() => {
    if (!liveTrackingData) return [];
    const activities = [...(liveTrackingData.shipment_track_activities || [])];
    const hasOrderReceived = activities.some(act => act.activity?.toLowerCase().includes('order received'));

    if (!hasOrderReceived && (order?.createdAt || order?.created_at)) {
      const orderDate = new Date(order.createdAt || order.created_at);
      const pad = (n) => n.toString().padStart(2, '0');
      activities.push({
        activity: 'Order Received',
        location: 'Origin',
        date: `${orderDate.getFullYear()}-${pad(orderDate.getMonth() + 1)}-${pad(orderDate.getDate())} ${pad(orderDate.getHours())}:${pad(orderDate.getMinutes())}:00`
      });
    }
    return activities;
  })();

  // --> MODIFICATION START: Modern Shimmer Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f2f9] font-sans relative overflow-x-hidden">
        {/* Header Skeleton */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] py-5 shadow-md">
          <div className="max-w-md mx-auto md:max-w-4xl px-5 md:px-8 flex items-center gap-4">
            <div className="w-9 h-9 bg-white/20 rounded-full animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="w-32 h-5 bg-white/20 rounded-md animate-pulse"></div>
              <div className="w-20 h-3 bg-white/10 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-40 rounded-b-[2rem] z-0 animate-pulse opacity-80" />

        <div className="max-w-md mx-auto md:max-w-4xl px-4 md:px-8 pt-28 relative z-20">
          {/* Stepper Skeleton */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 mb-6">
             <div className="relative px-2 sm:px-4 flex justify-between">
                <div className="absolute top-5 left-0 w-full h-1.5 bg-gray-100 rounded-full animate-pulse"></div>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex flex-col items-center gap-2 z-10 w-[4.5rem] sm:w-20">
                    <div className="w-10 h-10 rounded-full bg-gray-200 border-4 border-white animate-pulse"></div>
                    <div className="w-12 h-2.5 bg-gray-200 rounded-full animate-pulse mt-1"></div>
                  </div>
                ))}
             </div>
          </div>

          {/* Order Info Skeleton */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
               <div className="w-24 h-4 bg-gray-200 rounded-md animate-pulse"></div>
               <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
               <div className="flex gap-4 md:w-1/2">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 rounded-[1.2rem] shrink-0 animate-pulse"></div>
                  <div className="flex-1 flex flex-col gap-2 pt-1">
                     <div className="w-full h-5 bg-gray-200 rounded-md animate-pulse"></div>
                     <div className="w-2/3 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                     <div className="w-1/2 h-3 bg-gray-100 rounded-md animate-pulse mt-2"></div>
                     <div className="flex gap-2 mt-2">
                       <div className="w-20 h-6 bg-gray-100 rounded-md animate-pulse"></div>
                       <div className="w-24 h-6 bg-gray-100 rounded-md animate-pulse"></div>
                     </div>
                  </div>
               </div>

               <div className="bg-[#f8f6ff] p-5 rounded-2xl md:w-1/2 flex flex-col gap-2 animate-pulse">
                  <div className="w-32 h-3 bg-gray-200 rounded-md mb-2"></div>
                  <div className="w-48 h-4 bg-gray-300 rounded-md"></div>
                  <div className="w-full h-3 bg-gray-200 rounded-md mt-1"></div>
                  <div className="w-3/4 h-3 bg-gray-200 rounded-md"></div>
                  <div className="w-24 h-4 bg-gray-300 rounded-md mt-2"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // --> MODIFICATION END

  if (!order) return null;
  
  const estimatedInfo = getEstimatedDelivery();

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-24 font-sans relative overflow-x-hidden">
      
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] transition-all duration-300 ease-in-out shadow-md ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-md mx-auto md:max-w-4xl px-5 md:px-8 flex items-center gap-4 text-white">
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
              Order Details
            </h1>
            <p className={`text-purple-200 font-medium transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-sm mt-0.5'
            }`}>
              ID: #{order._id.slice(-6)}
            </p>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-40 rounded-b-[2rem] z-0"
      />

      <div className="max-w-md mx-auto md:max-w-4xl px-4 md:px-8 pt-28 relative z-20">
        
        {/* --> MODIFICATION START: Stepper Injection */}
        <OrderTrackingStepper currentStatus={order.orderStatus} />
        {/* --> MODIFICATION END */}
        
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm p-5 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-[#A388E1]" /> Order Info
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm border ${
              order.orderStatus === 'delivered' ? 'bg-[#f0fdf4] text-emerald-700 border-emerald-100' : 
              order.orderStatus === 'in_transit' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
              order.orderStatus === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
              order.orderStatus === 'processing' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
              order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
              'bg-[#FFF4D2] text-yellow-800 border-[#FFE28A]/50'
            }`}>
              <Clock className="w-3.5 h-3.5" /> {order.orderStatus.replace('_', ' ')}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex gap-4 md:w-1/2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#f8f6ff] rounded-[1.2rem] overflow-hidden shrink-0 border border-gray-100">
                <img 
                  src={order.item?.images?.[0] || 'https://via.placeholder.com/150'} 
                  alt={order.item?.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{order.item?.title || 'Deleted Item'}</h3>
                <p className="text-xs text-gray-500 font-medium mb-3">{order.item?.category}</p>
                
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-[#FFF4D2] border border-[#FFE28A]/50 px-2 py-1 rounded-md shadow-sm">
                      <Coins className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="font-bold text-[11px] sm:text-xs text-gray-900">{order.itemPrice || 0} Credits</span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 border px-2 py-1 rounded-md shadow-sm ${order.shippingCost > 0 ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <Truck className={`w-3 h-3 ${order.shippingCost > 0 ? 'text-blue-600' : 'text-emerald-600'}`} />
                      <span className={`font-bold text-[11px] sm:text-xs ${order.shippingCost > 0 ? 'text-blue-900' : 'text-emerald-900'}`}>
                        {order.shippingCost > 0 ? `₹${order.shippingCost} Shipping` : 'Free Shipping'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-1.5 mt-1">
                    <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    {userType === 'purchases' ? (
                      <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-tight">
                        <strong className="text-gray-700">Paid:</strong> {order.itemPrice} credits from wallet & ₹{order.shippingCost} online.
                      </p>
                    ) : (
                      <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-tight">
                        <strong className="text-gray-700">Earnings:</strong> You get <strong className="text-emerald-600">{order.itemPrice} Credits</strong> on delivery. (Buyer paid shipping).
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#f8f6ff] p-5 rounded-2xl border border-gray-100 md:w-1/2">
              <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#A388E1]" /> Shipping Address
              </h4>
              <p className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" /> {order.shippingAddress?.fullName}
              </p>
              <p className="text-xs text-gray-600 font-medium leading-relaxed pl-5.5">
                {order.shippingAddress?.houseNo}, {order.shippingAddress?.areaStreet}
                {order.shippingAddress?.landmark ? `, ${order.shippingAddress.landmark}` : ''}, <br className="hidden md:block" />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              {userType === 'purchases' ? (
                <p className="text-sm font-bold text-[#6B46C1] mt-2.5 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#A388E1]" /> {order.shippingAddress?.phone}
                </p>
              ) : (
                <p className="text-sm font-bold text-gray-500 mt-2.5 flex items-center gap-2" title="Partially hidden to protect buyer privacy">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> +91 ******{order.shippingAddress?.phone?.slice(-4) || '••••'}
                </p>
              )}
            </div>
          </div>

          {/* Cancellation Info */}
          {order.orderStatus === 'cancelled' && (
            <div className="mt-5 space-y-3">
              {order.cancellationReason && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Cancellation Reason</h4>
                    <p className="text-sm font-semibold text-gray-800">{order.cancellationReason}</p>
                  </div>
                </div>
              )}
              
              {/* Only show refund details to the Buyer */}
              {userType === 'purchases' && (
                <>
                  {/* Refund Processing Block */}
                  {order.paymentStatus === 'refund_processing' && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm relative overflow-hidden">
                      <div className="absolute right-[-15px] top-[-15px] opacity-10 pointer-events-none">
                        <RefreshCcw className="w-24 h-24 text-orange-600" />
                      </div>
                      
                      <div className="bg-orange-100 p-2 rounded-full shrink-0 relative z-10 mt-0.5">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      
                      <div className="relative z-10 w-full">
                        <div className="flex justify-between items-center mb-2.5">
                           <h4 className="text-[10px] font-bold text-orange-800 uppercase tracking-widest">Refund Processing</h4>
                           <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">In Progress</span>
                        </div>
                        
                        <div className="space-y-2.5">
                          <p className="text-xs text-orange-900 font-medium leading-relaxed">
                            Your order was cancelled. <strong>{order.itemPrice} Credits</strong> have been returned to your wallet instantly. The shipping amount of <strong>₹{order.shippingCost}</strong> is being processed and will reflect in your bank account in 3-5 days.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUCCESS REFUND VERIFIED RECEIPT */}
                  {order.paymentStatus === 'refunded' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm relative overflow-hidden">
                      <div className="absolute right-[-15px] top-[-15px] opacity-10 pointer-events-none">
                         <CheckCircle className="w-24 h-24 text-emerald-600" />
                      </div>
                      
                      <div className="bg-emerald-100 p-2 rounded-full shrink-0 relative z-10 mt-0.5">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      
                      <div className="relative z-10 w-full">
                        <div className="flex justify-between items-center mb-2.5">
                           <h4 className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Refund Successful</h4>
                           <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">Verified</span>
                        </div>
                        
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center bg-white/70 p-2.5 rounded-xl border border-emerald-100/50">
                             <div className="flex items-center gap-2">
                                <div className="bg-[#FFF4D2] p-1.5 rounded-lg">
                                  <Coins className="w-3.5 h-3.5 text-yellow-600" />
                                </div>
                                <span className="text-xs font-bold text-gray-800">Credits Refund</span>
                             </div>
                             <div className="text-right">
                               <span className="text-sm font-black text-emerald-600">+{order.itemPrice} CR</span>
                               <p className="text-[9px] text-gray-500 font-medium leading-none mt-0.5">Added to Wallet</p>
                             </div>
                          </div>

                          {order.shippingCost > 0 && (
                            <div className="flex justify-between items-center bg-white/70 p-2.5 rounded-xl border border-emerald-100/50">
                               <div className="flex items-center gap-2">
                                  <div className="bg-blue-50 p-1.5 rounded-lg">
                                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <span className="text-xs font-bold text-gray-800">Shipping Refund</span>
                               </div>
                               <div className="text-right">
                                 <span className="text-sm font-black text-emerald-600">+₹{order.shippingCost}</span>
                                 <p className="text-[9px] text-gray-500 font-medium leading-none mt-0.5">Sent to Bank</p>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FAILED REFUND ALERT */}
                  {order.paymentStatus === 'refund_failed' && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3 shadow-sm relative overflow-hidden mt-3">
                      <div className="absolute right-[-15px] top-[-15px] opacity-10 pointer-events-none">
                         <AlertCircle className="w-24 h-24 text-red-600" />
                      </div>
                      
                      <div className="bg-red-100 p-2 rounded-full shrink-0 relative z-10 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      
                      <div className="relative z-10 w-full">
                        <div className="flex justify-between items-center mb-2.5">
                           <h4 className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Refund Failed</h4>
                           <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">Action Needed</span>
                        </div>
                        
                        <div className="space-y-2.5">
                          <p className="text-xs text-red-900 font-medium leading-relaxed">
                            Your <strong>{order.itemPrice} Credits</strong> have been returned to your wallet. However, the bank rejected the shipping refund of <strong>₹{order.shippingCost}</strong>. Our support team has been notified and will process this manually.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tracking Panel */}
          {order.trackingDetails && order.trackingDetails.shiprocket_order_id && order.orderStatus !== 'cancelled' && (
            <div className="mt-5 bg-white border border-[#e9d8ff] p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B46C1]"></div>
              <div className="pl-2">
                <h4 className="text-[10px] font-bold text-[#6B46C1] uppercase tracking-widest mb-1">Shipping Details</h4>
                {order.trackingDetails.awb_code ? (
                  <>
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" /> {order.trackingDetails.courier_company || 'Courier Partner'}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">AWB: <span className="text-gray-800">{order.trackingDetails.awb_code}</span></p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-gray-600 flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" /> Shipment is being prepared...
                  </p>
                )}
              </div>
              
              {/* --> MODIFICATION START: External Link Button added with Flex Wrap */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                 {order.trackingDetails.awb_code && (
                   <div className="flex gap-2 flex-1 sm:flex-none">
                     <button
                       onClick={handleViewLiveTracking}
                       className="bg-[#f8f6ff] border border-[#e9d8ff] text-[#6B46C1] hover:bg-[#6B46C1] hover:text-white hover:border-[#6B46C1] px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 flex-1 sm:flex-none"
                     >
                       Live Tracking <Truck className="w-3.5 h-3.5" />
                     </button>
                     <a
                       href={`https://shiprocket.co/tracking/${order.trackingDetails.awb_code}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="bg-white border border-gray-200 text-gray-500 hover:text-[#6B46C1] hover:border-[#6B46C1] hover:bg-[#f8f6ff] px-3 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center shadow-sm shrink-0"
                       title="Track on Shiprocket Website"
                     >
                       <ExternalLink className="w-4 h-4" />
                     </a>
                   </div>
                 )}
                 
                 {userType === 'sales' && order.orderStatus === 'processing' && (
                   <button
                     onClick={handleDownloadLabel}
                     disabled={downloadingLabel}
                     className={`bg-[#6B46C1] text-white hover:bg-[#5a3aa3] px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 flex-1 sm:flex-none shadow-sm disabled:opacity-70 ${downloadingLabel ? 'cursor-not-allowed' : ''}`}
                   >
                     {downloadingLabel ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                     ) : (
                        <><FileText className="w-3.5 h-3.5" /> Get Slip</>
                     )}
                   </button>
                 )}
              </div>
              {/* --> MODIFICATION END */}
            </div>
          )}

          {/* Action Buttons & Timers for SELLER */}
          {userType === 'sales' && order.orderStatus !== 'delivered' && order.orderStatus !== 'shipped' && order.orderStatus !== 'in_transit' && order.orderStatus !== 'cancelled' && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              
              {order.orderStatus === 'pending' && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-4 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-orange-800 font-medium leading-relaxed w-full">
                    <span className="font-bold text-orange-900 block mb-1">Action Required:</span> 
                    Please dispatch this order within <span className="font-bold">{autoCancelHours} hours</span>.
                    <div className="text-red-600 font-bold flex items-center gap-1.5 mt-1.5 mb-1.5 bg-red-50/50 w-fit px-2 py-1 rounded-md border border-red-100">
                      <Clock className="w-3.5 h-3.5" /> Time Left: <span className="animate-pulse"><CountdownTimer createdAt={order.createdAt || order.created_at} hours={autoCancelHours} /></span>
                    </div>
                    Failure to dispatch will result in automatic cancellation and a <span className="font-bold text-red-600">{auraPenalty} Aura point penalty</span>.
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                {order.orderStatus === 'pending' && (
                  <button 
                    onClick={() => {
                      setDispatchError(''); 
                      setDispatchData({
                        weight: order.item?.weight || 0.5,
                        length: order.item?.dimensions?.length || 10,
                        width: order.item?.dimensions?.width || 10,
                        height: order.item?.dimensions?.height || 10
                      });
                      setShowDispatchModal(true);
                    }}
                    className="flex-1 sm:flex-none bg-[#6B46C1] hover:bg-[#5a3aa3] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" /> Ready to Dispatch
                  </button>
                )}
                
                {order.orderStatus === 'pending' && (
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-6 py-3 rounded-xl font-bold text-sm transition-colors active:scale-95"
                  >
                    Cancel Order
                  </button>
                )}

                {order.orderStatus === 'processing' && (
                  <div className="text-sm font-bold text-purple-600 flex flex-col gap-1 w-full bg-purple-50 rounded-xl border border-purple-100 p-4">
                     <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> 
                        <span>Waiting for Courier Pickup. Status will update automatically.</span>
                     </div>
                     <p className="text-xs text-purple-500 font-medium pl-6">
                        Use the "Get Slip" button above to download your shipping label.
                     </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Messages for BUYER */}
          {userType === 'purchases' && order.orderStatus !== 'cancelled' && (
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-gray-600 text-sm font-medium bg-[#f8f6ff] p-4 rounded-xl border border-gray-100">
                <Truck className="w-5 h-5 text-[#6B46C1]" />
                <span>{order.orderStatus === 'pending' ? 'Waiting for the seller to pack and dispatch your item.' : `Your item is currently ${order.orderStatus.replace('_', ' ')}. Tracking will update automatically.`}</span>
              </div>

              {order.orderStatus !== 'delivered' && (
                <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">Estimated Delivery: {estimatedInfo.date}</span>
                    <span className="text-[10px] text-emerald-600/80 font-medium mt-0.5 uppercase tracking-wide">
                      {estimatedInfo.source === 'shiprocket' ? 'Live Courier Estimate' : 
                       estimatedInfo.source === 'in_transit' ? 'In Transit (Awaiting Exact Date)' : 
                       'Standard Estimate (5-7 days)'}
                    </span>
                  </div>
                </div>
              )}
              
              {order.orderStatus === 'pending' && (
                <div className="text-[11px] text-gray-500 px-2 flex flex-col gap-1.5 font-medium mt-1">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" /> 
                    If the seller doesn't dispatch within {autoCancelHours} hours, the order will auto-cancel and you'll be fully refunded.
                  </span>
                  <span className="flex items-center gap-1.5 text-red-500 font-bold bg-red-50/50 w-fit px-2 py-1 rounded-md border border-red-50">
                    <Clock className="w-3.5 h-3.5" /> 
                    Time Left: <span className="animate-pulse"><CountdownTimer createdAt={order.createdAt || order.created_at} hours={autoCancelHours} /></span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative"
          >
            <button 
              onClick={() => setShowDispatchModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-gray-900 mb-1">Package Details</h3>
            <p className="text-xs text-gray-500 font-medium mb-4">Enter actual box size for accurate courier assignment.</p>

            {dispatchError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-bold leading-relaxed">{dispatchError}</p>
              </div>
            )}
            
            <form onSubmit={handleDispatchOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Weight (kg)</label>
                <input 
                  type="number" step="0.1" required 
                  value={dispatchData.weight} 
                  onChange={(e) => setDispatchData({...dispatchData, weight: parseFloat(e.target.value)})}
                  className="w-full bg-[#f8f6ff] border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#6B46C1] focus:ring-1 focus:ring-[#6B46C1] font-medium" 
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">L (cm)</label>
                  <input 
                    type="number" required 
                    value={dispatchData.length} 
                    onChange={(e) => setDispatchData({...dispatchData, length: parseInt(e.target.value)})}
                    className="w-full bg-[#f8f6ff] border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:border-[#6B46C1] font-medium text-center" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">W (cm)</label>
                  <input 
                    type="number" required 
                    value={dispatchData.width} 
                    onChange={(e) => setDispatchData({...dispatchData, width: parseInt(e.target.value)})}
                    className="w-full bg-[#f8f6ff] border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:border-[#6B46C1] font-medium text-center" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">H (cm)</label>
                  <input 
                    type="number" required 
                    value={dispatchData.height} 
                    onChange={(e) => setDispatchData({...dispatchData, height: parseInt(e.target.value)})}
                    className="w-full bg-[#f8f6ff] border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:outline-none focus:border-[#6B46C1] font-medium text-center" 
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={dispatching}
                className="w-full bg-[#6B46C1] hover:bg-[#5a3aa3] text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-md shadow-[#6B46C1]/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {dispatching ? 'Scheduling...' : 'Confirm Dispatch'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-6 max-w-sm w-full shadow-2xl relative"
          >
            <button 
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-gray-900 mb-1">Cancel Order</h3>
            <p className="text-xs text-gray-500 font-medium mb-6">Please provide a reason. This will be shared with the buyer.</p>
            
            <form onSubmit={submitCancelOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Reason for Cancellation</label>
                <textarea 
                  required 
                  rows="3"
                  placeholder="E.g., Item is currently out of stock or damaged..."
                  value={cancelReason} 
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-[#f8f6ff] border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium resize-none" 
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={cancelling}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl mt-4 transition-all shadow-md shadow-red-500/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative max-h-[80vh] flex flex-col"
          >
            <button 
              onClick={() => setShowTrackingModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-gray-900 mb-4">Live Tracking</h3>

            {fetchingTracking ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="w-8 h-8 text-[#6B46C1] animate-spin" />
                <p className="text-sm font-medium text-gray-500">Fetching courier updates...</p>
              </div>
            ) : liveTrackingData ? (
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-6 p-4 bg-[#f8f6ff] rounded-xl border border-[#e9d8ff]">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Status</p>
                  <p className="text-lg font-black text-[#6B46C1]">
                    {liveTrackingData.shipment_track?.[0]?.current_status || 'Processing'}
                  </p>
                </div>

                <div className="relative border-l-2 border-[#e9d8ff] ml-3 pl-6 space-y-6 pb-4">
                  {trackingActivities.map((activity, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[31px] bg-[#6B46C1] w-3.5 h-3.5 rounded-full ring-4 ring-white"></div>
                      <p className="text-sm font-bold text-gray-900">{activity.activity}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{activity.location}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{activity.date}</p>
                    </div>
                  ))}
                  {trackingActivities.length === 0 && (
                    <p className="text-sm text-gray-500 font-medium">Tracking timeline is not available yet. Please check back later.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 font-medium">
                Could not load tracking data.
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;