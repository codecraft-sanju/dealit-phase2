import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Trash2, Smartphone, Loader2, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

// --- Animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

// --- Premium Skeleton Loader ---
const SkeletonCard = () => (
  <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-sm flex items-center justify-between relative overflow-hidden">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10"></div>
    <div className="flex items-center gap-4 w-full">
      <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse shrink-0"></div>
      <div className="space-y-2.5 w-full">
        <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse"></div>
        <div className="h-3 w-20 bg-gray-100 rounded-md animate-pulse"></div>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full bg-gray-50 animate-pulse shrink-0"></div>
  </div>
);

const SavedPaymentsPage = ({ user }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedMethods();
  }, []);

  const fetchSavedMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/payment/saved-methods`, { withCredentials: true });
      if (res.data.success) {
        setTokens(res.data.data);
      }
    } catch (err) {
      setError('Could not fetch saved methods. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tokenId) => {
    if (!window.confirm("Are you sure you want to remove this payment method?")) return;
    
    try {
      setDeletingId(tokenId);
      const res = await axios.delete(`${API_URL}/payment/saved-methods/${tokenId}`, { withCredentials: true });
      if (res.data.success) {
        setTokens(prev => prev.filter(token => token.id !== tokenId));
      }
    } catch (err) {
      alert("Failed to delete payment method.");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-md mx-auto bg-[#F8F9FA] min-h-screen pb-6 md:max-w-7xl relative font-sans">
      
      {/* --- Header --- */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80 shadow-sm flex items-center px-5 py-4 md:px-8 transition-all">
        <Link to="/profile" className="p-2 -ml-2 text-gray-500 hover:text-[#6B46C1] hover:bg-[#F8F6FF] rounded-full transition-all active:scale-95 mr-3">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
          Saved Methods
        </h1>
      </div>

      <div className="p-5 md:px-8 max-w-2xl mx-auto mt-2">
        
        {/* --- Info Banner --- */}
        <div className="bg-gradient-to-r from-[#F8F6FF] to-white p-4 rounded-2xl border border-[#EBE5F7] mb-6 flex gap-3 items-start shadow-sm">
          <div className="p-2 bg-[#6B46C1]/10 rounded-full shrink-0 mt-0.5">
            <Lock className="w-4 h-4 text-[#6B46C1]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Fast & Secure Checkout</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Your saved cards and UPI IDs are securely tokenized and stored by Razorpay as per RBI guidelines.
            </p>
          </div>
        </div>

        {/* --- Content Area --- */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-6 flex flex-col items-center text-center shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm font-bold text-red-600">{error}</p>
            <button onClick={fetchSavedMethods} className="mt-4 text-xs font-bold bg-white text-red-600 px-4 py-2 rounded-full shadow-sm hover:bg-red-50 transition-colors">
              Try Again
            </button>
          </div>
        ) : tokens.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6B46C1]/20 to-transparent"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-[#F8F6FF] to-[#EBE5F7] rounded-full flex items-center justify-center mb-5 shadow-inner border border-white">
              <CreditCard className="w-10 h-10 text-[#6B46C1]" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">No Saved Methods</h3>
            <p className="text-sm text-gray-500 font-medium max-w-[250px]">
              Save your card or UPI during your next Razorpay checkout for a seamless 1-click experience.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <AnimatePresence>
              {tokens.map((token) => {
                const isCard = token.method === 'card';
                return (
                  <motion.div 
                    variants={itemVariants}
                    key={token.id}
                    layout
                    className="bg-white p-4 sm:p-5 rounded-[1.25rem] border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-[#EBE5F7] flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Premium Icon Styling */}
                      <div className={`p-3 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden ${
                        isCard 
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50' 
                          : 'bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100/50'
                      }`}>
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/40 rounded-full blur-xl"></div>
                        {isCard ? <CreditCard className="w-6 h-6 text-blue-600 relative z-10" /> : <Smartphone className="w-6 h-6 text-orange-600 relative z-10" />}
                      </div>
                      
                      <div>
                        {isCard ? (
                          <>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                {token.card.network}
                              </span>
                            </div>
                            <p className="font-black text-gray-900 tracking-tight text-sm sm:text-base">
                              •••• •••• •••• {token.card.last4}
                            </p>
                            <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                              Expires {token.card.expiry_month}/{token.card.expiry_year}
                            </p>
                          </>
                        ) : (
                          <>
                             <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                UPI ID
                              </span>
                            </div>
                            <p className="font-black text-gray-900 tracking-tight text-sm sm:text-base">
                              {token.vpa.address}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDelete(token.id)}
                      disabled={deletingId === token.id}
                      className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-90 group-hover:text-gray-400"
                    >
                      {deletingId === token.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
        
        {/* Footer Trust Badge */}
        {tokens.length > 0 && !loading && (
          <div className="mt-8 flex justify-center items-center gap-1.5 opacity-60">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              100% Secure by Razorpay
            </span>
          </div>
        )}

      </div>
      
      {/* Shimmer CSS for skeleton */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SavedPaymentsPage;