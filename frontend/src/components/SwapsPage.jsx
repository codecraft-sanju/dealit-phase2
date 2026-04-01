import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { RefreshCw, Check, X, MessageSquare, Package, Eye, AlertCircle, ArrowRightLeft, ChevronLeft } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const SwapsPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('received');
  
  const [receivedSwaps, setReceivedSwaps] = useState([]);
  const [sentSwaps, setSentSwaps] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState({ id: null, message: '' });

  useEffect(() => {
    if (!user) return;
    const fetchAllSwaps = async () => {
      setLoading(true);
      setActionError({ id: null, message: '' });
      try {
        const [receivedRes, sentRes] = await Promise.all([
          axios.get(`${API_URL}/barter/received`, { withCredentials: true }),
          axios.get(`${API_URL}/barter/sent`, { withCredentials: true })
        ]);
        
        setReceivedSwaps(receivedRes.data.data || []);
        setSentSwaps(sentRes.data.data || []);
      } catch (error) {
        console.error('Error fetching swaps:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllSwaps();
  }, [user]); 

  if (!user) return <Navigate to="/login" />;

  const handleStatusUpdate = async (swapId, newStatus) => {
    setProcessingId(swapId);
    setActionError({ id: null, message: '' }); 
    try {
      const response = await axios.put(`${API_URL}/barter/${swapId}/status`, 
        { status: newStatus },
        { withCredentials: true }
      );
      if (response.data.success) {
        setReceivedSwaps(receivedSwaps.map(s => s._id === swapId ? { ...s, status: newStatus } : s));
        setSentSwaps(sentSwaps.map(s => s._id === swapId ? { ...s, status: newStatus } : s));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setActionError({ 
        id: swapId, 
        message: error.response?.data?.message || 'Failed to update status' 
      });
    } finally {
      setProcessingId(null);
    }
  };

  const displaySwaps = activeTab === 'received' ? receivedSwaps : sentSwaps;

  return (
    <div className="max-w-md mx-auto bg-[#f4f2f9] min-h-screen pb-24 md:max-w-7xl relative font-sans">
      
      <div className="sticky top-0 z-50 bg-[#f4f2f9]">
        {/* CHANGE 1 & 2: 
          - Added 'sticky top-0 z-50' to keep the header fixed while scrolling.
          - Added the Back Button with ChevronLeft.
        */}
        <div className="bg-[#6B46C1] pt-6 pb-12 px-5 md:px-8 rounded-b-[2rem] shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-1.5 -ml-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight text-white">My Swaps</h1>
              <p className="text-[11px] md:text-sm text-purple-200 font-medium mt-0.5">Review offers and lock deals</p>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-8 -mt-7 relative z-20 pb-4">
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-2">
            <button 
              onClick={() => { setActiveTab('received'); setActionError({ id: null, message: '' }); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'received' 
                  ? 'bg-[#EBE5F7] text-[#6B46C1] shadow-sm' 
                  : 'text-gray-500 hover:text-[#6B46C1] hover:bg-gray-50'
              }`}
            >
              Received ({receivedSwaps.length})
            </button>
            <button 
              onClick={() => { setActiveTab('sent'); setActionError({ id: null, message: '' }); }}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'sent' 
                  ? 'bg-[#EBE5F7] text-[#6B46C1] shadow-sm' 
                  : 'text-gray-500 hover:text-[#6B46C1] hover:bg-gray-50'
              }`}
            >
              Sent ({sentSwaps.length})
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 md:px-8 relative z-10">
        <div className="space-y-5">
          {loading ? (
            <div className="space-y-5">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-100 shadow-sm rounded-[2rem] p-5 md:p-7 animate-pulse">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-5 border-b border-gray-100 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-20 bg-gray-100 rounded-lg"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <div className="h-10 w-full md:w-24 bg-gray-200 rounded-xl hidden md:block"></div>
                      <div className="h-10 w-full md:w-24 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative">
                    <div className="flex-1 w-full bg-[#fcfbff] rounded-2xl p-4 md:p-5 border border-[#f0eaff]">
                      <div className="h-3 w-24 bg-[#EBE5F7] rounded-md mb-3"></div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#EBE5F7] rounded-xl shrink-0"></div>
                        <div className="w-full">
                          <div className="h-5 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                          <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:relative md:translate-x-0 md:translate-y-0 z-10">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-100 shadow-sm">
                        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                      </div>
                    </div>

                    <div className="flex-1 w-full bg-[#fcfbff] rounded-2xl p-4 md:p-5 border border-[#f0eaff]">
                      <div className="h-3 w-24 bg-[#EBE5F7] rounded-md mb-3"></div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#EBE5F7] rounded-xl shrink-0"></div>
                        <div className="w-full">
                          <div className="h-5 w-3/4 bg-gray-200 rounded-md mb-2"></div>
                          <div className="h-4 w-1/2 bg-gray-200 rounded-md"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : displaySwaps.length === 0 ? (
            <div className="text-center bg-white border border-gray-100 rounded-[2rem] py-16 px-6 shadow-sm">
              <div className="bg-[#f8f6ff] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-[#A388E1]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No trades found</h3>
              <p className="text-sm text-gray-500">You don't have any {activeTab} offers right now.</p>
            </div>
          ) : (
            displaySwaps.map((swap) => (
              <div key={swap._id} className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-[2rem] p-5 md:p-7">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-5 border-b border-gray-100 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      #{swap._id.substring(0, 8)}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                      swap.status === 'GHOSTING' ? 'bg-orange-100 text-orange-700' : 
                      swap.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                      swap.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {swap.status} {swap.status === 'GHOSTING' && '👻'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {activeTab === 'received' && swap.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(swap._id, 'ACCEPTED')}
                          disabled={processingId === swap._id}
                          className="flex-1 md:flex-none bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#137333] px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {processingId === swap._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(swap._id, 'REJECTED')}
                          disabled={processingId === swap._id}
                          className="flex-1 md:flex-none bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#C5221F] px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </>
                    )}
                    <Link to={`/chat/${swap._id}`} className="flex-1 md:flex-none bg-[#F8F9FA] hover:bg-[#EBE5F7] hover:text-[#6B46C1] text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-gray-200 hover:border-[#d6bcfa]">
                      <MessageSquare className="w-4 h-4" /> Chat
                    </Link>
                  </div>
                </div>

                {actionError.id === swap._id && (
                  <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-700 mb-0.5">Action Failed</p>
                      <p className="text-sm text-red-600">{actionError.message}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 relative">
                  
                  <div className="flex-1 w-full bg-[#fcfbff] rounded-2xl p-4 md:p-5 border border-[#f0eaff]">
                    <p className="text-[10px] text-[#A388E1] font-extrabold uppercase tracking-wider mb-3">
                      {activeTab === 'received' ? 'They are offering' : 'You are requesting'}
                    </p>
                    <div className="flex items-center gap-4">
                      {swap.offeredItem?.images && swap.offeredItem.images.length > 0 && swap.offeredItem.images[0] ? (
                         <img src={swap.offeredItem.images[0]} alt="Item" className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-gray-100 shadow-sm" />
                      ) : (
                         <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
                           <Package className="w-8 h-8 text-gray-300"/>
                         </div>
                      )}
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 line-clamp-1">{swap.offeredItem?.title || 'Unknown Item'}</h3>
                        <button className="text-[#805ad5] text-xs font-bold flex items-center gap-1 hover:underline bg-[#f4f2f9] px-2.5 py-1 rounded-md w-fit">
                          <Eye className="w-3.5 h-3.5" /> View Item
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:relative md:translate-x-0 md:translate-y-0 z-10">
                    <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border border-gray-100 shadow-md">
                      <ArrowRightLeft className="w-5 h-5 text-[#A388E1] md:rotate-0 rotate-90" />
                    </div>
                  </div>

                  <div className="flex-1 w-full bg-[#fcfbff] rounded-2xl p-4 md:p-5 border border-[#f0eaff]">
                    <p className="text-[10px] text-[#A388E1] font-extrabold uppercase tracking-wider mb-3">
                      {activeTab === 'received' ? 'For your item' : 'From your items'}
                    </p>
                    <div className="flex items-center gap-4">
                      {swap.requestedItem?.images && swap.requestedItem.images.length > 0 && swap.requestedItem.images[0] ? (
                         <img src={swap.requestedItem.images[0]} alt="Item" className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-gray-100 shadow-sm" />
                      ) : (
                         <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shadow-sm">
                           <Package className="w-8 h-8 text-gray-300"/>
                         </div>
                      )}
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 line-clamp-1">{swap.requestedItem?.title || 'Unknown Item'}</h3>
                        <p className="text-xs text-gray-500 font-medium mb-2">{swap.requestedItem?.condition || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapsPage;