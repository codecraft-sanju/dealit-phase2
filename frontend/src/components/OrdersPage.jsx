import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, CheckCircle, Clock, MapPin, Phone, User, ArrowLeft, Coins, Package,Link } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const OrdersPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('purchases'); 
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-md sticky top-0 z-30 border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">My Orders</h1>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex bg-gray-800 p-1 rounded-2xl mb-8 border border-gray-700">
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'purchases' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <ShoppingBag className="w-5 h-5" /> My Purchases
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'sales' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            <Truck className="w-5 h-5" /> Incoming Orders
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
            <p className="text-gray-400">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-[2.5rem] border border-gray-700 border-dashed">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-400">No orders found here</h2>
            <p className="text-gray-500 mt-2">Start exploring and trading items!</p>
            <Link to="/" className="inline-block mt-6 bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold">Browse Items</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden shadow-xl">
                {/* Status Bar */}
                <div className="bg-gray-700/50 px-6 py-3 flex justify-between items-center border-b border-gray-600">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID: #{order._id.slice(-6)}</span>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    order.orderStatus === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 
                    order.orderStatus === 'shipped' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    <Clock className="w-3 h-3" /> {order.orderStatus}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Item Info */}
                    <div className="flex gap-4 md:w-1/2">
                      <img 
                        src={order.item?.images?.[0] || 'https://via.placeholder.com/150'} 
                        alt={order.item?.title} 
                        className="w-24 h-24 object-cover rounded-2xl border border-gray-600 shadow-md" 
                      />
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight mb-1">{order.item?.title || 'Deleted Item'}</h3>
                        <p className="text-sm text-gray-400 mb-2">{order.item?.category}</p>
                        <div className="flex items-center gap-1.5 text-yellow-500">
                          <Coins className="w-4 h-4" />
                          <span className="font-bold">{order.totalAmount} Credits</span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address (Always show for Seller) */}
                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 md:w-1/2">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Shipping Address
                      </h4>
                      <p className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" /> {order.shippingAddress.fullName}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                      </p>
                      <p className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> {order.shippingAddress.phone}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Seller */}
                  {activeTab === 'sales' && order.orderStatus !== 'delivered' && (
                    <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-gray-700">
                      {order.orderStatus === 'pending' && (
                        <button 
                          onClick={() => handleUpdateStatus(order._id, 'processing')}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg"
                        >
                          Accept & Process
                        </button>
                      )}
                      {order.orderStatus === 'processing' && (
                        <button 
                          onClick={() => handleUpdateStatus(order._id, 'shipped')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {order.orderStatus === 'shipped' && (
                        <button 
                          onClick={() => handleUpdateStatus(order._id, 'delivered')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-lg flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Delivered (Get Credits)
                        </button>
                      )}
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-6 py-2.5 rounded-xl font-bold text-sm transition"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                  
                  {/* Info for Buyer */}
                  {activeTab === 'purchases' && (
                    <div className="mt-6 flex items-center gap-3 text-gray-400 text-sm">
                      <Truck className="w-5 h-5 text-emerald-500" />
                      <span>{order.orderStatus === 'pending' ? 'Waiting for seller to ship your item.' : `Your item is ${order.orderStatus}.`}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;