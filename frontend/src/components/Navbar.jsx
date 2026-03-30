import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, LogIn, PlusCircle, Search, Shield, Coins, RefreshCw, Menu, X } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const Navbar = ({ user }) => {
  const location = useLocation();
  const [credits, setCredits] = useState(user?.account_credits || 0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever the route changes
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
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight z-10">
            Dealit.
          </Link>
          
          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search items to barter..." 
                className="w-full bg-gray-800 text-gray-200 text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700 transition-all"
              />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1.5">
              <Home className="w-5 h-5" /> <span className="text-sm font-medium">Feed</span>
            </Link>
            
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5">
                    <Shield className="w-5 h-5" /> <span className="text-sm font-medium">Admin</span>
                  </Link>
                )}
                
                <Link to="/wallet" className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-bold">{credits}</span>
                </Link>

                <Link to="/swaps" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1.5">
                  <RefreshCw className="w-5 h-5" /> <span className="text-sm font-medium">Swaps</span>
                </Link>
                
                <Link to="/messages" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1.5">
                  <MessageSquare className="w-5 h-5" /> <span className="text-sm font-medium">Chat</span>
                </Link>
                
                <Link to="/profile" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">{user.full_name?.split(' ')[0]}</span>
                </Link>

                <Link to="/add-item" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-500/20">
                  <PlusCircle className="w-4 h-4" /> Add Item
                </Link>
              </>
            ) : (
              <Link to="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition">
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-4">
            {/* Show Quick Wallet Info on mobile header if logged in */}
            {user && (
              <Link to="/wallet" className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{credits}</span>
              </Link>
            )}
            
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-emerald-400 focus:outline-none transition p-1"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-800 pb-2 space-y-4">
            {/* Mobile Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search items..." 
                className="w-full bg-gray-800 text-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border border-gray-700"
              />
            </div>

            {/* Mobile Links */}
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                <Home className="w-5 h-5" /> <span className="font-medium">Feed</span>
              </Link>

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                      <Shield className="w-5 h-5" /> <span className="font-medium">Admin Panel</span>
                    </Link>
                  )}
                  
                  <Link to="/swaps" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                    <RefreshCw className="w-5 h-5" /> <span className="font-medium">My Swaps</span>
                  </Link>
                  
                  <Link to="/messages" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                    <MessageSquare className="w-5 h-5" /> <span className="font-medium">Chat Messages</span>
                  </Link>
                  
                  <Link to="/profile" className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-800">
                    <User className="w-5 h-5" /> <span className="font-medium">Profile ({user.full_name?.split(' ')[0]})</span>
                  </Link>

                  <div className="pt-2">
                    <Link to="/add-item" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20">
                      <PlusCircle className="w-5 h-5" /> Add New Item
                    </Link>
                  </div>
                </>
              ) : (
                <div className="pt-2">
                  <Link to="/login" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                    <LogIn className="w-5 h-5" /> Login to Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;