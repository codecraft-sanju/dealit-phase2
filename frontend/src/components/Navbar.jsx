import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, User, LogIn, PlusCircle, Search, Shield, RefreshCw, Bell } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

/* ─────────────────────────────────────────────
   CSS Coin Component — pure CSS, no icon lib
───────────────────────────────────────────── */
const CSSCoin = ({ size = 'md' }) => {
  // MODIFIED: Slightly increased sizes to fit two characters ('Cr') comfortably
  const dims = size === 'sm'
    ? { outer: 20, inner: 13, fontSize: 6.5, border: 2, shimmer: 6 }
    : { outer: 24, inner: 16, fontSize: 8.5, border: 2.5, shimmer: 8 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: dims.outer,
        height: dims.outer,
        borderRadius: '50%',
        // MODIFIED: Richer, more professional gold gradient
        background: 'linear-gradient(135deg, #FFE885 0%, #FBBF24 40%, #F59E0B 70%, #D97706 100%)',
        boxShadow: `
          0 2px 5px rgba(217, 119, 6, 0.4),
          inset 0 2px 3px rgba(255,255,255,0.6),
          inset 0 -2px 4px rgba(180,80,0,0.4)
        `,
        border: `${dims.border}px solid #E6A30F`,
        flexShrink: 0,
        animation: 'coinSpin 4s ease-in-out infinite', // Slowed down slightly for elegance
      }}
    >
      {/* Inner ring */}
      <span
        style={{
          position: 'absolute',
          width: dims.inner,
          height: dims.inner,
          borderRadius: '50%',
          border: `1px solid rgba(255,255,255,0.5)`,
          boxShadow: 'inset 0 1px 2px rgba(180,80,0,0.2)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      {/* MODIFIED: Changed ₹ to Cr and updated typography for a premium feel */}
      <span
        style={{
          fontSize: dims.fontSize,
          fontWeight: 900,
          color: '#8A4100', // Deep metallic brown
          lineHeight: 1,
          letterSpacing: '-0.3px',
          textShadow: '0 1px 0px rgba(255,255,255,0.5)',
          zIndex: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginLeft: '0.5px' // Optical alignment
        }}
      >
        Cr
      </span>
      {/* Shimmer highlight */}
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: 3,
          width: dims.shimmer,
          height: dims.shimmer / 2,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
          filter: 'blur(0.5px)',
          transform: 'rotate(-30deg)',
        }}
      />

      <style>{`
        @keyframes coinSpin {
          0%, 100% { transform: rotateY(0deg) scale(1); }
          30% { transform: rotateY(20deg) scale(1.05); }
          60% { transform: rotateY(-15deg) scale(1.02); }
        }
      `}</style>
    </span>
  );
};

/* ─────────────────────────────────────────────
   Main Navbar
───────────────────────────────────────────── */
const Navbar = ({ user }) => {
  const location = useLocation();
  const [credits, setCredits] = useState(user?.account_credits || 0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const profileResponse = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
        if (profileResponse.data.success) {
          const freshCredits = profileResponse.data.data.account_credits;
          setCredits(freshCredits);
          const storedUser = JSON.parse(localStorage.getItem('dealit_user'));
          if (storedUser) {
            storedUser.account_credits = freshCredits;
            localStorage.setItem('dealit_user', JSON.stringify(storedUser));
          }
        }
        const notifResponse = await axios.get(`${API_URL}/notifications?limit=1`, { withCredentials: true });
        if (notifResponse.data.success) {
          setUnreadCount(notifResponse.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error fetching user data for Navbar:', error);
      }
    };

    fetchUserData();

    const handleNotificationsRead = () => setUnreadCount(0);
    window.addEventListener('notificationsRead', handleNotificationsRead);
    return () => window.removeEventListener('notificationsRead', handleNotificationsRead);
  }, [user, location.pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 z-10">
              <img src="/logo.png" alt="Dealit Logo" className="w-8 h-8 object-contain" />
              <img src="/img.jpeg" alt="Dealit" className="h-6 object-contain" />
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

                  {/* ── MODIFIED: Desktop Credit Pill (Professional App Style) ── */}
                  <Link
                    to="/wallet"
                    className="group flex items-center gap-2 bg-gradient-to-b from-white to-gray-50/80 border border-gray-200 hover:border-amber-300 px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(251,191,36,0.15)] transition-all duration-300 cursor-pointer"
                  >
                    <CSSCoin size="md" />
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-extrabold text-gray-800 tracking-tight">
                        {credits.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-bold text-amber-500 tracking-wide uppercase">Cr</span>
                    </div>
                  </Link>

                  {/* Desktop notification bell */}
                  <Link to="/notifications" className="text-gray-500 hover:text-[#A388E1] transition flex items-center gap-1.5 relative">
                    <div className="relative">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">Alerts</span>
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

            {/* Mobile Top Right Icons */}
            <div className="md:hidden flex items-center gap-2">
              <Link to="/search" className="text-gray-600 hover:text-[#A388E1] p-1">
                <Search className="w-5 h-5" />
              </Link>

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="flex items-center justify-center bg-gray-800 text-white w-7 h-7 rounded-full shadow-md border border-gray-700 hover:bg-gray-900 transition">
                      <Shield className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {/* ── MODIFIED: Mobile Credit Pill (Compact Professional Style) ── */}
                  <Link
                    to="/wallet"
                    className="flex items-center gap-1.5 bg-gradient-to-b from-white to-gray-50/80 border border-gray-200 px-2.5 py-1.5 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.03)] active:scale-95 transition-transform"
                  >
                    <CSSCoin size="sm" />
                    <span className="text-xs font-extrabold text-gray-800 leading-none">
                      {credits >= 10000 ? (credits / 1000).toFixed(1) + 'k' : credits.toLocaleString('en-IN')}
                    </span>
                  </Link>

                  {/* Mobile notification bell */}
                  <Link to="/notifications" className="text-gray-600 hover:text-[#A388E1] p-1 relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <Link to="/login" className="text-sm font-semibold text-[#A388E1] ml-1">
                  Login
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;