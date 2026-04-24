import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, TrendingUp, TrendingDown, Activity, Star, Zap, Loader2, CheckCircle2, AlertCircle, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const AuraPage = ({ user }) => {
  const navigate = useNavigate();
  
  // 1. DUMMY FALLBACK DATA 
  const fallbackLogs = [];

  // 2. TANSTACK QUERY FOR AURA DATA
  const { data: auraData, isLoading } = useQuery({
    queryKey: ['aura-details'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_URL}/users/aura`, { 
          withCredentials: true 
        });
        return res.data.data;
      } catch (error) {
        console.error("Failed to fetch aura data", error);
        return { 
          score: user?.aura_points || 0, 
          tier: 'Newbie', 
          logs: fallbackLogs 
        };
      }
    },
    staleTime: 1000 * 60 * 5 
  });

  const maxScore = 1000;
  const radius = 85; 
  const circumference = 2 * Math.PI * radius;
  const safeScore = auraData?.score || 0;
  const strokeDashoffset = circumference - (Math.min(Math.max(safeScore, 0), maxScore) / maxScore) * circumference;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: 'spring', stiffness: 300, damping: 24 } 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f2f9] font-sans flex flex-col overflow-hidden selection:bg-[#6B46C1]/30 text-gray-900 w-full max-w-md mx-auto">
      
      {/* 0. MATCHING APP THEME BACKGROUND - HEIGHT REDUCED TO 230px */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-[230px] rounded-b-[2.5rem] z-0 shadow-sm"
      />

      {/* 1. APP-STYLE HEADER - PADDING REDUCED */}
      <header className="px-5 py-3 flex items-center justify-between shrink-0 z-30 relative text-white">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 border border-white/10 backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight leading-tight">
              Aura Score
            </h1>
            <p className="text-[10px] font-medium text-purple-200 uppercase tracking-widest flex items-center gap-1">
              Trust Metrics
            </p>
          </div>
        </div>
        <div className="p-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
          <Activity className="w-4 h-4 text-purple-200 animate-pulse" />
        </div>
      </header>

      {/* 2. THE LIVING AURA CORE - COMPACTED */}
      <div className="px-5 pt-1 pb-4 shrink-0 z-10 relative">
        
        {isLoading ? (
          /* SKELETON LOADER FOR CORE - HEIGHT REDUCED */
          <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 h-[200px] flex items-center justify-center animate-pulse">
             <div className="w-28 h-28 bg-gray-100 rounded-full"></div>
          </div>
        ) : (
          /* ACTUAL AURA CORE CARD */
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-[1.5rem] pt-4 pb-3 px-4 shadow-[0_10px_30px_-10px_rgba(107,70,193,0.15)] border border-gray-100 relative overflow-hidden flex flex-col items-center"
          >
            
            <div className="w-full flex justify-between items-center absolute top-4 px-4 z-20">
              <div className="bg-[#F8F6FF] p-2 rounded-xl border border-[#EBE5F7]">
                <Shield className="w-4 h-4 text-[#6B46C1]" />
              </div>
              <div className="bg-[#FFF9E6] px-2.5 py-1 rounded-full border border-[#FFF0C2] flex items-center gap-1">
                <Star className="w-3 h-3 text-[#EAB308] fill-[#EAB308]" />
                <span className="text-[9px] font-bold text-[#EAB308] uppercase tracking-wider">
                  {auraData?.tier}
                </span>
              </div>
            </div>

            {/* Circular Progress Indicator - SIZE REDUCED to 140px */}
            <div className="relative w-[140px] h-[140px] flex items-center justify-center mt-2">
              
              <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="auraGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A388E1" /> 
                    <stop offset="100%" stopColor="#6B46C1" /> 
                  </linearGradient>
                  <filter id="glowLight" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                <circle 
                  cx="100" cy="100" r={radius} 
                  stroke="#F4F2F9" 
                  strokeWidth="12" 
                  fill="none" 
                />
                
                <motion.circle 
                  cx="100" cy="100" r={radius} 
                  stroke="url(#auraGradientLight)" 
                  strokeWidth="12" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeDashoffset }}
                  transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
                  filter="url(#glowLight)"
                />
              </svg>

              {/* Center Data - TEXT SIZE REDUCED */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <h2 className="text-4xl font-black text-gray-900 tracking-tighter drop-shadow-sm leading-none">
                    {auraData?.score}
                  </h2>
                  <p className="text-[8px] font-bold text-[#A388E1] uppercase tracking-[0.25em] mt-1.5">Platform Aura</p>
                </motion.div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-2 flex items-center justify-center gap-1.5 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full"
            >
              <Zap className="w-3 h-3 text-[#EAB308]" />
              <p className="text-[8.5px] font-bold uppercase tracking-widest">Points reflect on every trade</p>
            </motion.div>
          </motion.div>
        )}

        {/* MODIFICATION: Added Leaderboard Navigation Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={() => navigate('/aura-leadership')}
          className="w-full mt-4 bg-white shadow-sm border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between transition-all duration-300 active:scale-[0.98] hover:border-[#EBE5F7] hover:shadow-md"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FFF9E6] to-[#FFF0C2] rounded-xl flex items-center justify-center shadow-inner">
              <Trophy className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div className="text-left flex flex-col">
              <span className="font-bold text-gray-900 text-[14px] leading-tight">Aura Leaderboard</span>
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">See top ranks</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </motion.button>

      </div>

      {/* 3. SCROLLABLE CONTENT (Activity Log) */}
      <div className="flex-1 flex flex-col overflow-hidden z-20">
        
        <div className="px-6 pt-1 pb-3 shrink-0 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight">Recent Activity</h3>
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#A388E1] animate-spin" />
          ) : (
            <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-20 admin-scroll">
          <AnimatePresence mode="wait">
            {isLoading ? (
              /* SKELETON LOADER FOR LIST */
              <motion.div key="skeleton-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 animate-pulse shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-gray-100 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-3.5 bg-gray-100 rounded"></div>
                        <div className="w-20 h-2.5 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </motion.div>
            ) : (
              /* ACTUAL DATA LIST OR EMPTY STATE GUIDE */
              <motion.div 
                key="data-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {auraData?.logs?.length === 0 ? (
                  <motion.div 
                    variants={itemVariants}
                    className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col gap-5 mt-2"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#F5F0FF] rounded-full flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-[#6B46C1] fill-[#6B46C1]/20" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">No Activity Yet</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Your Aura journey starts here. Here is how you can build trust on Dealit.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                        <h5 className="flex items-center gap-2 font-bold text-emerald-700 text-sm mb-3">
                          <TrendingUp className="w-4 h-4" /> How to Earn Aura
                        </h5>
                        <ul className="space-y-2 text-xs font-medium text-emerald-700/80">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> Refer friends using your code (+20 Aura)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> Hit milestone referrals (+50 Aura)
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> Complete successful item deliveries (+50 Aura)
                          </li>
                        </ul>
                      </div>

                      <div className="bg-red-50/50 border border-red-100 rounded-xl p-4">
                        <h5 className="flex items-center gap-2 font-bold text-red-700 text-sm mb-3">
                          <TrendingDown className="w-4 h-4" /> What Drops Aura
                        </h5>
                        <ul className="space-y-2 text-xs font-medium text-red-700/80">
                          <li className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> Cancelling deals after accepting (-50 Aura)
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> Failing to fulfill shipped orders
                          </li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  auraData?.logs.map((log) => (
                    <motion.div 
                      variants={itemVariants}
                      key={log.id} 
                      className="flex items-center justify-between p-4 mb-3 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 hover:border-[#EBE5F7] hover:shadow-md transition-all duration-300 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${log.type === 'positive' ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                          {log.type === 'positive' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[13px] font-bold text-gray-800 tracking-tight leading-snug">{log.reason}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{log.date}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-0.5">
                        <span className={`text-[15px] font-black tracking-tight ${log.type === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {log.type === 'positive' ? `+${log.points}` : `-${log.points}`}
                        </span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Aura</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .admin-scroll::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
      `}</style>

    </div>
  );
};

export default AuraPage;