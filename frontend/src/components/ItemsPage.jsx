import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronLeft, Clock } from 'lucide-react'; 
import { useQuery } from '@tanstack/react-query'; 
import axios from 'axios';
import ProductCard from './ProductCard';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ItemsPage = () => {
  const navigate = useNavigate();

  // CHANGES MADE HERE: Replaced useState and useEffect with useQuery
  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['allItems'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/items?limit=100`);
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, 
  });

  // CHANGES MADE HERE: Fetch recent IDs and evaluate banner condition
  const recentlyViewedStr = localStorage.getItem('dealit_recently_viewed_ids');
  const recentlyViewedIds = recentlyViewedStr ? JSON.parse(recentlyViewedStr) : [];
  
  const showRecentlyViewedBanner = items.length > 50 && recentlyViewedIds.length > 0;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-2 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-50 bg-white">
        <div className="bg-[#6B46C1] py-5 px-5 md:px-8 shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">All Items</h1>
              <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Explore everything available for trade</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 mt-6 relative z-10">
        
        {/* CHANGES MADE HERE: Recently Viewed Banner */}
        {showRecentlyViewedBanner && (
          <div 
            onClick={() => navigate('/recently-viewed')}
            className="mb-6 bg-gradient-to-r from-[#F8F6FF] to-[#EBE5F7] border border-[#d8cbf5] rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
          >
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#6B46C1] flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 md:w-5 md:h-5" /> Pick up where you left off
              </h2>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Explore items inspired by your browsing history</p>
            </div>
            <div className="flex items-center">
               <div className="text-xs font-semibold text-[#A388E1] bg-white border border-[#EBE5F7] px-3 py-1.5 rounded-full shadow-sm">
                 View History
               </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCard key={i} isLoading={true} className="w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center bg-[#F8F6FF] rounded-3xl py-16 px-6 border border-[#EBE5F7] shadow-sm">
            <Package className="w-16 h-16 text-[#A388E1]/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No items found</h3>
            <p className="text-sm text-gray-500">Check back later for new items.</p>
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

export default ItemsPage;