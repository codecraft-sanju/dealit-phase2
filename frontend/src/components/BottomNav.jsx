import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Plus, Coins, Bell } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_API + '/api';

const BottomNav = ({ user }) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // Jab bhi user route change kare, unread notifications ka count update ho jaye
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${API_URL}/notifications?limit=1`, { withCredentials: true });
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notification count", error);
      }
    };

    fetchUnreadCount();
  }, [location.pathname, user]);

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      
      <div className="flex justify-between items-end relative">
        
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 w-12 pb-1 transition-all ${location.pathname === '/' ? 'text-[#6B46C1] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home className={`w-6 h-6 ${location.pathname === '/' ? 'fill-[#EBE5F7]' : ''}`} />
          <span className="text-[10px] font-bold tracking-wide">Home</span>
        </Link>
                  
        {/* 2. Earn */}
        <Link
          to={user ? '/wallet' : '/login'}
          className={`flex flex-col items-center gap-1 w-12 pb-1 transition-all ${location.pathname === '/wallet' ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Coins className={`w-6 h-6 ${location.pathname === '/wallet' ? 'fill-yellow-100' : ''}`} />
          <span className="text-[10px] font-bold tracking-wide">Earn</span>
        </Link>

        {/* 3. Floating Add Button (Center) */}
        <div className="relative -top-5">
          <Link
            to={user ? '/add-item' : '/login'}
            className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#6B46C1] to-[#A388E1] rounded-full shadow-[0_8px_20px_rgba(107,70,193,0.4)] border-4 border-white text-white transform transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-7 h-7" strokeWidth={3} />
          </Link>
        </div>

        {/* 4. Notifications */}
        <Link
          to={user ? '/notifications' : '/login'}
          className={`flex flex-col items-center gap-1 w-12 pb-1 transition-all ${location.pathname === '/notifications' ? 'text-[#6B46C1] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <div className="relative">
            <Bell className={`w-6 h-6 ${location.pathname === '/notifications' ? 'fill-[#EBE5F7]' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-wide">Alerts</span>
        </Link>
        
        {/* 5. Profile */}
        <Link
          to={user ? '/profile' : '/login'}
          className={`flex flex-col items-center gap-1 w-12 pb-1 transition-all ${location.pathname === '/profile' ? 'text-[#6B46C1] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <User className={`w-6 h-6 ${location.pathname === '/profile' ? 'fill-[#EBE5F7]' : ''}`} />
          <span className="text-[10px] font-bold tracking-wide">Profile</span>
        </Link>
        
      </div>
    </div>
  );
};

export default BottomNav;