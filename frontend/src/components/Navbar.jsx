import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, LogIn, PlusCircle, Search, Shield, Coins, RefreshCw, Bell } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const Navbar = ({ user }) => {
  const location = useLocation();
  const [credits, setCredits] = useState(user?.account_credits || 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchFreshCredits = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (response.data.success) {
          const freshCredits = response.data.data.account_credits;
          setCredits(freshCredits);
          
          const storedUser = JSON.parse(localStorage.getItem('dealit_user'));
          if (storedUser) {
            storedUser.account_credits = freshCredits;
            localStorage.setItem('dealit_user', JSON.stringify(storedUser));
          }
        }
      } catch (error) {
        console.error('Error fetching fresh credits:', error);
      }
    };

    fetchFreshCredits();
  }, [user, location.pathname]);

  return (
    <>
      {/* Desktop & Mobile Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-gray-900 tracking-tight z-10">
              <img src="/logo.png" alt="Dealit Logo" className="w-8 h-8 object-contain" />
              <span className="text-[#A388E1]">Dealit</span>
            </Link>
            
            {/* Desktop Search Bar */}
            <div className="flex-1 max-w-md mx-8 hidden md:block">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search items..." 
                  className="w-full bg-gray-50 text-gray-800 text-sm rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#A388E1]/40 border border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-gray-500 hover:text-[#A388E1] transition flex items-center gap-1.5">
                <Home className="w-5 h-5" /> <span className="text-sm font-medium">Home</span>
              </Link>
              
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-[#A388E1] hover:text-[#8b70ca] transition flex items-center gap-1.5">
                      <Shield className="w-5 h-5" /> <span className="text-sm font-medium">Admin</span>
                    </Link>
                  )}
                  
                  <Link to="/swaps" className="text-gray-500 hover:text-[#A388E1] transition flex items-center gap-1.5">
                    <RefreshCw className="w-5 h-5" /> <span className="text-sm font-medium">Swaps</span>
                  </Link>
                  
                  <Link to="/messages" className="text-gray-500 hover:text-[#A388E1] transition flex items-center gap-1.5">
                    <MessageSquare className="w-5 h-5" /> <span className="text-sm font-medium">Chat</span>
                  </Link>

                  <Link to="/wallet" className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border border-yellow-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold">{credits}</span>
                  </Link>
                  
                  <Link to="/profile" className="text-gray-500 hover:text-[#A388E1] transition flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center border border-gray-200">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{user.full_name?.split(' ')[0]}</span>
                  </Link>

                  <Link to="/add-item" className="bg-[#A388E1] hover:bg-[#8b70ca] text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition shadow-md shadow-[#A388E1]/30">
                    <PlusCircle className="w-4 h-4" /> List Item
                  </Link>
                </>
              ) : (
                <Link to="/login" className="bg-[#A388E1] hover:bg-[#8b70ca] text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition">
                  <LogIn className="w-4 h-4" /> Login
                </Link>
              )}
            </div>

            {/* Mobile Top Right Icons (Search, Bell & Profile) */}
            <div className="md:hidden flex items-center gap-3">
              <Link to="/search" className="text-gray-600 hover:text-[#A388E1] p-1">
                <Search className="w-6 h-6" />
              </Link>
              
              {user && (
                <>
                  {/* --- CHANGE MADE HERE: Added mobile admin button --- */}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center justify-center bg-gray-800 text-white w-7 h-7 rounded-full shadow-md border border-gray-700 hover:bg-gray-900 transition">
                      <Shield className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {/* --- END OF CHANGE --- */}

                  <button className="text-gray-600 hover:text-[#A388E1] p-1">
                    <Bell className="w-6 h-6" />
                  </button>
                  <Link to="/profile" className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                    <User className="w-5 h-5" />
                  </Link>
                </>
              )}
              {!user && (
                <Link to="/login" className="text-sm font-semibold text-[#A388E1] ml-1">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      {/* Ab isme saare links dynamically redirect honge login pe agar user authenticated nahi hai */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-safe z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-[#A388E1]' : 'text-gray-400'}`}>
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link to={user ? "/wallet" : "/login"} className={`flex flex-col items-center gap-1 ${location.pathname === '/wallet' ? 'text-yellow-500' : 'text-gray-400'}`}>
          <Coins className="w-6 h-6" />
          <span className="text-[10px] font-medium">Earn</span>
        </Link>

        {/* Floating Add Button */}
        <Link to={user ? "/add-item" : "/login"} className="relative -top-5 bg-[#A388E1] text-white p-3 rounded-full shadow-lg shadow-[#A388E1]/40 border-4 border-white">
          <PlusCircle className="w-6 h-6" />
        </Link>

        <Link to={user ? "/messages" : "/login"} className={`flex flex-col items-center gap-1 ${location.pathname === '/messages' ? 'text-[#A388E1]' : 'text-gray-400'}`}>
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-medium">Chat</span>
        </Link>

        <Link to={user ? "/profile" : "/login"} className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-[#A388E1]' : 'text-gray-400'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </>
  );
};

export default Navbar;