import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ChevronLeft, Edit2, Trash2, AlertCircle, Coins, Plus, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import { getOptimizedCloudinaryUrl } from './HomePage'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const DashboardPage = ({ user, setUser }) => {
  const queryClient = useQueryClient();
  
  // CHANGED: Added state for the rejection modal
  const [rejectionModalItem, setRejectionModalItem] = useState(null);

  if (!user) return <Navigate to="/login" />;

  const { data: myItems = [], isLoading: loading } = useQuery({
    queryKey: ['myItems'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
      return response.data.data || [];
    },
  });

  const { data: systemSettings = { maxAllowedListings: 5 } } = useQuery({
    queryKey: ['creditSettings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/admin/credit-settings`, { withCredentials: true });
      return res.data.success && res.data.data ? res.data.data : { maxAllowedListings: 5 };
    },
    staleTime: 1000 * 60 * 30,
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      return await axios.delete(`${API_URL}/items/${itemId}`, { withCredentials: true });
    },
    onMutate: async (deletedItemId) => {
      await queryClient.cancelQueries(['myItems']);
      const previousItems = queryClient.getQueryData(['myItems']);
      
      queryClient.setQueryData(['myItems'], old => 
        old?.filter(item => item._id !== deletedItemId)
      );
      
      return { previousItems };
    },
    onError: (err, deletedItemId, context) => {
      console.error('Error deleting item:', err);
      toast.error(err.response?.data?.message || 'Failed to delete item');
      queryClient.setQueryData(['myItems'], context.previousItems);
    },
    onSuccess: async () => {
      toast.success('Item deleted successfully');
      try {
        const userRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (userRes.data.success && setUser) {
          setUser(userRes.data.data);
          localStorage.setItem('dealit_user', JSON.stringify(userRes.data.data));
        }
      } catch (e) {
        console.error("Failed to update user profile locally", e);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['myItems']);
    }
  });

  const handleDelete = (itemId) => {
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-2 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-50 bg-white">
        <div className="bg-[#6B46C1] py-5 px-5 md:px-8 shadow-md relative z-10 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to="/profile" 
                className="p-1.5 -ml-2 bg-white/10 hover:bg-white/25 active:scale-95 hover:scale-105 rounded-full text-white transition-all duration-300 backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div className="transition-all duration-300">
                <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">My Dashboard</h1>
                <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Manage all your listed items here</p>
              </div>
            </div>
            
            {/* --- NAYA CHANGE: Added limits badge on top right --- */}
            {!loading && (
              <div className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1.5 rounded-xl flex flex-col items-center">
                <span className="text-[10px] font-medium text-purple-100 uppercase tracking-wide">Listed</span>
                <span className="text-sm font-black text-white">{myItems.length}/{systemSettings.maxAllowedListings}</span>
              </div>
            )}
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
                
                <div className="absolute top-3 left-0 w-full px-3 flex justify-between items-start z-10 pointer-events-none">
                  <div className="flex gap-1.5 pointer-events-auto">
                    {/* --- NAYA CHANGE: Conditionally render the Edit button --- */}
                    {item.status !== 'swapped' && item.status !== 'reserved' && (
                      <Link to={`/edit-item/${item._id}`} className="bg-white hover:bg-gray-50 text-gray-600 p-1.5 rounded-full shadow-sm border border-gray-100 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <button 
                      onClick={() => handleDelete(item._id)} 
                      disabled={deleteItemMutation.isPending && deleteItemMutation.variables === item._id}
                      className="bg-white hover:bg-red-50 text-gray-600 hover:text-red-500 p-1.5 rounded-full shadow-sm border border-gray-100 transition disabled:opacity-50"
                    >
                      {deleteItemMutation.isPending && deleteItemMutation.variables === item._id ? (
                         <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                         <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="pointer-events-auto shrink-0 ml-1">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm ${
                      item.status === 'active' ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]' :
                      item.status === 'pending' ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]' :
                      item.status === 'swapped' ? 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]' :
                      'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="h-32 w-full flex items-center justify-center mb-4 mt-8 rounded-xl overflow-hidden bg-white/40">
                  {item.images && item.images.length > 0 && item.images[0] ? (
                    <img src={getOptimizedCloudinaryUrl(item.images[0])} alt={item.title} className="w-full h-full object-cover mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105" />
                  ) : (
                    <Package className="w-10 h-10 text-[#A388E1]/40" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{item.category}</p>
                  
                  {/* CHANGED: Removed the inline rejection reason div from here so it doesn't break height */}

                  <div className="mt-auto flex items-center gap-1.5 mb-3">
                    <div className="bg-yellow-100 rounded-full p-0.5">
                      <Coins className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.estimated_value || '0'}</span>
                    <span className="text-xs text-gray-400 font-medium">Credits</span>
                  </div>
                  
                  {/* CHANGED: Conditionally render 'View Reason' button or 'View Details' link */}
                  {item.status === 'rejected' ? (
                    <button 
                      onClick={() => setRejectionModalItem(item)}
                      className="w-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] text-center py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      View Reason
                    </button>
                  ) : (
                    <Link to={`/item/${item._id}`} className="w-full bg-[#EBE5F7] hover:bg-[#DCD0F0] text-[#8B70CA] text-center py-2.5 rounded-xl text-xs font-bold transition shadow-sm">
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CHANGED: Added the Rejection Modal Component */}
      {rejectionModalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-xs shadow-xl overflow-hidden transform transition-all">
            <div className="bg-[#FEF2F2] p-4 flex items-center justify-between border-b border-[#FECACA]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-800 text-sm">Item Rejected</h3>
              </div>
              <button 
                onClick={() => setRejectionModalItem(null)}
                className="p-1 hover:bg-red-100 rounded-full text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Item Title</p>
              <p className="text-sm text-gray-900 font-medium mb-4">{rejectionModalItem.title}</p>
              
              <p className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">Reason for Rejection</p>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                {rejectionModalItem.rejection_reason || "No specific reason provided."}
              </div>
              
              <button 
                onClick={() => setRejectionModalItem(null)}
                className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;