import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Star, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// DUMMY DATA FOR LEADERBOARD (Mixed with 10+ users to test logic)
const dummyLeaderboard = [
  { id: 'u1', name: 'Alex Hunter', username: '@alex_h', score: 9850, tier: 'Aura God', rank: 1, trend: 'up', avatarColor: 'bg-amber-500' },
  { id: 'u2', name: 'Sarah Connor', username: '@sarah_c', score: 8420, tier: 'Legend', rank: 2, trend: 'same', avatarColor: 'bg-slate-500' },
  { id: 'u3', name: 'Jordan Lee', username: '@jordan_l', score: 7900, tier: 'Legend', rank: 3, trend: 'up', avatarColor: 'bg-amber-700' },
  { id: 'u4', name: 'Mia Wong', username: '@mia_w', score: 7150, tier: 'Elite', rank: 4, trend: 'down', avatarColor: 'bg-purple-500' },
  { id: 'u5', name: 'David Smith', username: '@david_s', score: 6800, tier: 'Elite', rank: 5, trend: 'same', avatarColor: 'bg-blue-500' },
  { id: 'u6', name: 'Emma Davis', username: '@emma_d', score: 6450, tier: 'Pro', rank: 6, trend: 'up', avatarColor: 'bg-pink-500' },
  { id: 'u7', name: 'Priya Patel', username: '@priya_p', score: 6100, tier: 'Pro', rank: 7, trend: 'same', avatarColor: 'bg-rose-500' },
  { id: 'u8', name: 'Rahul Sharma', username: '@rahul_s', score: 5200, tier: 'Trader', rank: 8, trend: 'down', avatarColor: 'bg-indigo-500' },
  { id: 'u9', name: 'Amit Kumar', username: '@amit_k', score: 4800, tier: 'Trader', rank: 9, trend: 'up', avatarColor: 'bg-teal-500' },
  { id: 'u10', name: 'Neha Gupta', username: '@neha_g', score: 4100, tier: 'Rising Star', rank: 10, trend: 'same', avatarColor: 'bg-orange-500' },
  // Your profile (Assuming rank is outside top 10 or inside, logic will handle)
  { id: 'u_me', name: 'Sanjay Choudhary', username: '@sanjay_c', score: 2850, tier: 'Starter', rank: 54, trend: 'up', avatarColor: 'bg-[#6B46C1]', isCurrentUser: true },
];

