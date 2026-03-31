import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Package, RefreshCw, X, AlertCircle, Coins, CheckCircle2, ArrowRightLeft } from 'lucide-react';
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

  // Handle Swipe/Scroll for Images
  const handleScroll = (e) => {
    if (!e.target) return;
    const width = e.target.offsetWidth;
    const scrollPosition = e.target.scrollLeft;
    const newIndex = Math.round(scrollPosition / width);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  // Handle Thumbnail Click
  const handleThumbnailClick = (index) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.offsetWidth * index,
        behavior: 'smooth'
      });
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
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center md:max-w-7xl">
        <div className="w-16 h-16 bg-[#f8f6ff] rounded-2xl flex items-center justify-center animate-bounce mb-4 border border-[#EBE5F7]">
          <Package className="w-8 h-8 text-[#6B46C1]" />
        </div>
        <div className="text-slate-500 font-medium animate-pulse text-sm">Loading details...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col items-center justify-center md:max-w-7xl px-5">
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

  return (
    <div className="max-w-7xl mx-auto bg-white min-h-screen pb-24 md:pb-12 font-sans animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 md:gap-12 items-start md:pt-10 md:px-6">
        
        {/* LEFT: Image Gallery (Interactive & Swipeable) */}
        <div className="w-full max-w-xl mx-auto md:sticky md:top-24 space-y-4">
          
          {/* Main Swipeable Container */}
          <div className="relative w-full aspect-square md:aspect-auto md:h-[500px] bg-[#f8f9fb] md:rounded-[2rem] overflow-hidden border-b md:border border-slate-100 shadow-sm group">
            
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-smooth"
            >
              {item.images && item.images.length > 0 ? (
                item.images.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-4 md:p-8">
                    <img 
                      src={img} 
                      alt={`${item.title} ${idx + 1}`} 
                      className="max-w-full max-h-full object-contain" 
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
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 md:hidden">
                {item.images.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-5 bg-[#6B46C1]' : 'w-1.5 bg-slate-300/80'}`} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop/Mobile Thumbnails */}
          {item.images && item.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-0">
              {item.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#f8f9fb] ${activeIndex === idx ? 'border-[#6B46C1] shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Details Section */}
        <div className="flex flex-col h-full px-5 md:px-0 pt-6 md:pt-0">
          
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-[#f8f6ff] text-[#6B46C1] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#EBE5F7]">
                {item.category || 'Item'}
              </span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                {item.condition || 'Used'}
              </span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
              {item.title}
            </h1>

            <div className="flex items-center gap-2 pb-5 border-b border-slate-100">
              <div className="w-10 h-10 bg-[#FFF4D2] rounded-full flex items-center justify-center border border-[#FFE28A]/50">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Estimated Value</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{item.estimated_value || '0'}</span>
                  <span className="text-sm font-medium text-slate-500">Credits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-slate mb-8">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          <div className="bg-[#f8f9fb] border border-slate-100 rounded-2xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-[#6B46C1]" />
              <p className="text-[10px] font-bold text-[#6B46C1] uppercase tracking-wider">Owner is looking for</p>
            </div>
            <p className="text-base font-bold text-slate-900 flex items-start gap-2 leading-snug">
              {item.preferred_item || 'Open to any fair offers'}
            </p>
          </div>

          {/* Desktop Button - Sticky Bottom on Mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-slate-100 z-30 md:static md:bg-transparent md:border-none md:p-0 md:mt-auto">
            {user && item.owner?._id === user.id ? (
              <button disabled className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl font-bold text-sm cursor-not-allowed border border-slate-200">
                This is your item
              </button>
            ) : (
              <button 
                onClick={handleOpenBarterModal}
                className="w-full bg-[#6B46C1] hover:bg-[#5a3aa8] text-white py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 shadow-lg shadow-[#6B46C1]/20"
              >
                <RefreshCw className="w-5 h-5" /> Offer a Trade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modern Barter Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:px-4 transition-opacity">
          <div className="bg-white w-full max-w-lg rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
            
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
                <div className="mb-5 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
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
                    <div className="mt-5 animate-in fade-in duration-300">
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
                    : 'bg-[#6B46C1] hover:bg-[#5a3aa8] text-white shadow-lg shadow-[#6B46C1]/20'
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