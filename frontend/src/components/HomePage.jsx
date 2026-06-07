// import React, { useState, useEffect, useRef } from 'react';
// import { Link } from 'react-router-dom';
// import { useQuery, useMutation } from '@tanstack/react-query';
// import { Helmet } from 'react-helmet-async';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Package, Coins, ChevronRight, Plus, UserCircle, Gift,
//   Smartphone, Shirt, Watch, Home as HomeIcon, Gamepad2, 
//   Car, Monitor, Book, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell, Sparkles
// } from 'lucide-react';
// import axios from 'axios';
// import ProductCard from './ProductCard';
// import CoinCelebration from './CoinCelebration';

// const API_BASE = import.meta.env.VITE_BACKEND_API;
// const API_URL = `${API_BASE}/api`;

// export const getOptimizedCloudinaryUrl = (url) => {
//   if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || url.includes('q_auto')) {
//     return url;
//   }
//   return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
// };

// const ICON_DICTIONARY = {
//   'Package': Package,
//   'Smartphone': Smartphone,
//   'Shirt': Shirt,
//   'Watch': Watch,
//   'Home': HomeIcon,
//   'Gamepad2': Gamepad2,
//   'Car': Car,
//   'Monitor': Monitor,
//   'Book': Book,
//   'Sofa': Sofa,
//   'Music': Music,
//   'Utensils': Utensils,
//   'Heart': Heart,
//   'Briefcase': Briefcase,
//   'Camera': Camera,
//   'Dumbbell': Dumbbell
// };

// const DUMMY_AVATARS = [
//   'https://i.pravatar.cc/40?img=11',
//   'https://i.pravatar.cc/40?img=32',
//   'https://i.pravatar.cc/40?img=45',
//   'https://i.pravatar.cc/40?img=16',
//   'https://i.pravatar.cc/40?img=57',
// ];

// const containerVariants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: { staggerChildren: 0.1, delayChildren: 0.1 }
//   }
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
// };

// const scaleTap = { scale: 0.92 };
// const hoverSpring = { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } };

// const ModernShimmer = ({ className }) => (
//   <div className={`relative overflow-hidden bg-gray-100 rounded-2xl ${className}`}>
//     <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
//   </div>
// );

// let initialAnimationPlayed = false;

// const HomePage = ({ user, setUser }) => {
//   const [activeCategory, setActiveCategory] = useState('All');
//   const [showCelebration, setShowCelebration] = useState(false);
//   const [isHovered, setIsHovered] = useState(false);
//   const shouldAnimate = !initialAnimationPlayed;

//   const scrollRef = useRef(null);
//   const isDown = useRef(false);
//   const startX = useRef(0);
//   const scrollLeftPos = useRef(0);

//   useEffect(() => {
    
//     initialAnimationPlayed = true;

//     const handleBonusClaimedEvent = () => {
//       setShowCelebration(true);
//       setTimeout(() => setShowCelebration(false), 5500);
//     };

//     window.addEventListener('bonusClaimedSuccess', handleBonusClaimedEvent);
//     return () => window.removeEventListener('bonusClaimedSuccess', handleBonusClaimedEvent);
//   }, []);

//   const { data: bonusSettings = { enabled: true, amount: 50 } } = useQuery({
//     queryKey: ['publicSettings'],
//     queryFn: async () => {
//       const res = await axios.get(`${API_URL}/admin/public-settings`);
//       if (res.data.success && res.data.data) {
//         return {
//           enabled: res.data.data.isWelcomeBonusEnabled ?? true,
//           amount: res.data.data.welcomeBonusAmount ?? 50
//         };
//       }
//       return { enabled: true, amount: 50 };
//     },
//     staleTime: 1000 * 60 * 5, 
//   });

//   const { data: offers = [], isLoading: loadingOffers } = useQuery({
//     queryKey: ['offers'],
//     queryFn: async () => {
//       const response = await axios.get(`${API_URL}/offers`);
//       return response.data.data.filter(offer => offer.isActive);
//     },
//   });

//   const { data: categories = [], isLoading: loadingCategories } = useQuery({
//     queryKey: ['categories', 'activeOnly'], 
//     queryFn: async () => {
//       const response = await axios.get(`${API_URL}/categories?activeOnly=true&hasItems=true`);
//       return response.data.data;
//     },
//     staleTime: Infinity, 
//   });

//   const { data: items = [], isLoading: loadingItems } = useQuery({
//     queryKey: ['items', activeCategory], 
//     queryFn: async () => {
//       const url = activeCategory === 'All' 
//         ? `${API_URL}/items?limit=20` 
//         : `${API_URL}/items?category=${activeCategory}&limit=20`;
//       const response = await axios.get(url);
//       return response.data.data;
//     },
//   });

//   const { data: randomAvatars = [] } = useQuery({
//     queryKey: ['randomAvatars'],
//     queryFn: async () => {
//       const response = await axios.get(`${API_URL}/users/random-avatars`);
//       return response.data.data;
//     },
//     staleTime: 0, 
//   });

//   const claimBonusMutation = useMutation({
//     mutationFn: async () => {
//       return axios.post(`${API_URL}/users/claim-bonus`, {}, { withCredentials: true });
//     },
//     onSuccess: (response) => {
//       if (response.data.success) {
//         setShowCelebration(true);
//         setUser(prevUser => {
//           const updatedUser = {
//             ...prevUser,
//             account_credits: response.data.data.account_credits,
//             hasClaimedWelcomeBonus: response.data.data.hasClaimedWelcomeBonus
//           };
//           localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
//           return updatedUser;
//         });

//         setTimeout(() => setShowCelebration(false), 5500);
//       }
//     },
//     onError: (error) => {
//       console.error('Error claiming bonus:', error);
//       if (error.response?.status === 400) {
//         setUser(prevUser => {
//           const updatedUser = { ...prevUser, hasClaimedWelcomeBonus: true };
//           localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
//           return updatedUser;
//         });
//         alert(error.response.data.message || 'Bonus already claimed!');
//       } else {
//         alert('Failed to claim bonus. Please try again.');
//       }
//     }
//   });

//   useEffect(() => {
//     if (offers.length <= 1 || isHovered) return;

//     const interval = setInterval(() => {
//       if (scrollRef.current) {
//         const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
//         if (scrollLeft + clientWidth >= scrollWidth - 10) {
//           scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
//         } else {
//           scrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
//         }
//       }
//     }, 3500);

//     return () => clearInterval(interval);
//   }, [offers, isHovered]);

//   const handleMouseDown = (e) => {
//     isDown.current = true;
//     if (scrollRef.current) {
//       scrollRef.current.style.scrollBehavior = 'auto';
//       scrollRef.current.classList.remove('snap-x', 'snap-mandatory');
//     }
//     startX.current = e.pageX - scrollRef.current.offsetLeft;
//     scrollLeftPos.current = scrollRef.current.scrollLeft;
//   };

//   const handleMouseLeave = () => {
//     isDown.current = false;
//     setIsHovered(false);
//     if (scrollRef.current) {
//       scrollRef.current.style.scrollBehavior = 'smooth';
//       scrollRef.current.classList.add('snap-x', 'snap-mandatory');
//     }
//   };

//   const handleMouseUp = () => {
//     isDown.current = false;
//     if (scrollRef.current) {
//       scrollRef.current.style.scrollBehavior = 'smooth';
//       scrollRef.current.classList.add('snap-x', 'snap-mandatory');
//     }
//   };

//   const handleMouseMove = (e) => {
//     if (!isDown.current) return;
//     e.preventDefault();
//     const x = e.pageX - scrollRef.current.offsetLeft;
//     const walk = (x - startX.current) * 2;
//     if (scrollRef.current) {
//       scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
//     }
//   };

//   const shouldShowClaimButton = user && !user.hasClaimedWelcomeBonus && bonusSettings.enabled;

//   return (
//     <motion.div 
//       initial={shouldAnimate ? "hidden" : false} 
//       animate="show" 
//       variants={containerVariants}
//       className="max-w-md mx-auto bg-[#faf9fc] min-h-[calc(100vh-130px)] md:max-w-7xl md:px-0 relative overflow-hidden"
//     >
//       <Helmet>
//         <title>Home - DealIt | Swap & Trade</title>
//         <meta name="description" content="Sell your unused items, earn credits, and get what you actually want on DealIt. Start bartering today!" />
//       </Helmet>

//       <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-100/40 to-transparent pointer-events-none"></div>

//       <div className="px-4 pt-3 pb-0 relative z-10">
        
//         <div className="grid grid-cols-7 gap-2 mb-3">
//           <motion.div 
//             variants={itemVariants}
//             className="col-span-5 bg-white border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03),inset_0_1px_1px_rgb(255,255,255,1)] rounded-2xl p-3 flex flex-col justify-center h-full relative overflow-hidden group"
//           >
       
//             <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white to-white opacity-80 z-0"></div>
            
      
//             <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#A388E1]/20 rounded-full blur-3xl group-hover:bg-[#A388E1]/30 transition-colors duration-500 z-0"></div>
            
//             <h1 className="text-[16px] sm:text-[15px] md:text-[20px] font-extrabold text-gray-900 leading-tight mb-1.5 tracking-tight relative z-10 drop-shadow-sm">
//               Sell what you don't use<br/>
//               Get what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#805ad5] to-[#A388E1]">actually want</span>
//             </h1>
//             <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 font-medium leading-snug relative z-10">
//               Sell your stuff &rarr; Earn credits &rarr; Buy anything.
//             </p>

       
//             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>
//           </motion.div>

//           <motion.div variants={itemVariants} className="col-span-2 h-full">
//             {user ? (
//               <div className={`h-full bg-gradient-to-br from-[#A388E1] via-[#8c67d6] to-[#6b46c1] rounded-2xl p-2 text-white shadow-[0_8px_20px_rgba(163,136,225,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${showCelebration ? 'shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-[1.05]' : ''}`}>
                
            
//                 <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[glare_4s_infinite_ease-in-out] pointer-events-none z-0"></div>

//                 <div className="absolute top-1.5 right-1.5 bg-white/20 px-1 py-[1px] rounded text-[7px] font-semibold border border-white/20 backdrop-blur-md shadow-sm tracking-wide z-10 whitespace-nowrap">
//                   ₹1 = 1 Cr
//                 </div>

//                 <div className="relative z-10 flex flex-col justify-end">
               
//                   <motion.div 
//                     animate={showCelebration ? { rotateY: 360, scale: 1.2 } : { rotateY: 0, scale: 1 }}
//                     transition={{ duration: 0.8, type: "spring" }}
//                     className="mb-1 w-max"
//                   >
//                     <div className="relative w-6 h-6 rounded-full shadow-[0_3px_8px_rgba(217,119,6,0.6),inset_0_-2px_4px_rgba(146,64,14,0.6),inset_0_1px_3px_rgba(255,255,255,0.9)] border border-[#FEF08A] bg-gradient-to-br from-[#FEF08A] via-[#F59E0B] to-[#92400E] flex items-center justify-center overflow-hidden">
                    
//                       <div className="absolute inset-[2px] rounded-full border-[0.5px] border-[#92400E]/50 bg-gradient-to-tl from-[#FEF08A]/20 via-transparent to-[#D97706]/40 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
//                         <span className="font-black text-[#78350F] text-[9px] tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">Cr</span>
//                       </div>
            
//                       <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] animate-[glare_3s_infinite_ease-in-out]"></div>
//                     </div>
//                   </motion.div>
                  

//                   <div className="flex items-end gap-0.5 mt-0.5">
//                     <span className="text-base font-bold leading-none relative drop-shadow-md">
//                       {user.account_credits || 0}
//                       <AnimatePresence>
//                         {showCelebration && (
//                           <motion.span 
//                             initial={{ opacity: 0, y: 10, scale: 0.5 }}
//                             animate={{ opacity: 1, y: -30, scale: 1.2 }}
//                             exit={{ opacity: 0 }}
//                             transition={{ duration: 1.5, ease: "easeOut" }}
//                             className="absolute -top-2 -right-8 text-xs text-yellow-300 font-black drop-shadow-[0_0_10px_rgba(253,224,71,1)] flex items-center z-10"
//                           >
//                             +{bonusSettings.amount} <Sparkles className="w-2.5 h-2.5 ml-0.5 animate-spin" />
//                           </motion.span>
//                         )}
//                       </AnimatePresence>
//                     </span>
//                     <span className="text-[8px] font-medium opacity-90 mb-0.5">credits</span>
//                   </div>
//                 </div>

