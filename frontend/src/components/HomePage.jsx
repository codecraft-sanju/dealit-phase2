import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Coins, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const HomePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_URL}/items`);
        setItems(response.data.data);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Latest on Dealit</h1>
        <p className="text-gray-400">Discover items up for trade in your community.</p>
      </div>

      {loading ? (
        <div className="text-center text-emerald-400 mt-20 animate-pulse font-medium">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 mt-20 bg-gray-800 py-10 rounded-xl border border-gray-700">
          No items available right now. Be the first to add one!
        </div>
      ) : (
      
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {items.map((item) => (
            <div key={item._id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition duration-300 group flex flex-col relative">
              
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                 {/* Changes made: Reduced badge size on mobile */}
                 <span className="bg-gray-900/80 backdrop-blur-md border border-yellow-500/30 text-yellow-500 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-lg">
                   <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
                   {item.estimated_value || '0'} 
                 </span>
              </div>

              {/* Changes made: Reduced image height on mobile (h-32) to fit 2 columns properly */}
              <Link to={`/item/${item._id}`} className="block h-32 sm:h-48 overflow-hidden bg-gray-900 flex items-center justify-center cursor-pointer relative">
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
              </Link>
              
              {/* Changes made: Adjusted padding and text sizes for mobile */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col">
                <Link to={`/item/${item._id}`} className="flex justify-between items-start mb-2 hover:text-emerald-400 transition">
                  <h3 className="text-sm sm:text-lg font-semibold text-white leading-tight line-clamp-2">{item.title}</h3>
                </Link>
                
                <div className="mt-auto">
                  <p className="text-[10px] sm:text-xs text-gray-400 mb-2 sm:mb-3 inline-block bg-gray-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded">Condition: {item.condition || 'Not specified'}</p>
                  <div className="pt-2 pb-2 sm:pt-3 sm:pb-3 border-t border-gray-700">
                    <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Looking for:</p>
                    <p className="text-xs sm:text-sm font-medium text-emerald-400 truncate">{item.preferred_item || 'Open to offers'}</p>
                  </div>
                  <Link to={`/item/${item._id}`} className="w-full bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/50 transition py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2">
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" /> Swap
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;