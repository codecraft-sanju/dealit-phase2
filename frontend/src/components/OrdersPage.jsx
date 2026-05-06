import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, Clock, ArrowLeft, Coins, Package, ChevronRight } from 'lucide-react'; 
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else if (window.scrollY < 10) {
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
                onClick={() => handleTabChange(tab)}
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
              className="space-y-4"
            >
              {orders.map((order) => (
                <motion.div 
                  variants={itemVariants} 
                  key={order._id} 
                  layout 
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={{ willChange: 'transform, opacity' }}
                  onClick={() => navigate(`/order/${order._id}?type=${activeTab}`)}
                >
                  <div className="bg-[#f8f6ff] px-4 py-3 flex justify-between items-center border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">#{order._id.slice(-6)}</span>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-sm border ${
                      order.orderStatus === 'delivered' ? 'bg-[#f0fdf4] text-emerald-700 border-emerald-100' : 
                      order.orderStatus === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                      order.orderStatus === 'processing' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                      order.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 
                      'bg-[#FFF4D2] text-yellow-800 border-[#FFE28A]/50'
                    }`}>
                      <Clock className="w-3.5 h-3.5" /> {order.orderStatus}
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-4">
                    <div className="w-20 h-20 bg-[#f8f6ff] rounded-[1rem] overflow-hidden shrink-0 border border-gray-100">
                      <img 
                        src={order.item?.images?.[0] || 'https://via.placeholder.com/150'} 
                        alt={order.item?.title} 
                        className="w-full h-full object-cover" 
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 leading-tight mb-1 truncate">{order.item?.title || 'Deleted Item'}</h3>
                      <p className="text-xs text-gray-500 font-medium mb-2 truncate">{order.item?.category}</p>
                      
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 bg-[#FFF4D2] border border-[#FFE28A]/50 px-2 py-0.5 rounded-md">
                          <Coins className="w-3 h-3 text-yellow-600" />
                          <span className="font-bold text-[10px] text-gray-900">{order.itemPrice || 0}</span>
                        </div>
                        {order.orderStatus === 'pending' && activeTab === 'sales' && (
                          <span className="text-[10px] font-bold text-red-500 animate-pulse bg-red-50 px-2 py-0.5 rounded-md border border-red-100">Action Required</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
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