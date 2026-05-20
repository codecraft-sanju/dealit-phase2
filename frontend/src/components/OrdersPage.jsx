import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Clock, ArrowLeft, Coins, Package, ChevronRight } from 'lucide-react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const OrderSkeleton = () => (
  <div className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm p-4 md:p-5 mb-4 relative">
    <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100/80">
      <div className="h-3 w-20 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse"></div>
    </div>
    <div className="flex flex-col md:flex-row gap-5">
      <div className="flex gap-4 md:w-full items-center">
        <div className="w-20 h-20 bg-gray-200 rounded-[1rem] animate-pulse shrink-0"></div>
        <div className="space-y-2.5 flex-1">
          <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-3 w-1/2 bg-gray-100 rounded-md animate-pulse"></div>
          <div className="flex gap-2 mt-2">
             <div className="h-5 w-16 bg-gray-100 rounded-md animate-pulse"></div>
             <div className="h-5 w-20 bg-gray-100 rounded-md animate-pulse"></div>
          </div>
        </div>
        <div className="w-5 h-5 bg-gray-100 rounded-full animate-pulse shrink-0"></div>
      </div>
    </div>
  </div>
);

const OrdersPage = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    return tabParam === 'sales' ? 'sales' : 'purchases';
  }); 

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/orders?tab=${tab}`, { replace: true });
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
  }, [activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      
      {/* Premium Glossy Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-white/10 ${
          isScrolled 
            ? 'py-3 bg-[#6B46C1]/95 backdrop-blur-md shadow-lg' 
            : 'py-5 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] shadow-md'
        }`}
      >
        <div className="max-w-md mx-auto md:max-w-4xl px-5 md:px-8 flex items-center gap-4 text-white">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-2 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all backdrop-blur-sm border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${
              isScrolled ? 'scale-90' : 'scale-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col justify-center">
            <h1 className={`font-black tracking-wide leading-tight transition-all duration-300 drop-shadow-sm ${
              isScrolled ? 'text-xl' : 'text-2xl'
            }`}>
              My Orders
            </h1>
            <p className={`text-purple-100 font-medium transition-all duration-300 overflow-hidden tracking-wide ${
              isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-xs mt-0.5'
            }`}>
              Track your purchases and sales
            </p>
          </div>
        </div>
      </header>

      {/* Premium Background Arch */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#6B46C1] via-[#7e4bd6] to-[#502b9e] h-48 rounded-b-[2.5rem] z-0 shadow-inner"
      />

      <div className="max-w-md mx-auto md:max-w-4xl px-4 md:px-8 pt-28 relative z-20">
        
        {/* Glassmorphic Tabs */}
        <div className="flex bg-white/95 backdrop-blur-xl p-1.5 rounded-[1.2rem] mb-6 border border-white/60 shadow-lg shadow-purple-900/5 relative z-20">
          {['purchases', 'sales'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="relative flex-1 py-3 rounded-xl font-black text-[13px] md:text-sm outline-none tap-highlight-transparent tracking-wide"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] rounded-[1rem] shadow-md shadow-purple-500/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center justify-center gap-2 transition-colors duration-200 ${
                  isActive ? 'text-white drop-shadow-sm' : 'text-gray-500 hover:text-purple-600'
                }`}>
                  {tab === 'purchases' ? (
                    <ShoppingBag className="w-4 h-4" />
                  ) : (
                    <Truck className="w-4 h-4" />
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
              className="w-full space-y-4"
            >
              <OrderSkeleton />
              <OrderSkeleton />
              <OrderSkeleton />
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="text-center py-24 bg-white/90 backdrop-blur-lg rounded-[2rem] border border-white/60 shadow-lg shadow-purple-900/5 mt-4"
            >
              <div className="bg-gradient-to-br from-[#f8f6ff] to-[#e9d8ff] w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-white">
                <Package className="w-14 h-14 text-[#A388E1]" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">No orders found here</h2>
              <p className="text-gray-500 mt-2 font-bold text-sm">Start exploring and trading items!</p>
              <Link to="/" className="inline-block mt-8 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] hover:opacity-90 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-[0_4px_14px_0_rgba(107,70,193,0.39)] border border-white/10 active:scale-95">
                Browse Items
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4 pb-6"
            >
              {orders.map((order) => (
                <motion.div 
                  variants={itemVariants} 
                  key={order._id} 
                  layout 
                  className="bg-white/95 backdrop-blur-xl rounded-[1.5rem] border border-white/60 overflow-hidden shadow-sm shadow-purple-900/5 hover:shadow-lg hover:shadow-purple-900/10 transition-all cursor-pointer group active:scale-[0.98]"
                  style={{ willChange: 'transform, opacity' }}
                  onClick={() => navigate(`/order/${order._id}?type=${activeTab}`)}
                >
                  <div className="bg-gradient-to-r from-[#f8f6ff] to-white px-4 py-3 flex justify-between items-center border-b border-purple-50/50 group-hover:from-purple-50 transition-colors">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order._id.slice(-6)}</span>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                      order.orderStatus === 'delivered' ? 'bg-gradient-to-r from-emerald-50 to-[#f0fdf4] text-emerald-700 border-emerald-200' : 
                      order.orderStatus === 'in_transit' ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border-indigo-200' : 
                      order.orderStatus === 'shipped' ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200' : 
                      order.orderStatus === 'processing' ? 'bg-gradient-to-r from-purple-50 to-fuchsia-50 text-purple-700 border-purple-200' : 
                      order.orderStatus === 'cancelled' ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-200' : 
                      'bg-gradient-to-r from-[#FFF4D2] to-[#fffaeb] text-yellow-800 border-[#FFE28A]/60'
                    }`}>
                      <Clock className="w-3 h-3" /> {order.orderStatus.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-[#f8f6ff] rounded-[1rem] overflow-hidden shrink-0 border border-gray-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] relative">
                      <img 
                        src={order.item?.images?.[0] || 'https://via.placeholder.com/150'} 
                        alt={order.item?.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-black text-gray-900 leading-tight mb-1 truncate tracking-tight group-hover:text-[#6B46C1] transition-colors">{order.item?.title || 'Deleted Item'}</h3>
                      <p className="text-[11px] text-gray-500 font-bold mb-2.5 truncate uppercase tracking-wider">{order.item?.category}</p>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        
                        {order.orderType === 'barter' ? (
                          <div className="inline-flex items-center gap-1 bg-gradient-to-br from-[#EBE5F7] to-[#f8f6ff] border border-[#d6bcfa]/60 px-2 py-0.5 rounded-md shadow-sm">
                            <Package className="w-3 h-3 text-[#6B46C1] drop-shadow-sm" />
                            <span className="font-black text-[10px] text-[#6B46C1]">BARTER EXCHANGE</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-gradient-to-br from-[#FFF4D2] to-[#fffaeb] border border-[#FFE28A]/60 px-2 py-0.5 rounded-md shadow-sm">
                            <Coins className="w-3 h-3 text-yellow-600 drop-shadow-sm" />
                            <span className="font-black text-[10px] text-gray-900">{order.itemPrice || 0} CR</span>
                          </div>
                        )}

                        {/* Shipping Cost Badge */}
                        <div className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-md shadow-sm ${order.shippingCost > 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'}`}>
                          <Truck className={`w-3 h-3 ${order.shippingCost > 0 ? 'text-blue-600' : 'text-emerald-600'}`} />
                          <span className={`font-bold text-[10px] ${order.shippingCost > 0 ? 'text-blue-900' : 'text-emerald-900'}`}>
                            {order.shippingCost > 0 ? `₹${order.shippingCost}` : 'Free'}
                          </span>
                        </div>

                        {/* NAYA LOGIC ADDED HERE: isReadyToDispatch check for Action Req vs Ready */}
                        {order.orderStatus === 'pending' && activeTab === 'sales' && (
                          order.isReadyToDispatch ? (
                            <span className="text-[9px] font-black text-purple-600 bg-gradient-to-r from-purple-50 to-purple-100 px-2 py-1 rounded-md border border-purple-200 uppercase tracking-widest shadow-sm">Ready</span>
                          ) : (
                            <span className="text-[9px] font-black text-red-600 animate-pulse bg-gradient-to-r from-red-50 to-rose-50 px-2 py-1 rounded-md border border-red-200 uppercase tracking-widest shadow-sm">Action Req</span>
                          )
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-full border border-gray-100 group-hover:bg-purple-50 group-hover:border-purple-200 transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#6B46C1] transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrdersPage;