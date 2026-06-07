// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Package, Coins } from 'lucide-react';
// import axios from 'axios'; // NAYA CHANGE: Axios import kiya API call ke liye

// import { getOptimizedCloudinaryUrl } from './HomePage';

// const API_BASE = import.meta.env.VITE_BACKEND_API;
// const API_URL = `${API_BASE}/api`;

// const ProductCard = ({ item, isLoading, className = '', onClick, isSelected }) => {
  
//   const handleRecordView = () => {
//     if (!item || !item._id) return;
    
//     try {
//       const existingData = localStorage.getItem('dealit_recently_viewed_ids');
//       let viewedIds = existingData ? JSON.parse(existingData) : [];
      
//       viewedIds = viewedIds.filter(id => id !== item._id);
//       viewedIds.unshift(item._id);
      
//       if (viewedIds.length > 20) {
//         viewedIds = viewedIds.slice(0, 20);
//       }
      
//       localStorage.setItem('dealit_recently_viewed_ids', JSON.stringify(viewedIds));

//       // NAYA CHANGE: Silent Cross-Device Sync (Database me update karega bina loading dikhaye)
//       const token = localStorage.getItem('dealit_token');
//       if (token) {
//         axios.post(`${API_URL}/users/recently-viewed/sync`, { viewedIds })
//           .catch(() => {}); // Error aaye toh ignore kar dega, UI block nahi hoga
//       }

//     } catch (error) {
//       console.error("Failed to save view history", error);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className={`bg-[#F8F6FF] rounded-2xl p-2.5 relative block border border-gray-50 animate-pulse ${className}`}>
//         <div className="w-full aspect-square bg-[#EBE5F7] rounded-xl mb-3"></div>
//         <div>
//           <div className="h-2.5 w-full bg-[#EBE5F7] rounded-md mb-1.5"></div>
//           <div className="h-2.5 w-2/3 bg-[#EBE5F7] rounded-md mb-2"></div>
//           <div className="flex items-center justify-between mt-1.5">
//             <div className="flex items-center gap-1.5">
//               <div className="w-3.5 h-3.5 rounded-full bg-[#EBE5F7]"></div>
//               <div className="h-2.5 w-8 bg-[#EBE5F7] rounded-md"></div>
//             </div>
//             <div className="h-3 w-12 bg-[#EBE5F7] rounded-md"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!item) return null;

//   const baseClasses = `rounded-2xl p-2.5 relative block transition-all ${className}`;
//   const selectedClasses = isSelected
//     ? 'border-2 border-[#6B46C1] shadow-md shadow-[#6B46C1]/10 bg-[#f8f6ff] scale-[0.98]'
//     : 'border-2 border-transparent bg-[#F8F6FF] hover:shadow-md hover:border-slate-200';
  
//   const combinedClasses = `${baseClasses} ${selectedClasses}`;

//   const cardContent = (
//     <>
//       <div className="relative w-full aspect-square flex items-center justify-center mb-3 bg-white/40 rounded-xl overflow-hidden">
//         {item.discount_percentage && (
//           <span className="absolute top-2 left-2 z-10 text-[9px] font-black text-white bg-[#FF4747] px-1.5 py-0.5 rounded shadow-sm">
//             {item.discount_percentage}% OFF
//           </span>
//         )}
        
//         {item.images && item.images.length > 0 && item.images[0] ? (
//           <img src={getOptimizedCloudinaryUrl(item.images[0])} alt={item.title} className="w-full h-full object-cover mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105" />
//         ) : (
//           <Package className="w-8 h-8 text-[#A388E1]/40" />
//         )}
//       </div>
      
//       <div>
//         <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
//         <div className="flex items-center justify-between mt-1.5">
          
//           <div className="flex items-center gap-1.5">
//             <div className="flex items-center gap-1">
//               <div className="bg-yellow-100 rounded-full p-0.5">
//                 <Coins className="w-2.5 h-2.5 text-yellow-600" />
//               </div>
//               <span className="font-bold text-gray-900 text-xs">{item.estimated_value || '0'}</span>
//             </div>
//             {item.original_value && (
//               <span className="text-[10px] text-gray-400 line-through font-medium">
//                 {item.original_value}
//               </span>
//             )}
//           </div>
          
//           <div className="flex flex-col items-end gap-1">
//             {item.category && (
//               <span className="text-[9px] font-medium text-[#A388E1] bg-[#EBE5F7] px-1.5 py-0.5 rounded-md truncate max-w-[65px]">
//                 {item.category}
//               </span>
//             )}
//           </div>

