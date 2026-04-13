import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Coins } from 'lucide-react';
// <-- NAYA CHANGE: Import helper function from HomePage
import { getOptimizedCloudinaryUrl } from './HomePage';

const ProductCard = ({ item, isLoading, className = '' }) => {
  // Skeleton Loader State
  if (isLoading) {
    return (
      <div className={`bg-[#F8F6FF] rounded-2xl p-2.5 relative block border border-gray-50 animate-pulse ${className}`}>
        <div className="w-full aspect-square bg-[#EBE5F7] rounded-xl mb-3"></div>
        <div>
          <div className="h-2.5 w-full bg-[#EBE5F7] rounded-md mb-1.5"></div>
          <div className="h-2.5 w-2/3 bg-[#EBE5F7] rounded-md mb-2"></div>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#EBE5F7]"></div>
              <div className="h-2.5 w-8 bg-[#EBE5F7] rounded-md"></div>
            </div>
            <div className="h-3 w-12 bg-[#EBE5F7] rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <Link 
      to={`/item/${item._id}`} 
      className={`bg-[#F8F6FF] rounded-2xl p-2.5 relative block hover:shadow-md transition-shadow ${className}`}
    >
      <div className="w-full aspect-square flex items-center justify-center mb-3 bg-white/40 rounded-xl overflow-hidden">
        {item.images && item.images.length > 0 && item.images[0] ? (
          // <-- NAYA CHANGE: Wrap item.images[0] with getOptimizedCloudinaryUrl -->
          <img src={getOptimizedCloudinaryUrl(item.images[0])} alt={item.title} className="w-full h-full object-cover mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105" />
        ) : (
          <Package className="w-8 h-8 text-[#A388E1]/40" />
        )}
      </div>
      
      <div>
        <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1">
            <div className="bg-yellow-100 rounded-full p-0.5">
              <Coins className="w-2.5 h-2.5 text-yellow-600" />
            </div>
            <span className="font-bold text-gray-900 text-xs">{item.estimated_value || '0'}</span>
          </div>
          
          {item.category && (
            <span className="text-[9px] font-medium text-[#A388E1] bg-[#EBE5F7] px-1.5 py-0.5 rounded-md truncate max-w-[65px]">
              {item.category}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;