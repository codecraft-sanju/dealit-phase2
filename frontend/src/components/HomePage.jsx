import React, { useState, useEffect, useRef } from 'react';

import { Link } from 'react-router-dom';

import { useQuery, useMutation } from '@tanstack/react-query';

import { motion, AnimatePresence } from 'framer-motion';

import { 
  Package, Coins, ChevronRight, Plus, UserCircle, Gift,
  Smartphone, Shirt, Watch, Home as HomeIcon, Gamepad2, 
  Car, Monitor, Book, Sofa, Music, Utensils, Heart, Briefcase, Camera, Dumbbell, Sparkles
} from 'lucide-react';

import axios from 'axios';

import ProductCard from './ProductCard';


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


// --- Framer Motion Variants ---
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


// Global variable to track if the initial animation has played this session
let initialAnimationPlayed = false;


const HomePage = ({ user, setUser }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const shouldAnimate = !initialAnimationPlayed;

  const scrollRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  useEffect(() => {
    // Mark that the animation has played so it doesn't repeat when returning to the page
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

  const { data: offers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/offers`);
      return response.data.data.filter(offer => offer.isActive);
    },
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
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

  useEffect(() => {
    if (offers.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: clientWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [offers, isHovered]);

  const handleMouseDown = (e) => {
    isDown.current = true;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'auto';
      scrollRef.current.classList.remove('snap-x', 'snap-mandatory');
    }
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftPos.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    setIsHovered(false);
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
      scrollRef.current.classList.add('snap-x', 'snap-mandatory');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
      scrollRef.current.classList.add('snap-x', 'snap-mandatory');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeftPos.current - walk;
    }
  };

  const coinGradients = [
    'radial-gradient(circle, #FFF099 20%, #FBBF24 80%, #D97706 100%)',
    'radial-gradient(circle, #FEF08A 20%, #F59E0B 80%, #B45309 100%)',
    'radial-gradient(circle, #FDE047 20%, #EAB308 80%, #92400E 100%)'
  ];

  return (
    <motion.div 
      initial={shouldAnimate ? "hidden" : false} 
      animate="show" 
      variants={containerVariants}
      className="max-w-md mx-auto bg-[#faf9fc] min-h-[calc(100vh-130px)] md:max-w-7xl md:px-0 relative overflow-hidden"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-100/40 to-transparent pointer-events-none"></div>

    <div className="px-4 pt-0 pb-0 relative z-10">
        
    {/* --- Hero Banner Section --- */}
      <motion.div 
        variants={itemVariants}
        className="mb-3 bg-[#0B1021] border-y md:border border-blue-900/40 shadow-[0_8px_20px_rgba(0,0,0,0.15)] rounded-none md:rounded-b-2xl md:rounded-t-none -mx-4 md:mx-0 p-5 flex flex-col justify-center relative overflow-hidden group"
      >
        {/* Deep Blue & Dark Slate Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-[#0B1021] opacity-90 z-0"></div>
        
        {/* CHANGED: Added Floating Ambient Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full bg-cyan-300"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0, 0.5, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: Math.random() * 5 + 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        {/* END CHANGED */}

        {/* Subtle floating blue and cyan glows */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-colors duration-500 z-0"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-cyan-600/10 rounded-full blur-2xl z-0"></div>

        {/* Text Content */}
        <div className="relative z-10 pr-14 sm:pr-16">
          <h1 className="text-[16px] sm:text-[18px] md:text-[24px] font-extrabold text-white leading-tight mb-2 tracking-tight drop-shadow-md">
            Sell what you don't use<br/>
            Get what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">actually want</span>
          </h1>
          <p className="text-[11px] sm:text-[12px] md:text-sm text-blue-200/80 font-medium leading-snug">
            Sell your stuff &rarr; Earn credits &rarr; Buy anything.
          </p>
        </div>

        {/* Shopping Bag Image */}
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute right-2 sm:right-4 bottom-[-5px] z-10 pointer-events-none"
        >
          <img
            src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1779476732/bouncy-yellow-shopping-bag_rhyypz.png"
            alt="Shopping Bag"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.4)]"
          />
        </motion.div>

        {/* Corner Gloss Glare overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>
      </motion.div>


        {/* --- Offers Section --- */}
        {loadingOffers ? (
          <motion.div variants={itemVariants} className="mb-0">
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-0">
              <ModernShimmer className="w-full aspect-[5/2] md:aspect-[5/1] flex-shrink-0 shadow-sm" />
            </div>
          </motion.div>
        ) : offers.length > 0 ? (
          <motion.div variants={itemVariants} className="mb-0 relative group">
            {/* Offer Glass Overlay Reflection */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>

            <div 
              ref={scrollRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
              className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory pb-0 scroll-smooth cursor-grab active:cursor-grabbing relative z-0"
            >
              {offers.map((offer) => (
                <div 
                  key={offer._id} 
                  className="w-full aspect-[5/2] md:aspect-[5/1] flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-white/50 relative bg-gray-50"
                >
                  <picture className="w-full h-full block pointer-events-none">
                    <source media="(min-width: 768px)" srcSet={getOptimizedCloudinaryUrl(offer.desktopImage)} />
                    <motion.img 
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      src={getOptimizedCloudinaryUrl(offer.mobileImage)} 
                      alt="Special Offer" 
                      className="w-full h-full object-cover"
                    />
                  </picture>
                  {/* Subtle persistent glossy shine over images */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

      </div>


      
      <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-0 relative z-10">
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar items-center pb-3 pt-1">
          {/* ALL Category */}
          <motion.div 
            whileHover={hoverSpring} whileTap={scaleTap}
            onClick={() => setActiveCategory('All')}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-300 min-w-max z-0 ${activeCategory === 'All' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {activeCategory === 'All' && (
              <motion.div 
                layoutId="activeCategoryBg" 
                className="absolute inset-0 bg-gradient-to-r from-[#805ad5] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(128,90,213,0.3)]"
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            )}
            {activeCategory !== 'All' && (
              <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
            )}
            <Package className={`w-4 h-4 relative z-10 ${activeCategory === 'All' ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
            <span className="text-[13px] font-bold relative z-10">All</span>
          </motion.div>

          {/* Dynamic Categories */}
          {loadingCategories ? (
            [1, 2, 3, 4].map((i) => (
              <ModernShimmer key={i} className="min-w-[90px] h-9 rounded-2xl shadow-sm flex-shrink-0" />
            ))
          ) : (
            <>
              {categories
                .filter((cat) => {
                  const count = cat.itemCount ?? cat.itemsCount ?? cat.count ?? cat.totalItems;
                  if (count !== undefined) return count > 0;
                  return true;
                })
                .map((cat) => {
                  const IconComponent = ICON_DICTIONARY[cat.icon] || Package;
                  const isActive = activeCategory === cat.name;

                  return (
                    <motion.div 
                      key={cat._id} 
                      whileHover={hoverSpring} whileTap={scaleTap}
                      onClick={() => setActiveCategory(cat.name)}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-300 min-w-max z-0 ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {isActive && (
                        <motion.div 
                          layoutId="activeCategoryBg" 
                          className="absolute inset-0 bg-gradient-to-r from-[#805ad5] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(128,90,213,0.3)]"
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
                      )}
                      <IconComponent className={`w-4 h-4 relative z-10 ${isActive ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
                      <span className="text-[13px] font-bold relative z-10">{cat.name}</span>
                    </motion.div>
                  );
              })}

              {/* OTHER Category */}
              <motion.div 
                whileHover={hoverSpring} whileTap={scaleTap}
                onClick={() => setActiveCategory('Other')}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer transition-colors duration-300 min-w-max z-0 ${activeCategory === 'Other' ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {activeCategory === 'Other' && (
                  <motion.div 
                    layoutId="activeCategoryBg" 
                    className="absolute inset-0 bg-gradient-to-r from-[#805ad5] to-[#A388E1] rounded-2xl -z-10 shadow-[0_4px_12px_rgba(128,90,213,0.3)]"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                {activeCategory !== 'Other' && (
                  <div className="absolute inset-0 bg-white border border-gray-100 rounded-2xl -z-10 shadow-[0_2px_8px_rgba(0,0,0,0.02)]" />
                )}
                <Plus className={`w-4 h-4 relative z-10 ${activeCategory === 'Other' ? 'text-white drop-shadow-sm' : 'text-gray-400'}`} />
                <span className="text-[13px] font-bold relative z-10">Other</span>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>


      {/* --- Items Listing Section --- */}
      <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-0 relative z-10">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900 drop-shadow-sm">
            {activeCategory === 'All' ? 'Popular Items' : `Top in ${activeCategory}`}
          </h2>
          <Link 
            to={activeCategory === 'All' ? '/items' : `/items?category=${activeCategory}`} 
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-xs font-semibold text-[#A388E1] bg-white border border-[#EBE5F7] px-3 py-1.5 rounded-full flex items-center gap-0.5 shadow-[0_2px_8px_rgba(163,136,225,0.1)] hover:shadow-[0_4px_12px_rgba(163,136,225,0.2)] transition-all">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>

        {loadingItems ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <ProductCard key={i} isLoading={true} className="min-w-[140px] w-[140px] flex-shrink-0 shadow-sm" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-8 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center">
            <Package className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-xs font-medium">No items right now.</span>
          </div>
        ) : (
          <motion.div 
            initial={shouldAnimate ? "hidden" : false} 
            animate="show" 
            variants={containerVariants}
            className="flex overflow-x-auto hide-scrollbar gap-3 pb-4 pt-1 snap-x"
          >
            {items.map((item) => (
              <motion.div variants={itemVariants} key={item._id} className="min-w-[140px] w-[140px] flex-shrink-0 snap-start">
                <ProductCard item={item} className="hover:shadow-[0_8px_25px_rgba(163,136,225,0.15)] transition-shadow duration-300" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>


      {/* --- Call to Action Section --- */}
      <motion.div variants={itemVariants} className="px-4 pt-1 pb-1 relative z-10">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-gradient-to-r from-[#EBE5F7] via-[#F8F6FF] to-white border border-white shadow-[0_8px_20px_rgba(163,136,225,0.1),inset_0_1px_2px_rgba(255,255,255,1)] rounded-2xl p-4 relative overflow-hidden group"
        >
          {/* Subtle CTA Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#A388E1]/5 to-transparent skew-x-[-20deg] animate-[glare_5s_infinite_ease-in-out] pointer-events-none"></div>

          <div className="w-3/4 relative z-10">
            <h3 className="text-base font-extrabold text-[#6B46C1] mb-1 drop-shadow-sm">Got unused items?</h3>
            <p className="text-[11px] text-gray-600 mb-3 leading-snug font-medium">
              List items you no longer need and earn instant credits to exchange for products you want!
            </p>
            <Link to={user ? "/add-item" : "/login"}>
              <motion.div 
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#FFE28A] via-[#FFF0B3] to-[#FFD75E] text-yellow-900 px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 shadow-[0_4px_12px_rgba(250,204,21,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)] hover:shadow-[0_6px_15px_rgba(250,204,21,0.4)] transition-all overflow-hidden relative"
              >
                {/* Button Gloss Sweep */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] animate-[glare_2.5s_infinite_ease-in-out]"></div>
                <Plus className="w-4 h-4 relative z-10 drop-shadow-sm" /> 
                <span className="relative z-10 drop-shadow-sm">List an Item</span>
              </motion.div>
            </Link>
          </div>
          <motion.div 
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }} 
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute -right-4 -bottom-4 w-28 h-28 opacity-20 pointer-events-none drop-shadow-xl"
          >
            <Package className="w-full h-full text-[#A388E1]" />
          </motion.div>
        </motion.div>
      </motion.div>


      {/* --- Social Proof Footer --- */}
      <motion.div variants={itemVariants} className="px-4 pb-6 pt-3 relative z-10">
        <div className="flex items-center gap-3 px-1 bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex-shrink-0 bg-white p-2 rounded-full shadow-[0_2px_8px_rgba(163,136,225,0.2)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L9 11L13 15L21 7" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 7H21V13" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-extrabold text-gray-800 leading-tight">
              Start earning by selling what you don't use anymore!
            </p>

            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5 hover:space-x-0 transition-all duration-300 cursor-pointer">
                {DUMMY_AVATARS.map((src, i) => (
                  <motion.img
                    whileHover={{ y: -5, scale: 1.1, zIndex: 20 }}
                    key={i}
                    src={src}
                    alt={`user-${i}`}
                    className="w-5 h-5 rounded-full border-2 border-white object-cover shadow-[0_2px_5px_rgba(0,0,0,0.1)] relative z-0"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=U${i}&background=A388E1&color=fff&size=40`;
                    }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-gray-500 font-bold">
                people are already trading
              </p>
            </div>
          </div>
        </div>
      </motion.div>


      {/* --- Celebration Particle Effect (CSS driven for perf on mobile) --- */}
      {showCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => {
            const size = Math.random() * 16 + 12; 
            const isSparkle = i % 5 === 0; 

            if (isSparkle) {
              const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                animationDelay: `${Math.random() * 0.5}s`,
                width: `${size}px`,
                height: `${size}px`,
                color: '#FDE047',
              };
              return (
                <div key={i} className="coin-piece flex items-center justify-center drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" style={style}>
                  <Sparkles size={size} />
                </div>
              );
            }

            const style = {
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 2.5 + 2}s`, 
              animationDelay: `${Math.random() * 0.3}s`,
              background: coinGradients[Math.floor(Math.random() * coinGradients.length)],
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              border: '1px solid #D97706',
              boxShadow: 'inset 0 0 6px rgba(217, 119, 6, 0.8), 0 4px 8px rgba(0,0,0,0.3)',
            };
            return <div key={i} className="coin-piece" style={style} />;
          })}
        </div>
      )}

      {/* Embedded Styles for Shimmers and Animations */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Advanced Glossy Glare Sweep Animation */
        @keyframes glare {
          0%, 20% { transform: translateX(-150%) skewX(-20deg); }
          80%, 100% { transform: translateX(250%) skewX(-20deg); }
        }
        
        @keyframes coinFall {
          0% { 
            transform: translateY(-10vh) rotateX(0deg) rotateY(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(110vh) rotateX(1080deg) rotateY(720deg); 
            opacity: 0; 
          }
        }
        .coin-piece {
          position: absolute;
          top: -10%;
          z-index: 50;
          animation: coinFall linear forwards;
        }
      `}</style>
    </motion.div>
  );
}; 

export default HomePage;