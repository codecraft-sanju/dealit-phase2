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

const HomePage = ({ user, setUser }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCelebration, setShowCelebration] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const scrollRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  useEffect(() => {
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
      const response = await axios.get(`${API_URL}/categories?activeOnly=true`);
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

  const shouldShowClaimButton = user && !user.hasClaimedWelcomeBonus && bonusSettings.enabled;

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={containerVariants}
      className="max-w-md mx-auto bg-white min-h-[calc(100vh-130px)] md:max-w-7xl md:px-0 relative overflow-hidden"
    >
      <div className="px-4 pt-3 pb-0">
        
        {/* --- Hero Banner Section --- */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          <motion.div 
            variants={itemVariants}
            className="col-span-5 bg-white border border-[#EBE5F7] rounded-2xl p-3 flex flex-col justify-center h-full relative overflow-hidden group"
          >
            {/* Subtle floating background gradient */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-100/50 rounded-full blur-3xl group-hover:bg-purple-200/50 transition-colors duration-500"></div>
            
            <h1 className="text-[16px] sm:text-[15px] md:text-[20px] font-extrabold text-gray-900 leading-tight mb-1.5 tracking-tight relative z-10">
              Sell what you don't use<br/>
              Get what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A388E1] to-[#805ad5]">actually want</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 font-medium leading-snug relative z-10">
              Sell your stuff &rarr; Earn credits &rarr; Buy anything.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-2 h-full">
            {user ? (
              <div className={`h-full bg-gradient-to-br from-[#A388E1] to-[#805ad5] rounded-2xl p-2 text-white shadow-lg shadow-[#A388E1]/30 flex flex-col justify-between relative overflow-hidden transition-all duration-700 ${showCelebration ? 'shadow-yellow-400/50 scale-[1.05]' : ''}`}>
                <div className="absolute top-1.5 right-1.5 bg-white/20 px-1 py-[1px] rounded text-[7px] font-semibold border border-white/10 backdrop-blur-sm tracking-wide z-10 whitespace-nowrap">
                  ₹1 = 1 Cr
                </div>

                <div>
                  <motion.div 
                    animate={showCelebration ? { rotate: 360, scale: 1.2 } : { rotate: 0, scale: 1 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="bg-yellow-400 p-1 rounded-full inline-flex items-center justify-center mb-1"
                  >
                    <Coins className="w-3 h-3 text-yellow-900" />
                  </motion.div>
                  <div className="flex items-end gap-0.5">
                    <span className="text-base font-bold leading-none relative">
                      {user.account_credits || 0}
                      <AnimatePresence>
                        {showCelebration && (
                          <motion.span 
                            initial={{ opacity: 0, y: 10, scale: 0.5 }}
                            animate={{ opacity: 1, y: -30, scale: 1.2 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute -top-2 -right-8 text-xs text-yellow-300 font-black drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] flex items-center z-10"
                          >
                            +{bonusSettings.amount} <Sparkles className="w-2.5 h-2.5 ml-0.5 animate-spin" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span className="text-[8px] font-normal opacity-90 mb-0.5">credits</span>
                  </div>
                </div>

                {shouldShowClaimButton ? (
                  <motion.button 
                    whileTap={scaleTap}
                    onClick={() => claimBonusMutation.mutate()} 
                    disabled={claimBonusMutation.isPending}
                    className="bg-gradient-to-r from-[#FFE28A] to-[#FFD75E] text-yellow-900 text-[9px] font-extrabold px-1 py-1.5 mt-1.5 rounded-lg flex items-center justify-center gap-0.5 shadow-sm transition hover:brightness-105 z-10 whitespace-nowrap disabled:opacity-80 relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute inset-0 bg-white/30"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                    <span className="relative z-10">{claimBonusMutation.isPending ? 'Claiming...' : `Claim ${bonusSettings.amount}`}</span>
                    <Gift className="w-2.5 h-2.5 relative z-10" />
                  </motion.button>
                ) : (
                  <Link to="/wallet" className="block">
                    <motion.div whileTap={scaleTap} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[9px] font-bold px-1 py-1.5 mt-1.5 rounded-lg flex items-center justify-center gap-0.5 shadow-sm transition-colors z-10 whitespace-nowrap">
                      Earn More <ChevronRight className="w-2.5 h-2.5" />
                    </motion.div>
                  </Link>
                )}
              </div>
            ) : (
              <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-2 text-white shadow-lg shadow-gray-900/30 flex flex-col justify-between relative overflow-hidden">
                <div>
                  <UserCircle className="w-4 h-4 text-gray-400 opacity-80 mb-0.5" />
                  <h3 className="text-[10px] font-bold leading-tight">Join</h3>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <Link to="/login">
                    <motion.div whileTap={scaleTap} className="bg-white text-gray-900 text-center text-[9px] font-bold py-1 rounded-md shadow-sm">
                      Login
                    </motion.div>
                  </Link>
                  <Link to="/signup">
                    <motion.div whileTap={scaleTap} className="bg-[#A388E1] text-white text-center text-[9px] font-bold py-1 rounded-md shadow-sm">
                      Join
                    </motion.div>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* --- Offers Section --- */}
        {loadingOffers ? (
          <motion.div variants={itemVariants} className="mb-0">
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-0">
              <ModernShimmer className="w-full aspect-[5/2] md:aspect-[5/1] flex-shrink-0" />
            </div>
          </motion.div>
        ) : offers.length > 0 ? (
          <motion.div variants={itemVariants} className="mb-0">
            <div 
              ref={scrollRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
              className="flex overflow-x-auto hide-scrollbar gap-3 snap-x snap-mandatory pb-0 scroll-smooth cursor-grab active:cursor-grabbing"
            >
              {offers.map((offer) => (
                <div 
                  key={offer._id} 
                  className="w-full aspect-[5/2] md:aspect-[5/1] flex-shrink-0 snap-center rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative bg-gray-50 group"
                >
                  <picture className="w-full h-full block pointer-events-none">
                    <source media="(min-width: 768px)" srcSet={getOptimizedCloudinaryUrl(offer.desktopImage)} />
                    <motion.img 
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.4 }}
                      src={getOptimizedCloudinaryUrl(offer.mobileImage)} 
                      alt="Special Offer" 
                      className="w-full h-full object-cover"
                    />
                  </picture>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

      </div>

      {/* --- Categories Section --- */}
      <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-0">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar items-center pb-2 pt-1">
          <motion.div 
            whileHover={hoverSpring} whileTap={scaleTap}
            onClick={() => setActiveCategory('All')}
            className="flex flex-col items-center gap-1.5 min-w-max cursor-pointer"
          >
            {activeCategory === 'All' ? (
              <motion.div layoutId="activeCategory" className="bg-[#EBE5F7] text-[#A388E1] px-3 py-2 rounded-full flex items-center gap-1.5 border border-[#A388E1]/20 shadow-sm relative">
                <Package className="w-4 h-4 relative z-10" />
                <span className="text-xs font-bold relative z-10">All</span>
              </motion.div>
            ) : (
              <>
                <div className="bg-[#F8F9FA] text-gray-500 p-2.5 rounded-xl w-12 h-12 flex items-center justify-center border border-gray-100 shadow-sm transition-colors hover:bg-gray-100">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] text-gray-500 font-medium">All</span>
              </>
            )}
          </motion.div>

          {loadingCategories ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 min-w-max">
                <ModernShimmer className="w-12 h-12 rounded-xl" />
                <ModernShimmer className="h-2 w-8 rounded" />
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
                    className="flex flex-col items-center gap-1.5 min-w-max cursor-pointer"
                  >
                    {isActive ? (
                      <motion.div layoutId="activeCategory" className="bg-[#EBE5F7] text-[#A388E1] px-3 py-2 rounded-full flex items-center gap-1.5 border border-[#A388E1]/20 shadow-sm relative">
                        <IconComponent className="w-4 h-4 relative z-10" />
                        <span className="text-xs font-bold relative z-10">{cat.name}</span>
                      </motion.div>
                    ) : (
                      <>
                        <div className="bg-[#F8F9FA] text-gray-500 p-2.5 rounded-xl w-12 h-12 flex items-center justify-center border border-gray-100 shadow-sm transition-colors hover:bg-gray-100">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium">{cat.name}</span>
                      </>
                    )}
                  </motion.div>
                );
              })}

              <motion.div 
                whileHover={hoverSpring} whileTap={scaleTap}
                onClick={() => setActiveCategory('Other')}
                className="flex flex-col items-center gap-1.5 min-w-max cursor-pointer"
              >
                {activeCategory === 'Other' ? (
                  <motion.div layoutId="activeCategory" className="bg-[#EBE5F7] text-[#A388E1] px-3 py-2 rounded-full flex items-center gap-1.5 border border-[#A388E1]/20 shadow-sm relative">
                    <Plus className="w-4 h-4 relative z-10" />
                    <span className="text-xs font-bold relative z-10">Other</span>
                  </motion.div>
                ) : (
                  <>
                    <div className="bg-[#F8F9FA] text-gray-500 p-2.5 rounded-xl w-12 h-12 flex items-center justify-center border border-gray-100 shadow-sm transition-colors hover:bg-gray-100">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">Other</span>
                  </>
                )}
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* --- Items Listing Section --- */}
      <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900">
            {activeCategory === 'All' ? 'Popular Items' : `Top in ${activeCategory}`}
          </h2>
          <Link 
            to={activeCategory === 'All' ? '/items' : `/items?category=${activeCategory}`} 
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="text-xs font-semibold text-[#A388E1] bg-[#F8F6FF] px-2.5 py-1 rounded-full flex items-center gap-0.5 hover:bg-[#EBE5F7] transition-colors">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </Link>
        </div>

        {loadingItems ? (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1">
            {[1, 2, 3, 4].map((i) => (
              <ProductCard key={i} isLoading={true} className="min-w-[140px] w-[140px] flex-shrink-0" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-400 py-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
            <Package className="w-6 h-6 text-gray-300 mb-1.5" />
            <span className="text-xs">No items right now.</span>
          </div>
        ) : (
          <motion.div 
            initial="hidden" animate="show" variants={containerVariants}
            className="flex overflow-x-auto hide-scrollbar gap-3 pb-3 pt-1 snap-x"
          >
            {items.map((item) => (
              <motion.div variants={itemVariants} key={item._id} className="min-w-[140px] w-[140px] flex-shrink-0 snap-start">
                <ProductCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* --- Call to Action Section --- */}
      <motion.div variants={itemVariants} className="px-4 pt-1.5 pb-1">
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-gradient-to-r from-[#EBE5F7] to-[#F8F6FF] border border-[#EBE5F7]/80 rounded-2xl p-4 relative overflow-hidden shadow-sm"
        >
          <div className="w-3/4 relative z-10">
            <h3 className="text-base font-bold text-[#6B46C1] mb-1">Got unused items?</h3>
            <p className="text-[11px] text-gray-600 mb-3 leading-snug">
              List items you no longer need and earn instant credits to exchange for products you want!
            </p>
            <Link to={user ? "/add-item" : "/login"}>
              <motion.div 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-[#FFE28A] to-[#FFD75E] text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm hover:shadow-md transition-shadow"
              >
                <Plus className="w-3.5 h-3.5" /> List an Item
              </motion.div>
            </Link>
          </div>
          <motion.div 
            animate={{ y: [0, -10, 0] }} 
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -right-4 -bottom-4 w-28 h-28 opacity-20 pointer-events-none"
          >
            <Package className="w-full h-full text-[#A388E1]" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* --- Social Proof Footer --- */}
      <motion.div variants={itemVariants} className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2.5 px-1">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex-shrink-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L9 11L13 15L21 7" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 7H21V13" stroke="#A388E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold text-gray-800 leading-tight">
              Start earning by selling what you don't use anymore!
            </p>

            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5 hover:space-x-0 transition-all duration-300 cursor-pointer">
                {DUMMY_AVATARS.map((src, i) => (
                  <motion.img
                    whileHover={{ y: -5 }}
                    key={i}
                    src={src}
                    alt={`user-${i}`}
                    className="w-5 h-5 rounded-full border-2 border-white object-cover shadow-sm relative z-0 hover:z-10"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=U${i}&background=A388E1&color=fff&size=40`;
                    }}
                  />
                ))}
              </div>
              <p className="text-[9px] text-gray-500 font-medium">
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
                <div key={i} className="coin-piece flex items-center justify-center" style={style}>
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
              boxShadow: 'inset 0 0 4px rgba(217, 119, 6, 0.6), 0 2px 4px rgba(0,0,0,0.2)',
            };
            return <div key={i} className="coin-piece" style={style} />;
          })}
        </div>
      )}

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