//                 {shouldShowClaimButton ? (
//                   <motion.button 
//                     whileTap={scaleTap}
//                     onClick={() => claimBonusMutation.mutate()} 
//                     disabled={claimBonusMutation.isPending}
//                     className="bg-gradient-to-r from-[#FFE28A] via-[#FFF0B3] to-[#FFD75E] text-yellow-900 text-[9px] font-extrabold px-1 py-1.5 mt-1.5 rounded-lg flex items-center justify-center gap-0.5 shadow-[0_4px_10px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.8)] transition hover:brightness-105 z-10 whitespace-nowrap disabled:opacity-80 relative overflow-hidden"
//                   >
                 
//                     <motion.div 
//                       className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-20deg]"
//                       animate={{ x: ["-150%", "250%"] }}
//                       transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
//                     />
//                     <span className="relative z-10 drop-shadow-sm">{claimBonusMutation.isPending ? 'Claiming...' : `Claim ${bonusSettings.amount}`}</span>
//                     <Gift className="w-2.5 h-2.5 relative z-10 drop-shadow-sm" />
//                   </motion.button>
//                 ) : (
//                   <Link to="/wallet" className="block relative z-10">
//                     <motion.div whileTap={scaleTap} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-1 py-1.5 mt-1.5 rounded-lg flex items-center justify-center gap-0.5 shadow-sm transition-colors whitespace-nowrap overflow-hidden relative">
//                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[glare_3s_infinite_ease-in-out]"></div>
//                       <span className="relative z-10">Earn More</span> <ChevronRight className="w-2.5 h-2.5 relative z-10" />
//                     </motion.div>
//                   </Link>
//                 )}
//               </div>
//             ) : (
//               <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-2 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col justify-between relative overflow-hidden">
//                 <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-[glare_5s_infinite_ease-in-out] pointer-events-none"></div>
//                 <div className="relative z-10">
//                   <UserCircle className="w-4 h-4 text-gray-400 opacity-80 mb-0.5" />
//                   <h3 className="text-[10px] font-bold leading-tight">Join</h3>
//                 </div>
//                 <div className="flex flex-col gap-1 mt-1 relative z-10">
//                   <Link to="/login">
//                     <motion.div whileTap={scaleTap} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white text-center text-[9px] font-bold py-1 rounded-md shadow-sm transition-colors">
//                       Login
//                     </motion.div>
//                   </Link>
//                   <Link to="/signup">
//                     <motion.div whileTap={scaleTap} className="bg-gradient-to-r from-[#A388E1] to-[#805ad5] text-white text-center text-[9px] font-bold py-1 rounded-md shadow-[0_2px_8px_rgba(163,136,225,0.4)]">
//                       Join
//                     </motion.div>
//                   </Link>
//                 </div>
//               </div>
//             )}
//           </motion.div>
//         </div>


//         {loadingOffers ? (
//           <motion.div variants={itemVariants} className="mb-0">
//             <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-0">
//               <ModernShimmer className="w-full aspect-[5/2] md:aspect-[5/1] flex-shrink-0 shadow-sm" />
//             </div>
//           </motion.div>
//         ) : offers.length > 0 ? (
//           <motion.div variants={itemVariants} className="mb-0 relative group">
         
//             <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>

//             <div 
//               ref={scrollRef}
//               onMouseEnter={() => setIsHovered(true)}
//               onMouseLeave={handleMouseLeave}
//               onMouseDown={handleMouseDown}
//               onMouseUp={handleMouseUp}
//               onMouseMove={handleMouseMove}
//               onTouchStart={() => setIsHovered(true)}
//               onTouchEnd={() => setIsHovered(false)}
//               className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory pb-0 scroll-smooth cursor-grab active:cursor-grabbing relative z-0"
//             >
//               {offers.map((offer) => (
//                 <div 
//                   key={offer._id} 
//                   className="w-full aspect-[5/2] md:aspect-[5/1] flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white/50 relative bg-gray-50"
//                 >
//                   <picture className="w-full h-full block pointer-events-none">
//                     <source media="(min-width: 768px)" srcSet={getOptimizedCloudinaryUrl(offer.desktopImage)} />
//                     <motion.img 
//                       whileHover={{ scale: 1.03 }}
//                       transition={{ duration: 0.5, ease: "easeOut" }}
//                       src={getOptimizedCloudinaryUrl(offer.mobileImage)} 
//                       alt="Special Offer" 
//                       className="w-full h-full object-cover"
//                     />
//                   </picture>
//                   {/* Subtle persistent glossy shine over images */}
//                   <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         ) : null}

//       </div>

//       {/* --- Categories Section --- */}
//       <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-0 relative z-10">
//         <div className="flex gap-2.5 overflow-x-auto hide-scrollbar items-center pb-3 pt-1">
//           {/* ALL Category */}
//           <motion.div 
//             whileHover={hoverSpring} whileTap={scaleTap}
//             onClick={() => setActiveCategory('All')}
//             className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-300 min-w-max z-0 ${activeCategory === 'All' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
//           >
//             {activeCategory === 'All' && (
//               <motion.div 
//                 layoutId="activeCategoryBg" 
//                 className="absolute inset-0 bg-gradient-to-r from-[#805ad5] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(128,90,213,0.3)]"
//                 transition={{ type: "spring", stiffness: 400, damping: 25 }}
//               />
//             )}
//             {activeCategory !== 'All' && (
//               <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
//             )}
//             <Package className={`w-4 h-4 relative z-10 ${activeCategory === 'All' ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
//             <span className="text-[13px] font-bold relative z-10">All</span>
//           </motion.div>

//           {loadingCategories ? (
//             [1, 2, 3, 4].map((i) => (
//               <ModernShimmer key={i} className="min-w-[90px] h-9 rounded-2xl shadow-sm flex-shrink-0" />
//             ))
//           ) : (
//             <>
//               {categories.map((cat) => {
//                 const IconComponent = ICON_DICTIONARY[cat.icon] || Package;
//                 const isActive = activeCategory === cat.name;

