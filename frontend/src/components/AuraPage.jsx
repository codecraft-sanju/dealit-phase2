import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, TrendingUp, TrendingDown, Info, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AuraPage = ({ user }) => {
  const navigate = useNavigate();
  
  // DUMMY DATA FOR UI TESTING
  const dummyScore = user?.auraScore || 500;
  const dummyTier = user?.auraTier || 'Normal';
  
  const dummyLogs = [
    { id: 1, reason: "Successful Deal Completed", points: 50, type: "positive", date: "Today, 02:30 PM" },
    { id: 2, reason: "Received positive rating", points: 20, type: "positive", date: "Yesterday" },
    { id: 3, reason: "Cancelled deal after accepting", points: -50, type: "negative", date: "15 Apr 2026" },
    { id: 4, reason: "Signup Bonus", points: 500, type: "positive", date: "10 Apr 2026" },
    { id: 5, reason: "Successful Deal Completed", points: 50, type: "positive", date: "05 Apr 2026" },
    { id: 6, reason: "Received positive rating", points: 20, type: "positive", date: "02 Apr 2026" },
  ];

  const getProgressWidth = (score) => {
    const maxScore = 1000;
    return `${Math.min(Math.max((score / maxScore) * 100, 0), 100)}%`;
  };

  return (
    <div className="h-screen bg-[#F4F2F9] font-sans flex flex-col overflow-hidden selection:bg-[#6B46C1]/30">
      
      {/* Sleek Header */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-4 flex items-center justify-between shrink-0 z-20 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Aura Score</h1>
        </div>
        <div className="p-2 bg-[#6B46C1]/10 rounded-full">
          <Activity className="w-5 h-5 text-[#6B46C1]" />
        </div>
      </header>

      {/* Top Fixed Section - Compact Premium Card */}
      <div className="px-5 pt-5 pb-6 shrink-0 z-10">
        
        {/* The Purple Aesthetic Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="rounded-[2rem] p-6 shadow-[0_15px_40px_-10px_rgba(107,70,193,0.3)] bg-gradient-to-br from-[#6B46C1] via-[#805AD5] to-[#9F7AEA] border border-white/20 relative overflow-hidden"
        >
          {/* Subtle Glow Effects */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white opacity-20 rounded-full blur-[2.5rem] mix-blend-overlay"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black opacity-15 rounded-full blur-[2rem] mix-blend-overlay"></div>
          
          <div className="relative z-10">
            {/* Top Row: Icon & Badge */}
            <div className="flex justify-between items-start mb-5">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/30 flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                  {dummyTier} TIER
                </span>
              </div>
            </div>

            {/* Middle Row: Score */}
            <div className="flex flex-col">
              <p className="text-[11px] font-bold text-white/70 uppercase tracking-[0.15em] mb-0.5">Total Points</p>
              <h2 className="text-6xl font-black text-white tracking-tighter leading-none" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {dummyScore}
              </h2>
            </div>

            {/* Bottom Row: Progress */}
            <div className="mt-6">
              <div className="w-full bg-black/15 h-1.5 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: getProgressWidth(dummyScore) }}
                  transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                  className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">0 (Low)</span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">1000 (Max)</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Banner - Tucked neatly below the card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 bg-white rounded-2xl p-4 flex gap-3 items-start shadow-sm border border-gray-100"
        >
          <div className="bg-[#f8f6ff] p-2 rounded-xl shrink-0">
            <Info className="w-5 h-5 text-[#6B46C1]" />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium mt-0.5">
            Complete deals and earn ratings to boost your score. Cancellations or spam will lower it.
          </p>
        </motion.div>
      </div>

      {/* Scrollable Bottom Section (Activity Log) */}
      <div className="flex-1 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden z-20 border-t border-gray-100/50">
        
        {/* Sticky Header for List */}
        <div className="px-6 pt-6 pb-3 shrink-0 flex items-center justify-between border-b border-gray-50">
          <h3 className="font-bold text-gray-900 text-[1.1rem]">Activity Log</h3>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1.5 rounded-full">Recent</span>
        </div>

        {/* Scrollable List area */}
        <div className="flex-1 overflow-y-auto px-4 pb-10 admin-scroll">
          {dummyLogs.map((log, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              key={log.id} 
              className={`flex items-center justify-between py-4 px-2 group hover:bg-gray-50/50 transition-colors rounded-2xl ${index !== dummyLogs.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${log.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {log.type === 'positive' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[14px] font-bold text-gray-800 leading-tight">{log.reason}</p>
                  <p className="text-[11px] text-gray-400 font-semibold">{log.date}</p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end pr-2">
                <span className={`font-black text-[1.1rem] ${log.type === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {log.type === 'positive' ? '+' : ''}{log.points}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AuraPage;