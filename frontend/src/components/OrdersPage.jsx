import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, CheckCircle, Clock, MapPin, Phone, User, ArrowLeft, Coins, Package, ExternalLink, X, FileText, Loader2, AlertCircle } from 'lucide-react'; 
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const OrderSkeleton = () => (
  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm p-5 md:p-6 mb-6">
    <div className="flex justify-between items-center mb-6">
      <div className="h-3 w-24 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
    </div>
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex gap-4 md:w-1/2">
        <div className="w-24 h-24 bg-gray-100 rounded-[1.2rem] animate-pulse shrink-0"></div>
        <div className="space-y-3 flex-1 pt-1">
          <div className="h-5 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-3 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-100 rounded-lg animate-pulse mt-2"></div>
        </div>
      </div>
      <div className="md:w-1/2 space-y-3 pt-1">
        <div className="h-3 w-1/3 bg-gray-200 rounded-md animate-pulse mb-4"></div>
        <div className="h-3 w-full bg-gray-100 rounded-md animate-pulse"></div>
        <div className="h-3 w-2/3 bg-gray-100 rounded-md animate-pulse"></div>
        <div className="h-3 w-1/2 bg-gray-200 rounded-md animate-pulse mt-4"></div>
      </div>
    </div>
  </div>
);

const OrdersPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('purchases'); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchData, setDispatchData] = useState({ weight: 0.5, length: 10, width: 10, height: 10 });
  const [dispatching, setDispatching] = useState(false);
  
  // NAYA CHANGE: Error show karne ke liye state
  const [dispatchError, setDispatchError] = useState(''); 

  const [downloadingLabelFor, setDownloadingLabelFor] = useState(null);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [autoCancelHours, setAutoCancelHours] = useState(24);

  const navigate = useNavigate();

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/public-credit-settings`);
      if (res.data.success && res.data.data.autoCancelHours) {
        setAutoCancelHours(res.data.data.autoCancelHours);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'purchases' ? '/orders/my-orders' : '/orders/seller-orders';
      const res = await axios.get(`${API_URL}${endpoint}`, { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSettings(); 
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else if (window.scrollY < 10) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, reason = '') => {
    try {
      const res = await axios.put(`${API_URL}/orders/${orderId}/status`, 
        { status: newStatus, cancellationReason: reason }, 
        { withCredentials: true }
      );
      if (res.data.success) {
        fetchOrders();
        alert(`Order marked as ${newStatus}`);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDispatchOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    setDispatching(true);
    setDispatchError(''); // NAYA CHANGE: Purana error clear karna

    try {
      const res = await axios.post(
        `${API_URL}/orders/${selectedOrder._id}/dispatch`, 
        dispatchData, 
        { withCredentials: true }
      );
      if (res.data.success) {
        alert('Order Dispatched! Shiprocket pickup scheduled.');
        setShowDispatchModal(false);
        fetchOrders();
      }
    } catch (err) {
      // NAYA CHANGE: Alert ki jagah modal me error state set kar rahe hain
      setDispatchError(err.response?.data?.message || 'Failed to dispatch order. Please check details.');
    } finally {
      setDispatching(false);
    }
  };

 const handleDownloadLabel = async (orderId) => {
    setDownloadingLabelFor(orderId);
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
            
            fetchOrders(); 
         } else {
            alert('Shiprocket is still processing the label. Please try again in 1 minute.');
         }
      } else {
         alert(res.data.message || 'Failed to generate label.');
      }
    } catch (err) {
       console.error("Label Error:", err);
       alert(err.response?.data?.message || 'Failed to generate shipping label. Ensure you have balance in Shiprocket wallet.');
    } finally {
       setDownloadingLabelFor(null);
    }
  };

  const submitCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }
    setCancelling(true);
    await handleUpdateStatus(selectedOrder._id, 'cancelled', cancelReason);
    setShowCancelModal(false);
    setCancelReason('');
    setCancelling(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 400, damping: 30 } 
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-20 font-sans relative overflow-x-hidden">
      
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
              My Orders
            </h1>
            <p className={`text-purple-200 font-medium transition-all duration-300 overflow-hidden ${
              isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-sm mt-0.5'
            }`}>
              Track your purchases and sales
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

      <div className="max-w-md mx-auto md:max-w-4xl px-5 md:px-8 pt-28 relative z-20">
        
        <div className="flex bg-white p-1.5 rounded-2xl mb-8 border border-gray-100 shadow-sm relative z-20">
          {['purchases', 'sales'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 py-3 rounded-xl font-bold text-sm md:text-base outline-none tap-highlight-transparent"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-[#6B46C1] rounded-xl shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center justify-center gap-2 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-gray-500 hover:text-gray-800'
                }`}>
                  {tab === 'purchases' ? (
                    <ShoppingBag className="w-5 h-5" />
                  ) : (
                    <Truck className="w-5 h-5" />
                  )}
                  {tab === 'purchases' ? 'My Purchases' : 'Incoming Orders'}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="bg-[#f8f6ff] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-[#A388E1]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No orders found here</h2>
              <p className="text-gray-500 mt-2 font-medium">Start exploring and trading items!</p>
              <Link to="/" className="inline-block mt-8 bg-[#6B46C1] hover:bg-[#5a3aa3] text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-md shadow-[#6B46C1]/20">
                Browse Items
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {orders.map((order) => (
                <motion.div 
                  variants={itemVariants} 
                  key={order._id} 
                  layout 
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="bg-[#f8f6ff] px-5 py-4 flex justify-between items-center border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID: #{order._id.slice(-6)}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm border ${
                      order.orderStatus === 'delivered' ? 'bg-[#f0fdf4] text-emerald-700 border-emerald-100' : 
                      order.orderStatus === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                      order.orderStatus === 'processing' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                      order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                      'bg-[#FFF4D2] text-yellow-800 border-[#FFE28A]/50'
                    }`}>
                      <Clock className="w-3.5 h-3.5" /> {order.orderStatus}
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex gap-4 md:w-1/2">
                        <div className="w-24 h-24 bg-[#f8f6ff] rounded-[1.2rem] overflow-hidden shrink-0 border border-gray-100">
                          <img 
                            src={order.item?.images?.[0] || 'https://via.placeholder.com/150'} 
                            alt={order.item?.title} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{order.item?.title || 'Deleted Item'}</h3>
                          <p className="text-sm text-gray-500 font-medium mb-2.5">{order.item?.category}</p>
                          <div className="inline-flex items-center gap-1.5 bg-[#FFF4D2] border border-[#FFE28A]/50 px-2.5 py-1 rounded-lg shadow-sm">
                            <Coins className="w-3.5 h-3.5 text-yellow-600" />
                            <span className="font-bold text-xs text-gray-900">{order.totalAmount} Credits</span>
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
                          {order.shippingAddress?.addressLine}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                        </p>
                        <p className="text-sm font-bold text-[#6B46C1] mt-2.5 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#A388E1]" /> {order.shippingAddress?.phone}
                        </p>
                      </div>
                    </div>

                    {order.orderStatus === 'cancelled' && order.cancellationReason && (
                      <div className="mt-5 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Cancellation Reason</h4>
                          <p className="text-sm font-semibold text-gray-800">{order.cancellationReason}</p>
                        </div>
                      </div>
                    )}

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
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                           {order.trackingDetails.awb_code && (
                             <a
                               href={`https://shiprocket.co/tracking/${order.trackingDetails.awb_code}`}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="bg-[#f8f6ff] border border-[#e9d8ff] text-[#6B46C1] hover:bg-[#6B46C1] hover:text-white hover:border-[#6B46C1] px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 flex-1 sm:flex-none"
                             >
                               Track <ExternalLink className="w-3.5 h-3.5" />
                             </a>
                           )}
                           
                           {activeTab === 'sales' && order.orderStatus === 'processing' && (
                             <button
                               onClick={() => handleDownloadLabel(order._id)}
                               disabled={downloadingLabelFor === order._id}
                               className={`bg-[#6B46C1] text-white hover:bg-[#5a3aa3] px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 flex-1 sm:flex-none shadow-sm disabled:opacity-70 ${downloadingLabelFor === order._id ? 'cursor-not-allowed' : ''}`}
                             >
                               {downloadingLabelFor === order._id ? (
                                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                               ) : (
                                  <><FileText className="w-3.5 h-3.5" /> Download Slip</>
                               )}
                             </button>
                           )}
                        </div>
                      </div>
                    )}

                    {/* Actions for Seller */}
                    {activeTab === 'sales' && order.orderStatus !== 'delivered' && order.orderStatus !== 'shipped' && order.orderStatus !== 'cancelled' && (
                      <div className="mt-6 pt-5 border-t border-gray-100">
                        
                        {order.orderStatus === 'pending' && (
                          <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl mb-4 flex items-start gap-3 shadow-sm">
                            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-orange-800 font-medium leading-relaxed">
                              <span className="font-bold text-orange-900 block mb-1">Action Required:</span> 
                              Please dispatch this order within <span className="font-bold">{autoCancelHours} hours</span> of receiving it. Failure to dispatch will result in automatic cancellation and a <span className="font-bold text-red-600">50 Aura point penalty</span>.
                            </p>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3">
                          {order.orderStatus === 'pending' && (
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                setDispatchError(''); // Modal open hone par error reset karo
                                setShowDispatchModal(true);
                              }}
                              className="bg-[#6B46C1] hover:bg-[#5a3aa3] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm active:scale-95 flex items-center gap-2"
                            >
                              <Package className="w-4 h-4" /> Ready to Dispatch
                            </button>
                          )}
                          
                          {order.orderStatus === 'pending' && (
                            <button 
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors active:scale-95"
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
                                 Please download the shipping slip, print it, and attach it to the package.
                               </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Info for Buyer */}
                    {activeTab === 'purchases' && order.orderStatus !== 'cancelled' && (
                      <div className="mt-6 flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-gray-600 text-sm font-medium bg-[#f8f6ff] p-3.5 rounded-xl border border-gray-100">
                          <Truck className="w-5 h-5 text-[#6B46C1]" />
                          <span>{order.orderStatus === 'pending' ? 'Waiting for the seller to pack and dispatch your item.' : `Your item is currently ${order.orderStatus}. Tracking will update automatically.`}</span>
                        </div>
                        
                        {order.orderStatus === 'pending' && (
                          <p className="text-[11px] text-gray-500 px-2 flex items-center gap-1.5 font-medium mt-1">
                            <Clock className="w-3.5 h-3.5" /> 
                            If the seller doesn't dispatch within {autoCancelHours} hours, the order will auto-cancel and you'll be fully refunded.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dispatch Modal UI */}
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

            {/* NAYA CHANGE: Error Display UI in Modal */}
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
      
    </div>
  );
};

export default OrdersPage;