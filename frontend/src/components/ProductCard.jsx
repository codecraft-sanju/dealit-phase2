import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Coins } from 'lucide-react';

const ProductCard = ({ item, isLoading, className = '' }) => {
  // Skeleton Loader State
  if (isLoading) {
    return (
      <div className={`bg-[#F8F6FF] rounded-3xl p-4 relative block border border-gray-50 animate-pulse ${className}`}>
        <div className="h-24 w-full bg-[#EBE5F7] rounded-2xl mb-4"></div>
        <div>
          <div className="h-3 w-full bg-[#EBE5F7] rounded-md mb-2"></div>
          <div className="h-3 w-2/3 bg-[#EBE5F7] rounded-md mb-3"></div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-4 h-4 rounded-full bg-[#EBE5F7]"></div>
            <div className="h-3 w-10 bg-[#EBE5F7] rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback agar item null ho
  if (!item) return null;

  // Actual Product Card
  return (
    <Link 
      to={`/item/${item._id}`} 
      className={`bg-[#F8F6FF] rounded-3xl p-4 relative block hover:shadow-md transition-shadow ${className}`}
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
  );
};

export default ProductCard;