//         </div>
//       </div>
//     </>
//   );

//   if (onClick) {
//     return (
//       <div 
//         onClick={() => {
//           handleRecordView(); 
//           onClick(item._id);
//         }} 
//         className={`cursor-pointer ${combinedClasses}`}
//       >
//         {cardContent}
//       </div>
//     );
//   }

//   return (
//     <Link 
//       to={`/item/${item._id}`} 
//       onClick={handleRecordView} 
//       className={combinedClasses}
//     >
//       {cardContent}
//     </Link>
//   );
// };

// export default ProductCard;



import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import axios from 'axios';

import { getOptimizedCloudinaryUrl } from './HomePage';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ProductCard = ({ item, isLoading, className = '', onClick, isSelected }) => {

  const handleRecordView = () => {
    if (!item || !item._id) return;

    try {
      const existingData = localStorage.getItem('dealit_recently_viewed_ids');
      let viewedIds = existingData ? JSON.parse(existingData) : [];

      viewedIds = viewedIds.filter(id => id !== item._id);
      viewedIds.unshift(item._id);

      if (viewedIds.length > 20) {
        viewedIds = viewedIds.slice(0, 20);
      }

      localStorage.setItem('dealit_recently_viewed_ids', JSON.stringify(viewedIds));

      // Silent Cross-Device Sync (Database me update karega bina loading dikhaye)
      const token = localStorage.getItem('dealit_token');
      if (token) {
        axios.post(`${API_URL}/users/recently-viewed/sync`, { viewedIds })
          .catch(() => {}); // Error aaye toh ignore kar dega, UI block nahi hoga
      }

    } catch (error) {
      console.error('Failed to save view history', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-[#F8F6FF] rounded-2xl p-2.5 relative block border border-gray-50 animate-pulse ${className}`}>
        <div className="w-full aspect-square bg-[#EBE5F7] rounded-xl mb-3" />
        <div>
          <div className="h-2.5 w-full bg-[#EBE5F7] rounded-md mb-1.5" />
          <div className="h-2.5 w-2/3 bg-[#EBE5F7] rounded-md mb-2" />
          <div className="flex items-center justify-between mt-1.5">
            <div className="h-2.5 w-16 bg-[#EBE5F7] rounded-md" />
            <div className="h-3 w-12 bg-[#EBE5F7] rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const baseClasses = `rounded-2xl p-2.5 relative block transition-all ${className}`;
  const selectedClasses = isSelected
    ? 'border-2 border-[#6B46C1] shadow-md shadow-[#6B46C1]/10 bg-[#f8f6ff] scale-[0.98]'
    : 'border-2 border-transparent bg-[#F8F6FF] hover:shadow-md hover:border-slate-200';

  const combinedClasses = `${baseClasses} ${selectedClasses}`;

  const cardContent = (
    <>
      {/* Image */}
      <div className="relative w-full aspect-square flex items-center justify-center mb-3 bg-white/40 rounded-xl overflow-hidden">
        {item.discount_percentage && (
          <span className="absolute top-2 left-2 z-10 text-[9px] font-black text-white bg-[#FF4747] px-1.5 py-0.5 rounded shadow-sm">
            {item.discount_percentage}% OFF
          </span>
        )}

        {item.images && item.images.length > 0 && item.images[0] ? (
          <img
            src={getOptimizedCloudinaryUrl(item.images[0])}
            alt={item.title}
            className="w-full h-full object-cover mix-blend-multiply drop-shadow-sm transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <Package className="w-8 h-8 text-[#A388E1]/40" />
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
          {item.title}
        </h3>

        <div className="flex items-center justify-between mt-1.5">

          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-gray-900">
              {item.estimated_value || '0'}
            </span>
            {/* Credits label next to price */}
            <span className="text-[10px] font-semibold text-[#6B46C1]">
              credits
            </span>
            {item.original_value && (
              <span className="text-[10px] text-gray-400 line-through font-medium">
                {item.original_value}
              </span>
            )}
          </div>

          {/* Category badge */}
          {item.category && (
            <span className="text-[9px] font-medium text-[#A388E1] bg-[#EBE5F7] px-1.5 py-0.5 rounded-md truncate max-w-[65px]">
              {item.category}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <div
        onClick={() => {
          handleRecordView();
          onClick(item._id);
        }}
        className={`cursor-pointer ${combinedClasses}`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      to={`/item/${item._id}`}
      onClick={handleRecordView}
      className={combinedClasses}
    >
      {cardContent}
    </Link>
  );
};

export default ProductCard;