// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { Home, User, Plus, Coins, Bell } from 'lucide-react';
// import axios from 'axios';

// const API_URL = import.meta.env.VITE_BACKEND_API + '/api';

// const BottomNav = ({ user }) => {
//   const location = useLocation();
//   const [unreadCount, setUnreadCount] = useState(0);

//   useEffect(() => {
//     if (!user) return;
    
//     const fetchUnreadCount = async () => {
//       try {
//         // Ab ye API backend optimizations ki wajah se instant response degi
//         const response = await axios.get(`${API_URL}/notifications?limit=1`, { withCredentials: true });
//         if (response.data.success) {
//           setUnreadCount(response.data.unreadCount || 0);
//         }
//       } catch (error) {
//         console.error("Failed to fetch notification count", error);
//       }
//     };

//     fetchUnreadCount();

//     const handleNotificationsRead = () => {
//       setUnreadCount(0);
//     };

//     window.addEventListener('notificationsRead', handleNotificationsRead);

//     return () => {
//       window.removeEventListener('notificationsRead', handleNotificationsRead);
//     };
//   }, [location.pathname, user]);

//   return (
//     <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      
//       <div className="flex justify-between items-end relative">
        
//         {/* 1. Home */}
//         <Link
//           to="/"
//           style={{ WebkitTapHighlightColor: 'transparent' }}
//           className={`flex flex-col items-center gap-1 w-12 pb-1 transition-transform duration-200 active:scale-90 ${location.pathname === '/' ? 'text-[#6B46C1] scale-110' : 'text-gray-400'}`}
//         >
//           <Home className={`w-6 h-6 ${location.pathname === '/' ? 'fill-[#EBE5F7]' : ''}`} />
//           <span className="text-[10px] font-bold tracking-wide">Home</span>
//         </Link>
                  
//         {/* 2. Earn */}
//         <Link
//           to={user ? '/wallet' : '/login'}
//           style={{ WebkitTapHighlightColor: 'transparent' }}
//           className={`flex flex-col items-center gap-1 w-12 pb-1 transition-transform duration-200 active:scale-90 ${location.pathname === '/wallet' ? 'text-yellow-500 scale-110' : 'text-gray-400'}`}
//         >
//           <Coins className={`w-6 h-6 ${location.pathname === '/wallet' ? 'fill-yellow-100' : ''}`} />
//           <span className="text-[10px] font-bold tracking-wide">Earn</span>
//         </Link>

//         {/* 3. Floating Add Button (Center) */}
//         <div className="relative -top-5">
//           <Link
//             to={user ? '/add-item' : '/login'}
//             style={{ WebkitTapHighlightColor: 'transparent' }}
//             className="flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-tr from-[#6B46C1] to-[#A388E1] rounded-full shadow-[0_8px_20px_rgba(107,70,193,0.4)] border-4 border-white transform transition-transform duration-200 active:scale-90"
//           >
//             <Plus className="w-7 h-7 text-white" strokeWidth={3} />
//           </Link>
//         </div>

//         {/* 4. Notifications */}
//         <Link
//           to={user ? '/notifications' : '/login'}
//           style={{ WebkitTapHighlightColor: 'transparent' }}
//           className={`flex flex-col items-center gap-1 w-12 pb-1 transition-transform duration-200 active:scale-90 ${location.pathname === '/notifications' ? 'text-[#6B46C1] scale-110' : 'text-gray-400'}`}
//         >
//           <div className="relative">
//             <Bell className={`w-6 h-6 ${location.pathname === '/notifications' ? 'fill-[#EBE5F7]' : ''}`} />
//             {unreadCount > 0 && (
//               <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
//                 {unreadCount > 9 ? '9+' : unreadCount}
//               </span>
//             )}
//           </div>
//           <span className="text-[10px] font-bold tracking-wide">Alerts</span>
//         </Link>
        
//         {/* 5. Profile */}
//         <Link
//           to={user ? '/profile' : '/login'}
//           style={{ WebkitTapHighlightColor: 'transparent' }}
//           className={`flex flex-col items-center gap-1 w-12 pb-1 transition-transform duration-200 active:scale-90 ${location.pathname === '/profile' ? 'text-[#6B46C1] scale-110' : 'text-gray-400'}`}
//         >
//           <User className={`w-6 h-6 ${location.pathname === '/profile' ? 'fill-[#EBE5F7]' : ''}`} />
//           <span className="text-[10px] font-bold tracking-wide">Profile</span>
//         </Link>
        
