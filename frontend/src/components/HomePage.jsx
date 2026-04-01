import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Coins, ChevronRight, Plus, Smartphone, Shirt, Watch, Home as HomeIcon, Gamepad2, UserCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// Yahan user prop ko add kiya gaya hai
const HomePage = ({ user }) => {
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

  const categories = [
    { name: 'Electronics', icon: Smartphone, active: true },
    { name: 'Fashion', icon: Shirt, active: false },
    { name: 'Gear', icon: Watch, active: false },
    { name: 'Home', icon: HomeIcon, active: false },
    { name: 'Toys', icon: Gamepad2, active: false },
  ];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-24 md:max-w-7xl md:px-4">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
          Turn unused items into <br />
          things you <span className="text-[#A388E1]">want</span>
        </h1>
        <p className="text-sm text-gray-500 mb-6">Now you don't need money to get things!</p>

        {/* Dynamic Top Banner: Login status ke hisaab se change hoga */}
        {user ? (
          <div className="bg-gradient-to-r from-[#A388E1] to-[#b7a3eb] rounded-3xl p-5 text-white shadow-lg shadow-[#A388E1]/30 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 p-1.5 rounded-full">
                  <Coins className="w-5 h-5 text-yellow-900" />
                </div>
                <span className="text-2xl font-bold">{user.account_credits || 0} <span className="text-lg font-normal opacity-90">credits</span></span>
              </div>
              <Link to="/wallet" className="bg-[#FFF4D2] text-[#8B70CA] text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1 shadow-sm">
                Earn More <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex justify-between items-center text-xs font-medium">
              <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">₹ 1 = 1 credit</span>
              <Link to="/wallet" className="text-white/80 cursor-pointer hover:text-white transition">Buy Credits</Link>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-5 text-white shadow-lg shadow-gray-900/30 relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-bold">Join Dealit Today!</h3>
                <p className="text-xs text-gray-300 mt-1">Sign in to earn credits and start trading.</p>
              </div>
              <UserCircle className="w-10 h-10 text-gray-400 opacity-50" />
            </div>
            <div className="mt-4 flex gap-3">
              <Link to="/login" className="flex-1 bg-white text-gray-900 text-center text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-100 transition">
                Login
              </Link>
              <Link to="/signup" className="flex-1 bg-[#A388E1] text-white text-center text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-[#8b70ca] transition">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="flex gap-4 overflow-x-auto hide-scrollbar items-center pb-2">
          {categories.map((cat, index) => (
            <div key={index} className={`flex flex-col items-center gap-2 min-w-max cursor-pointer`}>
              {cat.active ? (
                <div className="bg-[#EBE5F7] text-[#A388E1] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#A388E1]/20">
                  <cat.icon className="w-5 h-5" />
                  <span className="text-sm font-bold">{cat.name}</span>
                </div>
              ) : (
                <>
                  <div className="bg-[#F8F9FA] text-gray-500 p-3 rounded-2xl w-14 h-14 flex items-center justify-center border border-gray-100 shadow-sm">
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{cat.name}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Popular Items</h2>
          <Link to="/items" className="text-sm font-semibold text-gray-500 flex items-center gap-1 hover:text-[#A388E1]">
            See All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          /* NAYA: Premium Skeleton Loader For Home Items */
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="bg-[#F8F6FF] rounded-3xl p-4 min-w-[150px] w-[150px] flex-shrink-0 relative block border border-gray-50 animate-pulse"
              >
                {/* Image Skeleton */}
                <div className="h-24 w-full bg-[#EBE5F7] rounded-2xl mb-4"></div>
                
                {/* Text Skeleton */}
                <div>
                  <div className="h-3 w-full bg-[#EBE5F7] rounded-md mb-2"></div>
                  <div className="h-3 w-2/3 bg-[#EBE5F7] rounded-md mb-3"></div>
                  
                  {/* Price Skeleton */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-4 h-4 rounded-full bg-[#EBE5F7]"></div>
                    <div className="h-3 w-10 bg-[#EBE5F7] rounded-md"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-2xl border border-gray-100">
            No items available right now. Be the first to add one!
          </div>
        ) : (
          <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 snap-x">
            {items.map((item) => (
              <Link 
                to={`/item/${item._id}`} 
                key={item._id} 
                className="bg-[#F8F6FF] rounded-3xl p-4 min-w-[150px] w-[150px] flex-shrink-0 snap-start relative block hover:shadow-md transition-shadow"
              >
                <div className="h-24 w-full flex items-center justify-center mb-4">
                  {item.images && item.images.length > 0 && item.images[0] ? (
                    <img src={item.images[0]} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-md" />
                  ) : (
                    <Package className="w-10 h-10 text-[#A388E1]/40" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="bg-yellow-100 rounded-full p-0.5">
                      <Coins className="w-3 h-3 text-yellow-600" />
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{item.estimated_value || '0'}</span>
                    <span className="text-xs text-gray-400 line-through ml-1">₹{((item.estimated_value || 0) * 1.6).toFixed(0)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="bg-[#EBE5F7] rounded-3xl p-5 relative overflow-hidden">
          <div className="w-2/3 relative z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Got unused items?</h3>
            <p className="text-sm text-gray-700 font-bold mb-1">List them to earn credits now!</p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              List items you no longer need and earn instant credits to exchange for products you want!
            </p>
            {/* Dynamic Link: Agar login nahi hai, toh add-item ki jagah login pe bhejega */}
            <Link to={user ? "/add-item" : "/login"} className="bg-[#FFE28A] text-gray-900 px-4 py-2 rounded-full text-sm font-bold inline-flex items-center gap-1 shadow-sm hover:bg-[#FFD75E] transition">
              <Plus className="w-4 h-4" /> List an Item
            </Link>
          </div>
          
          <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20">
            <Package className="w-full h-full text-[#A388E1]" />
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default HomePage;