// ItemsPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// CHANGES MADE HERE: Added Loader2 for loading spinner
import { Package, ChevronLeft, Clock, SlidersHorizontal, ChevronDown, Check, TrendingUp, TrendingDown, Tag, List, Grid2X2, Grid3X3, Loader2 } from 'lucide-react'; 
// CHANGES MADE HERE: Imported useInfiniteQuery
import { useInfiniteQuery } from '@tanstack/react-query'; 
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First', icon: Clock },
  { id: 'value_asc', label: 'Credits: Low to High', icon: TrendingUp },
  { id: 'value_desc', label: 'Credits: High to Low', icon: TrendingDown },
  { id: 'discount_desc', label: 'Highest Discount', icon: Tag },
];

const ItemsPage = () => {
  const navigate = useNavigate();

  const [sortOption, setSortOption] = useState('newest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [gridCols, setGridCols] = useState(() => {
    return localStorage.getItem('dealit_grid_layout') || '2';
  });

  useEffect(() => {
    localStorage.setItem('dealit_grid_layout', gridCols);
  }, [gridCols]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CHANGES MADE HERE: Switched from useQuery to useInfiniteQuery
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['allItems', sortOption],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      // limit=20 passed so we only load a small chunk at a time
      const response = await axios.get(`${API_URL}/items?limit=20&page=${pageParam}&sort=${sortOption}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, 
  });

  // CHANGES MADE HERE: Flatten all loaded pages into a single items array
  const items = data ? data.pages.flatMap(page => page.data) : [];

  const recentlyViewedStr = localStorage.getItem('dealit_recently_viewed_ids');
  const recentlyViewedIds = recentlyViewedStr ? JSON.parse(recentlyViewedStr) : [];
  
  const showRecentlyViewedBanner = items.length > 50 && recentlyViewedIds.length > 0;

  let dynamicGridClass = 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'; 
  if (gridCols === '1') {
    dynamicGridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  } else if (gridCols === '3') {
    dynamicGridClass = 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'; 
  }

  // CHANGES MADE HERE: Intersection Observer logic to trigger fetchNextPage
  const observer = useRef();
  const lastItemRef = useCallback(node => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // Jab loading trigger viewport me aaye aur next page available ho, next page layo
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-6 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-50 bg-white">
        <div className="bg-[#6B46C1] py-5 px-5 md:px-8 shadow-md relative z-10">
          <div className="flex items-center justify-between">
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="p-1.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">All Items</h1>
                <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Explore everything available for trade</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              
              <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/20 backdrop-blur-md">
                <button 
                  onClick={() => setGridCols('1')}
                  className={`p-1 md:p-1.5 rounded-lg transition-colors ${gridCols === '1' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button 
                  onClick={() => setGridCols('2')}
                  className={`p-1 md:p-1.5 rounded-lg transition-colors ${gridCols === '2' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <Grid2X2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button 
                  onClick={() => setGridCols('3')}
                  className={`p-1 md:p-1.5 rounded-lg transition-colors ${gridCols === '3' ? 'bg-white/25 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                >
                  <Grid3X3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-1 md:gap-2 px-2.5 py-1.5 md:py-2 rounded-xl text-[11px] md:text-xs font-bold transition-all duration-300 border backdrop-blur-md shadow-sm ${
                    isDropdownOpen 
                      ? 'bg-white/20 border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-80" />
                  <span className="hidden xs:inline-block">Sort</span>
                  <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50"
                    >
                      <div className="p-1.5">
                        {SORT_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          const isActive = sortOption === option.id;
                          
                          return (
                            <button
                              key={option.id}
                              onClick={() => {
                                setSortOption(option.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                isActive 
                                  ? 'bg-[#F8F6FF] text-[#6B46C1] font-bold' 
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-[#6B46C1]' : 'text-gray-400'}`} />
                                <span className="text-[12px]">{option.label}</span>
                              </div>
                              {isActive && <Check className="w-4 h-4 text-[#6B46C1]" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="px-3 md:px-8 mt-6 relative z-10">
        
        {showRecentlyViewedBanner && (
          <div 
            onClick={() => navigate('/recently-viewed')}
            className="mb-6 bg-gradient-to-r from-[#F8F6FF] to-[#EBE5F7] border border-[#d8cbf5] rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between mx-2 md:mx-0"
          >
            <div>
              <h2 className="text-sm md:text-base font-bold text-[#6B46C1] flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 md:w-5 md:h-5" /> Pick up where you left off
              </h2>
              <p className="text-xs md:text-sm text-gray-600 font-medium">Explore items inspired by your browsing history</p>
            </div>
            <div className="flex items-center">
               <div className="text-xs font-semibold text-[#A388E1] bg-white border border-[#EBE5F7] px-3 py-1.5 rounded-full shadow-sm">
                 View History
               </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={`grid gap-3 md:gap-4 mt-2 ${dynamicGridClass}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ProductCard key={i} isLoading={true} className="w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center bg-[#F8F6FF] rounded-3xl py-16 px-6 border border-[#EBE5F7] shadow-sm mx-2 md:mx-0">
            <Package className="w-16 h-16 text-[#A388E1]/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No items found</h3>
            <p className="text-sm text-gray-500">Check back later for new items.</p>
          </div>
        ) : (
          <div className={`grid gap-3 md:gap-4 mt-2 ${dynamicGridClass}`}>
            {items.map((item) => (
              <ProductCard key={item._id} item={item} className="w-full" />
            ))}
          </div>
        )}

        {/* CHANGES MADE HERE: Invisible Trigger Element for Infinite Scrolling */}
        <div ref={lastItemRef} className="w-full h-16 mt-4 flex items-center justify-center">
          {isFetchingNextPage && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex items-center gap-2 px-4 py-2 bg-[#F8F6FF] border border-[#EBE5F7] rounded-full text-[#6B46C1] font-bold text-xs shadow-sm"
            >
              <Loader2 className="w-4 h-4 animate-spin" /> Fetching more deals...
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemsPage;