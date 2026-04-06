import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Package } from 'lucide-react';
import axios from 'axios';
import ProductCard from './ProductCard'; 

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const WishlistPage = ({ user }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchWishlist = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/wishlist`, { withCredentials: true });
        if (response.data.success) {
          setWishlist(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-20 font-sans">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#6B46C1] fill-[#6B46C1]" />
              My Wishlist
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-200 rounded-2xl"></div>)}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100 mt-10 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-[#f8f6ff] rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-[#A388E1]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty</h2>
            <p className="text-slate-500 text-sm mb-6">Explore items and tap the heart icon to save them for later.</p>
            <Link to="/" className="inline-block bg-[#6B46C1] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5a3aa8] transition-colors shadow-sm active:scale-95">
              Explore Items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {wishlist.map(item => (
              <ProductCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;