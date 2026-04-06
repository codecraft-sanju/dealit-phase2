import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Package, RefreshCw, X, AlertCircle, Coins, CheckCircle2, Info, ShieldCheck, User, Share2, ArrowLeft, Calendar, Grid } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const ItemDetailPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal & Swap States
  const [showModal, setShowModal] = useState(false);
  const [myItems, setMyItems] = useState([]);
  const [selectedMyItem, setSelectedMyItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [balanceError, setBalanceError] = useState(null);

  // Gallery States
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/items/${id}`);
        setItem(response.data.data);
      } catch (error) {
        console.error('Error fetching item details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

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

  const handleOpenBarterModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowModal(true);
    setBalanceError(null); 
    try {
      const response = await axios.get(`${API_URL}/items/me`, { withCredentials: true });
      const myActiveItems = response.data.data.filter(i => i.status === 'active');
      setMyItems(myActiveItems);
    } catch (error) {
      console.error('Error fetching your items:', error);
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

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center lg:max-w-7xl">
        <div className="w-16 h-16 bg-[#f8f6ff] rounded-2xl flex items-center justify-center animate-bounce mb-4 border border-[#EBE5F7]">
          <Package className="w-8 h-8 text-[#6B46C1]" />
        </div>
        <div className="text-slate-500 font-medium animate-pulse text-sm">Loading details...</div>
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
    <div className="max-w-7xl mx-auto bg-white min-h-screen pb-32 lg:pb-12 font-sans animate-in fade-in duration-500 relative">
      
      {/* Mobile Floating Header (Back & Share) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
        <button onClick={() => navigate(-1)} className="pointer-events-auto w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-slate-200/50 text-slate-700 hover:bg-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={handleShare} className="pointer-events-auto w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm border border-slate-200/50 text-slate-700 hover:bg-white transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12 items-start lg:pt-10 lg:px-6">
        
        {/* LEFT COLUMN: Gallery & Desktop Description */}
        <div className="lg:col-span-7 w-full mx-auto space-y-6">
          
          {/* Main Swipeable Container */}
          <div className="relative w-full aspect-square lg:aspect-auto lg:h-[500px] bg-[#f8f9fb] lg:rounded-[2rem] overflow-hidden border-b lg:border border-slate-100 shadow-sm group">
            
            {/* NAYA: Mobile Image Counter Badge */}
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
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-4 lg:p-8 relative">
                    <img 
                      src={img} 
                      alt={`${item.title} ${idx + 1}`} 
                      className="max-w-full max-h-full object-contain drop-shadow-sm" 
                    />
                  </div>
                ))
              ) : (
                <div className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center">
                  <Package className="w-20 h-20 text-slate-300" />
                </div>
              )}
            </div>

            {/* Mobile Dots Indicator */}
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

          {/* Thumbnails */}
          {item.images && item.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 lg:px-0 mt-4 lg:mt-0 pb-2">
              {item.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#f8f9fb] ${activeIndex === idx ? 'border-[#6B46C1] shadow-sm scale-[0.98]' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}

          {/* Desktop Description */}
          <div className="hidden lg:block bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-[#6B46C1]" /> Item Description
            </h3>
            <p className="text-slate-600 text-[15px] leading-relaxed whitespace-pre-line">
              {item.description || 'No description provided by the owner.'}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Details & Actions */}
        <div className="lg:col-span-5 flex flex-col h-full px-5 lg:px-0 pt-6 lg:pt-0 pb-16 lg:pb-0 lg:sticky lg:top-24">
          
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-tight tracking-tight pr-4">
                {item.title}
              </h1>
              {/* Desktop Share Button */}
              <button onClick={handleShare} className="hidden lg:flex w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-full items-center justify-center text-slate-500 transition-colors shrink-0">
                <Share2 className="w-4 h-4" />
              </button>
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

          {/* Item Stats Grid */}
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

          {/* Owner Profile Card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm mb-6 lg:mb-8 hover:border-[#EBE5F7] hover:shadow-md transition-all cursor-default">
            <div className="w-12 h-12 bg-[#F8F6FF] rounded-full flex items-center justify-center overflow-hidden border border-[#EBE5F7] shrink-0">
              {item.owner?.profilePic ? (
                <img src={item.owner.profilePic} alt="Owner" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-[#A388E1]" />
              )}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Owned By</p>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{item.owner?.full_name || 'Dealit User'}</p>
            </div>
          </div>

          {/* Mobile Description */}
          <div className="block lg:hidden mb-4 relative">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line pb-4">
              {item.description || 'No description provided by the owner.'}
            </p>
          </div>

          {/* Fixed Bottom Action Container */}
          <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-40 pointer-events-none lg:static lg:mt-auto">
            
            {/* NAYA: Gradient Fade for scrolling text beneath the button */}
            <div className="h-10 bg-gradient-to-t from-white to-transparent lg:hidden w-full"></div>
            
            <div className="p-4 bg-white/95 backdrop-blur-xl border-t border-slate-100 lg:bg-transparent lg:border-none lg:p-0 pointer-events-auto">
              {user && (item.owner?._id === user._id || item.owner?._id === user.id) ? (
                <button disabled className="w-full bg-[#F8F9FA] text-slate-400 py-4 rounded-xl font-bold text-base cursor-not-allowed border border-slate-200 flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 opacity-50" /> This is your item
                </button>
              ) : (
                <button 
                  onClick={handleOpenBarterModal}
                  className="w-full bg-[#6B46C1] hover:bg-[#5a3aa8] text-white py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg shadow-[#6B46C1]/20 active:scale-[0.98]"
                >
                  <RefreshCw className="w-5 h-5" /> Offer a Trade
                </button>
              )}
              
              {/* Trust Badges */}
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
        </div>
      </div>

      {/* ================= Modern Barter Modal ================= */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center bg-slate-900/50 backdrop-blur-sm sm:px-4 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-[2rem] lg:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] lg:max-h-[85vh] animate-in slide-in-from-bottom-10 lg:slide-in-from-bottom-0 lg:zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Select an Item</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Choose what you want to offer in return</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition p-2 bg-slate-50 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-[#f8f9fb]">
              {balanceError && (
                <div className="mb-5 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700 mb-0.5">Trade Cannot Proceed</p>
                    <p className="text-xs text-red-600 mb-2 leading-relaxed">{balanceError}</p>
                    <Link 
                      to="/wallet" 
                      onClick={() => setShowModal(false)} 
                      className="inline-block bg-white border border-red-200 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition mt-1"
                    >
                      Get Credits
                    </Link>
                  </div>
                </div>
              )}

              {myItems.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 bg-[#f8f6ff] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-[#A388E1]" />
                  </div>
                  <p className="text-sm text-slate-500 font-medium mb-4 px-4">You don't have any items to offer yet.</p>
                  <Link to="/add-item" onClick={() => setShowModal(false)} className="inline-block bg-[#EBE5F7] text-[#6B46C1] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#d6bcfa] transition">
                    Add an Item Now
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    {myItems.map(myItem => (
                      <div 
                        key={myItem._id} 
                        onClick={() => setSelectedMyItem(myItem._id)}
                        className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all flex flex-col bg-white ${
                          selectedMyItem === myItem._id 
                            ? 'border-[#6B46C1] shadow-md shadow-[#6B46C1]/10 bg-[#f8f6ff] scale-[0.98]' 
                            : 'border-transparent shadow-sm hover:border-slate-200'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-[#f8f9fb] flex items-center justify-center overflow-hidden p-2">
                          {myItem.images && myItem.images.length > 0 && myItem.images[0] ? (
                            <img src={myItem.images[0]} alt={myItem.title} className="w-full h-full object-contain mix-blend-multiply" />
                          ) : (
                            <Package className="w-8 h-8 text-[#A388E1]/40" />
                          )}
                        </div>
                        <div className="p-3 border-t border-slate-50">
                          <p className="text-xs font-bold text-slate-900 truncate mb-1">{myItem.title}</p>
                          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md border border-slate-100">
                            <Coins className="w-3 h-3 text-yellow-600" /> {myItem.estimated_value || '0'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedMyItem && selectedItemObj && (
                    <div className="mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {requiredCredits > 0 ? (
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <RefreshCw className="w-4 h-4 text-[#6B46C1]" />
                            <span className="font-bold text-slate-900">Trade Summary</span>
                          </div>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Target item is <span className="font-bold text-slate-900">{targetValue} Credits</span>. Your offer is <span className="font-bold text-slate-900">{offeredValue} Credits</span>. 
                            If accepted, <span className="font-bold text-[#6B46C1]">{requiredCredits} Credits</span> will be deducted from your wallet.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-[#E6F4EA] border border-[#CEEAD6] p-4 rounded-2xl shadow-sm text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-[#137333]" />
                            <span className="font-bold text-[#137333]">Fair Trade Match!</span>
                          </div>
                          <p className="text-[#137333]/80 text-xs">No extra credits will be required for this swap.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-white flex gap-3 pb-safe">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmOrder}
                disabled={!selectedMyItem || submitting}
                className={`flex-[2] px-4 py-3.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                  !selectedMyItem || submitting 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#6B46C1] hover:bg-[#5a3aa8] text-white shadow-lg shadow-[#6B46C1]/20 active:scale-[0.98]'
                }`}
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  'Confirm Offer'
                )}
              </button>
            </div>
          </div>
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
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 1.25rem);
        }
      `}</style>
    </div>
  );
};

export default ItemDetailPage;