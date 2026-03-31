import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Coins, ChevronLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ItemsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllItems = async () => {
      try {
        const response = await axios.get(`${API_URL}/items`);
        setItems(response.data.data || []);
      } catch (error) {
        console.error('Error fetching all items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllItems();
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-50 bg-white">
        <div className="bg-[#6B46C1] pt-6 pb-8 px-5 md:px-8 rounded-b-[2rem] shadow-md relative z-10">
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
        {loading ? (
          <div className="text-center text-[#A388E1] py-20 animate-pulse font-medium">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center bg-[#F8F6FF] rounded-3xl py-16 px-6 border border-[#EBE5F7] shadow-sm">
            <Package className="w-16 h-16 text-[#A388E1]/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No items found</h3>
            <p className="text-sm text-gray-500">Check back later for new items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {items.map(item => (
              <Link 
                to={`/item/${item._id}`} 
                key={item._id} 
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition relative shadow-sm block"
              >
                <div className="h-32 bg-[#F8F9FA] relative flex items-center justify-center">
                  {item.images && item.images.length > 0 && item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm p-2" />
                  ) : (
                    <Package className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">{item.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">{item.category}</p>

                  <div className="mt-auto border-t border-gray-50 pt-3 flex items-center gap-1.5">
                    <div className="bg-yellow-100 rounded-full p-1">
                      <Coins className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-900">{item.estimated_value || '0'}</span>
                    <span className="text-xs text-gray-400">Credits</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsPage;