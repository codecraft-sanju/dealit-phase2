import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, CheckCircle, Clock, MapPin, Phone, User, ArrowLeft, Coins, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const OrdersPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('purchases'); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

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
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
      if (res.data.success) {
        fetchOrders();
        alert(`Order marked as ${newStatus}`);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-20 font-sans relative overflow-x-hidden">
      
      {/* Header aligned with Profile/Checkout theme */}
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

      {/* Background swoosh */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-48 rounded-b-[2rem] z-0"
      />

      <div className="max-w-md mx-auto md:max-w-4xl px-5 md:px-8 pt-28 relative z-20">
        
        {/* Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl mb-8 border border-gray-100 shadow-sm relative z-20">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'purchases' 
                ? 'bg-[#6B46C1] text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#f8f6ff]'
            }`}
          >
            <ShoppingBag className={`w-5 h-5 ${activeTab === 'purchases' ? 'text-white' : 'text-[#6B46C1]'}`} /> 
            My Purchases
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
              activeTab === 'sales' 
                ? 'bg-[#6B46C1] text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-[#f8f6ff]'
            }`}
          >
            <Truck className={`w-5 h-5 ${activeTab === 'sales' ? 'text-white' : 'text-[#6B46C1]'}`} /> 
            Incoming Orders
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6B46C1] mb-4"></div>
              <p className="text-gray-500 font-medium">Loading your orders...</p>
            </motion.div>
          ) : orders.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
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
                <motion.div variants={itemVariants} key={order._id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                  {/* Status Bar */}
                  <div className="bg-[#f8f6ff] px-5 py-4 flex justify-between items-center border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID: #{order._id.slice(-6)}</span>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm border ${
                      order.orderStatus === 'delivered' ? 'bg-[#f0fdf4] text-emerald-700 border-emerald-100' : 
                      order.orderStatus === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                      'bg-[#FFF4D2] text-yellow-800 border-[#FFE28A]/50'
                    }`}>
                      <Clock className="w-3.5 h-3.5" /> {order.orderStatus}
                    </div>
                  </div>

                  <div className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Item Info */}
                      <div className="flex gap-4 md:w-1/2">
                        <div className="w-24 h-24 bg-[#f8f6ff] rounded-[1.2rem] overflow-hidden shrink-0 border border-gray-100">
                          <img 
                            src={order.item?.images?.[0] || 'https://via.placeholder.com/150'} 
                            alt={order.item?.title} 
                            className="w-full h-full object-cover" 
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

                      {/* Shipping Address (Always show for Seller) */}
                      <div className="bg-[#f8f6ff] p-5 rounded-2xl border border-gray-100 md:w-1/2">
                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#A388E1]" /> Shipping Address
                        </h4>
                        <p className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400" /> {order.shippingAddress.fullName}
                        </p>
                        <p className="text-xs text-gray-600 font-medium leading-relaxed pl-5.5">
                          {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        </p>
                        <p className="text-sm font-bold text-[#6B46C1] mt-2.5 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#A388E1]" /> {order.shippingAddress.phone}
                        </p>
                      </div>
                    </div>

                    {/* Actions for Seller */}
                    {activeTab === 'sales' && order.orderStatus !== 'delivered' && (
                      <div className="mt-6 flex flex-wrap gap-3 pt-5 border-t border-gray-100">
                        {order.orderStatus === 'pending' && (
                          <button 
                            onClick={() => handleUpdateStatus(order._id, 'processing')}
                            className="bg-[#6B46C1] hover:bg-[#5a3aa3] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                          >
                            Accept & Process
                          </button>
                        )}
                        {order.orderStatus === 'processing' && (
                          <button 
                            onClick={() => handleUpdateStatus(order._id, 'shipped')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                          >
                            Mark as Shipped
                          </button>
                        )}
                        {order.orderStatus === 'shipped' && (
                          <button 
                            onClick={() => handleUpdateStatus(order._id, 'delivered')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Delivered (Get Credits)
                          </button>
                        )}
                        <button 
                          onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}
                    
                    {/* Info for Buyer */}
                    {activeTab === 'purchases' && (
                      <div className="mt-6 flex items-center gap-3 text-gray-600 text-sm font-medium bg-[#f8f6ff] p-3.5 rounded-xl border border-gray-100">
                        <Truck className="w-5 h-5 text-[#6B46C1]" />
                        <span>{order.orderStatus === 'pending' ? 'Waiting for the seller to process and ship your item.' : `Your item is currently ${order.orderStatus}.`}</span>
                      </div>
                    )}
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