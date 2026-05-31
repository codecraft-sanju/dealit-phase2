import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, History, Package, Trash2 } from 'lucide-react'; // NAYA CHANGE: Trash2 icon
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductCard from './ProductCard';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const RecentlyViewedPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recentlyViewedItems'],
    queryFn: async () => {
      const idsStr = localStorage.getItem('dealit_recently_viewed_ids');
      let itemIds = idsStr ? JSON.parse(idsStr) : [];
      const token = localStorage.getItem('dealit_token');

      // NAYA CHANGE: Sync history with backend if logged in
      if (token) {
        try {
          const syncRes = await axios.post(`${API_URL}/users/recently-viewed/sync`, { viewedIds: itemIds });
          if (syncRes.data.success) {
            itemIds = syncRes.data.data;
            localStorage.setItem('dealit_recently_viewed_ids', JSON.stringify(itemIds));
          }
        } catch (error) {
          console.error("Sync error", error);
        }
      }
      
      if (itemIds.length === 0) return [];
      
      const response = await axios.post(`${API_URL}/items/batch`, { itemIds });
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // NAYA CHANGE: Clear History function
  const handleClearHistory = async () => {
    const token = localStorage.getItem('dealit_token');
    
    // Clear frontend
    localStorage.removeItem('dealit_recently_viewed_ids');
    queryClient.setQueryData(['recentlyViewedItems'], []); 

    // Clear backend
    if (token) {
      try {
        await axios.delete(`${API_URL}/users/recently-viewed/clear`);
      } catch (error) {
        console.error("Failed to clear backend history", error);
      }
    }
    toast.success("Browsing history cleared!");
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-2 md:max-w-7xl relative font-sans">
      <div className="sticky top-0 z-50 bg-white">
        <div className="bg-[#6B46C1] py-5 px-5 md:px-8 shadow-md relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="p-1.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">Browsing History</h1>
                <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Items you recently checked out</p>
              </div>
            </div>
            
            {/* NAYA CHANGE: Clear Button UI */}
            {items.length > 0 && !isLoading && (
              <button 
                onClick={handleClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-red-500/80 rounded-full text-white text-xs font-semibold transition-all backdrop-blur-sm border border-white/20"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 mt-6 relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {[1, 2, 3, 4].map((i) => (
              <ProductCard key={i} isLoading={true} className="w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center bg-[#F8F6FF] rounded-3xl py-16 px-6 border border-[#EBE5F7] shadow-sm">
            <History className="w-16 h-16 text-[#A388E1]/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No history yet</h3>
            <p className="text-sm text-gray-500">Items you view will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {items.map(item => (
              <ProductCard key={item._id} item={item} className="w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentlyViewedPage;