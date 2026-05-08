import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Package, Coins, X, User, Clock, TrendingUp, SlidersHorizontal, Smartphone, Laptop, Shirt, Sofa, Watch, Car, Book, Gamepad, Grid } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const getCategoryStyles = (categoryName) => {
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('mobile') || name.includes('phone')) return { icon: Smartphone, color: "bg-blue-100 text-blue-600" };
  if (name.includes('laptop') || name.includes('computer')) return { icon: Laptop, color: "bg-purple-100 text-purple-600" };
  if (name.includes('fashion') || name.includes('cloth')) return { icon: Shirt, color: "bg-pink-100 text-pink-600" };
  if (name.includes('furniture') || name.includes('home')) return { icon: Sofa, color: "bg-orange-100 text-orange-600" };
  if (name.includes('watch') || name.includes('wearable')) return { icon: Watch, color: "bg-teal-100 text-teal-600" };
  if (name.includes('vehicle') || name.includes('car') || name.includes('bike')) return { icon: Car, color: "bg-red-100 text-red-600" };
  if (name.includes('book') || name.includes('study')) return { icon: Book, color: "bg-yellow-100 text-yellow-700" };
  if (name.includes('game') || name.includes('toy')) return { icon: Gamepad, color: "bg-green-100 text-green-600" };
  
  return { icon: Grid, color: "bg-gray-100 text-gray-600" };
};

const SearchPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [recentSearches, setRecentSearches] = useState(
    JSON.parse(localStorage.getItem('dealit_recent_searches')) || []
  );

  const [exploreData, setExploreData] = useState({
    categories: [],
    trendingSearches: []
  });
  const [loadingExplore, setLoadingExplore] = useState(true);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      const response = await axios.get(`${API_URL}/items/explore-data`);
      if (response.data.success) {
        setExploreData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching explore data:', error);
    } finally {
      setLoadingExplore(false);
    }
  };

  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    const updated = [searchTerm, ...recentSearches.filter(t => t !== searchTerm)].slice(0, 6);
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
    setQuery(term);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/items/search?q=${encodeURIComponent(query)}`);
        if (response.data.success) {
          setResults(response.data.data);
          setHasSearched(true);
          if (response.data.data.length > 0) {
            saveRecentSearch(query.trim());
          }
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] md:bg-gray-50 pb-2 font-sans overflow-x-hidden">
      
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-3 md:py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-gray-500 hover:text-[#6B46C1] hover:bg-[#F8F6FF] rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for phones, shoes, watches..."
                className="w-full bg-[#F8F9FA] text-gray-900 placeholder-gray-400 rounded-full pl-11 pr-12 py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-[#A388E1]/50 border border-gray-200 focus:bg-white transition-all text-sm md:text-base font-medium shadow-inner"
              />
              {query && (
                <button 
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5 bg-gray-200 rounded-full p-0.5" />
                </button>
              )}
            </div>
            
            <button className="p-3 bg-[#F8F9FA] border border-gray-200 rounded-full text-gray-600 hover:text-[#6B46C1] hover:bg-[#F8F6FF] transition-all shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider animate-pulse">
              Searching for "{query}"...
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col shadow-sm animate-pulse h-[260px]">
                     <div className="h-36 w-full bg-[#EBE5F7] rounded-t-3xl"></div>
                     <div className="p-4 flex-1 flex flex-col">
                        <div className="h-4 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded-md mb-4"></div>
                        <div className="flex items-center gap-2 mb-3">
                           <div className="w-4 h-4 rounded-full bg-gray-200"></div>
                           <div className="h-3 w-16 bg-gray-200 rounded-md"></div>
                        </div>
                        <div className="mt-auto border-t border-gray-50 pt-3 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-[#FFE28A]"></div>
                              <div className="h-4 w-10 bg-gray-200 rounded-md"></div>
                           </div>
                           <div className="h-5 w-10 bg-gray-200 rounded-full"></div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </motion.div>
        )}

        {!loading && !hasSearched && !query.trim() && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-8 pb-10"
          >
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#A388E1]" /> Recent Searches
                  </h3>
                  <button onClick={() => {setRecentSearches([]); localStorage.removeItem('dealit_recent_searches');}} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded-md transition-colors">Clear All</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <div key={idx} onClick={() => handleQuickSearch(term)} className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm hover:border-[#A388E1] hover:shadow-md cursor-pointer transition-all group">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-[#6B46C1]">{term}</span>
                      <button onClick={(e) => removeRecentSearch(term, e)} className="ml-1 text-gray-400 hover:text-red-500 rounded-full p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loadingExplore && exploreData.trendingSearches.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-orange-500" /> Trending on DealIt
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exploreData.trendingSearches.map((term, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleQuickSearch(term)}
                      className="bg-white border border-gray-100 text-sm font-medium text-gray-600 px-4 py-2.5 rounded-full shadow-sm hover:bg-[#F8F6FF] hover:text-[#6B46C1] hover:border-[#EBE5F7] transition-all capitalize"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loadingExplore && exploreData.categories.length > 0 && (
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-3">Explore Categories</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {exploreData.categories.map((cat, idx) => {
                    const style = getCategoryStyles(cat);
                    const IconComp = style.icon;
                    return (
                      <button 
                        key={idx} 
                        onClick={() => handleQuickSearch(cat)}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md hover:-translate-y-1 transition-all"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.color}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 text-center break-words w-full">{cat}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!loading && hasSearched && results.length === 0 && query.trim() && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">No items found</h2>
            <p className="text-sm text-gray-500">
              We couldn't find any items matching "<span className="font-semibold text-gray-700">{query}</span>". 
              Try checking for typos or using different keywords.
            </p>
          </motion.div>
        )}

        {!loading && hasSearched && results.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Found {results.length} {results.length === 1 ? 'Result' : 'Results'}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((item) => (
                <Link 
                  to={`/item/${item._id}`} 
                  key={item._id} 
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all relative shadow-sm group"
                >
                  
                  <div className="h-36 bg-[#F8F9FA] relative flex items-center justify-center overflow-hidden">
                    {item.images && item.images.length > 0 && item.images[0] ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.title} 
                        className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-sm p-3 group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <Package className="w-10 h-10 text-gray-300" />
                    )}
                    
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-[#6B46C1] transition-colors">{item.title}</h3>
                    
                    <div className="flex items-center gap-1.5 mt-2 mb-3">
                      {item.owner?.profilePic ? (
                        <img src={item.owner.profilePic} alt="owner" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-gray-500" />
                        </div>
                      )}
                      <span className="text-[10px] text-gray-500 font-medium truncate">
                        {item.owner?.full_name?.split(' ')[0] || 'User'}
                      </span>
                    </div>

                    <div className="mt-auto border-t border-gray-50 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="bg-yellow-100 rounded-full p-1 shadow-sm border border-yellow-200/50">
                          <Coins className="w-3 h-3 text-yellow-600" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{item.estimated_value || '0'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#A388E1] bg-[#F8F6FF] px-2 py-1 rounded-full">
                        View
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;