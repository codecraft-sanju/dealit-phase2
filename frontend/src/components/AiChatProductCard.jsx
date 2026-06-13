import React from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { getOptimizedCloudinaryUrl } from './HomePage';

const AiChatProductCard = ({ item, onClick }) => {
  if (!item) return null;

  return (
    <div 
      onClick={() => onClick(item._id)}
      className="w-[140px] sm:w-[160px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(107,70,193,0.12)] hover:border-purple-200 transition-all duration-300 cursor-pointer group flex flex-col snap-center"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        {item.discount_percentage && (
          <span className="absolute top-1.5 left-1.5 z-10 text-[8px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm">
            {item.discount_percentage}% OFF
          </span>
        )}
        
        {item.images && item.images.length > 0 && item.images[0] ? (
          <img 
            src={getOptimizedCloudinaryUrl(item.images[0])} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-300" />
          </div>
        )}
        
        {/* Soft Dark Gradient from bottom for premium look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Details Section */}
      <div className="p-2.5 flex flex-col flex-1 justify-between bg-white">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-gray-800 line-clamp-1 mb-1 group-hover:text-purple-700 transition-colors">
            {item.title}
          </h3>
          
          <div className="flex items-center gap-1">
            <span className="font-black text-[13px] sm:text-sm text-purple-600 leading-none">
              {item.estimated_value || '0'}
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">
              Credits
            </span>
          </div>
        </div>

        {/* Action Button - Slides up slightly on hover */}
        <div className="w-full bg-gray-50 group-hover:bg-purple-50 border border-gray-100 group-hover:border-purple-100 text-gray-500 group-hover:text-purple-600 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-300">
          View Deal <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default AiChatProductCard;