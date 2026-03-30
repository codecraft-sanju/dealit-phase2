import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { RefreshCw, Check, X, MessageSquare, Package, Eye } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const SwapsPage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('received');
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [processingId, setProcessingId] = useState(null);

  if (!user) return <Navigate to="/login" />;

  useEffect(() => {
    const fetchSwaps = async () => {
      setLoading(true);
      try {
        const endpoint = activeTab === 'received' ? `${API_URL}/barter/received` : `${API_URL}/barter/sent`;
        const response = await axios.get(endpoint, { withCredentials: true });
        setSwaps(response.data.data || []);
      } catch (error) {
        console.error('Error fetching swaps:', error);
        setSwaps([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSwaps();
  }, [activeTab]);

  const handleStatusUpdate = async (swapId, newStatus) => {
    setProcessingId(swapId);
    try {
      const response = await axios.put(`${API_URL}/barter/${swapId}/status`, 
        { status: newStatus },
        { withCredentials: true }
      );
      if (response.data.success) {
        setSwaps(swaps.map(s => s._id === swapId ? { ...s, status: newStatus } : s));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Swaps & DMs 💅</h1>
        <p className="text-gray-400 text-lg">Slide into these trades fr fr 🚀</p>
      </div>

      <div className="flex bg-gray-900 rounded-2xl p-1 mb-8 w-fit border border-gray-800">
        <button 
          onClick={() => setActiveTab('received')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'received' ? 'bg-[#f97316] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Vibes Received 📩 ({activeTab === 'received' ? swaps.length : '0'})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'sent' ? 'bg-[#f97316] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          Vibes Sent 📤 ({activeTab === 'sent' ? swaps.length : '0'})
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center text-emerald-400 py-10 animate-pulse font-medium">Loading your vibes...</div>
        ) : swaps.length === 0 ? (
          <div className="text-center bg-gray-800 border border-gray-700 rounded-3xl py-16 px-6">
            <p className="text-gray-400 text-lg">No trades here yet. Go send some vibes! 🌬️</p>
          </div>
        ) : (
          swaps.map((swap) => (
            <div key={swap._id} className="bg-[#1f2125] border border-gray-800 rounded-2xl p-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-gray-500">Request #{swap._id.substring(0, 8)}</span>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    swap.status === 'GHOSTING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                    swap.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    swap.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    'bg-gray-700 text-gray-300'
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
                        className="flex-1 md:flex-none bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1 border border-emerald-500/30 disabled:opacity-50"
                      >
                        {processingId === swap._id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(swap._id, 'REJECTED')}
                        disabled={processingId === swap._id}
                        className="flex-1 md:flex-none bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1 border border-red-500/30 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  <Link to={`/chat/${swap._id}`} className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-gray-700">
                    <MessageSquare className="w-4 h-4" /> Chat
                  </Link>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full bg-[#181a1d] rounded-2xl p-5 border border-gray-800/50">
                  <p className="text-xs text-gray-500 font-bold tracking-widest mb-4">THEY HAVE</p>
                  <div className="flex items-center gap-4">
                    {swap.requestedItem?.images && swap.requestedItem.images.length > 0 && swap.requestedItem.images[0] ? (
                       <img src={swap.requestedItem.images[0]} alt="Item" className="w-20 h-20 rounded-xl object-cover border border-gray-700" />
                    ) : (
                       <div className="w-20 h-20 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center"><Package className="w-8 h-8 text-gray-600"/></div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{swap.requestedItem?.title || 'Unknown Item'}</h3>
                      <p className="text-sm text-gray-400 mb-2">{swap.requestedItem?.condition || 'N/A'}</p>
                      <button className="text-[#f97316] text-sm font-medium flex items-center gap-1 hover:underline">
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </div>
                  </div>
                </div>

                <div className="hidden md:flex flex-shrink-0 items-center justify-center p-3 bg-gray-800 rounded-full border border-gray-700">
                  <RefreshCw className="w-6 h-6 text-gray-400" />
                </div>

                <div className="flex-1 w-full bg-[#181a1d] rounded-2xl p-5 border border-gray-800/50">
                  <p className="text-xs text-gray-500 font-bold tracking-widest mb-4">YOU OFFER</p>
                  <div className="flex items-center gap-4">
                    {swap.offeredItem?.images && swap.offeredItem.images.length > 0 && swap.offeredItem.images[0] ? (
                       <img src={swap.offeredItem.images[0]} alt="Item" className="w-20 h-20 rounded-xl object-cover border border-gray-700" />
                    ) : (
                       <div className="w-20 h-20 bg-gray-900 rounded-xl border border-gray-700 flex items-center justify-center"><Package className="w-8 h-8 text-gray-600"/></div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">{swap.offeredItem?.title || 'Unknown Item'}</h3>
                      <button className="text-[#f97316] text-sm font-medium flex items-center gap-1 hover:underline">
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SwapsPage;