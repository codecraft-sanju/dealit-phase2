import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, TrendingUp, TrendingDown, Info, Activity, Star, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Backend endpoint setup (Change if needed)
const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const AuraPage = ({ user }) => {
  const navigate = useNavigate();
  
  // 1. DUMMY FALLBACK DATA (Agar API fail ho ya loading ho)
  const fallbackLogs = [
    { id: 1, reason: "Successful Deal Completed", points: 50, type: "positive", date: "Today, 02:30 PM" },
    { id: 2, reason: "Received positive rating", points: 20, type: "positive", date: "Yesterday" },
    { id: 3, reason: "Cancelled deal after accepting", points: -50, type: "negative", date: "15 Apr 2026" },
    { id: 4, reason: "Signup Bonus", points: 500, type: "positive", date: "10 Apr 2026" },
    { id: 5, reason: "First Listing Bonus", points: 30, type: "positive", date: "01 Apr 2026" },
    { id: 6, reason: "Profile Completion", points: 20, type: "positive", date: "28 Mar 2026" },
  ];

  // 2. TANSTACK QUERY FOR AURA DATA
  const { data: auraData, isLoading } = useQuery({
    queryKey: ['aura-details'],
    queryFn: async () => {
      try {
        // Asli API call yaha hogi:
        // const res = await axios.get(`${API_URL}/users/aura`, { withCredentials: true });
        // return res.data.data;
        
        // Abhi ke liye API mock kar rahe hain 1 second delay ke sath (Skeleton dikhane ke liye)
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
          score: user?.aura_points || user?.auraScore || 785,
          tier: user?.role || 'Elite', // Testing ke liye Trusted/Elite rakha hai
          logs: fallbackLogs
        };
      } catch (error) {
        console.error("Failed to fetch aura data", error);
        return { score: 500, tier: 'Trusted', logs: fallbackLogs };
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });

  // Circular Progress Logic (Modified to be smaller)
  const maxScore = 1000;
  const radius = 85; // Reduced from 110
  const circumference = 2 * Math.PI * radius;
  // Calculate offset safely, defaulting to 0 if loading
  const safeScore = auraData?.score || 0;
  const strokeDashoffset = circumference - (Math.min(Math.max(safeScore, 0), maxScore) / maxScore) * circumference;

  // Framer Motion Variants
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
      
      {/* 0. MATCHING APP THEME BACKGROUND (Curved Purple Top) */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-[300px] rounded-b-[2.5rem] z-0 shadow-sm"
      />

      {/* 1. APP-STYLE HEADER */}
      <header className="px-5 py-4 flex items-center justify-between shrink-0 z-30 relative text-white">
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

      {/* 2. THE LIVING AURA CORE (Fixed Top Section - Compact Version) */}
      <div className="px-5 pt-1 pb-4 shrink-0 z-10 relative">
        
        {isLoading ? (
          /* SKELETON LOADER FOR CORE */
          <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 h-[240px] flex items-center justify-center animate-pulse">
             <div className="w-36 h-36 bg-gray-100 rounded-full"></div>
          </div>
        ) : (
          /* ACTUAL AURA CORE CARD */
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-[1.5rem] pt-5 pb-3 px-4 shadow-[0_10px_30px_-10px_rgba(107,70,193,0.15)] border border-gray-100 relative overflow-hidden flex flex-col items-center"
          >
            
            {/* Top Bar inside Card */}
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

            {/* Circular Progress Indicator - Compact */}
            <div className="relative w-[190px] h-[190px] flex items-center justify-center mt-1">
              
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
                
                {/* Background Track */}
                <circle 
                  cx="100" cy="100" r={radius} 
                  stroke="#F4F2F9" 
                  strokeWidth="12" 
                  fill="none" 
                />
                
                {/* Animated Score Ring */}
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

              {/* Center Data */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <h2 className="text-5xl font-black text-gray-900 tracking-tighter drop-shadow-sm leading-none">
                    {auraData?.score}
                  </h2>
                  <p className="text-[9px] font-bold text-[#A388E1] uppercase tracking-[0.25em] mt-1.5">Platform Aura</p>
                </motion.div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-1 flex items-center justify-center gap-1.5 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full"
            >
              <Zap className="w-3 h-3 text-[#EAB308]" />
              <p className="text-[8.5px] font-bold uppercase tracking-widest">Points refresh on every trade</p>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* 3. SCROLLABLE CONTENT (Activity Log) */}
      <div className="flex-1 flex flex-col overflow-hidden z-20">
        
        {/* List Header (Sticky) */}
        <div className="px-6 pt-1 pb-3 shrink-0 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg tracking-tight">Recent Activity</h3>
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#A388E1] animate-spin" />
          ) : (
            <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
          )}
        </div>

        {/* Scrollable List Area - Increased bottom padding for mobile safe area */}
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
              /* ACTUAL DATA LIST */
              <motion.div 
                key="data-list"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {auraData?.logs.map((log) => (
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
                        {log.type === 'positive' ? `+${log.points}` : log.points}
                      </span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Aura</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Global CSS for Custom Scrollbar */}
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