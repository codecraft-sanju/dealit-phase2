import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Star, TrendingUp, TrendingDown, Minus, Crown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const AuraLeadershipPage = ({ user }) => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('all-time');
  const [isScrolled, setIsScrolled] = useState(false);

  // Profile Page Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Fetch fresh Profile Data (shares cache instantly with ProfilePage)
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5 
  });

  // 2. Fetch Leaderboard Data
  const { data: leaderboardData = [], isLoading } = useQuery({
    queryKey: ['aura-leaderboard', timeframe],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/users/leaderboard?timeframe=${timeframe}`, {
        withCredentials: true
      });
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5 
  });

  // 3. Inject the freshest profile picture into the leaderboard if the current user is in it
  const enrichedLeaderboard = leaderboardData.map(player => {
    if (player.isCurrentUser && profileData?.profilePic) {
      return { ...player, profilePic: profileData.profilePic, name: profileData.full_name || player.name };
    }
    return player;
  });

  const sortedData = [...enrichedLeaderboard].sort((a, b) => b.score - a.score);
  const top10Users = sortedData.slice(0, 10);
  const top3 = top10Users.slice(0, 3);
  const restOfList = top10Users.slice(3, 10);
  
  // 4. Use the freshest profile data for the bottom footer
  const currentUserData = sortedData.find(u => u.isCurrentUser) || { 
    name: profileData?.full_name || user?.full_name || 'User', 
    rank: '-', 
    score: profileData?.aura_points || 0, 
    avatarColor: 'bg-[#6B46C1]',
    profilePic: profileData?.profilePic || user?.profilePic 
  };

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
    <div className="min-h-screen bg-[#f4f2f9] font-sans relative overflow-x-hidden selection:bg-[#6B46C1]/30">
      
      {/* 1. HEADER */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 bg-[#6B46C1] transition-all duration-300 ease-in-out shadow-md ${
          isScrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-md mx-auto px-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95 border border-white/20"
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
        className="absolute top-0 left-0 right-0 bg-[#6B46C1] h-[260px] rounded-b-[2.5rem] z-0"
      />

      {/* 3. MAIN CONTENT AREA (pt-28 prevents header overlap, pb-48 leaves room for both footers) */}
      <div className="max-w-md mx-auto px-4 pt-28 pb-48 relative z-20">
        <AnimatePresence mode="wait">
          <motion.div 
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            
            {/* TABS */}
            <motion.div variants={itemVariants} className="bg-black/15 backdrop-blur-sm p-1 rounded-full flex border border-white/20 shadow-sm mx-2">
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

            {isLoading ? (
              <motion.div variants={itemVariants} className="flex justify-center items-center py-20">
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
              </motion.div>
            ) : top3.length > 0 ? (
              <>
                {/* PODIUM CARD (Top 3) */}
                <motion.div variants={itemVariants} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 pt-8 flex items-end justify-center gap-1.5 relative overflow-hidden">
                  
                  {/* Rank 2 */}
                  {top3[1] && (
                    <div className="flex flex-col items-center w-1/3 pb-2 z-10">
                      <div className="relative mb-2">
                        {top3[1].profilePic ? (
                          <img src={top3[1].profilePic} alt={top3[1].name} className="w-14 h-14 rounded-[1.2rem] object-cover border-[3px] border-gray-50 shadow-sm" />
                        ) : (
                          <div className={`w-14 h-14 ${top3[1].avatarColor || 'bg-slate-500'} rounded-[1.2rem] flex items-center justify-center text-white font-bold text-xl border-[3px] border-gray-50 shadow-sm`}>
                            {top3[1].name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-slate-100 rounded-full p-1 border-2 border-white shadow-sm">
                          <Medal className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>
                      <p className="text-gray-900 text-[11px] font-bold truncate w-full text-center mt-1">{top3[1].username}</p>
                      <p className="text-[#6B46C1] text-[10px] font-black">{top3[1].score}</p>
                    </div>
                  )}

                  {/* Rank 1 */}
                  {top3[0] && (
                    <div className="flex flex-col items-center w-1/3 relative z-20 pb-6">
                      <Crown className="w-8 h-8 text-[#EAB308] mb-1 drop-shadow-md" />
                      <div className="relative mb-2">
                        <div className="w-[84px] h-[84px] rounded-[1.5rem] bg-gradient-to-b from-[#FFF0C2] to-[#EAB308] p-1 shadow-md">
                          {top3[0].profilePic ? (
                            <img src={top3[0].profilePic} alt={top3[0].name} className="w-full h-full rounded-[1.3rem] object-cover border-2 border-white" />
                          ) : (
                            <div className={`w-full h-full ${top3[0].avatarColor || 'bg-amber-500'} rounded-[1.3rem] flex items-center justify-center text-white font-black text-3xl border-2 border-white`}>
                              {top3[0].name?.charAt(0)}
                            </div>
                          )}
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
                  )}

                  {/* Rank 3 */}
                  {top3[2] && (
                    <div className="flex flex-col items-center w-1/3 pb-2 z-10">
                      <div className="relative mb-2">
                        {top3[2].profilePic ? (
                          <img src={top3[2].profilePic} alt={top3[2].name} className="w-14 h-14 rounded-[1.2rem] object-cover border-[3px] border-gray-50 shadow-sm" />
                        ) : (
                          <div className={`w-14 h-14 ${top3[2].avatarColor || 'bg-amber-700'} rounded-[1.2rem] flex items-center justify-center text-white font-bold text-xl border-[3px] border-gray-50 shadow-sm`}>
                            {top3[2].name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-2 -left-2 bg-amber-50 rounded-full p-1 border-2 border-white shadow-sm">
                          <Medal className="w-3.5 h-3.5 text-amber-700" />
                        </div>
                      </div>
                      <p className="text-gray-900 text-[11px] font-bold truncate w-full text-center mt-1">{top3[2].username}</p>
                      <p className="text-[#6B46C1] text-[10px] font-black">{top3[2].score}</p>
                    </div>
                  )}
                </motion.div>

                {/* LIST CARD (Ranks 4-10) */}
                {restOfList.length > 0 && (
                  <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {restOfList.map((player, index) => {
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
                              {player.profilePic ? (
                                <img src={player.profilePic} alt={player.name} className="w-10 h-10 rounded-full object-cover shadow-inner" />
                              ) : (
                                <div className={`w-10 h-10 ${player.avatarColor || 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
                                  {player.name?.charAt(0)}
                                </div>
                              )}
                              
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
                )}
              </>
            ) : (
               <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 text-gray-500 font-medium">
                 No leaderboard data available for this timeframe.
               </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4. CURRENT USER FOOTER (Sits ABOVE the global BottomNav) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-gray-200 px-4 py-3 shadow-[0_-5px_15px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between bg-white border border-[#EBE5F7] p-3 rounded-2xl shadow-[0_2px_12px_rgba(107,70,193,0.06)]">
            <div className="flex items-center gap-3">
              {currentUserData.profilePic ? (
                <img src={currentUserData.profilePic} alt="You" className="w-11 h-11 rounded-xl object-cover shadow-sm border border-[#5a3aa3]" />
              ) : (
                <div className={`w-11 h-11 ${currentUserData.avatarColor || 'bg-[#6B46C1]'} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm border border-[#5a3aa3]`}>
                  {currentUserData.name?.charAt(0) || 'U'}
                </div>
              )}
              
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