//                 return (
//                   <motion.div 
//                     key={cat._id} 
//                     whileHover={hoverSpring} whileTap={scaleTap}
//                     onClick={() => setActiveCategory(cat.name)}
//                     className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-300 min-w-max z-0 ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
//                   >
//                     {isActive && (
//                       <motion.div 
//                         layoutId="activeCategoryBg" 
//                         className="absolute inset-0 bg-gradient-to-r from-[#805ad5] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(128,90,213,0.3)]"
//                         transition={{ type: "spring", stiffness: 400, damping: 25 }}
//                       />
//                     )}
//                     {!isActive && (
//                       <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
//                     )}
//                     <IconComponent className={`w-4 h-4 relative z-10 ${isActive ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
//                     <span className="text-[13px] font-bold relative z-10">{cat.name}</span>
//                   </motion.div>
//                 );
//               })}

//               {/* OTHER Category */}
//               <motion.div 
//                 whileHover={hoverSpring} whileTap={scaleTap}
//                 onClick={() => setActiveCategory('Other')}
//                 className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-300 min-w-max z-0 ${activeCategory === 'Other' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
//               >
//                 {activeCategory === 'Other' && (
//                   <motion.div 
//                     layoutId="activeCategoryBg" 
//                     className="absolute inset-0 bg-gradient-to-r from-[#805ad5] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(128,90,213,0.3)]"
//                     transition={{ type: "spring", stiffness: 400, damping: 25 }}
//                   />
//                 )}
//                 {activeCategory !== 'Other' && (
//                   <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
//                 )}
//                 <Plus className={`w-4 h-4 relative z-10 ${activeCategory === 'Other' ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
//                 <span className="text-[13px] font-bold relative z-10">Other</span>
//               </motion.div>
//             </>
//           )}
//         </div>
//       </motion.div>

//       {/* --- Items Listing Section --- */}
//       <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-0 relative z-10">
//         <div className="flex justify-between items-center mb-2">
//           <h2 className="text-lg font-bold text-gray-900 drop-shadow-sm">
//             {activeCategory === 'All' ? 'Popular Items' : `Top in ${activeCategory}`}
//           </h2>
//           <Link 
//             to={activeCategory === 'All' ? '/items' : `/items?category=${activeCategory}`} 
//           >
//             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-xs font-semibold text-[#A388E1] bg-white border border-[#EBE5F7] px-3 py-1.5 rounded-full flex items-center gap-0.5 shadow-[0_2px_8px_rgba(163,136,225,0.1)] hover:shadow-[0_4px_12px_rgba(163,136,225,0.2)] transition-all">
//               See All <ChevronRight className="w-3.5 h-3.5" />
//             </motion.div>
//           </Link>
//         </div>

//         {loadingItems ? (
//           <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1">
//             {[1, 2, 3, 4].map((i) => (
//               <ProductCard key={i} isLoading={true} className="min-w-[140px] w-[140px] flex-shrink-0 shadow-sm" />
//             ))}
//           </div>
//         ) : items.length === 0 ? (
//           <div className="text-center text-gray-400 py-8 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center">
//             <Package className="w-8 h-8 text-gray-300 mb-2" />
//             <span className="text-xs font-medium">No items right now.</span>
//           </div>
//         ) : (
//           <motion.div 
//             initial={shouldAnimate ? "hidden" : false} 
//             animate="show" 
//             variants={containerVariants}
//             className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 pt-1 snap-x"
//           >
//             {items.map((item) => (
//               <motion.div variants={itemVariants} key={item._id} className="min-w-[140px] w-[140px] flex-shrink-0 snap-start">
//                 <ProductCard item={item} className="hover:shadow-[0_8px_25px_rgba(163,136,225,0.15)] transition-shadow duration-300" />
//               </motion.div>
//             ))}
//           </motion.div>
//         )}
//       </motion.div>

//       {/* --- Call to Action Section --- */}
//       <motion.div variants={itemVariants} className="px-4 pt-1 pb-1 relative z-10">
//         <motion.div 
//           whileHover={{ y: -2 }}
//           className="bg-gradient-to-r from-[#EBE5F7] via-[#F8F6FF] to-white border border-white shadow-[0_8px_20px_rgba(163,136,225,0.1),inset_0_1px_2px_rgba(255,255,255,1)] rounded-2xl p-4 relative overflow-hidden group"
//         >
//           {/* Subtle CTA Glow */}
//           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A388E1]/5 to-transparent skew-x-[-20deg] animate-[glare_5s_infinite_ease-in-out] pointer-events-none"></div>

//           <div className="w-3/4 relative z-10">
//             <h3 className="text-base font-extrabold text-[#6B46C1] mb-1 drop-shadow-sm">Got unused items?</h3>
//             <p className="text-[11px] text-gray-600 mb-3 leading-snug font-medium">
//               List items you no longer need and earn instant credits to exchange for products you want!
//             </p>
//             <Link to={user ? "/add-item" : "/login"}>
//               <motion.div 
//                 whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
//                 className="bg-gradient-to-r from-[#FFE28A] via-[#FFF0B3] to-[#FFD75E] text-yellow-900 px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-[0_4px_12px_rgba(250,204,21,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_6px_15px_rgba(250,204,21,0.4)] transition-all overflow-hidden relative"
//               >
//                 {/* Button Gloss Sweep */}
//                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] animate-[glare_2.5s_infinite_ease-in-out]"></div>
//                 <Plus className="w-4 h-4 relative z-10 drop-shadow-sm" /> 
//                 <span className="relative z-10 drop-shadow-sm">List an Item</span>
//               </motion.div>
//             </Link>
//           </div>
//           <motion.div 
//             animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} 
//             transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
//             className="absolute -right-4 -bottom-4 w-28 h-28 opacity-20 pointer-events-none drop-shadow-xl"
//           >
//             <Package className="w-full h-full text-[#A388E1]" />
//           </motion.div>
//         </motion.div>
//       </motion.div>

  
//       <motion.div variants={itemVariants} className="px-4 pb-6 pt-3 relative z-10">
//         <div className="flex items-center gap-3 px-1 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
//           <motion.div 
//             animate={{ scale: [1, 1.1, 1] }} 
//             transition={{ repeat: Infinity, duration: 2 }}
//             className="flex-shrink-0 bg-white p-2 rounded-full shadow-[0_2px_8px_rgba(163,136,225,0.2)]"
//           >
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
//               <path d="M3 17L9 11L13 15L21 7" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//               <path d="M15 7H21V13" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </motion.div>