//       </div>
//     </div>
//   );
// };

// export default BottomNav;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, Plus, Coins, Bell } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_API + '/api';

const BottomNav = ({ user }) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        // Ab ye API backend optimizations ki wajah se instant response degi
        const response = await axios.get(`${API_URL}/notifications?limit=1`, { withCredentials: true });
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Failed to fetch notification count", error);
      }
    };

    fetchUnreadCount();

    const handleNotificationsRead = () => {
      setUnreadCount(0);
    };

    window.addEventListener('notificationsRead', handleNotificationsRead);

    return () => {
      window.removeEventListener('notificationsRead', handleNotificationsRead);
    };
  }, [location.pathname, user]);


  return (
   
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-gray-100/50 rounded-t-[2rem] z-50 shadow-[0_-10px_40px_rgba(107,70,193,0.15)] pb-[env(safe-area-inset-bottom)] overflow-hidden">
      
      
      <div className="flex justify-around items-center h-16 px-4 relative">
        
        <Link
          to="/"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300"
        >
          {location.pathname === '/' && (
            <div className="absolute top-0 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-[#6B46C1] to-transparent shadow-[0_2px_10px_rgba(107,70,193,0.6)]" />
          )}
          <Home className={`w-6 h-6 z-10 transition-transform duration-300 ${location.pathname === '/' ? 'text-[#6B46C1] -translate-y-2' : 'text-gray-400'}`} />
          <span className={`absolute bottom-1.5 text-[10px] font-bold tracking-wide transition-all duration-300 ${location.pathname === '/' ? 'opacity-100 text-[#6B46C1] translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Home
          </span>
        </Link>
                  
        <Link
          to={user ? '/wallet' : '/login'}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300"
        >
          {location.pathname === '/wallet' && (
            <div className="absolute top-0 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent shadow-[0_2px_10px_rgba(234,179,8,0.6)]" />
          )}
          <Coins className={`w-6 h-6 z-10 transition-transform duration-300 ${location.pathname === '/wallet' ? 'text-yellow-500 -translate-y-2' : 'text-gray-400'}`} />
          <span className={`absolute bottom-1.5 text-[10px] font-bold tracking-wide transition-all duration-300 ${location.pathname === '/wallet' ? 'opacity-100 text-yellow-600 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Earn
          </span>
        </Link>

        <div className="relative flex justify-center items-center w-16 h-full">
          <Link
            to={user ? '/add-item' : '/login'}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className="flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-tr from-[#6B46C1] to-[#A388E1] rounded-full shadow-[0_6px_15px_rgba(107,70,193,0.3)] transform transition-transform duration-200 active:scale-90"
          >
            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
          </Link>
        </div>

        <Link
          to={user ? '/notifications' : '/login'}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300"
        >
          {location.pathname === '/notifications' && (
            <div className="absolute top-0 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-[#6B46C1] to-transparent shadow-[0_2px_10px_rgba(107,70,193,0.6)]" />
          )}
          <div className={`relative z-10 transition-transform duration-300 ${location.pathname === '/notifications' ? '-translate-y-2 text-[#6B46C1]' : 'text-gray-400'}`}>
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className={`absolute bottom-1.5 text-[10px] font-bold tracking-wide transition-all duration-300 ${location.pathname === '/notifications' ? 'opacity-100 text-[#6B46C1] translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Alerts
          </span>
        </Link>
        
        {/* 5. Profile */}
        <Link
          to={user ? '/profile' : '/login'}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300"
        >
          {location.pathname === '/profile' && (
            <div className="absolute top-0 w-10 h-[3px] rounded-b-full bg-gradient-to-r from-transparent via-[#6B46C1] to-transparent shadow-[0_2px_10px_rgba(107,70,193,0.6)]" />
          )}
          <User className={`w-6 h-6 z-10 transition-transform duration-300 ${location.pathname === '/profile' ? 'text-[#6B46C1] -translate-y-2' : 'text-gray-400'}`} />
          <span className={`absolute bottom-1.5 text-[10px] font-bold tracking-wide transition-all duration-300 ${location.pathname === '/profile' ? 'opacity-100 text-[#6B46C1] translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Profile
          </span>
        </Link>
        
      </div>
    </div>
  );
};

export default BottomNav;