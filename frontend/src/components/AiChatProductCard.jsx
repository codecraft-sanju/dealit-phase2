import React from 'react';
import { Package, ChevronRight, Sparkles } from 'lucide-react';
import { getOptimizedCloudinaryUrl } from './HomePage';
const AiChatProductCard = ({ item, onClick }) => {
  if (!item) return null;
  return (
    <div onClick={() => onClick(item._id)} className="relative w-full flex flex-col transition-all duration-500 border border-gray-700/50 bg-gray-900/80 hover:bg-gray-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-100 pointer-events-none z-20" />
      <div className="relative w-full aspect-[4/3] bg-gray-950 overflow-hidden">
        {item.discount_percentage && (
          <span className="absolute top-1.5 left-1.5 z-30 text-[8px] font-black text-white bg-gradient-to-r from-rose-500 to-pink-500 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.4)] tracking-wider">
            {item.discount_percentage}% OFF
          </span>
        )}
        {item.images && item.images.length > 0 && item.images[0] ? (
          <img src={getOptimizedCloudinaryUrl(item.images[0])} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Package className="w-6 h-6 text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent z-10" />
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between relative z-30">
        <div className="mb-2.5">
          <h3 className="text-[11px] sm:text-xs font-bold text-gray-200 line-clamp-1 mb-1.5 group-hover:text-purple-300 transition-colors duration-300">
            {item.title}
          </h3>
          <div className="flex items-end gap-1">
            <span className="font-black text-[14px] sm:text-[15px] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 leading-none drop-shadow-sm">
              {item.estimated_value || '0'}
            </span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-[2px]">
              Credits
            </span>
          </div>
        </div>
        <div className="w-full bg-purple-500/10 group-hover:bg-purple-500/25 border border-purple-500/20 group-hover:border-purple-400/50 text-purple-300 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-300 shadow-inner">
          <Sparkles className="w-3 h-3 text-purple-400 group-hover:text-white transition-colors" />
          <span>View Deal</span>
          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
export default AiChatProductCard;