import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ChevronLeft, Edit2, Trash2, AlertCircle, Coins, Plus } from 'lucide-react';
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
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-50 bg-white">
        <div className="bg-[#6B46C1] pt-6 pb-8 px-5 md:px-8 rounded-b-[2rem] shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <Link 
              to="/profile" 
              className="p-1.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">My Dashboard</h1>
              <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Manage all your listed items here</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 mt-6 relative z-10">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="bg-[#F8F6FF] rounded-3xl p-4 border border-gray-50 flex flex-col animate-pulse h-[300px] relative"
              >
                <div className="flex justify-between w-full absolute top-4 left-0 px-4 z-10">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 bg-[#EBE5F7] rounded-full"></div>
                    <div className="w-7 h-7 bg-[#EBE5F7] rounded-full"></div>
                  </div>
                  <div className="w-14 h-5 bg-[#EBE5F7] rounded-full"></div>
                </div>
                
                <div className="h-32 w-full bg-[#EBE5F7] rounded-2xl mb-4 mt-8"></div>
                
                <div className="flex-1 flex flex-col">
                  <div className="h-4 w-3/4 bg-[#EBE5F7] rounded-md mb-2"></div>
                  <div className="h-3 w-1/2 bg-[#EBE5F7] rounded-md mb-4"></div>
                  
                  <div className="mt-auto flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#EBE5F7]"></div>
                    <div className="h-4 w-12 bg-[#EBE5F7] rounded-md"></div>
                  </div>
                  
                  <div className="w-full h-8 bg-[#EBE5F7] rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
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
              <div key={item._id} className="bg-[#F8F6FF] rounded-3xl p-4 relative flex flex-col hover:shadow-md transition-shadow border border-gray-50 h-full">
                
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <Link to={`/edit-item/${item._id}`} className="bg-white hover:bg-gray-50 text-gray-600 p-1.5 rounded-full shadow-sm border border-gray-100 transition">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => handleDelete(item._id)} className="bg-white hover:bg-red-50 text-gray-600 hover:text-red-500 p-1.5 rounded-full shadow-sm border border-gray-100 transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${
                    item.status === 'active' ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]' :
                    item.status === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' :
                    item.status === 'swapped' ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]' :
                    'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="h-32 w-full flex items-center justify-center mb-4 mt-8">
                  {item.images && item.images.length > 0 && item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-md" />
                  ) : (
                    <Package className="w-10 h-10 text-[#A388E1]/40" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{item.category}</p>
                  
                  {item.status === 'rejected' && item.rejection_reason && (
                    <div className="mb-3 bg-[#FEF2F2] border border-[#FECACA] p-2.5 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide mb-0.5">Rejected</p>
                        <p className="text-[11px] text-red-600 line-clamp-2 leading-tight">{item.rejection_reason}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex items-center gap-1.5 mb-3">
                    <div className="bg-yellow-100 rounded-full p-0.5">
                      <Coins className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.estimated_value || '0'}</span>
                    <span className="text-xs text-gray-400 font-medium">Credits</span>
                  </div>
                  
                  <Link to={`/item/${item._id}`} className="w-full bg-[#EBE5F7] hover:bg-[#DCD0F0] text-[#8B70CA] text-center py-2.5 rounded-xl text-xs font-bold transition shadow-sm">
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