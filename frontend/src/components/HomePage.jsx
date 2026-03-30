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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item._id} className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition duration-300 group flex flex-col relative">
              
              <div className="absolute top-3 right-3 z-10">
                 <span className="bg-gray-900/80 backdrop-blur-md border border-yellow-500/30 text-yellow-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
                   <Coins className="w-3.5 h-3.5" /> 
                   {item.estimated_value || '0'} 
                 </span>
              </div>

              <Link to={`/item/${item._id}`} className="block h-48 overflow-hidden bg-gray-900 flex items-center justify-center cursor-pointer relative">
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <Package className="w-12 h-12 text-gray-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
              </Link>
              
              <div className="p-5 flex-1 flex flex-col">
                <Link to={`/item/${item._id}`} className="flex justify-between items-start mb-2 hover:text-emerald-400 transition">
                  <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2">{item.title}</h3>
                </Link>
                
                <div className="mt-auto">
                  <p className="text-xs text-gray-400 mb-3 inline-block bg-gray-700 px-2 py-1 rounded">Condition: {item.condition || 'Not specified'}</p>
                  <div className="pt-3 pb-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Looking for:</p>
                    <p className="text-sm font-medium text-emerald-400 truncate">{item.preferred_item || 'Open to offers'}</p>
                  </div>
                  <Link to={`/item/${item._id}`} className="w-full bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/50 transition py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Swap Now
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