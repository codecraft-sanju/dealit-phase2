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
  Car, Monitor, Book, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell, Sparkles,
  ArrowRight, ShieldCheck, Lock, Zap, Tag, ShoppingBag
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const scaleTap = { scale: 0.92 };
const hoverSpring = { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 10 } };

const ModernShimmer = ({ className }) => (
  <div className={`relative overflow-hidden bg-gray-100 rounded-2xl ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
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

  const { data: bonusSettings = { enabled: true, amount: 50 } } = useQuery({
    queryKey: ['publicSettings'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/admin/public-settings`);
      if (res.data.success && res.data.data) {
        return {
          enabled: res.data.data.isWelcomeBonusEnabled ?? true,
          amount: res.data.data.welcomeBonusAmount ?? 50
        };
      }
      return { enabled: true, amount: 50 };
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
      initial={shouldAnimate ? "hidden" : false} 
      animate="show" 
      variants={containerVariants}
      className="max-w-md mx-auto bg-white min-h-[calc(100vh-130px)] pb-32 md:max-w-7xl md:px-0 relative overflow-hidden font-sans"
    >
      <Helmet>
        <title>Home - DealIt | Swap & Trade</title>
        <meta name="description" content="Sell your unused items, earn credits, and get what you actually want on DealIt. Start bartering today!" />
      </Helmet>

      {/* --- Hero Section --- */}
      <motion.div variants={itemVariants} className="pt-6 pb-6 px-4 relative z-10 bg-gradient-to-b from-[#FAF8FF] to-white">
        <div className="inline-flex items-center gap-1.5 bg-[#F6F3FE] text-[#7C3AED] px-3 py-1.5 rounded-full text-xs font-bold mb-5 shadow-[0_2px_8px_rgba(124,58,237,0.08)]">
          <Gift className="w-4 h-4 text-[#F59E0B]" /> Join Free & Get 100 Credits
        </div>
        
        <div className="flex justify-between items-start">
          <div className="w-full sm:w-[60%] z-10 relative">
            <h1 className="text-4xl sm:text-5xl font-black text-[#111827] leading-[1.1] mb-3 tracking-tight">
              Sell Unused.<br />
              <span className="text-[#6B46C1]">Get Anything.</span>
            </h1>
            <p className="text-[#6B7280] text-sm mb-7 font-medium max-w-[240px] leading-relaxed">
              List your unused items, earn credits and buy what you actually want.
            </p>
            
            {shouldShowClaimButton ? (
               <motion.button 
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => claimBonusMutation.mutate()} 
                 className="bg-[#6B46C1] text-white font-bold py-3 px-5 rounded-xl flex items-center gap-2 shadow-[0_8px_20px_rgba(107,70,193,0.3)] hover:bg-[#5A38A3] transition-colors"
               >
                  Join Now & Get 100 Credits <ArrowRight className="w-4 h-4" />
               </motion.button>
            ) : (
               <Link to="/add-item" className="inline-block">
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.95 }}
                   className="bg-[#6B46C1] text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-[0_8px_20px_rgba(107,70,193,0.3)] hover:bg-[#5A38A3] transition-colors"
                 >
                    Start Selling <ArrowRight className="w-4 h-4" />
                 </motion.button>
               </Link>
            )}
          </div>
          
          <div className="hidden sm:flex absolute right-[-20px] top-[-20px] w-[50%] h-[120%] opacity-10 pointer-events-none items-center justify-end overflow-hidden">
             <Package size={200} className="text-[#6B46C1]" />
          </div>
        </div>
      </motion.div>

      {/* --- Trust Badges Section --- */}
      <motion.div variants={itemVariants} className="flex justify-between items-start px-5 py-5 bg-white border-y border-gray-100 mb-6">
        <div className="flex flex-col items-center gap-1 text-center w-1/4">
          <ShieldCheck className="w-5 h-5 text-[#6B46C1] mb-0.5" />
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight">100% Free</span>
          <span className="text-[8px] sm:text-[9px] text-gray-500 leading-tight">No hidden charges</span>
        </div>
        <div className="w-[1px] h-10 bg-gray-100 mt-1"></div>
        <div className="flex flex-col items-center gap-1 text-center w-1/4">
          <Lock className="w-5 h-5 text-[#6B46C1] mb-0.5" />
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight">Safe & Trusted</span>
          <span className="text-[8px] sm:text-[9px] text-gray-500 leading-tight">Secure platform</span>
        </div>
        <div className="w-[1px] h-10 bg-gray-100 mt-1"></div>
        <div className="flex flex-col items-center gap-1 text-center w-1/4">
          <UserCircle className="w-5 h-5 text-[#6B46C1] mb-0.5" />
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight">For Everyone</span>
          <span className="text-[8px] sm:text-[9px] text-gray-500 leading-tight">Buy, sell, save more</span>
        </div>
        <div className="w-[1px] h-10 bg-gray-100 mt-1"></div>
        <div className="flex flex-col items-center gap-1 text-center w-1/4">
          <Zap className="w-5 h-5 text-[#6B46C1] mb-0.5" />
          <span className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight">Instant Credits</span>
          <span className="text-[8px] sm:text-[9px] text-gray-500 leading-tight">Get credits instantly</span>
        </div>
      </motion.div>

      {/* --- How Dealit Works Section --- */}
      <motion.div variants={itemVariants} className="px-4 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">How <span className="text-[#6B46C1]">Dealit</span> Works?</h2>
        <div className="flex items-start justify-between relative px-2">
           <div className="absolute top-6 left-[22%] w-[18%] h-[1px] bg-gray-200">
             <div className="absolute -right-1 -top-1 w-2 h-2 border-t border-r border-gray-200 transform rotate-45"></div>
           </div>
           <div className="absolute top-6 left-[60%] w-[18%] h-[1px] bg-gray-200">
             <div className="absolute -right-1 -top-1 w-2 h-2 border-t border-r border-gray-200 transform rotate-45"></div>
           </div>

           <div className="flex flex-col items-center flex-1 relative z-10">
              <div className="relative mb-3">
                <div className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] bg-[#6B46C1] text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-sm border-[1.5px] border-white">1</div>
                <div className="w-14 h-14 bg-[#F8F6FF] rounded-[18px] flex items-center justify-center shadow-[0_4px_12px_rgba(107,70,193,0.06)] transform rotate-[-3deg] transition-transform hover:rotate-0">
                   <Tag className="w-6 h-6 text-[#6B46C1]" />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-900 mb-1 text-center">List Items</span>
              <span className="text-[9px] text-gray-500 text-center leading-snug">Upload items you<br/>don't use anymore</span>
           </div>

           <div className="flex flex-col items-center flex-1 relative z-10">
              <div className="relative mb-3">
                <div className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] bg-[#6B46C1] text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-sm border-[1.5px] border-white">2</div>
                <div className="w-14 h-14 bg-[#FFFBF0] rounded-[18px] flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.06)] transition-transform hover:scale-105">
                   <Coins className="w-6 h-6 text-[#F59E0B]" />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-900 mb-1 text-center">Earn Credits</span>
              <span className="text-[9px] text-gray-500 text-center leading-snug">Get credits when<br/>someone buys</span>
           </div>

           <div className="flex flex-col items-center flex-1 relative z-10">
              <div className="relative mb-3">
                <div className="absolute -top-1.5 -left-1.5 w-[18px] h-[18px] bg-[#6B46C1] text-white rounded-full flex items-center justify-center text-[10px] font-bold z-10 shadow-sm border-[1.5px] border-white">3</div>
                <div className="w-14 h-14 bg-[#F8F6FF] rounded-[18px] flex items-center justify-center shadow-[0_4px_12px_rgba(107,70,193,0.06)] transform rotate-[3deg] transition-transform hover:rotate-0">
                   <ShoppingBag className="w-6 h-6 text-[#6B46C1]" />
                </div>
              </div>
              <span className="text-xs font-bold text-gray-900 mb-1 text-center">Buy Anything</span>
              <span className="text-[9px] text-gray-500 text-center leading-snug">Use credits to buy<br/>what you want</span>
           </div>
        </div>
      </motion.div>

      {/* --- Popular Right Now Items Section --- */}
      <motion.div variants={itemVariants} className="px-4 mb-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {activeCategory === 'All' ? 'Popular Right Now' : `Top in ${activeCategory}`}
          </h2>
          <Link to={activeCategory === 'All' ? '/items' : `/items?category=${activeCategory}`}>
            <motion.div whileHover={{ x: 2 }} className="text-xs font-bold text-[#6B46C1] flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>

        {loadingItems ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <ProductCard key={i} isLoading={true} className="min-w-[150px] w-[150px] flex-shrink-0 shadow-sm" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-10 bg-[#F9FAFB] rounded-[20px] border border-gray-100 flex flex-col items-center justify-center">
            <Package className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-xs font-medium">No items right now.</span>
          </div>
        ) : (
          <motion.div 
            initial={shouldAnimate ? "hidden" : false} 
            animate="show" 
            variants={containerVariants}
            className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 pt-1 snap-x"
          >
            {items.map((item) => (
              <motion.div variants={itemVariants} key={item._id} className="min-w-[150px] w-[150px] flex-shrink-0 snap-start">
                <ProductCard item={item} className="bg-white border border-gray-100 rounded-[16px] overflow-hidden" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* --- Fixed Categories Section --- */}
      <div className="fixed bottom-[60px] md:bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
           className="w-full max-w-md md:max-w-7xl bg-white/90 backdrop-blur-xl border-t border-gray-100 px-3 py-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] pointer-events-auto"
        >
          <div className="flex gap-3.5 overflow-x-auto hide-scrollbar items-start px-1">
            
            <motion.div 
              whileHover={hoverSpring} whileTap={scaleTap}
              onClick={() => setActiveCategory('All')}
              className="flex flex-col items-center gap-1 cursor-pointer min-w-[56px]"
            >
              <div className={`w-[48px] h-[48px] rounded-[14px] flex items-center justify-center transition-all duration-300 shadow-sm ${activeCategory === 'All' ? 'bg-[#6B46C1] text-white' : 'bg-[#F8F6FF] text-[#6B46C1] hover:bg-[#F3EFFF]'}`}>
                <Package className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold ${activeCategory === 'All' ? 'text-[#6B46C1]' : 'text-gray-500'}`}>All</span>
            </motion.div>

            {loadingCategories ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[56px]">
                   <ModernShimmer className="w-[48px] h-[48px] rounded-[14px] shadow-sm" />
                   <ModernShimmer className="w-8 h-2 rounded-full mt-0.5" />
                </div>
              ))
            ) : (
              <>
                {categories.map((cat) => {
                  const IconComponent = ICON_DICTIONARY[cat.icon] || Package;
                  const isActive = activeCategory === cat.name;

                  return (
                    <motion.div 
                      key={cat._id} 
                      whileHover={hoverSpring} whileTap={scaleTap}
                      onClick={() => setActiveCategory(cat.name)}
                      className="flex flex-col items-center gap-1 cursor-pointer min-w-[56px]"
                    >
                      <div className={`w-[48px] h-[48px] rounded-[14px] flex items-center justify-center transition-all duration-300 shadow-sm ${isActive ? 'bg-[#6B46C1] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                        <IconComponent className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={`text-[10px] font-bold ${isActive ? 'text-[#6B46C1]' : 'text-gray-500'}`}>{cat.name}</span>
                    </motion.div>
                  );
                })}

                <motion.div 
                  whileHover={hoverSpring} whileTap={scaleTap}
                  onClick={() => setActiveCategory('Other')}
                  className="flex flex-col items-center gap-1 cursor-pointer min-w-[56px]"
                >
                  <div className={`w-[48px] h-[48px] rounded-[14px] flex items-center justify-center transition-all duration-300 shadow-sm ${activeCategory === 'Other' ? 'bg-[#6B46C1] text-white' : 'bg-white border border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                    <Plus className="w-5 h-5" strokeWidth={activeCategory === 'Other' ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold ${activeCategory === 'Other' ? 'text-[#6B46C1]' : 'text-gray-500'}`}>More</span>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {showCelebration && <CoinCelebration coinCount={30} />}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </motion.div>
  );
}; 

export default HomePage;