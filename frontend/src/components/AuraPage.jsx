import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, TrendingUp, TrendingDown, Activity, Star, Zap, Loader2, CheckCircle2, AlertCircle, Trophy, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const getDynamicTier = (score) => {
  if (score >= 800) return 'Legend';
  if (score >= 500) return 'Elite';
  if (score >= 200) return 'Pro';
  return 'Newbie';
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

// ⚡ PREMIUM EASING (GSAP Expo.easeOut equivalent)
const premiumEase = [0.16, 1, 0.3, 1];

const AnimatedNumber = ({ value }) => {
  // ⚡ Tighter spring for that snappy number roll
  const spring = useSpring(value, { stiffness: 150, damping: 15, mass: 0.8 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const AuraPage = ({ user }) => {
  const navigate = useNavigate();
  
  const fallbackLogs = user?.recent_activity || [];

  const { data: auraData, isLoading } = useQuery({
    queryKey: ['aura-details'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_URL}/users/aura`, { 
          withCredentials: true 
        });
        
        return {
          ...res.data.data,
          tier: res.data.data.tier || getDynamicTier(res.data.data.score),
          rules: res.data.data.rules || defaultRules
        };
      } catch (error) {
        console.error("Failed to fetch aura data", error);
        const fallbackScore = user?.aura_points || 0;
        return { 
          score: fallbackScore, 
          tier: getDynamicTier(fallbackScore), 
          logs: fallbackLogs,
          rules: defaultRules 
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

  const [prevScore, setPrevScore] = useState(user?.aura_points || 0);
  
  const [floatData, setFloatData] = useState({ show: false, diff: 0, type: 'up', id: 0 });

  useEffect(() => {
    if (auraData?.score !== undefined) {
      if (auraData.score > prevScore) {
        setFloatData({ show: true, diff: auraData.score - prevScore, type: 'up', id: Date.now() });
        const timer = setTimeout(() => setFloatData(prev => ({ ...prev, show: false })), 2500);
        setPrevScore(auraData.score);
        return () => clearTimeout(timer);
      } else if (auraData.score < prevScore) {
        setFloatData({ show: true, diff: prevScore - auraData.score, type: 'down', id: Date.now() });
        const timer = setTimeout(() => setFloatData(prev => ({ ...prev, show: false })), 2500);
        setPrevScore(auraData.score);
        return () => clearTimeout(timer);
      }
    }
  }, [auraData?.score, prevScore]);

  // ⚡ AWWWARDS STYLE STAGGER & BLUR REVEALS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25, filter: "blur(8px)", scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: "blur(0px)", 
      scale: 1,
      transition: { duration: 0.6, ease: premiumEase } 
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f2f9] font-sans flex flex-col overflow-hidden selection:bg-[#6B46C1]/30 text-gray-900 w-full max-w-md mx-auto">
      
      {/* ⚡ PARALLAX HEADER BACKGROUND */}
      <motion.div 
        initial={{ y: -80, opacity: 0, scale: 1.05 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: premiumEase }}
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-[#5c37a6] to-[#6B46C1] h-[240px] rounded-b-[3rem] z-0 shadow-lg"
      />

      <header className="px-5 py-4 flex items-center justify-between shrink-0 z-30 relative text-white">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.2)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} 
            className="p-2.5 bg-white/10 rounded-full transition-colors border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: premiumEase }}
            className="flex flex-col"
          >
            <h1 className="text-xl font-black tracking-tight leading-tight">
              Aura Score
            </h1>
            <p className="text-[10px] font-bold text-purple-200 uppercase tracking-widest flex items-center gap-1">
              Trust Metrics
            </p>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="p-2.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-md relative"
        >
          {/* Outer glow pulse */}
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }}></span>
          <Activity className="w-4 h-4 text-white relative z-10" />
        </motion.div>
      </header>

      <div className="px-5 pt-1 pb-4 shrink-0 z-10 relative">
        
        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-4 shadow-sm border border-gray-100 h-[220px] flex items-center justify-center">
             <div className="w-28 h-28 bg-gray-200/50 rounded-full animate-pulse"></div>
          </div>
        ) : (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: premiumEase }}
            className="bg-white/90 backdrop-blur-2xl rounded-[2rem] pt-5 pb-4 px-4 shadow-[0_20px_40px_-15px_rgba(107,70,193,0.2)] border border-white relative overflow-hidden flex flex-col items-center"
          >
            
            <div className="w-full flex justify-between items-center absolute top-5 px-5 z-20">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="bg-[#F8F6FF] p-2.5 rounded-xl border border-[#EBE5F7] shadow-sm"
              >
                <Shield className="w-4 h-4 text-[#6B46C1]" />
              </motion.div>
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, ease: premiumEase }}
                className="bg-gradient-to-r from-[#FFF9E6] to-[#FFF0C2] px-3 py-1.5 rounded-full border border-[#FFE599] flex items-center gap-1.5 shadow-sm"
              >
                <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#F59E0B]" />
                <span className="text-[10px] font-black text-[#B45309] uppercase tracking-wider">
                  {auraData?.tier}
                </span>
              </motion.div>
            </div>

            <div className="relative w-[150px] h-[150px] flex items-center justify-center mt-3">
              
              <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="auraGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" /> 
                    <stop offset="100%" stopColor="#6B46C1" /> 
                  </linearGradient>
                  <filter id="premiumGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Track */}
                <circle 
                  cx="100" cy="100" r={radius} 
                  stroke="#F3F0F8" 
                  strokeWidth="14" 
                  fill="none" 
                />
                
                {/* Progress */}
                <motion.circle 
                  cx="100" cy="100" r={radius} 
                  stroke="url(#auraGradientLight)" 
                  strokeWidth="14" 
                  fill="none" 
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: strokeDashoffset }}
                  transition={{ duration: 1.8, ease: premiumEase, delay: 0.3 }}
                  filter="url(#premiumGlow)"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                
                {/* ⚡ ULTRA-PREMIUM GSAP-STYLE FLOAT & SHOCKWAVE ⚡ */}
                <AnimatePresence>
                  {floatData.show && (
                    <motion.div
                      key={floatData.id}
                      initial={{ opacity: 0, y: 10, scale: 0.4, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: -75, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -120, scale: 0.8, filter: "blur(12px)" }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 18, 
                        mass: 0.6 
                      }}
                      className="absolute z-50 flex items-center justify-center pointer-events-none"
                    >
                      {/* Shockwave Ring */}
                      <motion.div
                        initial={{ scale: 0.5, opacity: 1, borderWidth: "4px" }}
                        animate={{ scale: 2.5, opacity: 0, borderWidth: "0px" }}
                        transition={{ duration: 1, ease: premiumEase }}
                        className={`absolute inset-0 rounded-full border-solid ${floatData.type === 'up' ? 'border-emerald-400' : 'border-red-400'}`}
                      />
                      
                      {/* Glass Pill */}
                      <div className={`relative px-4 py-2 rounded-full backdrop-blur-xl border shadow-[0_15px_35px_rgba(0,0,0,0.2)] flex items-center justify-center gap-1.5
                        ${floatData.type === 'up' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-400/50' : 'bg-red-500/20 text-red-600 border-red-400/50'}`}
                      >
                        <Zap className={`w-4 h-4 ${floatData.type === 'up' ? 'fill-emerald-500 text-emerald-500' : 'fill-red-500 text-red-500'}`} />
                        <span className="font-black text-2xl tracking-tighter drop-shadow-sm">
                          {floatData.type === 'up' ? '+' : '-'}{floatData.diff}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5, filter: "blur(5px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: 0.5, duration: 0.6, ease: premiumEase }}
                  className="flex flex-col items-center relative z-40 mt-1"
                >
                  <h2 className="text-[2.75rem] font-black text-gray-900 tracking-tighter drop-shadow-sm leading-none">
                    <AnimatedNumber value={safeScore} />
                  </h2>
                  <p className="text-[9px] font-bold text-[#A388E1] uppercase tracking-[0.25em] mt-1.5">Platform Aura</p>
                </motion.div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-4 flex items-center justify-center gap-1.5 text-gray-500 bg-gray-50/80 px-4 py-2 rounded-full border border-gray-100"
            >
              <Zap className="w-3.5 h-3.5 text-[#EAB308] fill-[#EAB308]/20" />
              <p className="text-[9px] font-bold uppercase tracking-widest">Points reflect on every trade</p>
            </motion.div>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.7, duration: 0.6, ease: premiumEase }}
          whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/aura-leadership')}
          className="w-full mt-4 bg-white shadow-sm border border-gray-100 rounded-2xl p-4 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-[#FFF9E6] to-[#FFF0C2] rounded-[1rem] flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-300">
              <Trophy className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div className="text-left flex flex-col">
              <span className="font-black text-gray-900 text-[15px] tracking-tight leading-tight">Aura Leaderboard</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 group-hover:text-[#A388E1] transition-colors">See top ranks</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#F5F0FF] transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#6B46C1] group-hover:translate-x-0.5 transition-all" />
          </div>
        </motion.button>

      </div>

      <div className="flex-1 flex flex-col overflow-hidden z-20">
        
        <div className="px-6 pt-2 pb-4 shrink-0 flex items-center justify-between">
          <h3 className="font-black text-gray-900 text-lg tracking-tight">Recent Activity</h3>
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#A388E1] animate-spin" />
          ) : (
            <div className="h-1.5 w-10 bg-gray-200 rounded-full"></div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-20 admin-scroll">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-[1.25rem] border border-gray-100 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200/60 rounded-xl"></div>
                      <div className="space-y-2">
                        <div className="w-32 h-3.5 bg-gray-200/60 rounded-md"></div>
                        <div className="w-20 h-2.5 bg-gray-200/60 rounded-md"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="data-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {auraData?.logs?.length === 0 ? (
                  <motion.div 
                    variants={itemVariants}
                    className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col gap-6 mt-2"
                  >
                    <div className="text-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#F5F0FF] to-[#EBE5F7] rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <Star className="w-7 h-7 text-[#6B46C1] fill-[#6B46C1]/20" />
                      </div>
                      <h4 className="font-black text-gray-900 text-xl tracking-tight">No Activity Yet</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1.5 leading-relaxed px-4">
                        Your Aura journey starts here. Build trust on Dealit by following these rules.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 border border-emerald-100 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <TrendingUp className="w-16 h-16 text-emerald-500" />
                        </div>
                        <h5 className="flex items-center gap-2 font-black text-emerald-800 text-sm mb-4 relative z-10">
                          <TrendingUp className="w-4 h-4 text-emerald-600" /> How to Earn Aura
                        </h5>
                        <ul className="space-y-3 text-xs font-bold text-emerald-700/80 relative z-10">
                          {auraData?.rules?.earn.map((rule) => (
                            <li key={rule.id} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" /> 
                              <span className="leading-tight">{rule.text} <span className="text-emerald-600">(+{rule.points})</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-red-50/50 to-red-100/30 border border-red-100 rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <TrendingDown className="w-16 h-16 text-red-500" />
                        </div>
                        <h5 className="flex items-center gap-2 font-black text-red-800 text-sm mb-4 relative z-10">
                          <TrendingDown className="w-4 h-4 text-red-600" /> What Drops Aura
                        </h5>
                        <ul className="space-y-3 text-xs font-bold text-red-700/80 relative z-10">
                          {auraData?.rules?.drop.map((rule) => (
                            <li key={rule.id} className="flex items-start gap-2.5">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" /> 
                              <span className="leading-tight">{rule.text} <span className="text-red-600">(-{rule.points})</span></span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  auraData?.logs.map((log) => (
                    <motion.div 
                      layout // ⚡ layout prop gives fluid snap when list changes
                      variants={itemVariants}
                      key={log.id} 
                      whileHover={{ scale: 1.01, backgroundColor: "#ffffff" }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-[1.25rem] shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 hover:border-[#EBE5F7] hover:shadow-[0_8px_25px_rgba(107,70,193,0.08)] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center transition-transform group-hover:scale-110 ${log.type === 'positive' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 text-emerald-600' : 'bg-gradient-to-br from-red-50 to-red-100 border border-red-200 text-red-600'}`}>
                          {log.type === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-[14px] font-black text-gray-800 tracking-tight leading-none">{log.reason}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.date}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1 bg-gray-50/50 px-3 py-2 rounded-xl group-hover:bg-white transition-colors">
                        <span className={`text-[16px] font-black tracking-tighter leading-none ${log.type === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {log.type === 'positive' ? `+${log.points}` : `-${log.points}`}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Aura</span>
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