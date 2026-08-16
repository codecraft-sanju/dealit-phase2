import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, TrendingUp, TrendingDown, 
  Star, Loader2, CheckCircle2, AlertCircle, Trophy, 
  ChevronRight, X, Filter
} from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const getTierDetails = (score) => {
  if (score < 300) return { current: 'Newbie', next: 'Trusted', prevReq: 0, nextReq: 300 };
  if (score < 800) return { current: 'Trusted', next: 'Elite', prevReq: 300, nextReq: 800 };
  if (score < 1000) return { current: 'Elite', next: 'Mythic', prevReq: 800, nextReq: 1000 };
  return { current: 'Mythic', next: null, prevReq: 1000, nextReq: 1000 };
};

const defaultRules = {
  earn: [
    { id: 1, text: 'Claim Welcome Bonus', points: 50 },
    { id: 2, text: 'Successful Referral', points: 20 },
    { id: 3, text: 'Milestone Unlocked (Max Referrals)', points: 50 },
    { id: 4, text: 'Item Approved by Admin', points: 10 } 
  ],
  drop: [
    { id: 1, text: 'Cancelling deals after accepting', points: 50 },
    { id: 2, text: 'Failing to fulfill shipped orders', points: 80 }
  ]
};

const premiumEase = [0.16, 1, 0.3, 1];