//           <div className="flex flex-col gap-1">
//             <p className="text-[11px] font-extrabold text-gray-800 leading-tight">
//               Start earning by selling what you don't use anymore!
//             </p>

//             <div className="flex items-center gap-1.5">
//               <div className="flex -space-x-1.5 hover:space-x-0 transition-all duration-300 cursor-pointer">
                
      
//                 {(randomAvatars.length > 0 ? randomAvatars : DUMMY_AVATARS).map((src, i) => {
                  
                
//                   const finalSrc = (src && src.includes('ui-avatars.com')) ? DUMMY_AVATARS[i % DUMMY_AVATARS.length] : src;

//                   return (
//                     <motion.img
//                       whileHover={{ y: -5, scale: 1.1, zIndex: 20 }}
//                       key={i}
//                       src={finalSrc}
//                       alt={`user-${i}`}
//                       className="w-5 h-5 rounded-full border-2 border-white object-cover shadow-[0_2px_5px_rgba(0,0,0,0.1)] relative z-0 bg-white"
//                       onError={(e) => {
//                         e.target.onerror = null;
                
//                         e.target.src = DUMMY_AVATARS[i % DUMMY_AVATARS.length];
//                       }}
//                     />
//                   );
//                 })}

//               </div>
//               <p className="text-[9px] text-gray-500 font-bold">
//                 people are already trading
//               </p>
//             </div>
//           </div>
//         </div>
//       </motion.div>

 
//       {showCelebration && <CoinCelebration coinCount={30} />}

//       {/* Embedded Styles for Shimmers and Animations */}
//       <style>{`
//         .hide-scrollbar::-webkit-scrollbar {
//           display: none;
//         }
//         .hide-scrollbar {
//           -ms-overflow-style: none;
//           scrollbar-width: none;
//         }

//         @keyframes glare {
//           0%, 20% { transform: translateX(-150%) skewX(-20deg); }
//           80%, 100% { transform: translateX(250%) skewX(-20deg); }
//         }
//       `}</style>
//     </motion.div>
//   );
// }; 

// export default HomePage;








import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Coins, ChevronRight, Plus, UserCircle, Gift,
  Smartphone, Shirt, Watch, Home as HomeIcon, Gamepad2,
  Car, Monitor, Book, Sofa, Music, Utensils, Heart, Briefcase,
  Camera, Dumbbell, Sparkles, Tag, ShoppingBag, Shield, Users, Zap
} from 'lucide-react';
import axios from 'axios';
import ProductCard from './ProductCard';
import CoinCelebration from './CoinCelebration';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

export const getOptimizedCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com') || url.includes('q_auto')) {
    return url;
  }
  return url.replace('/upload/', '/upload/q_auto,f_auto,w_800/');
};

const ICON_DICTIONARY = {
  'Package': Package,
  'Smartphone': Smartphone,
  'Shirt': Shirt,
  'Watch': Watch,
  'Home': HomeIcon,
  'Gamepad2': Gamepad2,
  'Car': Car,
  'Monitor': Monitor,
  'Book': Book,
  'Sofa': Sofa,
  'Music': Music,
  'Utensils': Utensils,
  'Heart': Heart,
  'Briefcase': Briefcase,
  'Camera': Camera,
  'Dumbbell': Dumbbell
};

const DUMMY_AVATARS = [
  'https://i.pravatar.cc/40?img=11',
  'https://i.pravatar.cc/40?img=32',
  'https://i.pravatar.cc/40?img=45',
  'https://i.pravatar.cc/40?img=16',
  'https://i.pravatar.cc/40?img=57',
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const scaleTap = { scale: 0.93 };
const hoverSpring = { scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 10 } };

const ModernShimmer = ({ className }) => (
  <div className={`relative overflow-hidden bg-gray-100 rounded-2xl ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  </div>
);

// Reusable step badge component used in hero and "How it Works"
const StepBadge = ({ number, active }) => (
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${active ? 'bg-[#F59E0B] text-white shadow-[0_3px_10px_rgba(245,158,11,0.5)]' : 'bg-[#6b46c1] text-white'}`}>
    {number}
  </div>
);

let initialAnimationPlayed = false;

