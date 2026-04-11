import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Bell, 
  Zap, 
  RefreshCw, 
  Coins, 
  Sparkles,
  Fingerprint
} from 'lucide-react';

const NotificationsPage = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = () => {
    setIsSubscribed(true);
  };

  return (
    <div className="min-h-screen bg-[#f4f2f9] font-sans relative overflow-hidden flex flex-col">
      
      {/* 1. STANDARD HEADER (As requested) */}
      <header className="sticky top-0 z-50 bg-[#6B46C1] shadow-md py-4">
        <div className="max-w-md mx-auto md:max-w-7xl px-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-wide flex items-center gap-2">
                Notifications
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* 2. ADVANCED ANIMATED BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] bg-[#6B46C1]/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[30%] left-[20%] w-[250px] h-[250px] bg-[#FFE28A]/30 rounded-full blur-[80px]"
        />
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center pt-10 pb-20 px-5 relative z-10 max-w-md mx-auto w-full">
        
        {/* 3D Floating Notification Stack */}
        <div className="relative w-full h-[280px] flex items-center justify-center perspective-1000 mb-8 mt-4">
          
          {/* Background Pulse */}
          <motion.div 
            animate={{ scale: [0.8, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute w-32 h-32 border-2 border-[#A388E1] rounded-full"
          />

          {/* Card 3 (Back) */}
          <motion.div 
            animate={{ y: [-8, 8, -8], rotateZ: -12, rotateX: 10 }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute top-10 left-4 w-64 bg-white/40 backdrop-blur-sm border border-white/40 p-3 rounded-2xl shadow-lg opacity-60 pointer-events-none"
          >
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Coins className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="w-24 h-2.5 bg-gray-300/50 rounded-full mb-2"></div>
                <div className="w-32 h-2 bg-gray-200/50 rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Card 2 (Middle) */}
          <motion.div 
            animate={{ y: [8, -8, 8], rotateZ: 8, rotateX: 10 }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            className="absolute top-20 right-4 w-64 bg-white/60 backdrop-blur-md border border-white/60 p-3 rounded-2xl shadow-xl opacity-80 pointer-events-none"
          >
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="w-28 h-2.5 bg-gray-400/50 rounded-full mb-2"></div>
                <div className="w-40 h-2 bg-gray-300/50 rounded-full"></div>
              </div>
            </div>
          </motion.div>

          {/* Card 1 (Front - Focused) */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute z-20 w-72 bg-white/90 backdrop-blur-xl border border-white p-4 rounded-3xl shadow-[0_20px_40px_rgba(107,70,193,0.15)]"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A388E1] to-[#6B46C1] flex items-center justify-center shadow-inner">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-bold text-[#6B46C1] bg-[#EBE5F7] px-2 py-1 rounded-md tracking-wider">COMING SOON</span>
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">Smart Notification Engine</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Real-time updates for your swaps, instant credit drops, and exclusive deals. We are building the radar.
            </p>
          </motion.div>

        </div>

        {/* Text Area */}
        <div className="text-center mt-6 mb-8 w-full">
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
            Stay in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6B46C1] to-[#A388E1]">Loop</span>
          </h2>
          
          {/* Premium Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="bg-white border border-gray-100 shadow-sm text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Instant Swaps
            </span>
            <span className="bg-white border border-gray-100 shadow-sm text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-500" /> Credit Alerts
            </span>
            <span className="bg-white border border-gray-100 shadow-sm text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" /> Flash Deals
            </span>
          </div>
        </div>

        {/* Interactive Action Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {!isSubscribed ? (
              <motion.button
                key="btn"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubscribe}
                className="w-full bg-gray-900 text-white font-bold text-base py-4 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Fingerprint className="w-5 h-5 relative z-10 text-[#A388E1]" />
                <span className="relative z-10">Notify Me On Launch</span>
              </motion.button>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-[#EBE5F7] border border-[#6B46C1]/20 text-[#6B46C1] p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-inner"
              >
                <motion.div
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Sparkles className="w-8 h-8 text-[#A388E1]" />
                </motion.div>
                <p className="font-extrabold text-sm">You're on the list!</p>
                <p className="text-xs font-medium text-gray-500 opacity-80">We'll ping you when the engine starts.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

    </div>
  );
};

export default NotificationsPage;