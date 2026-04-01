import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, User, PlusCircle, Coins } from 'lucide-react';

const BottomNav = ({ user }) => {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 pb-safe z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      <Link
        to="/"
        className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-[#A388E1]' : 'text-gray-400'}`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">Home</span>
      </Link>
                  
      <Link
        to={user ? '/wallet' : '/login'}
        className={`flex flex-col items-center gap-1 ${location.pathname === '/wallet' ? 'text-yellow-500' : 'text-gray-400'}`}
      >
        <Coins className="w-6 h-6" />
        <span className="text-[10px] font-medium">Earn</span>
      </Link>

      {/* Floating Add Button */}
      <Link
        to={user ? '/add-item' : '/login'}
        className={`flex flex-col items-center gap-1 ${location.pathname === '/add-item' ? 'text-[#A388E1]' : 'text-gray-400'}`}
      >
        <PlusCircle className="w-6 h-6" />
        <span className="text-[10px] font-medium">List</span>
      </Link>
      
      <Link
        to={user ? '/profile' : '/login'}
        className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-[#A388E1]' : 'text-gray-400'}`}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">Profile</span>
      </Link>
         
    </div>
  );
};

export default BottomNav;