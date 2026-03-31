import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ArrowLeft, Edit2, Trash2, AlertCircle, Coins, Plus } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const DashboardPage = ({ user }) => {
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user) return <Navigate to="/login" />;

  const fetchMyItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
      setMyItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching my items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyItems();
  }, []);

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/items/${itemId}`, { withCredentials: true });
        setMyItems(myItems.filter(item => item._id !== itemId));
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(error.response?.data?.message || 'Failed to delete item');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 md:max-w-7xl">
      {/* Header Section (Purple) */}
      <div className="bg-[#6B46C1] px-4 py-5 md:px-6 flex items-center gap-4 text-white shadow-md md:rounded-b-[2rem]">
        <Link 
          to="/profile" 
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <ArrowLeft className="w-7 h-7" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-wide leading-tight">My Dashboard</h1>
          <p className="text-sm text-purple-200 font-medium mt-0.5">Manage all your listed items here</p>
        </div>
      </div>

      <div className="px-5 md:px-6 mt-6">
        {loading ? (
          <div className="text-center text-[#A388E1] py-20 animate-pulse font-medium">Loading your items...</div>
        ) : myItems.length === 0 ? (
          <div className="text-center bg-[#F8F6FF] rounded-3xl py-16 px-6 border border-[#EBE5F7] shadow-sm">
            <Package className="w-16 h-16 text-[#A388E1]/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No items listed yet</h3>
            <p className="text-sm text-gray-500 mb-6">Start adding items to your dashboard to earn credits!</p>
            <Link to="/add-item" className="inline-flex bg-[#FFE28A] text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-[#FFD75E] transition shadow-sm items-center gap-2">
              <Plus className="w-5 h-5" /> List Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {myItems.map(item => (
              <div key={item._id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition relative shadow-sm">
                
                {/* Action Buttons */}
                <div className="absolute top-3 left-3 z-10 flex gap-2">
                  <Link to={`/edit-item/${item._id}`} className="bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full backdrop-blur-md transition shadow-sm border border-gray-200">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(item._id)} className="bg-white/90 hover:bg-red-50 text-gray-700 hover:text-red-500 p-1.5 rounded-full backdrop-blur-md transition shadow-sm border border-gray-200">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Image Section */}
                <div className="h-32 bg-[#F8F9FA] relative flex items-center justify-center">
                  {item.images && item.images.length > 0 && item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm p-2" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${
                      item.status === 'active' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      item.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      item.status === 'swapped' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{item.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{item.category}</p>
                  
                  {item.status === 'rejected' && item.rejection_reason && (
                    <div className="mb-3 bg-red-50 border border-red-100 p-2.5 rounded-2xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-0.5">Rejected</p>
                        <p className="text-xs text-red-500 line-clamp-2">{item.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto border-t border-gray-50 pt-3 flex items-center gap-1.5">
                    <div className="bg-yellow-100 rounded-full p-1">
                      <Coins className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.estimated_value || '0'}</span>
                    <span className="text-xs text-gray-400">Credits</span>
                  </div>
                  
                  <Link to={`/item/${item._id}`} className="mt-3 w-full bg-[#F8F6FF] hover:bg-[#EBE5F7] text-[#A388E1] text-center py-2 rounded-xl text-xs font-bold transition">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;