const AuraLeadershipPage = ({ user }) => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('all-time');
  const [isScrolled, setIsScrolled] = useState(false);

  // Profile Page Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // LOGIC: Explicitly show ONLY Top 10 + Current User
  // Sort data just in case, though it's already sorted by score
  const sortedData = [...dummyLeaderboard].sort((a, b) => b.score - a.score);
  
  // 1. Top 10 Users Only
  const top10Users = sortedData.slice(0, 10);
  
  // 2. Extract Top 3 for Podium and 4-10 for the List
  const top3 = top10Users.slice(0, 3);
  const restOfList = top10Users.slice(3, 10);
  
  // 3. Current User Data (Search in full data)
  const currentUserData = sortedData.find(u => u.isCurrentUser) || dummyLeaderboard.find(u => u.isCurrentUser);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const renderTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-gray-300" />;
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] pb-32 font-sans relative overflow-x-hidden selection:bg-[#6B46C1]/30">
      
      {/* 1. HEADER (Matches Profile Page perfectly) */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] transition-all duration-300 ease-in-out shadow-md ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-md mx-auto px-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 border border-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex flex-col justify-center">
              <h1 className={`font-bold tracking-wide leading-tight transition-all duration-300 flex items-center gap-2 ${
                isScrolled ? 'text-xl' : 'text-2xl'
              }`}>
                Leaderboard
              </h1>
              <p className={`text-purple-200 font-medium transition-all duration-300 overflow-hidden ${
                isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-sm mt-0.5'
              }`}>
                Top 10 Aura Holders
              </p>
            </div>
          </div>
          {/* Trophy Icon on right side */}
          <div className="bg-white/10 p-2.5 rounded-full border border-white/20">
            <Trophy className="w-5 h-5 text-[#FFF0C2]" />
          </div>
        </div>
      </header>

      {/* 2. BACKGROUND CURVE */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-52 rounded-b-[2rem] z-0"
      />

      {/* 3. MAIN CONTENT AREA */}
      <div className="max-w-md mx-auto px-5 pt-32 relative z-20">
        <AnimatePresence mode="wait">
          <motion.div 
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            
            {/* TABS - Tightly integrated over curve */}
            <motion.div variants={itemVariants} className="bg-black/15 backdrop-blur-sm p-1 rounded-full flex border border-white/20 mx-4 shadow-sm">
              {['weekly', 'monthly', 'all-time'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeframe(tab)}
                  className={`flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
                    timeframe === tab 
                      ? 'bg-white text-[#6B46C1] shadow-sm' 
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </motion.div>

            {/* PODIUM CARD (Top 3) */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 pt-8 flex items-end justify-center gap-1.5 relative overflow-hidden">
              
              {/* Rank 2 */}
              <div className="flex flex-col items-center w-1/3 pb-2 z-10">
                <div className="relative mb-2">
                  <div className={`w-14 h-14 ${top3[1].avatarColor} rounded-[1.2rem] flex items-center justify-center text-white font-bold text-xl border-[3px] border-gray-50 shadow-sm`}>
                    {top3[1].name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-slate-100 rounded-full p-1 border-2 border-white shadow-sm">
                    <Medal className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
                <p className="text-gray-900 text-[11px] font-bold truncate w-full text-center mt-1">{top3[1].username}</p>
                <p className="text-[#6B46C1] text-[10px] font-black">{top3[1].score}</p>
              </div>

              {/* Rank 1 */}
              <div className="flex flex-col items-center w-1/3 relative z-20 pb-6">
                <Crown className="w-8 h-8 text-[#EAB308] mb-1 drop-shadow-md" />
                <div className="relative mb-2">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-b from-[#FFF0C2] to-[#EAB308] p-1 shadow-md">
                    <div className={`w-full h-full ${top3[0].avatarColor} rounded-[1.3rem] flex items-center justify-center text-white font-black text-3xl border-2 border-white`}>
                      {top3[0].name.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#EAB308] text-white text-[10px] font-black px-3 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                    1st
                  </div>
                </div>
                <p className="text-gray-900 text-[12px] font-black truncate w-full text-center mt-2">{top3[0].username}</p>
                <p className="text-[#6B46C1] text-[12px] font-black flex items-center justify-center gap-1">
                  {top3[0].score} <Star className="w-3 h-3 fill-[#6B46C1]" />
                </p>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center w-1/3 pb-2 z-10">
                <div className="relative mb-2">
                  <div className={`w-14 h-14 ${top3[2].avatarColor} rounded-[1.2rem] flex items-center justify-center text-white font-bold text-xl border-[3px] border-gray-50 shadow-sm`}>
                    {top3[2].name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-2 -left-2 bg-amber-50 rounded-full p-1 border-2 border-white shadow-sm">
                    <Medal className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                </div>
                <p className="text-gray-900 text-[11px] font-bold truncate w-full text-center mt-1">{top3[2].username}</p>
                <p className="text-[#6B46C1] text-[10px] font-black">{top3[2].score}</p>
              </div>
            </motion.div>

            {/* LIST CARD (Ranks 4-10) */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col mb-4">
              {restOfList.map((player, index) => {
                // If current user is in Top 10, highlight them
                const isMe = player.isCurrentUser;
                return (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-4 ${index !== restOfList.length - 1 ? 'border-b border-gray-50' : ''} ${
                      isMe ? 'bg-[#F8F6FF]' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 text-center font-black text-sm ${isMe ? 'text-[#6B46C1]' : 'text-gray-400'}`}>
                        {player.rank}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${player.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
                          {player.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-bold text-gray-800">{player.name}</span>
                            {isMe && (
                              <span className="bg-[#EBE5F7] text-[#6B46C1] text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-500 font-medium mt-0.5">{player.tier}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[14px] font-black text-gray-900 tracking-tight">
                        {player.score}
                      </span>
                      {renderTrendIcon(player.trend)}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. CURRENT USER BOTTOM FOOTER (Shows your exact rank, even if it is 54) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-gray-100 pb-safe">
        <div className="max-w-md mx-auto p-4 pb-6">
          <div className="flex items-center justify-between bg-white border border-[#EBE5F7] p-3.5 rounded-2xl shadow-[0_4px_20px_rgba(107,70,193,0.08)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#6B46C1] rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md border border-[#5a3aa3]">
                {currentUserData.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Rank</p>
                <p className="text-[15px] font-black text-gray-900 tracking-tight flex items-baseline gap-1 mt-0.5">
                  #{currentUserData.rank} <span className="text-[11px] text-gray-400 font-medium font-sans">in {timeframe.replace('-', ' ')}</span>
                </p>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-0.5">
              <span className="text-[18px] font-black text-[#6B46C1] tracking-tight">
                {currentUserData.score}
              </span>
              <span className="text-[9px] font-bold text-[#EAB308] uppercase tracking-widest flex items-center gap-1 bg-[#FFF9E6] px-2 py-0.5 rounded-full border border-[#FFF0C2]">
                <Star className="w-2.5 h-2.5 fill-[#EAB308]" /> Aura
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AuraLeadershipPage;