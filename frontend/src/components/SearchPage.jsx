// SearchPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Package, Clock, TrendingUp, SlidersHorizontal, Smartphone, Laptop, Shirt, Sofa, Watch, Car, Book, Gamepad, Grid, X, Loader2, Check } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteQuery } from '@tanstack/react-query';

import ProductCard from './ProductCard';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const getCategoryStyles = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('mobile') || name.includes('phone')) return { icon: Smartphone, color: "bg-blue-50 text-blue-600 border-blue-100" };
  if (name.includes('laptop') || name.includes('computer')) return { icon: Laptop, color: "bg-purple-50 text-purple-600 border-purple-100" };
  if (name.includes('fashion') || name.includes('cloth')) return { icon: Shirt, color: "bg-pink-50 text-pink-600 border-pink-100" };
  if (name.includes('furniture') || name.includes('home')) return { icon: Sofa, color: "bg-orange-50 text-orange-600 border-orange-100" };
  if (name.includes('watch') || name.includes('wearable')) return { icon: Watch, color: "bg-teal-50 text-teal-600 border-teal-100" };
  if (name.includes('vehicle') || name.includes('car') || name.includes('bike')) return { icon: Car, color: "bg-red-50 text-red-600 border-red-100" };
  if (name.includes('book') || name.includes('study')) return { icon: Book, color: "bg-yellow-50 text-yellow-700 border-yellow-100" };
  if (name.includes('game') || name.includes('toy')) return { icon: Gamepad, color: "bg-green-50 text-green-600 border-green-100" };
  return { icon: Grid, color: "bg-gray-50 text-gray-600 border-gray-100" };
};

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'newest', label: 'Newest First' },
  { id: 'value_asc', label: 'Credits: Low to High' },
  { id: 'value_desc', label: 'Credits: High to Low' },
];

const SearchPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Debounced state
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('relevance');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('dealit_recent_searches')) || []
  );

  const [exploreData, setExploreData] = useState({ categories: [], trendingSearches: [] });
  const [loadingExplore, setLoadingExplore] = useState(true);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/explore-data`);
      if (response.data.success) setExploreData(response.data.data);
    } catch (error) {
      console.error('Error fetching explore data:', error);
    } finally {
      setLoadingExplore(false);
    }
  };

  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    const updated = [searchTerm, ...recentSearches.filter(t => t !== searchTerm)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem('dealit_recent_searches', JSON.stringify(updated));
  };

  const removeRecentSearch = (termToRemove, e) => {
    e.stopPropagation();
    const updated = recentSearches.filter(t => t !== termToRemove);
    setRecentSearches(updated);
    localStorage.setItem('dealit_recent_searches', JSON.stringify(updated));
  };

  const handleQuickSearch = (term) => {
    setSearchInput(term);
    setQuery(term);
  };

  // Debounce typing for search query
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setQuery(searchInput);
      if (searchInput.trim()) saveRecentSearch(searchInput.trim());
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Infinite Query for Search Results
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['searchResults', query, selectedCategory, sortOption, priceRange.min, priceRange.max],
    initialPageParam: 1,
    enabled: !!query.trim() || selectedCategory !== 'All', // Only search if query or category exists
    queryFn: async ({ pageParam = 1 }) => {
      let url = `${API_URL}/items/search?page=${pageParam}&limit=20`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      if (selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`;
      if (sortOption !== 'relevance') url += `&sort=${sortOption}`;
      if (priceRange.min) url += `&minCredits=${priceRange.min}`;
      if (priceRange.max) url += `&maxCredits=${priceRange.max}`;
      
      const response = await axios.get(url);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) return lastPage.currentPage + 1;
      return undefined;
    }
  });

  const results = data ? data.pages.flatMap(page => page.data) : [];
  const isSearching = !!query.trim() || selectedCategory !== 'All';

  // Intersection Observer for Infinite Scroll
  const observer = useRef();
  const lastItemRef = useCallback(node => {
    if (isLoading || isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-6 font-sans overflow-x-hidden">
      
      {/* 
        FIXED HEADER: 
        Changed to fixed, added w-full, z-50.
        Added intense backdrop blur for a premium glassmorphism effect. 
      */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-4 py-3 md:py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-gray-500 hover:text-[#6B46C1] bg-white hover:bg-[#F8F6FF] rounded-full shadow-sm border border-gray-100 transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative flex items-center gap-2">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#6B46C1] transition-colors" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search items, brands, categories..."
                className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-2xl pl-11 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#A388E1]/50 border border-gray-200 focus:border-transparent transition-all text-sm md:text-base font-medium shadow-sm hover:shadow-md"
              />
              {searchInput && (
                <button 
                  onClick={() => { setSearchInput(''); setQuery(''); }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5 bg-gray-100 rounded-full p-0.5" />
                </button>
              )}
            </div>
            
            {/* Filter Button */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className={`p-3.5 rounded-2xl border transition-all shrink-0 shadow-sm flex items-center justify-center relative ${
                selectedCategory !== 'All' || sortOption !== 'relevance' || priceRange.min || priceRange.max
                  ? 'bg-[#6B46C1] border-[#6B46C1] text-white' 
                  : 'bg-white border-gray-200 text-gray-600 hover:text-[#6B46C1] hover:bg-[#F8F6FF] hover:border-[#EBE5F7]'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {/* Active Filter Indicator */}
              {(selectedCategory !== 'All' || sortOption !== 'relevance' || priceRange.min || priceRange.max) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FILTER DRAWER (Framer Motion Slide-up) */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-[70] shadow-2xl overflow-hidden md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:rounded-3xl"
            >
              <div className="p-5 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Filters & Sort</h2>
                  <button onClick={() => setIsFilterOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Sort Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Sort By</h3>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button 
                        key={opt.id}
                        onClick={() => setSortOption(opt.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          sortOption === opt.id ? 'bg-[#F8F6FF] text-[#6B46C1] border border-[#A388E1]' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {sortOption === opt.id && <Check className="w-3.5 h-3.5" />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setSelectedCategory('All')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === 'All' ? 'bg-[#6B46C1] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      All Categories
                    </button>
                    {exploreData.categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedCategory === cat ? 'bg-[#6B46C1] text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Credit Range</h3>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" placeholder="Min" 
                      value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A388E1]"
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <input 
                      type="number" placeholder="Max" 
                      value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#A388E1]"
                    />
                  </div>
                </div>

                {/* Apply Button */}
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-[#6B46C1] text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:bg-[#5a3da6] transition-all"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 
        MAIN CONTENT AREA:
        Added pt-24 (padding top) so the fixed header doesn't hide the content below it.
      */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 mt-2">
        
        {/* Loading State */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <div className="flex items-center gap-2 text-[#6B46C1] mb-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <h3 className="text-sm font-bold">Searching...</h3>
             </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-2">
               {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <ProductCard key={i} isLoading={true} className="w-full" />
               ))}
            </div>
          </motion.div>
        )}

        {/* Explore Data State (When not searching) */}
        {!isLoading && !isSearching && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
            className="flex flex-col gap-10 pb-10"
          >
            {/* Modern Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[16px] font-extrabold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#A388E1]" /> Recent Searches
                  </h3>
                  <button onClick={() => {setRecentSearches([]); localStorage.removeItem('dealit_recent_searches');}} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">Clear All</button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {recentSearches.map((term, idx) => (
                    <div key={idx} onClick={() => handleQuickSearch(term)} className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:border-[#A388E1] hover:shadow-md cursor-pointer transition-all group">
                      <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#6B46C1]" />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-[#6B46C1]">{term}</span>
                      <button onClick={(e) => removeRecentSearch(term, e)} className="ml-1 text-gray-400 hover:text-red-500 rounded-full p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premium Trending Section */}
            {!loadingExplore && exploreData.trendingSearches.length > 0 && (
              <div>
                <h3 className="text-[16px] font-extrabold text-gray-900 flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-orange-500" /> Trending on DealIt
                </h3>
                <div className="flex flex-wrap gap-3">
                  {exploreData.trendingSearches.map((term, idx) => (
                    <button 
                      key={idx} onClick={() => handleQuickSearch(term)}
                      className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100/50 text-sm font-bold text-orange-800 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all capitalize"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reimagined Categories Grid */}
            {!loadingExplore && exploreData.categories.length > 0 && (
              <div>
                <h3 className="text-[16px] font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Grid className="w-5 h-5 text-[#6B46C1]" /> Explore Categories
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
                  {exploreData.categories.map((cat, idx) => {
                    const style = getCategoryStyles(cat);
                    const IconComp = style.icon;
                    return (
                      <button 
                        key={idx} onClick={() => handleQuickSearch(cat)}
                        className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:border-[#A388E1]/30 hover:-translate-y-1 transition-all group"
                      >
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 ${style.color}`}>
                          <IconComp className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center break-words w-full group-hover:text-[#6B46C1]">{cat}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Empty Results State */}
        {!isLoading && isSearching && results.length === 0 && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">No items found</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              We couldn't find any items matching your current filters. Try adjusting your search or clearing filters.
            </p>
            <button onClick={() => {setSearchInput(''); setQuery(''); setSelectedCategory('All');}} className="mt-6 px-6 py-2.5 bg-[#F8F6FF] text-[#6B46C1] font-bold rounded-full hover:bg-[#EBE5F7] transition-colors">
              Clear Search
            </button>
          </motion.div>
        )}

        {/* Populated Search Results */}
        {!isLoading && isSearching && results.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                {data.pages[0].total} {data.pages[0].total === 1 ? 'Result' : 'Results'} Found
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-2">
              {results.map((item) => (
                <ProductCard key={item._id} item={item} className="w-full" />
              ))}
            </div>

            {/* Infinite Scroll Trigger */}
            <div ref={lastItemRef} className="w-full h-20 mt-4 flex items-center justify-center">
              {isFetchingNextPage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-600 font-bold text-xs"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-[#6B46C1]" /> Loading more...
                </motion.div>
              )}
            </div>

          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;