const AnimatedNumber = ({ value }) => {
  const spring = useSpring(0, { stiffness: 60, damping: 20, mass: 1 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const AuraPage = ({ user }) => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  
  const fallbackLogs = user?.recent_activity || [];

  const { data: fetchedAuraData, isLoading, isError } = useQuery({
    queryKey: ['aura-details'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users/aura`, { 
        withCredentials: true 
      });
      return {
        ...res.data.data,
        rules: res.data.data.rules || defaultRules
      };
    },
    staleTime: 1000 * 60 * 5 
  });

  const auraData = isError ? {
    score: user?.aura_points || 0,
    logs: fallbackLogs,
    rules: defaultRules
  } : fetchedAuraData;

  const safeScore = Math.max(0, auraData?.score || 0);
  const tierInfo = getTierDetails(safeScore);
  
  let progressPercent = 100;
  let pointsNeeded = 0;
  if (tierInfo.next) {
    const range = tierInfo.nextReq - tierInfo.prevReq;
    const currentProgress = safeScore - tierInfo.prevReq;
    progressPercent = Math.min(100, Math.max(0, (currentProgress / range) * 100));
    pointsNeeded = tierInfo.nextReq - safeScore;
  }

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const isScrolled = scrollY > 30;

  const fetchHistory = async (pageNum, currentType, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setHistoryLoading(true);
      setHistoryLogs([]);
    }

    try {
      const res = await axios.get(`${API_URL}/users/aura/history`, { 
        params: { page: pageNum, limit: 10, type: currentType },
        withCredentials: true 
      });
      
      if (res.data.success) {
        if (isLoadMore) {
          setHistoryLogs(prev => [...prev, ...res.data.data]);
        } else {
          setHistoryLogs(res.data.data);
        }
        setHasMore(res.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.log("Error fetching aura history", error);
    } finally {
      setHistoryLoading(false);
      setLoadingMore(false);
    }
  };

  const openHistoryModal = () => {
    setShowHistoryModal(true);
    setFilterType('all');
    fetchHistory(1, 'all', false);
  };

  const handleFilterChange = (newType) => {
    if (filterType === newType) return;
    setFilterType(newType);
    fetchHistory(1, newType, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchHistory(page + 1, filterType, true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase } }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f2f2f7] font-sans flex flex-col overflow-hidden selection:bg-[#6B46C1]/20">
      
      {/* ⚡ PREMIUM BACKGROUND (Matching ProfilePage) */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[#6B46C1] via-[#7c52d6] to-transparent z-0 pointer-events-none" />
      <div className="absolute top-10 -left-20 w-80 h-80 bg-[#805ad5] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 z-0 pointer-events-none" />
      <div className="absolute top-20 -right-20 w-80 h-80 bg-[#d53f8c] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 z-0 pointer-events-none" />
      
      {/* ⚡ SCROLLING HEADER */}
      <header 
        style={{ transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}
        className={`absolute top-0 left-0 right-0 z-40 flex justify-center ${
          isScrolled 
            ? 'py-3.5 bg-[#6B46C1]/96 backdrop-blur-xl shadow-sm border-b border-white/10' 
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between w-full max-w-md md:max-w-7xl px-5 text-white">
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)} 
              style={{ transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}
              className={`rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center bg-white/10 ${
                isScrolled ? 'p-2' : 'p-2.5'
              }`}
            >
              <ArrowLeft className={`${isScrolled ? 'w-4 h-4' : 'w-5 h-5'} text-white transition-all`} />
            </motion.button>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: premiumEase }}
              style={{ transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}
              className={`font-bold tracking-wide ${isScrolled ? 'text-[17px]' : 'text-[22px]'}`}
            >
              Aura Score
            </motion.h1>
          </div>
        </div>
      </header>

      {/* ⚡ SCROLLABLE CONTENT */}
      <div 
        className="flex-1 w-full overflow-y-auto z-10 hide-scrollbar relative"
        onScroll={(e) => setScrollY(e.target.scrollTop)}
      >
        <div className="max-w-md mx-auto w-full px-4 pt-28 pb-10 flex flex-col">
          
          {/* MAIN SCORE CARD */}
          {isLoading ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-6 shadow-sm border border-gray-100 h-[220px] flex items-center justify-center mb-4">
               <div className="w-12 h-12 border-4 border-gray-200 border-t-[#6B46C1] rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: premiumEase }}
              className="bg-white rounded-[28px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 relative mb-4"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Total Points
                  </p>
                  <h2 className="text-[3.5rem] font-black text-gray-900 leading-none tracking-tighter">
                    <AnimatedNumber value={safeScore} />
                  </h2>
                </div>
                <div className="bg-[#f3f0ff] border border-[#EBE5F7] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Shield className="w-4 h-4 text-[#6B46C1]" />
                  <span className="text-[11px] font-black text-[#6B46C1] uppercase tracking-wider">
                    {tierInfo.current}
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR TO NEXT TIER */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-500 mb-2.5 px-1 uppercase tracking-wider">
                  <span>{tierInfo.current}</span>
                  {tierInfo.next && <span>{tierInfo.next}</span>}
                </div>
                
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden mb-3 relative">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8b5cf6] to-[#6B46C1] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: premiumEase, delay: 0.2 }}
                  />
                </div>

                <div className="text-center">
                  {tierInfo.next ? (
                    <p className="text-[12px] font-semibold text-gray-600">
                      <span className="text-[#6B46C1] font-bold">{pointsNeeded}</span> more points to reach <span className="text-gray-900">{tierInfo.next}</span>
                    </p>
                  ) : (
                    <p className="text-[12px] font-bold text-emerald-600 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Maximum Tier Reached
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* LEADERBOARD BUTTON */}
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: premiumEase }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/aura-leadership')}
            className="w-full mb-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 rounded-[24px] p-4 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFF9E6] border border-[#FFE599] rounded-2xl flex items-center justify-center shadow-inner">
                <Trophy className="w-6 h-6 text-[#D97706]" />
              </div>
              <div className="text-left flex flex-col">
                <span className="font-bold text-gray-900 text-[16px] tracking-tight">Leaderboard</span>
                <span className="text-[12px] font-medium text-gray-500 mt-0.5">See where you rank</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </motion.button>

          {/* RECENT ACTIVITY */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-bold text-gray-900 text-[15px] tracking-tight">Recent Activity</h3>
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-[#A388E1] animate-spin" />
            ) : (
              <button
                onClick={openHistoryModal}
                className="text-[12px] font-bold text-[#6B46C1] bg-[#f3f0ff] px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                See All
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="w-24 h-3 bg-gray-100 rounded-md"></div>
                        <div className="w-16 h-2 bg-gray-100 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="data" variants={containerVariants} initial="hidden" animate="visible" className="space-y-3 pb-8">
                {auraData?.logs?.length === 0 ? (
                  
                  /* HOW IT WORKS / RULES SECTION */
                  <motion.div variants={itemVariants} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-6 mt-2">
                    <div className="text-center pt-2">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-gray-300" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-[16px]">No Activity Yet</h4>
                      <p className="text-[13px] text-gray-500 font-medium mt-1">
                        Build trust to get better trades. Follow these rules.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4">
                        <h5 className="flex items-center gap-2 font-bold text-emerald-800 text-[13px] mb-3">
                          <TrendingUp className="w-4 h-4 text-emerald-600" /> How to Earn
                        </h5>
                        <ul className="space-y-2.5 text-[12.5px] font-medium text-emerald-700/90">
                          {auraData?.rules?.earn.map((rule) => (
                            <li key={rule.id} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" /> 
                              <span className="leading-snug">{rule.text} <span className="font-bold text-emerald-600 ml-1">(+{rule.points})</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-50/50 border border-red-100/60 rounded-2xl p-4">
                        <h5 className="flex items-center gap-2 font-bold text-red-800 text-[13px] mb-3">
                          <TrendingDown className="w-4 h-4 text-red-600" /> What Drops Aura
                        </h5>
                        <ul className="space-y-2.5 text-[12.5px] font-medium text-red-700/90">
                          {auraData?.rules?.drop.map((rule) => (
                            <li key={rule.id} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" /> 
                              <span className="leading-snug">{rule.text} <span className="font-bold text-red-600 ml-1">(-{rule.points})</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                ) : (
                  
                  /* ACTUAL LOGS */
                  auraData?.logs.map((log) => (
                    <motion.div 
                      layout variants={itemVariants} key={log.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${log.type === 'positive' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                          {log.type === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[14px] font-semibold text-gray-900 leading-snug">{log.reason}</p>
                          <p className="text-[11px] text-gray-400 font-medium">{log.date}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className={`text-[16px] font-bold leading-none ${log.type === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {log.type === 'positive' ? `+${log.points}` : `-${log.points}`}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ⚡ AURA HISTORY MODAL ⚡ */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowHistoryModal(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="bg-[#f2f2f7] w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] overflow-hidden shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] relative z-10"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-20">
                <h2 className="text-[18px] font-bold text-gray-900">Aura History</h2>
                <button 
                  onClick={() => setShowHistoryModal(false)} 
                  className="bg-gray-100 p-2 rounded-full text-gray-500 active:scale-90 hover:bg-gray-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* FILTERS */}
              <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0 flex gap-2 overflow-x-auto hide-scrollbar relative z-20">
                <button 
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'all' ? 'bg-[#6B46C1] text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  All Activity
                </button>
                <button 
                  onClick={() => handleFilterChange('earned')}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'earned' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Earned
                </button>
                <button 
                  onClick={() => handleFilterChange('dropped')}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1.5 ${filterType === 'dropped' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  Dropped
                </button>
              </div>

              {/* LOG LIST */}
              <div className="p-4 overflow-y-auto flex-1 pb-10">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 pt-10">
                    <Loader2 className="w-8 h-8 text-[#6B46C1] animate-spin" />
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center pt-10">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Filter className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">No Records Found</h3>
                    <p className="text-[13px] text-gray-500">No aura changes match this filter.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {historyLogs.map((log) => (
                        <motion.div 
                          key={log.id} layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white rounded-2xl p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${log.type === 'positive' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                              {log.type === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-[14px]">
                                {log.reason}
                              </p>
                              <p className="text-[11.5px] text-gray-400 font-medium mt-0.5">
                                {log.date}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`font-bold text-[15px] ${log.type === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
                              {log.type === 'positive' ? '+' : '-'}{log.points}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {hasMore && (
                      <div className="flex justify-center pt-4 pb-2">
                        <button 
                          onClick={handleLoadMore} 
                          disabled={loadingMore}
                          className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-[13px] font-bold text-gray-700 active:scale-95 hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                          {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                          {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

    </div>
  );
};

export default AuraPage;