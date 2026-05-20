import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Sparkles, Clock, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const OffersPage = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8f7fc] relative overflow-hidden font-sans pb-20">
      
      {/* Animated Background Orbs for Glossy Feel */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-40 -left-20 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-[90px] opacity-40 z-0"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-60 -right-20 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[90px] opacity-40 z-0"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          y: [0, -50, 0]
        }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/4 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-[90px] opacity-40 z-0"
      />

      {/* Original Header Restored */}
      <header className="bg-[#6B46C1] pt-6 pb-20 px-5 text-white relative shadow-md z-10">
        <div className="max-w-md mx-auto md:max-w-7xl flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Play & Earn</h1>
            <p className="text-purple-200 text-xs mt-1">Complete events for free credits</p>
          </div>
        </div>
      </header>

      {/* Main Content Area Overlapping Header */}
      <div className="relative z-20 flex flex-col items-center justify-center px-5 max-w-md mx-auto md:max-w-7xl -mt-12">
        
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full relative group mt-4"
        >
          {/* Glossy Glassmorphism Card */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/30 backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_40px_0_rgba(107,70,193,0.12)] border border-white/60 -z-10" />
          
          <div className="p-8 md:p-10 flex flex-col items-center text-center overflow-hidden rounded-[3rem]">
            
            {/* Multi-layered Glowing Icon */}
            <div className="relative mb-10 mt-4">
              {/* Back Glow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 rounded-full blur-2xl opacity-30 scale-125"
              />
              
              {/* Floating Center Icon */}
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-32 h-32 bg-gradient-to-br from-white to-purple-50 rounded-[2.5rem] p-[2px] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
              >
                <div className="w-full h-full bg-white/90 backdrop-blur-md rounded-[2.4rem] flex items-center justify-center border border-white">
                  <Gift className="w-14 h-14 text-[#6B46C1] drop-shadow-md" />
                </div>
              </motion.div>
              
              {/* Floating Accents */}
              <motion.div 
                animate={{ y: [-5, 5, -5], x: [-2, 2, -2] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-6 bg-gradient-to-tr from-amber-400 to-orange-400 p-3 rounded-2xl shadow-xl border border-white/80 backdrop-blur-sm"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div 
                animate={{ y: [5, -5, 5], x: [2, -2, 2] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-6 bg-gradient-to-bl from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-xl border border-white/80 backdrop-blur-sm"
              >
                <Lock className="w-6 h-6 text-white" />
              </motion.div>
            </div>

            {/* Typography */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-100/60 backdrop-blur-sm border border-purple-200/60 mb-5 shadow-inner">
                <Clock className="w-4 h-4 text-[#6B46C1]" />
                <span className="text-xs font-bold tracking-widest text-[#6B46C1] uppercase">Coming Soon</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 leading-tight">
                Premium Offers <br/> Are Loading
              </h2>
              
              <p className="text-gray-500 font-medium leading-relaxed mb-10 px-4 max-w-sm">
                Admin is crafting exclusive rewards, massive drops, and new ways to earn. Get ready to level up your experience.
              </p>
            </motion.div>

            {/* Animated Glossy Button */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(-1)}
              className="w-full relative group overflow-hidden rounded-[1.5rem] p-[2px] max-w-sm"
            >
              <motion.div 
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 bg-[length:200%_200%]" 
              />
              <div className="relative bg-[#6B46C1]/90 backdrop-blur-xl px-6 py-4 rounded-[1.4rem] flex items-center justify-center gap-2 border border-white/20">
                <ArrowLeft className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-[15px] tracking-wide">Return to Dashboard</span>
              </div>
            </motion.button>

          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default OffersPage;