import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Star, TrendingUp, TrendingDown, Minus, Crown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const premiumEase = [0.16, 1, 0.3, 1];

const AuraLeadershipPage = ({ user }) => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('all-time');
  const [scrollY, setScrollY] = useState(0);

  const isScrolled = scrollY > 30;

  // 1. Fetch fresh Profile Data
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/users/profile`, { withCredentials: true });
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5 
  });

  // 2. Fetch Leaderboard Data with Pagination (Infinite Query)
  const { 
    data: infiniteData, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useInfiniteQuery({
    queryKey: ['aura-leaderboard', timeframe],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(`${API_URL}/users/leaderboard?timeframe=${timeframe}&page=${pageParam}&limit=20`, {
        withCredentials: true
      });
      return res.data.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    staleTime: 1000 * 60 * 5 
  });

  // 3. Flatten pages into a single raw list
  const allPages = infiniteData?.pages || [];
  const rawLeaderboardData = allPages.flatMap(page => page.leaderboard) || [];
  const currentUserDataFromAPI = allPages[0]?.currentUser || null;

  // 4. INDUSTRY APPROACH: Deduplicate arrays to prevent "Two children with the same key" React errors
  // AND inject the freshest profile picture
  const uniqueIds = new Set();
  const enrichedLeaderboard = [];

  rawLeaderboardData.forEach((player) => {
    // Only add the player if we haven't seen their ID yet
    if (!uniqueIds.has(player.id)) {
      uniqueIds.add(player.id);
      
      let finalPlayer = { ...player };
      if (finalPlayer.isCurrentUser && profileData?.profilePic) {
        finalPlayer.profilePic = profileData.profilePic;
        finalPlayer.name = profileData.full_name || finalPlayer.name;
      }
      enrichedLeaderboard.push(finalPlayer);
    }
  });

  const top3 = enrichedLeaderboard.slice(0, 3);
  const restOfList = enrichedLeaderboard.slice(3);
  
  // 5. Build Current User Footer Object
  const currentUserData = { 
    ...(currentUserDataFromAPI || {}),
    name: profileData?.full_name || currentUserDataFromAPI?.name || user?.full_name || 'User', 
    rank: currentUserDataFromAPI?.rank || '-', 
    score: profileData?.aura_points || currentUserDataFromAPI?.score || 0, 
    avatarColor: 'bg-[#6B46C1]',
    profilePic: profileData?.profilePic || user?.profilePic 
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase } }
  };

  const renderTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-gray-300" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f2f2f7] font-sans flex flex-col overflow-hidden selection:bg-[#6B46C1]/20">
      
      {/* ⚡ PREMIUM BACKGROUND */}
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
        <div className="flex items-center justify-between w-full max-w-md md:max-w-7xl px-5 md:px-8 text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              style={{ transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}
              className={`rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 ${
                isScrolled ? 'p-2' : 'p-2.5'
              }`}
            >
              <ArrowLeft className={`${isScrolled ? 'w-4 h-4' : 'w-5 h-5'} text-white transition-all`} />
            </button>
            <div className="flex flex-col justify-center">
              <h1 
                style={{ transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }}
                className={`font-bold tracking-wide flex items-center gap-2 ${isScrolled ? 'text-[17px]' : 'text-[22px]'}`}
              >
                Leaderboard
              </h1>
              <p 
                style={{ transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}
                className={`text-purple-200 font-medium overflow-hidden ${
                  isScrolled ? 'max-h-0 opacity-0 text-[0px] m-0 p-0' : 'max-h-10 opacity-100 text-[13px] mt-0.5'
                }`}
              >
                Top Aura Holders
              </p>
            </div>
          </div>
          <div className={`transition-all duration-300 ${isScrolled ? 'scale-90 opacity-0' : 'scale-100 opacity-100 bg-white/10 p-2.5 rounded-full border border-white/20'}`}>
            <Trophy className="w-5 h-5 text-[#FFF0C2]" />
          </div>
        </div>
      </header>

      {/* ⚡ SCROLLABLE CONTENT */}
      <div 
        className="flex-1 w-full overflow-y-auto z-10 hide-scrollbar relative"
        onScroll={(e) => setScrollY(e.target.scrollTop)}
      >
        <div className="max-w-md mx-auto md:max-w-xl w-full px-4 md:px-8 pt-[104px] pb-48 flex flex-col">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key="content"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-5"
            >
              
              {/* ⚡ TABS */}
              <motion.div variants={itemVariants} className="bg-black/15 backdrop-blur-md p-1 rounded-full flex border border-white/20 shadow-sm mx-1">
                {['weekly', 'monthly', 'all-time'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTimeframe(tab)}
                    className={`flex-1 py-2 text-[11.5px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 ${
                      timeframe === tab 
                        ? 'bg-white text-[#6B46C1] shadow-[0_2px_10px_rgba(0,0,0,0.1)]' 
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.replace('-', ' ')}
                  </button>
                ))}
              </motion.div>

              {isLoading ? (
                <motion.div variants={itemVariants} className="flex justify-center items-center py-32">
                   <Loader2 className="w-8 h-8 text-white animate-spin" />
                </motion.div>
              ) : top3.length > 0 ? (
                <>
                  {/* ⚡ PODIUM CARD (Top 3) */}
                  <motion.div variants={itemVariants} className="bg-gradient-to-b from-white to-gray-50/50 rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 p-5 pt-8 flex items-end justify-center gap-2 relative overflow-hidden">
                    
                    {/* Rank 2 */}
                    {top3[1] && (
                      <div className="flex flex-col items-center w-1/3 pb-2 z-10">
                        <div className="relative mb-2.5">
                          {top3[1].profilePic ? (
                            <img src={top3[1].profilePic} alt={top3[1].name} className="w-14 h-14 rounded-[16px] object-cover border border-gray-200/50 shadow-sm" />
                          ) : (
                            <div className={`w-14 h-14 ${top3[1].avatarColor || 'bg-slate-500'} rounded-[16px] flex items-center justify-center text-white font-bold text-xl shadow-sm border border-white/20`}>
                              {top3[1].name?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute -bottom-2.5 -right-2.5 bg-[#f8f9fa] rounded-full p-1.5 border-[2.5px] border-white shadow-sm">
                            <Medal className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </div>
                        <p className="text-gray-900 text-[12px] font-bold truncate w-full text-center tracking-tight">{top3[1].username}</p>
                        <p className="text-[#6B46C1] text-[11.5px] font-black mt-0.5">{top3[1].score}</p>
                      </div>
                    )}

                    {/* Rank 1 */}
                    {top3[0] && (
                      <div className="flex flex-col items-center w-1/3 relative z-20 pb-6">
                        <Crown className="w-7 h-7 text-[#EAB308] mb-1.5 drop-shadow-sm" />
                        <div className="relative mb-3">
                          <div className="w-[88px] h-[88px] rounded-[24px] bg-gradient-to-b from-[#FFF0C2] to-[#EAB308] p-[3px] shadow-[0_4px_15px_rgba(234,179,8,0.25)]">
                            {top3[0].profilePic ? (
                              <img src={top3[0].profilePic} alt={top3[0].name} className="w-full h-full rounded-[21px] object-cover border-2 border-white" />
                            ) : (
                              <div className={`w-full h-full ${top3[0].avatarColor || 'bg-amber-500'} rounded-[21px] flex items-center justify-center text-white font-black text-3xl border-2 border-white`}>
                                {top3[0].name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#F5C341] to-[#D97706] text-white text-[10px] font-black px-3.5 py-0.5 rounded-full border-2 border-white shadow-sm tracking-wider">
                            1ST
                          </div>
                        </div>
                        <p className="text-gray-900 text-[13.5px] font-black truncate w-full text-center tracking-tight mt-1">{top3[0].username}</p>
                        <p className="text-[#6B46C1] text-[13px] font-black flex items-center justify-center gap-1 mt-0.5">
                          {top3[0].score} <Star className="w-3 h-3 fill-[#6B46C1]" />
                        </p>
                      </div>
                    )}

                    {/* Rank 3 */}
                    {top3[2] && (
                      <div className="flex flex-col items-center w-1/3 pb-2 z-10">
                        <div className="relative mb-2.5">
                          {top3[2].profilePic ? (
                            <img src={top3[2].profilePic} alt={top3[2].name} className="w-14 h-14 rounded-[16px] object-cover border border-gray-200/50 shadow-sm" />
                          ) : (
                            <div className={`w-14 h-14 ${top3[2].avatarColor || 'bg-amber-700'} rounded-[16px] flex items-center justify-center text-white font-bold text-xl shadow-sm border border-white/20`}>
                              {top3[2].name?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute -bottom-2.5 -left-2.5 bg-[#FFF9E6] rounded-full p-1.5 border-[2.5px] border-white shadow-sm">
                            <Medal className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                        </div>
                        <p className="text-gray-900 text-[12px] font-bold truncate w-full text-center tracking-tight">{top3[2].username}</p>
                        <p className="text-[#6B46C1] text-[11.5px] font-black mt-0.5">{top3[2].score}</p>
                      </div>
                    )}
                  </motion.div>

                  {/* ⚡ LIST CARD (Ranks 4+) */}
                  {restOfList.length > 0 && (
                    <motion.div variants={itemVariants} className="bg-white rounded-[28px] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col">
                      {restOfList.map((player, index) => {
                        const isMe = player.isCurrentUser;
                        return (
                          <div 
                            key={player.id} 
                            className={`flex items-center justify-between px-5 py-4 ${index !== restOfList.length - 1 ? 'border-b border-gray-50' : ''} ${
                              isMe ? 'bg-[#f8f6ff]' : 'hover:bg-gray-50/50 transition-colors'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 text-center font-black text-[13px] ${isMe ? 'text-[#6B46C1]' : 'text-gray-400'}`}>
                                {player.rank}
                              </div>
                              
                              <div className="flex items-center gap-3.5">
                                {player.profilePic ? (
                                  <img src={player.profilePic} alt={player.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                                ) : (
                                  <div className={`w-10 h-10 ${player.avatarColor || 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white/20`}>
                                    {player.name?.charAt(0)}
                                  </div>
                                )}
                                
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[14.5px] font-bold text-gray-900 tracking-tight">{player.name}</span>
                                    {isMe && (
                                      <span className="bg-[#EBE5F7] text-[#6B46C1] text-[9.5px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11.5px] text-gray-500 font-medium mt-0.5 tracking-tight">{player.tier}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1">
                              <span className={`text-[15px] font-black tracking-tight ${isMe ? 'text-[#6B46C1]' : 'text-gray-900'}`}>
                                {player.score}
                              </span>
                              {renderTrendIcon(player.trend)}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Load More Button */}
                      {hasNextPage && (
                        <div className="flex justify-center p-4 bg-gray-50/50 border-t border-gray-50">
                          <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#6B46C1] font-bold rounded-full transition-colors flex items-center gap-2 text-[13px] active:scale-95 shadow-sm"
                          >
                            {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load More Users'}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              ) : (
                 <motion.div variants={itemVariants} className="bg-white rounded-[28px] p-8 text-center shadow-sm border border-gray-100 text-gray-500 font-medium">
                   No leaderboard data available for this timeframe.
                 </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ⚡ CURRENT USER FOOTER */}
      <div className="fixed left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] user-footer-position">
        <div className="max-w-md mx-auto md:max-w-xl px-4 py-3">
          <div className="flex items-center justify-between bg-white border border-[#EBE5F7] p-3.5 rounded-[20px] shadow-[0_2px_15px_rgba(107,70,193,0.06)]">
            <div className="flex items-center gap-3.5">
              {currentUserData.profilePic ? (
                <img src={currentUserData.profilePic} alt="You" className="w-12 h-12 rounded-[14px] object-cover shadow-sm border border-gray-100" />
              ) : (
                <div className={`w-12 h-12 ${currentUserData.avatarColor || 'bg-[#6B46C1]'} rounded-[14px] flex items-center justify-center text-white font-bold text-sm shadow-sm border border-white/20`}>
                  {currentUserData.name?.charAt(0) || 'U'}
                </div>
              )}
              
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Your Rank</p>
                <p className="text-[16px] font-black text-gray-900 tracking-tight flex items-baseline gap-1.5">
                  #{currentUserData.rank} <span className="text-[11px] text-gray-400 font-medium font-sans tracking-normal">in {timeframe.replace('-', ' ')}</span>
                </p>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-[18px] font-black text-[#6B46C1] tracking-tight leading-none">
                {currentUserData.score}
              </span>
              <span className="text-[9.5px] font-bold text-[#EAB308] uppercase tracking-widest flex items-center gap-1 bg-[#FFF9E6] px-2 py-0.5 rounded-full border border-[#FFF0C2]">
                <Star className="w-2.5 h-2.5 fill-[#EAB308]" /> Aura
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .user-footer-position {
          bottom: calc(4rem + env(safe-area-inset-bottom));
        }
        @media (min-width: 768px) {
          .user-footer-position {
            bottom: 0;
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        }
      `}</style>

    </div>
  );
};

export default AuraLeadershipPage;