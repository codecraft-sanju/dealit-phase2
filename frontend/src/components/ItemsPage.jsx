import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronLeft } from 'lucide-react';
import axios from 'axios';
// ProductCard import kiya gaya hai
import ProductCard from './ProductCard';

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
          /* NAYA: Premium Skeleton Loader For All Items Grid replaced with ProductCard */
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
            {/* Purana item mapping hata kar ProductCard laga diya */}
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