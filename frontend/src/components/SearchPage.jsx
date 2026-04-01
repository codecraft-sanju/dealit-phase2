import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Package, Loader2, Coins, X, User } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const SearchPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-focus the search input when the page loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounced Search Logic (Wait 500ms after user stops typing before calling API)
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
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="min-h-screen bg-gray-50 md:bg-white pb-24 font-sans">
      
      {/* Sticky Header with Search Input */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-3 md:py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 text-gray-500 hover:text-[#6B46C1] hover:bg-[#F8F6FF] rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 relative">
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        
        {/* State 1: Typing / Loading */}
        {loading && (
          <div>
             <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider animate-pulse">
              Searching for "{query}"...
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div 
                    key={i} 
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col shadow-sm animate-pulse h-[260px]"
                  >
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
          </div>
        )}

        {/* State 2: Initial Empty State (No Search Yet) */}
        {!loading && !hasSearched && !query.trim() && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="w-20 h-20 bg-[#F8F6FF] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#EBE5F7]">
              <Search className="w-10 h-10 text-[#A388E1]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What are you looking for?</h2>
            <p className="text-sm text-gray-500 max-w-sm">
              Type above to search through thousands of items available for trade on Dealit.
            </p>
          </div>
        )}

        {/* State 3: No Results Found */}
        {!loading && hasSearched && results.length === 0 && query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">No items found</h2>
            <p className="text-sm text-gray-500">
              We couldn't find any items matching "<span className="font-semibold text-gray-700">{query}</span>". 
              Try checking for typos or using different keywords.
            </p>
          </div>
        )}

        {/* State 4: Results Display */}
        {!loading && hasSearched && results.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
              Found {results.length} {results.length === 1 ? 'Result' : 'Results'}
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((item) => (
                <Link 
                  to={`/item/${item._id}`} 
                  key={item._id} 
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all relative shadow-sm group"
                >
                  
                  {/* Image Section */}
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
                    
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-700 shadow-sm border border-gray-100">
                      {item.category}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 leading-tight group-hover:text-[#6B46C1] transition-colors">{item.title}</h3>
                    
                    {/* Owner Details */}
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
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;