import React from 'react';
import { motion } from 'framer-motion';
import { 
  RefreshCw, Coins, Zap, Shield, ArrowRight, Package, 
  Star, Lock, Camera, Headphones, CheckCircle, Activity, 
  Globe, ChevronRight, Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- MODIFICATION START: Imported FaultyTerminal ---
import FaultyTerminal from './FaultyTerminal';
// --- MODIFICATION END ---

const DesktopLandingPage = ({ user }) => {
  const navigate = useNavigate();

  // Admin Portal Access Logic
  const handleAdminClick = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin');
    } else {
      toast.error('Restricted Area: Top-Level Clearance Required.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  };

  // Advanced Cinematic Animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const floatAnimation1 = {
    y: [-15, 15, -15],
    rotate: [-4, 4, -4],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  };

  const floatAnimation2 = {
    y: [15, -15, 15],
    rotate: [4, -4, 4],
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }
  };

  const floatAnimation3 = {
    y: [-10, 10, -10],
    scale: [0.98, 1.02, 0.98],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-[#A388E1] selection:text-white">
      
      {/* 1. Ultra-Premium Background (Grid + Meshes) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Animated Cyber Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Deep Glowing Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-[#6B46C1]/20 to-[#4c1d95]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-gradient-to-tl from-[#FFE28A]/10 to-transparent rounded-full blur-[150px]"></div>
        <div className="absolute top-[20%] left-[50%] w-[40vw] h-[40vw] bg-[#A388E1]/15 rounded-full blur-[130px] -translate-x-1/2"></div>
      </div>

      {/* 2. Sleek Glass Navbar */}
      <nav className="relative z-50 flex justify-between items-center px-8 lg:px-12 py-6 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-br from-[#A388E1] to-[#6B46C1] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(107,70,193,0.4)] border border-white/20 group-hover:scale-105 transition-transform duration-300">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tighter text-white">Dealit<span className="text-[#FFE28A]">.</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 bg-white/5 border border-white/10 px-8 py-3.5 rounded-full backdrop-blur-xl shadow-2xl">
          <a href="#platform" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Platform</a>
          <a href="#ecosystem" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Ecosystem</a>
          <a href="#security" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Security</a>
        </div>
        
        <div className="flex items-center gap-5">
          {/* High-Class Admin Button */}
          <button 
            onClick={handleAdminClick}
            className="group relative flex items-center gap-2 bg-[#111] border border-gray-700 hover:border-[#A388E1] px-6 py-3 rounded-full transition-all shadow-[0_0_0_1px_rgba(255,255,255,0.05)] hover:shadow-[0_0_25px_rgba(163,136,225,0.4)] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
            <Lock className="w-4 h-4 text-[#FFE28A] group-hover:scale-110 transition-transform" />
            <span className="text-sm font-extrabold tracking-wider text-white relative z-10">ADMIN</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* 3. Next-Gen Hero Section */}
        <section className="min-h-[85vh] max-w-[1440px] mx-auto px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-10 lg:py-20">
          
          {/* Left: Typography & CTAs */}
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-start text-left relative z-20">
            
            {/* Trust Badge */}
            <motion.div variants={fadeInUp} className="mb-8 flex items-center gap-3 bg-[#1a1a24]/80 border border-[#A388E1]/30 px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <span className="text-xs text-gray-200 font-bold uppercase tracking-widest">Platform Live in India</span>
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-[6rem] font-black tracking-tighter mb-6 leading-[1.05] drop-shadow-2xl">
              Trade Value.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#A388E1] via-[#d8caff] to-[#FFE28A]">Not Cash.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg lg:text-xl text-gray-400 max-w-xl mb-10 font-medium leading-relaxed">
              The world's most advanced decentralized bartering engine. Liquidate unused assets into Dealit Credits, or swap directly with verified users globally.
            </motion.p>
            
            {/* High-End App Download Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-5">
              {/* App Store Button */}
              <a href="#" className="flex items-center gap-3 bg-[#0a0a0a] backdrop-blur-xl border border-gray-800 hover:border-gray-600 px-7 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.8)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg viewBox="0 0 384 512" className="w-8 h-8 text-white relative z-10" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                <div className="text-left relative z-10">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-0.5">Download on the</div>
                  <div className="text-xl font-black leading-none text-white tracking-tight">App Store</div>
                </div>
              </a>

              {/* Google Play Button */}
              <a href="#" className="flex items-center gap-3 bg-[#0a0a0a] backdrop-blur-xl border border-gray-800 hover:border-gray-600 px-7 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.8)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <svg viewBox="0 0 512 512" className="w-8 h-8 text-white relative z-10" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                <div className="text-left relative z-10">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-0.5">Get it on</div>
                  <div className="text-xl font-black leading-none text-white tracking-tight">Google Play</div>
                </div>
              </a>
            </motion.div>
            
            {/* Social Proof */}
            <motion.div variants={fadeInUp} className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-3.5 h-3.5 text-[#FFE28A] fill-[#FFE28A]" />)}
                </div>
                <span className="text-xs text-gray-400 font-bold mt-1">4.9/5 from 10,000+ Reviews</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Holographic 3D Composition */}
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="relative h-[600px] hidden lg:flex items-center justify-center pointer-events-none">
            
            {/* Outer Rotating Dash Ring */}
            <motion.div 
              animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-white/20 z-0"
            />
            
            {/* --- MODIFICATION START: Replaced static glowing ring with FaultyTerminal --- */}
            <div className="absolute w-[350px] h-[350px] rounded-full overflow-hidden border border-[#A388E1]/30 shadow-[0_0_80px_rgba(163,136,225,0.4)] z-0 pointer-events-auto">
              <FaultyTerminal
                scale={1.5}
                gridMul={[2, 1]}
                digitSize={1.2}
                timeScale={0.5}
                pause={false}
                scanlineIntensity={0.5}
                glitchAmount={1}
                flickerAmount={1}
                noiseAmp={1}
                chromaticAberration={0}
                dither={0}
                curvature={0.3}
                tint="#A388E1"
                mouseReact={true}
                mouseStrength={0.5}
                pageLoadAnimation={true}
                brightness={0.8}
              />
            </div>
            {/* --- MODIFICATION END --- */}

            {/* Asset 1 */}
            <motion.div animate={floatAnimation1} className="absolute top-[5%] left-[5%] w-60 bg-[#111]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform -rotate-6 z-10">
              <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-4 flex items-center justify-center border border-gray-700 shadow-inner">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="font-bold text-base text-white">Sony Alpha A7 III</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[#FFE28A] font-black text-sm flex items-center gap-1"><Coins className="w-4 h-4"/> 4500 Cr</p>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded-md">VERIFIED</span>
              </div>
            </motion.div>

            {/* Asset 2 */}
            <motion.div animate={floatAnimation2} className="absolute bottom-[5%] right-[5%] w-60 bg-[#111]/80 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] transform rotate-6 z-10">
              <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl mb-4 flex items-center justify-center border border-gray-700 shadow-inner">
                <Headphones className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="font-bold text-base text-white">AirPods Pro Gen 2</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[#FFE28A] font-black text-sm flex items-center gap-1"><Coins className="w-4 h-4"/> 2100 Cr</p>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded-md">VERIFIED</span>
              </div>
            </motion.div>

            {/* Center Dynamic Element: The Swap Match Toast */}
            <motion.div animate={floatAnimation3} className="absolute z-30 w-72 bg-gradient-to-r from-emerald-500 to-teal-400 p-[1px] rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)]">
              <div className="bg-[#050505] backdrop-blur-xl p-4 rounded-[15px] flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-white font-extrabold text-sm">Swap Matched!</h4>
                  <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mt-0.5">Automated Execution</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 4. Live Ticker / Marquee Section (High Standard Vibe) */}
        <section className="w-full border-y border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md overflow-hidden py-4 flex items-center shadow-2xl">
          <div className="flex items-center gap-3 px-8 border-r border-white/10 z-20 bg-[#0a0a0a]">
            <Activity className="w-4 h-4 text-[#A388E1] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Live Network</span>
          </div>
          
          <div className="flex-1 overflow-hidden relative flex">
            {/* Gradient masks for smooth fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10"></div>
            
            {/* Scrolling Content */}
            <motion.div 
              animate={{ x: ["0%", "-50%"] }} 
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-12 px-8 whitespace-nowrap"
            >
              {/* Dummy Live Data Array repeated twice for seamless loop */}
              {[1, 2].map((_, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="text-white">Rahul</span> swapped <span className="text-[#A388E1]">PS5</span> for <span className="text-[#A388E1]">Gaming PC</span> <span className="text-xs opacity-50">2m ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="text-white">Priya</span> earned <span className="text-[#FFE28A] flex items-center gap-1"><Coins className="w-3 h-3"/> 500 Cr</span> <span className="text-xs opacity-50">5m ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="text-white">Aman</span> listed <span className="text-[#A388E1]">Nike Jordans</span> <span className="text-xs opacity-50">12m ago</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
                    <span className="text-white">Neha</span> swapped <span className="text-[#A388E1]">Kindle</span> for <span className="text-[#FFE28A] flex items-center gap-1"><Coins className="w-3 h-3"/> 300 Cr</span> <span className="text-xs opacity-50">18m ago</span>
                  </div>
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </section>

        {/* 5. Features Section (Glass Cards) */}
        <section id="platform" className="py-32 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-6 drop-shadow-lg">Engineered for Perfection.</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium">A state-of-the-art ecosystem built to make bartering fast, secure, and infinitely scalable.</p>
          </div>
          
          <motion.div 
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto"
          >
            {[
              { icon: RefreshCw, title: "Frictionless Swaps", desc: "Our algorithmic matching engine pairs your inventory with users actively seeking your specific assets.", color: "text-[#A388E1]", bg: "bg-[#A388E1]/10", border: "border-[#A388E1]/30" },
              { icon: Coins, title: "Internal Economy", desc: "Liquidate assets instantly into Dealit Credits to preserve and transfer purchasing power seamlessly.", color: "text-[#FFE28A]", bg: "bg-[#FFE28A]/10", border: "border-[#FFE28A]/30" },
              { icon: Shield, title: "Verified Escrow", desc: "Bank-grade security protocols, robust user verification, and secure drop-offs for high-value trades.", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-500/30" }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative group rounded-[2rem] bg-[#0a0a0f] border border-white/5 p-10 overflow-hidden hover:-translate-y-2 transition-transform duration-300">
                {/* Subtle Inner Glow on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className={`relative z-10 w-16 h-16 rounded-2xl ${feature.bg} ${feature.border} border flex items-center justify-center mb-8 shadow-lg`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="relative z-10 text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="relative z-10 text-gray-400 leading-relaxed text-base font-medium">{feature.desc}</p>
                
                {/* Learn More Link */}
                <div className="relative z-10 mt-8 flex items-center gap-2 text-sm font-bold text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                  Explore Module <ChevronRight className="w-4 h-4 text-[#A388E1]" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

      </main>

      {/* 6. Elite Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#020202] pt-24 pb-12 px-8 lg:px-12">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row justify-between items-start gap-16 mb-20">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#A388E1] to-[#6B46C1] rounded-[10px] flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tighter text-white">Dealit.</span>
            </div>
            <p className="text-gray-500 text-base font-medium leading-relaxed mb-8">
              Redefining the architecture of asset exchange. Proudly developed to eliminate cash friction and maximize absolute value.
            </p>
            
            {/* App Badges in Footer */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#111] border border-gray-800 hover:border-gray-600 px-5 py-2.5 rounded-xl cursor-pointer transition-colors">
                 <svg viewBox="0 0 384 512" className="w-5 h-5 text-white" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                 <span className="text-xs font-bold text-gray-300">App Store</span>
              </div>
              <div className="flex items-center gap-2 bg-[#111] border border-gray-800 hover:border-gray-600 px-5 py-2.5 rounded-xl cursor-pointer transition-colors">
                 <svg viewBox="0 0 512 512" className="w-5 h-5 text-white" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                 <span className="text-xs font-bold text-gray-300">Google Play</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24">
            <div>
              <h4 className="font-extrabold text-white mb-6 uppercase tracking-wider text-xs">Architecture</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-white transition">The Engine</a></li>
                <li><a href="#" className="hover:text-white transition">Tokenomics</a></li>
                <li><a href="#" className="hover:text-white transition">Security SDK</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers <span className="ml-2 bg-[#A388E1]/20 text-[#A388E1] text-[9px] px-1.5 py-0.5 rounded">HIRING</span></a></li>
                <li><a href="#" className="hover:text-white transition">Press Kit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white mb-6 uppercase tracking-wider text-xs">Legal</h4>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1440px] mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm font-bold tracking-wide">© 2026 Dealit Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-500">
             <Globe className="w-4 h-4" />
             <span className="text-sm font-medium">Global Network Online</span>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default DesktopLandingPage;