const HomePage = ({ user, setUser }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCelebration, setShowCelebration] = useState(false);
  const shouldAnimate = !initialAnimationPlayed;

  useEffect(() => {
    initialAnimationPlayed = true;

    const handleBonusClaimedEvent = () => {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5500);
    };

    window.addEventListener('bonusClaimedSuccess', handleBonusClaimedEvent);
    return () => window.removeEventListener('bonusClaimedSuccess', handleBonusClaimedEvent);
  }, []);

  const { data: bonusSettings = { enabled: true, amount: 100 } } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/admin/public-settings`);
      if (res.data.success && res.data.data) {
        return {
          enabled: res.data.data.isWelcomeBonusEnabled ?? true,
          amount: res.data.data.welcomeBonusAmount ?? 100
        };
      }
      return { enabled: true, amount: 100 };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', 'activeOnly'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/categories?activeOnly=true&hasItems=true`);
      return response.data.data;
    },
    staleTime: Infinity,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['items', activeCategory],
    queryFn: async () => {
      const url = activeCategory === 'All'
        ? `${API_URL}/items?limit=20`
        : `${API_URL}/items?category=${activeCategory}&limit=20`;
      const response = await axios.get(url);
      return response.data.data;
    },
  });

  const { data: randomAvatars = [] } = useQuery({
    queryKey: ['randomAvatars'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users/random-avatars`);
      return response.data.data;
    },
    staleTime: 0,
  });

  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      return axios.post(`${API_URL}/users/claim-bonus`, {}, { withCredentials: true });
    },
    onSuccess: (response) => {
      if (response.data.success) {
        setShowCelebration(true);
        setUser(prevUser => {
          const updatedUser = {
            ...prevUser,
            account_credits: response.data.data.account_credits,
            hasClaimedWelcomeBonus: response.data.data.hasClaimedWelcomeBonus
          };
          localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
          return updatedUser;
        });
        setTimeout(() => setShowCelebration(false), 5500);
      }
    },
    onError: (error) => {
      console.error('Error claiming bonus:', error);
      if (error.response?.status === 400) {
        setUser(prevUser => {
          const updatedUser = { ...prevUser, hasClaimedWelcomeBonus: true };
          localStorage.setItem('dealit_user', JSON.stringify(updatedUser));
          return updatedUser;
        });
        alert(error.response.data.message || 'Bonus already claimed!');
      } else {
        alert('Failed to claim bonus. Please try again.');
      }
    }
  });

  const shouldShowClaimButton = user && !user.hasClaimedWelcomeBonus && bonusSettings.enabled;

  return (
    <motion.div
      initial={shouldAnimate ? 'hidden' : false}
      animate="show"
      variants={containerVariants}
      className="max-w-md mx-auto bg-[#f5f4f9] min-h-[calc(100vh-130px)] md:max-w-7xl relative"
    >
      <Helmet>
        <title>Home - DealIt | Swap & Trade</title>
        <meta name="description" content="Sell your unused items, earn credits, and get what you actually want on DealIt. Start bartering today!" />
      </Helmet>

      {/* ─────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-4 pt-4 pb-0">
        <div className="grid grid-cols-5 gap-3 md:gap-4">

          {/* ── Left Hero Card ── */}
          <div className="col-span-3 bg-gradient-to-br from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] rounded-3xl overflow-hidden relative shadow-[0_12px_40px_rgba(109,40,217,0.45)] min-h-[220px] md:min-h-[260px]">

            {/* Background glow orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#A78BFA]/30 blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#4C1D95]/50 blur-2xl pointer-events-none" />

            {/* Glare sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[glare_5s_infinite_ease-in-out] pointer-events-none" />

            <div className="relative z-10 p-4 flex flex-col h-full">
              {/* Join badge */}
              {!user && (
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 mb-3 w-max">
                  <Gift className="w-3 h-3 text-yellow-300" />
                  <span className="text-[10px] font-bold text-white">Join &amp; Get {bonusSettings.amount} Credits</span>
                </div>
              )}

              {/* Headline */}
              <h1 className="text-[22px] sm:text-2xl md:text-3xl font-black text-white leading-[1.15] mb-2 tracking-tight drop-shadow-sm">
                Sell Unused.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] to-[#F59E0B]">Get Anything.</span>
              </h1>
              <p className="text-[11px] text-white/80 font-medium leading-snug mb-4">
                List unused items, earn credits<br />&amp; buy what you want instantly.
              </p>

              {/* 3-step row */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl px-2 py-2 border border-white/10">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                    <Tag className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[8px] font-bold text-white">1. Sell</span>
                  <span className="text-[7px] text-white/60 font-medium">List items</span>
                </div>
                <ChevronRight className="w-3 h-3 text-white/40 flex-shrink-0" />
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                    <Coins className="w-3 h-3 text-[#FCD34D]" />
                  </div>
                  <span className="text-[8px] font-bold text-white">2. Earn</span>
                  <span className="text-[7px] text-white/60 font-medium">Get credits</span>
                </div>
                <ChevronRight className="w-3 h-3 text-white/40 flex-shrink-0" />
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center">
                    <ShoppingBag className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[8px] font-bold text-white">3. Buy</span>
                  <span className="text-[7px] text-white/60 font-medium">Buy anything</span>
                </div>
              </div>

              {/* Bonus strips */}
              <div className="grid grid-cols-3 gap-1 mt-2">
                <div className="bg-white/10 rounded-lg p-1.5 flex flex-col gap-0.5 border border-white/10">
                  <Zap className="w-3 h-3 text-yellow-300" />
                  <span className="text-[8px] font-extrabold text-white leading-tight">Get {bonusSettings.amount} credits</span>
                  <span className="text-[7px] text-white/60">on signup</span>
                </div>
                <div className="bg-white/10 rounded-lg p-1.5 flex flex-col gap-0.5 border border-white/10">
                  <Coins className="w-3 h-3 text-yellow-300" />
                  <span className="text-[8px] font-extrabold text-white leading-tight">List items</span>
                  <span className="text-[7px] text-white/60">Get 70 cr each</span>
                </div>
                <div className="bg-white/10 rounded-lg p-1.5 flex flex-col gap-0.5 border border-white/10">
                  <ShoppingBag className="w-3 h-3 text-yellow-300" />
                  <span className="text-[8px] font-extrabold text-white leading-tight">Buy from credits</span>
                  <span className="text-[7px] text-white/60">Anything you want</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column: Credits + Trust ── */}
          <div className="col-span-2 flex flex-col gap-2.5">

            {/* Credits / Auth Card */}
            {user ? (
              <div className={`bg-gradient-to-br from-[#A388E1] via-[#8c67d6] to-[#6b46c1] rounded-2xl p-3 text-white shadow-[0_8px_24px_rgba(163,136,225,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${showCelebration ? 'shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-[1.03]' : ''}`}>
                {/* glare */}
                <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] animate-[glare_4s_infinite_ease-in-out] pointer-events-none" />

                <div className="absolute top-2 right-2 bg-white/20 px-1.5 py-0.5 rounded text-[7px] font-semibold border border-white/20 backdrop-blur-md z-10 whitespace-nowrap">
                  ₹1 = 1 Cr
                </div>

                {/* Coin */}
                <motion.div
                  animate={showCelebration ? { rotateY: 360, scale: 1.2 } : { rotateY: 0, scale: 1 }}
                  transition={{ duration: 0.8, type: 'spring' }}
                  className="w-8 h-8 rounded-full shadow-[0_3px_10px_rgba(217,119,6,0.7),inset_0_-2px_4px_rgba(146,64,14,0.6),inset_0_1px_3px_rgba(255,255,255,0.9)] border border-[#FEF08A] bg-gradient-to-br from-[#FEF08A] via-[#F59E0B] to-[#92400E] flex items-center justify-center relative overflow-hidden"
                >
                  <span className="font-black text-[#78350F] text-[10px]">Cr</span>
                  <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] animate-[glare_3s_infinite_ease-in-out]" />
                </motion.div>

                {/* Balance */}
                <div className="mt-1">
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black leading-none relative">
                      {user.account_credits || 0}
                      <AnimatePresence>
                        {showCelebration && (
                          <motion.span
                            initial={{ opacity: 0, y: 10, scale: 0.5 }}
                            animate={{ opacity: 1, y: -30, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                            className="absolute -top-2 -right-8 text-xs text-yellow-300 font-black flex items-center z-10"
                          >
                            +{bonusSettings.amount} <Sparkles className="w-2.5 h-2.5 ml-0.5 animate-spin" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="text-[10px] font-medium opacity-80 mb-0.5">Credits</span>
                  </div>
                  <p className="text-[9px] text-white/60 font-medium mt-0.5">Your balance</p>
                </div>

                {/* CTA */}
                {shouldShowClaimButton ? (
                  <motion.button
                    whileTap={scaleTap}
                    onClick={() => claimBonusMutation.mutate()}
                    disabled={claimBonusMutation.isPending}
                    className="mt-2 bg-gradient-to-r from-[#FFE28A] via-[#FFF0B3] to-[#FFD75E] text-yellow-900 text-[9px] font-extrabold px-2 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow-[0_4px_10px_rgba(0,0,0,0.1)] relative overflow-hidden disabled:opacity-80"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-20deg]"
                      animate={{ x: ['-150%', '250%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />
                    <span className="relative z-10">{claimBonusMutation.isPending ? 'Claiming...' : `Claim ${bonusSettings.amount}`}</span>
                    <Gift className="w-3 h-3 relative z-10" />
                  </motion.button>
                ) : (
                  <Link to="/wallet" className="block mt-2">
                    <motion.div whileTap={scaleTap} className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-2 py-1.5 rounded-xl flex items-center justify-center gap-1 relative overflow-hidden transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[glare_3s_infinite_ease-in-out]" />
                      <span className="relative z-10">Earn More</span>
                      <ChevronRight className="w-3 h-3 relative z-10" />
                    </motion.div>
                  </Link>
                )}
              </div>
            ) : (
              /* Guest state */
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-3 text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-[-150%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] animate-[glare_5s_infinite_ease-in-out] pointer-events-none" />
                <div className="relative z-10">
                  <UserCircle className="w-5 h-5 text-gray-400 mb-1" />
                  <h3 className="text-[11px] font-extrabold leading-tight">Join Dealit</h3>
                  <p className="text-[9px] text-gray-400 mt-0.5">Get {bonusSettings.amount} free credits</p>
                </div>
                <div className="flex flex-col gap-1.5 mt-2 relative z-10">
                  <Link to="/login">
                    <motion.div whileTap={scaleTap} className="bg-white/10 hover:bg-white/20 border border-white/10 text-white text-center text-[9px] font-bold py-1.5 rounded-xl transition-colors">
                      Login
                    </motion.div>
                  </Link>
                  <Link to="/signup">
                    <motion.div whileTap={scaleTap} className="bg-gradient-to-r from-[#A388E1] to-[#805ad5] text-white text-center text-[9px] font-bold py-1.5 rounded-xl shadow-[0_3px_10px_rgba(163,136,225,0.4)]">
                      Join Free
                    </motion.div>
                  </Link>
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="flex flex-col gap-1.5">
              {[
                { icon: Users, color: 'text-[#7C3AED]', bg: 'bg-purple-50', label: 'Trusted Community', sub: 'Verified members' },
                { icon: Shield, color: 'text-[#EA580C]', bg: 'bg-orange-50', label: 'Secure & Safe', sub: 'Protected payments' },
                { icon: Zap, color: 'text-[#0EA5E9]', bg: 'bg-sky-50', label: 'Easy & Instant', sub: 'Sell & buy in seconds' },
              ].map(({ icon: Icon, color, bg, label, sub }) => (
                <div key={label} className="bg-white rounded-xl px-2.5 py-2 flex items-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-50">
                  <div className={`${bg} p-1.5 rounded-lg flex-shrink-0`}>
                    <Icon className={`w-3 h-3 ${color}`} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-800 leading-none">{label}</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-4 pt-4">
        <div className="bg-white rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-50">
          <h2 className="text-base font-extrabold text-gray-900 text-center mb-4">
            How <span className="text-[#7C3AED]">Dealit</span> Works?
          </h2>
          <div className="flex items-start gap-1">
            {[
              { icon: Tag, step: 1, title: 'List Items', desc: 'Upload items you don\'t use', active: false },
              { icon: Coins, step: 2, title: 'Earn Credits', desc: 'Get credits when someone buys', active: true },
              { icon: ShoppingBag, step: 3, title: 'Buy Anything', desc: 'Use credits to buy what you want', active: false },
            ].map(({ icon: Icon, step, title, desc, active }, idx, arr) => (
              <React.Fragment key={step}>
                <div className="flex-1 flex flex-col items-center text-center gap-2">
                  <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center ${active ? 'bg-[#FEF9C3] shadow-[0_4px_12px_rgba(245,158,11,0.2)]' : 'bg-[#F3F0FF] shadow-[0_4px_12px_rgba(124,58,237,0.1)]'}`}>
                    <Icon className={`w-5 h-5 ${active ? 'text-[#F59E0B]' : 'text-[#7C3AED]'}`} />
                    <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${active ? 'bg-[#F59E0B] shadow-[0_2px_6px_rgba(245,158,11,0.5)]' : 'bg-[#7C3AED]'}`}>
                      {step}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-900">{title}</p>
                    <p className="text-[9px] text-gray-400 leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="flex-shrink-0 mt-5">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────
          CATEGORIES
      ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center pb-1 pt-0.5">
          {/* ALL */}
          <motion.div
            whileHover={hoverSpring} whileTap={scaleTap}
            onClick={() => setActiveCategory('All')}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-200 min-w-max z-0 ${activeCategory === 'All' ? 'text-white' : 'text-gray-600'}`}
          >
            {activeCategory === 'All' && (
              <motion.div
                layoutId="activeCategoryBg"
                className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            )}
            {activeCategory !== 'All' && (
              <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" />
            )}
            <Package className={`w-4 h-4 relative z-10 ${activeCategory === 'All' ? 'text-white' : 'text-gray-400'}`} />
            <span className="text-[13px] font-bold relative z-10">All</span>
          </motion.div>

          {loadingCategories ? (
            [1, 2, 3, 4].map(i => (
              <ModernShimmer key={i} className="min-w-[90px] h-9 rounded-2xl flex-shrink-0" />
            ))
          ) : (
            <>
              {categories.map(cat => {
                const IconComponent = ICON_DICTIONARY[cat.icon] || Package;
                const isActive = activeCategory === cat.name;
                return (
                  <motion.div
                    key={cat._id}
                    whileHover={hoverSpring} whileTap={scaleTap}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-200 min-w-max z-0 ${isActive ? 'text-white' : 'text-gray-600'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryBg"
                        className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      />
                    )}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" />
                    )}
                    <IconComponent className={`w-4 h-4 relative z-10 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span className="text-[13px] font-bold relative z-10">{cat.name}</span>
                  </motion.div>
                );
              })}

              {/* OTHER */}
              <motion.div
                whileHover={hoverSpring} whileTap={scaleTap}
                onClick={() => setActiveCategory('Other')}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-200 min-w-max z-0 ${activeCategory === 'Other' ? 'text-white' : 'text-gray-600'}`}
              >
                {activeCategory === 'Other' && (
                  <motion.div
                    layoutId="activeCategoryBg"
                    className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(124,58,237,0.35)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
                {activeCategory !== 'Other' && (
                  <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" />
                )}
                <Plus className={`w-4 h-4 relative z-10 ${activeCategory === 'Other' ? 'text-white' : 'text-gray-400'}`} />
                <span className="text-[13px] font-bold relative z-10">More</span>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* ─────────────────────────────────────────────
          ITEMS LISTING
      ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-4 pt-3">
        <div className="flex justify-between items-center mb-2.5">
          <h2 className="text-[17px] font-extrabold text-gray-900">
            {activeCategory === 'All' ? 'Popular Right Now' : `Top in ${activeCategory}`}
          </h2>
          <Link to={activeCategory === 'All' ? '/items' : `/items?category=${activeCategory}`}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} className="text-xs font-bold text-[#7C3AED] bg-white border border-[#EBE5F7] px-3 py-1.5 rounded-full flex items-center gap-0.5 shadow-[0_2px_8px_rgba(124,58,237,0.08)] hover:shadow-[0_4px_12px_rgba(124,58,237,0.15)] transition-all">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>

        {loadingItems ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2">
            {[1, 2, 3, 4].map(i => (
              <ProductCard key={i} isLoading={true} className="min-w-[145px] w-[145px] flex-shrink-0" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-gray-50 flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <Package className="w-9 h-9 text-gray-200 mb-2" />
            <span className="text-xs font-semibold text-gray-400">No items right now.</span>
          </div>
        ) : (
          <motion.div
            initial={shouldAnimate ? 'hidden' : false}
            animate="show"
            variants={containerVariants}
            className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 snap-x"
          >
            {items.map(item => (
              <motion.div variants={itemVariants} key={item._id} className="min-w-[145px] w-[145px] flex-shrink-0 snap-start">
                <ProductCard item={item} className="hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] transition-shadow duration-300" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ─────────────────────────────────────────────
          CTA — LIST AN ITEM
      ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-4 pt-1 pb-1">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-gradient-to-r from-[#EBE5F7] via-[#F5F0FF] to-white border border-white shadow-[0_8px_24px_rgba(124,58,237,0.08),inset_0_1px_2px_rgba(255,255,255,1)] rounded-2xl p-4 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A388E1]/5 to-transparent skew-x-[-20deg] animate-[glare_5s_infinite_ease-in-out] pointer-events-none" />

          <div className="w-3/4 relative z-10">
            <h3 className="text-base font-extrabold text-[#5B21B6] mb-1">Got unused items?</h3>
            <p className="text-[11px] text-gray-500 mb-3 leading-snug font-medium">
              List items you no longer need and earn instant credits to exchange for products you want!
            </p>
            <Link to={user ? '/add-item' : '/login'}>
              <motion.div
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#FFE28A] via-[#FFF0B3] to-[#FFD75E] text-yellow-900 px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(250,204,21,0.25)] hover:shadow-[0_6px_18px_rgba(250,204,21,0.4)] transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] animate-[glare_2.5s_infinite_ease-in-out]" />
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">List an Item</span>
              </motion.div>
            </Link>
          </div>

          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            className="absolute -right-4 -bottom-4 w-28 h-28 opacity-[0.12] pointer-events-none"
          >
            <Package className="w-full h-full text-[#7C3AED]" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ─────────────────────────────────────────────
          SOCIAL PROOF
      ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="px-4 pb-6 pt-3">
        <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex-shrink-0 bg-white p-2 rounded-full shadow-[0_2px_8px_rgba(124,58,237,0.15)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L9 11L13 15L21 7" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 7H21V13" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-extrabold text-gray-800 leading-tight">
              Start earning by selling what you don't use anymore!
            </p>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {(randomAvatars.length > 0 ? randomAvatars : DUMMY_AVATARS).map((src, i) => {
                  const finalSrc = src && src.includes('ui-avatars.com')
                    ? DUMMY_AVATARS[i % DUMMY_AVATARS.length]
                    : src;
                  return (
                    <motion.img
                      whileHover={{ y: -5, scale: 1.1, zIndex: 20 }}
                      key={i}
                      src={finalSrc}
                      alt={`user-${i}`}
                      className="w-5 h-5 rounded-full border-2 border-white object-cover shadow-sm bg-white"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DUMMY_AVATARS[i % DUMMY_AVATARS.length];
                      }}
                    />
                  );
                })}
              </div>
              <p className="text-[9px] text-gray-400 font-bold">people are already trading</p>
            </div>
          </div>
        </div>
      </motion.div>

      {showCelebration && <CoinCelebration coinCount={30} />}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes glare {
          0%, 20%  { transform: translateX(-150%) skewX(-20deg); }
          80%, 100%{ transform: translateX(250%) skewX(-20deg); }
        }
      `}</style>
    </motion.div>
  );
};

export default HomePage;