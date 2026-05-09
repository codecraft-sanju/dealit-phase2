import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  Package, RefreshCw, X, AlertCircle, Coins, CheckCircle2, Info, 
  ShieldCheck, User, Share2, ArrowLeft, Calendar, Grid, 
  TrendingUp, Heart, ShoppingBag 
} from 'lucide-react';
import axios from 'axios';
import ProductCard from './ProductCard'; 

import { getOptimizedCloudinaryUrl } from './HomePage';

import TradeModal from '../TradeModal/TradeModal';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ItemDetailPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Related Items State
  const [relatedItems, setRelatedItems] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  // Modal & Swap States
  const [showModal, setShowModal] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [selectedMyItem, setSelectedMyItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [balanceError, setBalanceError] = useState(null);
  
  const [loadingMyItems, setLoadingMyItems] = useState(false); 

  // Gallery States
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  // Wishlist States
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/items/${id}`);
        setItem(response.data.data);

        // Fetch User Profile to check if item is in wishlist
        if (user) {
          const profileRes = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
          if (profileRes.data.success && profileRes.data.data.wishlist) {
            const userWishlist = profileRes.data.data.wishlist;
            setIsWishlisted(userWishlist.includes(id));
          }
        }

      } catch (error) {
        console.error('Error fetching item details:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedItems = async () => {
      try {
        setLoadingRelated(true);
        const response = await axios.get(`${API_URL}/items/${id}/related`);
        if (response.data.success) {
          setRelatedItems(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching related items:', error);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchItemDetails();
    fetchRelatedItems();
  }, [id, user]); 

  const handleScroll = (e) => {
    if (!e.target) return;
    const width = e.target.offsetWidth;
    const scrollPosition = e.target.scrollLeft;
    const newIndex = Math.round(scrollPosition / width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const handleThumbnailClick = (index) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.offsetWidth * index,
        behavior: 'smooth'
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `Check out this ${item.title} on Dealit!`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Toggle Wishlist Handler
  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setTogglingWishlist(true);
    try {
      const response = await axios.post(`${API_URL}/users/wishlist/${id}`, {}, { withCredentials: true });
      if (response.data.success) {
        setIsWishlisted(response.data.isWishlisted);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleOpenBarterModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowModal(true);
    setBalanceError(null); 
  
    setLoadingMyItems(true); 
    try {
      const response = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
      const myActiveItems = response.data.data.filter(i => i.status === 'active');
      setMyItems(myActiveItems);
    } catch (error) {
      console.error('Error fetching your items:', error);
    } finally {
    
      setLoadingMyItems(false); 
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedMyItem) return;
    setSubmitting(true);
    setBalanceError(null);
    try {
      await axios.post(`${API_URL}/barter`, {
        requestedItem: item._id,
        offeredItem: selectedMyItem,
        receiver: item.owner._id
      }, { withCredentials: true });
      
      setShowModal(false);
      navigate('/swaps'); 
    } catch (error) {
      console.error('Error Details:', error.response?.data || error);
      
      if (error.response?.data?.insufficientCredits) {
        setBalanceError(error.response.data.message);
      } else {
        const errorMessage = error.response?.data?.message || error.message;
        setBalanceError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/checkout/${item._id}`);
  };


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto bg-white min-h-screen pb-[150px] md:pb-32 lg:pb-12 font-sans animate-pulse lg:pt-10 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12 items-start">
          
          {/* Left Column Shimmer (Image & Details) */}
          <div className="lg:col-span-7 w-full mx-auto space-y-6 px-5 lg:px-0 mt-6 lg:mt-0">
            <div className="w-full aspect-square bg-slate-100 lg:rounded-[2rem] rounded-xl mb-4"></div>
            
            {/* Thumbnails Shimmer */}
            <div className="hidden lg:flex gap-3 overflow-x-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-20 h-20 bg-slate-100 rounded-xl flex-shrink-0"></div>
              ))}
            </div>
            
            {/* Description Box Shimmer */}
            <div className="hidden lg:block bg-white rounded-3xl p-7 border border-slate-100 mt-6">
              <div className="h-6 bg-slate-100 rounded-md w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3.5 bg-slate-100 rounded-md w-full"></div>
                <div className="h-3.5 bg-slate-100 rounded-md w-full"></div>
                <div className="h-3.5 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-3.5 bg-slate-100 rounded-md w-5/6"></div>
              </div>
            </div>
          </div>

          {/* Right Column Shimmer (Info & Actions) */}
          <div className="lg:col-span-5 flex flex-col px-5 lg:px-0 pt-6 lg:pt-0">
            
            {/* Title & Icons Shimmer */}
            <div className="flex justify-between items-start mb-6">
              <div className="h-8 bg-slate-100 rounded-lg w-2/3"></div>
              <div className="flex gap-2">
                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
                <div className="w-10 h-10 bg-slate-100 rounded-full"></div>
              </div>
            </div>

            {/* Price/Credits Shimmer */}
            <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded-md w-24"></div>
                <div className="h-8 bg-slate-100 rounded-md w-32"></div>
              </div>
            </div>

            {/* Grid Attributes Shimmer */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl h-20"></div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl h-20"></div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl h-20 col-span-2"></div>
            </div>

            {/* Owner Details Shimmer */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl h-20 mb-6 flex items-center p-4 gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="h-3 bg-slate-200 rounded-md w-16"></div>
                <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
              </div>
            </div>
            
            {/* Mobile Description Shimmer */}
            <div className="block lg:hidden space-y-3 mt-4">
              <div className="h-4 bg-slate-100 rounded-md w-1/3 mb-4"></div>
              <div className="h-3 bg-slate-100 rounded-md w-full"></div>
              <div className="h-3 bg-slate-100 rounded-md w-full"></div>
              <div className="h-3 bg-slate-100 rounded-md w-5/6"></div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center lg:max-w-7xl px-5">
        <div className="bg-slate-50 p-8 rounded-[2rem] text-center border border-slate-100 w-full shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-1">Item Not Found</h2>
          <p className="text-sm text-slate-500 mb-6">This item might have been removed or traded.</p>
          <Link to="/" className="inline-block bg-white text-slate-700 px-6 py-3 rounded-xl font-bold text-sm border border-slate-200 shadow-sm hover:bg-slate-50 transition">
            Go to Feed
          </Link>
        </div>
      </div>
    );
  }

  const targetValue = item.estimated_value || 0;
  const selectedItemObj = myItems.find(i => i._id === selectedMyItem);
  const offeredValue = selectedItemObj?.estimated_value || 0;
  const requiredCredits = Math.max(0, targetValue - offeredValue);

  const postDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

  return (
    <div className="max-w-7xl mx-auto bg-white min-h-screen pb-[150px] md:pb-32 lg:pb-12 font-sans animate-in fade-in duration-500 relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12 items-start lg:pt-10 lg:px-6">
        
        <div className="lg:col-span-7 w-full mx-auto space-y-6">
          
          <div className="relative w-full aspect-square bg-[#f8f9fb] lg:rounded-[2rem] overflow-hidden border-b lg:border border-slate-100 shadow-sm group">
            
            {item.images && item.images.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full lg:hidden z-10 tracking-widest shadow-sm">
                {activeIndex + 1} / {item.images.length}
              </div>
            )}

            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth relative"
            >
              {item.images && item.images.length > 0 ? (
                item.images.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                    <img 
                      src={getOptimizedCloudinaryUrl(img)} 
                      alt={`${item.title} ${idx + 1}`} 
                      className="w-full h-full object-cover drop-shadow-sm" 
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                  <Package className="w-20 h-20 text-slate-300" />
                </div>
              )}
            </div>

            {item.images && item.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 lg:hidden z-10">
                {item.images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${activeIndex === idx ? 'w-5 bg-[#6B46C1]' : 'w-1.5 bg-slate-300/80'}`} 
                  />
                ))}
              </div>
            )}
          </div>

          {item.images && item.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 lg:px-0 mt-4 lg:mt-0 pb-2">
              {item.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all bg-[#f8f9fb] ${activeIndex === idx ? 'border-[#6B46C1] shadow-sm scale-[0.98]' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <img src={getOptimizedCloudinaryUrl(img)} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}

          <div className="hidden lg:block bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#6B46C1]" /> Item Description
            </h3>
            <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-line">
              {item.description || 'No description provided by the owner.'}
            </p>
          </div>
        </div>

    
        <div className="lg:col-span-5 flex flex-col h-full px-5 lg:px-0 pt-6 lg:pt-0 pb-2 lg:pb-0 lg:sticky lg:top-24">
          
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight tracking-tight pr-4">
                {item.title}
              </h1>
              
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleToggleWishlist} 
                  disabled={togglingWishlist}
                  className="flex w-10 h-10 bg-slate-50 hover:bg-red-50 border border-slate-100 shadow-sm rounded-full items-center justify-center transition-colors active:scale-95 group"
                >
                  <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-slate-400 group-hover:text-red-500'}`} />
                </button>
                <button 
                  onClick={handleShare} 
                  className="flex w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-100 shadow-sm rounded-full items-center justify-center text-[#6B46C1] transition-colors active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

            </div>

            <div className="flex items-center gap-2 pb-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-[#FFF4D2] rounded-full flex items-center justify-center border border-[#FFE28A]/50">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Dealit Value</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">{targetValue}</span>
                  <span className="text-sm font-medium text-slate-500">Credits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col">
              <CheckCircle2 className="w-4 h-4 text-[#6B46C1] mb-2" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Condition</span>
              <span className="text-sm font-bold text-slate-800">{item.condition || 'Used'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col">
              <Grid className="w-4 h-4 text-[#6B46C1] mb-2" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Category</span>
              <span className="text-sm font-bold text-slate-800">{item.category || 'General'}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col col-span-2">
              <Calendar className="w-4 h-4 text-[#6B46C1] mb-2" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Listed On</span>
              <span className="text-sm font-bold text-slate-800">{postDate}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm mb-6 lg:mb-8 hover:border-[#EBE5F7] hover:shadow-md transition-all cursor-default">
            <div className="w-12 h-12 bg-[#F8F6FF] rounded-full flex items-center justify-center overflow-hidden border border-[#EBE5F7] shrink-0">
              {item.owner?.profilePic ? (
                <img src={getOptimizedCloudinaryUrl(item.owner.profilePic)} alt="Owner" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-[#A388E1]" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Owned By</p>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.owner?.full_name || 'Dealit User'}</p>
            </div>
          </div>

   
          <div className="block lg:hidden mb-2 relative">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pb-2">
              {item.description || 'No description provided by the owner.'}
            </p>
          </div>

        </div>
      </div>

      {(!loadingRelated && relatedItems.length > 0) && (
   
        <div className="mt-4 lg:mt-16 pt-6 lg:pt-12 border-t border-slate-100 px-5 lg:px-6 mb-8 lg:mb-10">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[#6B46C1]" />
            <h2 className="text-xl lg:text-2xl font-black text-slate-900">More items you might like</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedItems.map(relItem => (
              <ProductCard key={relItem._id} item={relItem} />
            ))}
          </div>
        </div>
      )}
      {loadingRelated && (
  
        <div className="mt-4 lg:mt-16 pt-6 lg:pt-12 border-t border-slate-100 px-5 lg:px-6 mb-8 lg:mb-10 animate-pulse">
           <div className="h-6 w-48 bg-slate-200 rounded-lg mb-6"></div>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {[1, 2, 3, 4].map(i => <ProductCard key={i} isLoading={true} />)}
           </div>
        </div>
      )}

    
      <div className="fixed bottom-[calc(60px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 pointer-events-none lg:static lg:mt-auto px-4 lg:px-0">
        <div className="pointer-events-auto max-w-lg mx-auto lg:max-w-full">
          {user && item?.owner?._id && (item.owner._id === user._id || item.owner._id === user.id) ? (
            <button disabled className="w-full bg-[#F8F9FA]/95 backdrop-blur-md text-slate-500 py-4 rounded-2xl font-bold text-base cursor-not-allowed border border-slate-200 shadow-sm flex items-center justify-center gap-2">
              <Package className="w-5 h-5 opacity-50" /> This is your item
            </button>
          ) : (
            <div className="flex gap-3 bg-white/80 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-2xl border border-slate-100 lg:bg-transparent lg:border-none lg:p-0 lg:shadow-none lg:flex-row">
              <button 
                onClick={handleOpenBarterModal}
                className="flex-1 bg-white hover:bg-slate-50 text-[#6B46C1] py-4 rounded-2xl font-bold text-sm sm:text-base transition-all border-2 border-[#6B46C1]/20 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> Trade
              </button>
              
              <button 
                onClick={handleBuyNow}
                className="flex-[1.5] bg-[#6B46C1] hover:bg-[#5a3aa8] text-white py-4 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-[0_10px_25px_-5px_rgba(107,70,193,0.4)] active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" /> Buy Now
              </button>
            </div>
          )}
          
          <div className="hidden lg:flex items-center justify-center gap-4 mt-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Secure</span>
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Verified</span>
            </div>
          </div>
        </div>
      </div>

      <TradeModal 
        isOpen={showModal}
        isLoading={loadingMyItems}
        onClose={() => setShowModal(false)}
        myItems={myItems}
        selectedMyItem={selectedMyItem}
        setSelectedMyItem={setSelectedMyItem}
        balanceError={balanceError}
        targetValue={targetValue}
        offeredValue={offeredValue}
        requiredCredits={requiredCredits}
        submitting={submitting}
        onConfirm={handleConfirmOrder}
      />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 1.25rem);
        }
      `}</style>
    </div>
  );
};

export default ItemDetailPage;