import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useMotionValue, 
  useMotionTemplate,
  AnimatePresence 
} from 'framer-motion';
import { 
  ArrowRight, Menu, X, 
  MapPin, ArrowUpRight, Package, 
  Sun, Moon, ShoppingBag, IndianRupee,
  Phone, Mail, ChevronRight, LogIn,
  RefreshCw, Coins, ArrowRightLeft, Shield, Zap, Lock
} from 'lucide-react';

import ScrollReveal from './ScrollReveal'; 
import ElectricBorder from './ElectricBorder'; 
import Antigravity from './Antigravity'; // IMPORTING ANTIGRAVITY COMPONENT

const styleInjection = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');

  :root { 
    --grid-color: rgba(255, 255, 255, 0.05); 
    --bg-main: #050505;
    --text-main: #ffffff;
    --text-muted: #8a8a93;
    --border-color: rgba(255, 255, 255, 0.1);
    --panel-bg: rgba(20, 20, 24, 0.6);
    --accent-glow: #A388E1; 
    --blob-1: rgba(163, 136, 225, 0.15); 
    --blob-2: rgba(255, 226, 138, 0.15); 
    --button-bg: #ffffff;
    --button-text: #050505;
    --card-highlight: rgba(255, 255, 255, 0.03);
  }

  [data-theme='light'] {
    --grid-color: rgba(163, 136, 225, 0.05);
    --bg-main: #ffffff; 
    --text-main: #0a0a0a; 
    --text-muted: #6b7280; 
    --border-color: rgba(0, 0, 0, 0.08);
    --panel-bg: rgba(255, 255, 255, 0.8); 
    --accent-glow: #8B5CF6; 
    --blob-1: rgba(139, 92, 246, 0.15); 
    --blob-2: rgba(251, 191, 36, 0.2); 
    --button-bg: #0a0a0a;
    --button-text: #ffffff;
    --card-highlight: rgba(0, 0, 0, 0.02);
  }

  html, body {
    background-color: var(--bg-main) !important;
    font-family: 'Space Grotesk', sans-serif;
    color: var(--text-main);
    overflow-x: hidden; 
    width: 100%;
    margin: 0;
    padding: 0;
    cursor: none;
    scroll-behavior: smooth;
    transition: background-color 0.7s ease, color 0.7s ease;
  }

  /* --- UTILS --- */
  .custom-cursor {
    position: fixed; top: 0; left: 0; width: 20px; height: 20px;
    border: 1.5px solid #A388E1; border-radius: 50%; pointer-events: none; z-index: 9999;
    transform: translate(-50%, -50%); transition: width 0.3s, height 0.3s; mix-blend-mode: difference;
  }
  .custom-cursor.hovered { width: 60px; height: 60px; background-color: #A388E1; border-color: transparent; opacity: 0.5; }
  
  .glass-panel { background: var(--panel-bg); backdrop-filter: blur(16px); border: 1px solid var(--border-color); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05); }
  .massive-text { font-size: clamp(3.5rem, 13vw, 9rem); line-height: 0.90; letter-spacing: -0.04em; font-weight: 800; color: var(--text-main); }
  .stroked-text { -webkit-text-stroke: 1.5px var(--text-muted); color: transparent; transition: all 0.5s ease; }
  .stroked-text:hover { color: var(--text-main); -webkit-text-stroke: 0px; }
  .neon-button { animation: neonPulse 2s infinite; }
  @keyframes neonPulse { 0% { box-shadow: 0 0 5px var(--border-color); } 50% { box-shadow: 0 0 20px var(--accent-glow); } 100% { box-shadow: 0 0 5px var(--border-color); } }
  .theme-transition { transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1); }

  /* --- PREMIUM TEXT GRADIENTS --- */
  .gradient-decentralized {
    background: linear-gradient(135deg, #A388E1 0%, #6B46C1 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0px 0px 20px rgba(163, 136, 225, 0.3));
  }
  .gradient-bartering {
    background: linear-gradient(135deg, #FFE28A 0%, #F59E0B 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0px 0px 20px rgba(255, 226, 138, 0.3));
  }
  .gradient-ecosystem {
    background: linear-gradient(135deg, #34d399 0%, #059669 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0px 0px 20px rgba(52, 211, 153, 0.3));
  }
  .gradient-credits {
    background: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    filter: drop-shadow(0px 0px 20px rgba(96, 165, 250, 0.3));
  }

  /* --- SHIMMER GOLD TEXT EFFECT --- */
  @keyframes textShimmer {
    0% { background-position: 200% center; }
    100% { background-position: -200% center; }
  }
  .shimmer-text {
    background: linear-gradient(
      to right,
      #A388E1 20%, 
      #FFE28A 40%, 
      #A388E1 60%, 
      #6B46C1 80%
    );
    background-size: 200% auto;
    color: #A388E1;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: textShimmer 4s linear infinite;
  }
`;

/* --- MAGNETIC BUTTON COMPONENT --- */
const MagneticElement = ({ children, className, onClick, as: Component = 'div', href }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      href={href}
      className={className}
      style={{ cursor: 'pointer', display: 'inline-block' }}
    >
      <motion.div
        animate={{ x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      >
        {children}
      </motion.div>
    </Component>
  );
};

/* --- BACKGROUNDS --- */
const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    
    {/* --- MODIFICATION START: ANTIGRAVITY IN HERO --- */}
    <div className="absolute inset-0 pointer-events-auto z-0 opacity-60">
      <Antigravity
        count={250}
        magnetRadius={6}
        ringRadius={7}
        waveSpeed={0.4}
        waveAmplitude={1}
        particleSize={1.5}
        lerpSpeed={0.05}
        color="#38BDF8" // Beautiful Electric Blue for best contrast
        autoAnimate
        particleVariance={1}
        rotationSpeed={0}
        depthFactor={1}
        pulseSpeed={3}
        particleShape="capsule"
        fieldStrength={10}
      />
    </div>
    {/* --- MODIFICATION END --- */}

    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-[10%] -right-[10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] blur-[100px] md:blur-[140px] rounded-full mix-blend-multiply dark:mix-blend-screen theme-transition" style={{ backgroundColor: 'var(--blob-1)' }} />
    <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-[20%] -left-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] blur-[100px] md:blur-[140px] rounded-full mix-blend-multiply dark:mix-blend-screen theme-transition" style={{ backgroundColor: 'var(--blob-2)' }} />
  </div>
);

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    const updateMouse = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    const handleOver = (e) => setIsHovered(!!e.target.closest('.interactive'));
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mouseover', handleOver);
    return () => { window.removeEventListener('mousemove', updateMouse); window.removeEventListener('mouseover', handleOver); };
  }, []);
  return <div className={`custom-cursor hidden md:block ${isHovered ? 'hovered' : ''}`} style={{ left: mousePosition.x, top: mousePosition.y }} />;
};

/* --- 3D TILT CARD --- */
const BentoBox3D = ({ children, className = "", title, style }) => {
  const x = useMotionValue(0); const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], ["3deg", "-3deg"]); 
  const rotateY = useTransform(x, [-0.5, 0.5], ["-3deg", "3deg"]);
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  return (
    <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d", ...style }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 300, damping: 20 }} onMouseMove={handleMouseMove} onMouseLeave={() => { x.set(0); y.set(0); }} className={`glass-panel p-5 relative group overflow-hidden hover:shadow-2xl transition-all duration-500 ${className} interactive theme-transition`}>
      <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full flex flex-col">
         <div className="absolute top-0 right-0 p-0 opacity-50 md:opacity-0 group-hover:opacity-100 transition-opacity"><ArrowUpRight size={16} /></div>
         {title && <h4 className="text-[10px] font-bold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</h4>}
         {children}
      </div>
      <motion.div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition duration-300 z-0" style={{ background: useMotionTemplate`radial-gradient(400px circle at ${useTransform(x, v => (v + 0.5) * 100)}% ${useTransform(y, v => (v + 0.5) * 100)}%, var(--card-highlight), transparent 80%)` }} />
    </motion.div>
  );
};

/* --- PROCESS PIPELINE (DEALIT MECHANISM) --- */
const ProcessPipeline = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start center", "end center"] });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
  
  const steps = [
    { title: "Digitize Your Asset", desc: "List unused items. Our engine automatically appraises the item and assigns a Dealit Credit value.", color: "#A388E1" },
    { title: "Smart Matching", desc: "The algorithm scans the global network, pairing you with users who actively desire your assets.", color: "#FFE28A" },
    { title: "Secure Execution", desc: "Funds locked in escrow. Exchange locally or ship. Credits are instantly released upon verification.", color: "#34d399" }
  ];

  return (
    <section id="how-it-works" ref={containerRef} className="px-6 md:px-12 py-24 md:py-32 relative max-w-7xl mx-auto">
      <div className="text-center mb-24 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">The Mechanism</h2>
        <p className="max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>How a decentralized trade executes in 3 steps.</p>
      </div>
      
      <div className="absolute left-8 md:left-1/2 top-40 md:top-80 bottom-20 w-px -translate-x-1/2" style={{ backgroundColor: 'var(--border-color)' }} />
      <motion.div style={{ scaleY, transformOrigin: 'top', backgroundColor: 'var(--accent-glow)' }} className="absolute left-8 md:left-1/2 top-40 md:top-80 bottom-20 w-px -translate-x-1/2 z-10" />
      
      <div className="space-y-16 md:space-y-32 relative z-20">
        {steps.map((step, i) => (
          <div key={i} className={`flex flex-col md:flex-row items-center gap-8 md:gap-0 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: i * 0.2 }} className="flex-1 w-full md:w-[45%] pl-16 md:pl-0">
              
              <ElectricBorder color={step.color} speed={1.5} chaos={0.1} borderRadius={24}>
                <div className={`p-8 rounded-2xl relative group transition-all duration-500 hover:-translate-y-1 theme-transition`} style={{ backgroundColor: 'var(--panel-bg)', border: '1px solid var(--border-color)', backdropFilter: 'blur(16px)' }}>
                  <span className="text-6xl font-black absolute -top-6 -right-4 select-none opacity-5 transition-opacity group-hover:opacity-10" style={{ color: step.color }}>0{i+1}</span>
                  <h3 className="text-2xl font-bold mb-3 transition-colors" style={{ color: step.color }}>{step.title}</h3>
                  <p className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
              </ElectricBorder>

            </motion.div>
            <div className="absolute left-8 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
               <div className="w-4 h-4 rounded-full border shadow-sm z-30 flex items-center justify-center theme-transition" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
                 <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
               </div>
            </div>
            <div className="flex-1 hidden md:block" /> 
          </div>
        ))}
      </div>
    </section>
  );
};

/* --- ADVANCED MOBILE SHEET MENU --- */
const MobileMenuSheet = ({ isOpen, onClose, onLoginClick, onAdminClick }) => {
  const sheetVariants = {
    initial: { y: "100%" },
    animate: { y: 0, transition: { ease: [0.32, 0.72, 0, 1], duration: 0.6 } },
    exit: { y: "100%", transition: { ease: [0.32, 0.72, 0, 1], duration: 0.4 } }
  };
  const staggerVars = {
    animate: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
    exit: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }
  };
  const itemVars = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.1 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] cursor-pointer" />
          <motion.div variants={sheetVariants} initial="initial" animate="animate" exit="exit" drag="y" dragConstraints={{ top: 0 }} dragElastic={{ top: 0.05, bottom: 0.5 }} onDragEnd={(_, { offset, velocity }) => { if (offset.y > 100 || velocity.y > 150) onClose(); }} className="fixed bottom-0 left-0 right-0 h-[85vh] z-[60] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl border-t" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 flex items-center justify-center cursor-grab active:cursor-grabbing z-20">
              <div className="w-12 h-1.5 rounded-full opacity-30" style={{ backgroundColor: 'var(--text-muted)' }} />
            </div>
            <div className="absolute top-[-20%] left-[-20%] w-[100%] h-[500px] rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, var(--blob-1) 0%, transparent 70%)' }} />
            
            <div className="flex flex-col h-full p-8 pt-12 relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className="text-2xl font-bold tracking-tight">Network</span>
                <button onClick={onClose} className="p-2 rounded-full border transition-all active:scale-95" style={{ borderColor: 'var(--border-color)' }}>
                  <X size={20} />
                </button>
              </div>

              <motion.div variants={staggerVars} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-2 flex-1 overflow-y-auto pb-6">
                 {[{ name: 'Ecosystem', href: '#features', sub: "Platform Features" }, { name: 'Tokenomics', href: '#pricing', sub: "Dealit Credits" }, { name: 'Philosophy', href: '#about', sub: "Core Engine" }].map((link, i) => (
                   <motion.a key={i} href={link.href} variants={itemVars} onClick={onClose} className="group flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-95" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'var(--border-color)' }}>
                     <div>
                       <span className="text-xl font-bold block mb-1">{link.name}</span>
                       <span className="text-xs font-medium opacity-60 uppercase tracking-widest">{link.sub}</span>
                     </div>
                     <div className="w-10 h-10 rounded-full flex items-center justify-center transition-colors group-hover:bg-[var(--text-main)] group-hover:text-[var(--bg-main)]" style={{ backgroundColor: 'var(--panel-bg)' }}>
                       <ChevronRight size={18} />
                     </div>
                   </motion.a>
                 ))}

                 <motion.div variants={itemVars} className="mt-8 flex flex-col gap-3">
                    <button className="flex items-center justify-center gap-3 py-4 rounded-2xl transition-all group border interactive active:scale-95 shadow-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                      <svg viewBox="0 0 384 512" className="w-6 h-6" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                      <div className="text-left">
                        <div className="text-[10px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Download on the</div>
                        <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>App Store</div>
                      </div>
                    </button>

                    <button className="flex items-center justify-center gap-3 py-4 rounded-2xl transition-all group border interactive active:scale-95 shadow-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                      <svg viewBox="0 0 512 512" className="w-6 h-6" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                      <div className="text-left">
                        <div className="text-[10px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Get it on</div>
                        <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>Google Play</div>
                      </div>
                    </button>
                 </motion.div>

                 <motion.button 
                   variants={itemVars} 
                   onClick={() => { onClose(); onAdminClick(); }} 
                   className="mt-4 flex items-center justify-center gap-2 py-4 w-full rounded-xl border transition-all active:scale-95 bg-[var(--accent-glow)]/10 text-[var(--accent-glow)] font-bold text-sm uppercase tracking-wider shadow-inner"
                   style={{ borderColor: 'var(--accent-glow)' }}
                 >
                   <Lock size={16} /> Admin Access
                 </motion.button>
                 
                 <motion.div variants={itemVars} className="mt-6 flex flex-col gap-3 opacity-60">
                   <a href="tel:+917298317177" className="flex items-center gap-3 text-sm font-medium"><Phone size={14}/> +91 72983 17177</a>
                   <a href="mailto:support@dealit.shop" className="flex items-center gap-3 text-sm font-medium"><Mail size={14}/> Support</a>
                 </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* --- MAIN LANDING PAGE --- */
const DesktopLandingPage = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); 

  useEffect(() => {
    const savedTheme = localStorage.getItem('dealit-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('dealit-theme', newTheme); 
  };
  
  useEffect(() => { 
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehaviorY = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.overscrollBehaviorY = 'auto';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      document.body.style.overscrollBehaviorY = 'auto';
    };
  }, [isMobileMenuOpen]);

  const [swaps, setSwaps] = useState([
    { type: 'swap', text: "Rahul swapped PS5 for Gaming PC", time: '2m ago' }, 
    { type: 'credit', text: "Priya earned 500 Cr", time: '5m ago' }
  ]);
  
  useEffect(() => {
    const events = [
      { type: 'swap', text: "Aman swapped Kindle for 300 Cr" }, 
      { type: 'credit', text: "Liquidated: Sony A7 III for 4500 Cr" }, 
      { type: 'escrow', text: "Verified Drop-off - Bangalore" }, 
      { type: 'swap', text: "Neha listed Nike Jordans" }
    ];
    const interval = setInterval(() => setSwaps(p => { 
      const n = [...p, { ...events[Math.floor(Math.random()*events.length)], time: 'Just now' }]; 
      if (n.length > 3) n.shift(); return n; 
    }), 2500);
    return () => clearInterval(interval);
  }, []);

  const highlightWords = [
    { word: "decentralized", class: "gradient-decentralized font-black" },      
    { word: "bartering", class: "gradient-bartering font-black" },  
    { word: "ecosystem", class: "gradient-ecosystem font-black" },
    { word: "economy", class: "gradient-credits font-black" }           
  ];

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden theme-transition" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <style>{styleInjection}</style>
      <CustomCursor />
      <div className="grain-overlay" />
      <div className="tech-grid" />
      
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ backgroundColor: 'var(--blob-1)' }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ backgroundColor: 'var(--blob-2)' }} />

      {/* --- SIDEBAR (DESKTOP) --- */}
      <nav className="hidden md:flex flex-col justify-between fixed left-0 top-0 h-full w-20 border-r backdrop-blur-md z-50 py-8 items-center theme-transition" style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}>
        <div className="hover:scale-110 transition-transform duration-300 cursor-pointer interactive">
            <div className="w-10 h-10 relative flex items-center justify-center bg-gradient-to-br from-[#A388E1] to-[#6B46C1] rounded-xl shadow-lg">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center w-full">
            <div className="flex gap-10 -rotate-90 whitespace-nowrap origin-center">
                <a href="#about" className="text-xs font-bold transition-colors tracking-widest uppercase interactive" style={{ color: 'var(--text-muted)' }}>Philosophy</a>
                <a href="#pricing" className="text-xs font-bold transition-colors tracking-widest uppercase interactive" style={{ color: 'var(--text-muted)' }}>Tokenomics</a>
                <a href="#features" className="text-xs font-bold transition-colors tracking-widest uppercase interactive" style={{ color: 'var(--text-muted)' }}>Ecosystem</a>
            </div>
        </div>
        <div className="flex flex-col gap-6 items-center">
            <div 
              onClick={() => navigate('/admin')} 
              className="interactive p-2.5 rounded-xl hover:bg-black/5 transition-all group relative border border-transparent hover:border-[var(--border-color)] cursor-pointer"
              title="Admin Access"
            >
              <Lock size={20} className="transition-colors group-hover:text-[var(--accent-glow)]" style={{ color: 'var(--text-muted)' }} />
            </div>

            <button onClick={toggleTheme} className="interactive p-2 rounded-full hover:bg-black/5 transition-all border border-transparent hover:border-[var(--border-color)]">
              {theme === 'dark' ? <Sun size={20} color="var(--text-muted)" /> : <Moon size={20} color="var(--text-muted)" />}
            </button>
            <Menu className="cursor-pointer interactive" size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
      </nav>

      {/* --- MOBILE HEADER & TRIGGER --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 w-full z-[40] flex justify-between items-center p-4 backdrop-blur-xl border-b theme-transition" style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#A388E1] to-[#6B46C1] rounded-lg shadow-sm">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter shimmer-text uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            DEALIT.
          </span>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="interactive p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all border border-transparent hover:border-[var(--border-color)]">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-full hover:bg-black/5 active:scale-95 transition-all interactive">
              <Menu size={24} />
            </button>
        </div>
      </div>

      <MobileMenuSheet 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        onLoginClick={onLoginClick} 
        onAdminClick={() => navigate('/admin')}
      />

      <main className="md:pl-20 relative z-10 pt-20 md:pt-0 w-full max-w-[100vw]">
        
        {/* HERO */}
        <section className="min-h-[85dvh] md:min-h-[95vh] flex flex-col justify-between px-6 md:px-12 py-6 md:py-12 relative overflow-hidden">
          <HeroBackground />
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="hidden md:flex justify-between items-start z-10">
            <div><p className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>LIVE NETWORK</p><p className="text-xs font-bold tracking-widest" style={{ color: 'var(--text-muted)' }}>DECENTRALIZED BARTERING</p></div>
            
            <div className="flex gap-4">
              <MagneticElement as="a" href="#">
                <div className="flex items-center gap-3 px-5 py-2 rounded-xl transition-all group relative overflow-hidden border interactive hover:shadow-[0_0_20px_rgba(163,136,225,0.2)]" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--text-main)] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                  <svg viewBox="0 0 384 512" className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  <div className="text-left relative z-10">
                    <div className="text-[9px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Download on the</div>
                    <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>App Store</div>
                  </div>
                </div>
              </MagneticElement>

              <MagneticElement as="a" href="#">
                <div className="flex items-center gap-3 px-5 py-2 rounded-xl transition-all group relative overflow-hidden border interactive hover:shadow-[0_0_20px_rgba(163,136,225,0.2)]" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--text-main)] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                  <svg viewBox="0 0 512 512" className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                  <div className="text-left relative z-10">
                    <div className="text-[9px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Get it on</div>
                    <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>Google Play</div>
                  </div>
                </div>
              </MagneticElement>
            </div>

          </motion.div>

          <div className="relative my-4 md:my-12 z-10 pointer-events-none">
            <h1 className="massive-text leading-[0.9] tracking-tighter break-words">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2 md:mb-0">
                <motion.span initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="block pointer-events-auto"><span className="cursor-default">LIQUIDATE</span></motion.span>
              </div>
              <motion.span initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="stroked-text block pointer-events-auto mb-2 md:mb-0">SWAP</motion.span>
              <motion.span initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="block mb-2 md:mb-0" style={{ color: 'var(--text-muted)' }}>EARN</motion.span>
            </h1>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.9 }} className="md:hidden mt-16 flex flex-col gap-3 pointer-events-auto w-full max-w-sm">
              <button className="w-full py-3.5 border rounded-xl flex items-center justify-center gap-3 interactive active:scale-95 transition-all shadow-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                <svg viewBox="0 0 384 512" className="w-6 h-6" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Download on the</div>
                  <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>App Store</div>
                </div>
              </button>

              <button className="w-full py-3.5 border rounded-xl flex items-center justify-center gap-3 interactive active:scale-95 transition-all shadow-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                <svg viewBox="0 0 512 512" className="w-6 h-6" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Get it on</div>
                  <div className="text-sm font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>Google Play</div>
                </div>
              </button>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t pt-5 md:pt-8 z-10 backdrop-blur-sm" style={{ borderColor: 'var(--border-color)' }}>
            <div className="col-span-1"><p className="text-base md:text-lg leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>The world's most advanced decentralized engine. Liquidate unused assets instantly.</p></div>
            <div className="col-span-2 flex flex-col md:flex-row md:items-center gap-6 md:justify-end">
              <button onClick={() => navigate('/shop')} className="interactive group w-full md:w-auto flex items-center justify-between md:justify-start gap-4 pl-6 pr-2 py-3 border rounded-full transition-all duration-300 active:scale-95" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}><span className="text-sm font-bold uppercase tracking-wider">Explore Network</span><div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ backgroundColor: 'var(--text-main)', color: 'var(--bg-main)' }}><ArrowRight size={14} /></div></button>
            </div>
          </motion.div>
        </section>

        {/* SCROLL REVEAL PHILOSOPHY */}
        <section id="about" className="relative min-h-screen flex items-center justify-center px-6 md:px-12 py-32 overflow-hidden border-t theme-transition" style={{ borderColor: 'var(--border-color)' }}>
          <motion.div 
            animate={{ x: [-100, 100], y: [-50, 50], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: "mirror" }}
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[var(--accent-glow)] rounded-full blur-[200px] pointer-events-none" 
          />
          
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <span className="inline-block mb-8 text-xs font-bold tracking-[0.3em] uppercase opacity-70" style={{ color: 'var(--accent-glow)' }}>
              Our Philosophy
            </span>
            
            <ScrollReveal 
              containerClassName="max-w-5xl mx-auto"
              textClassName="text-[clamp(2.5rem,5vw,5rem)] font-extrabold tracking-tight text-[var(--text-main)]"
              highlightWords={highlightWords}
            >
              Dealit is a decentralized ecosystem of bartering and interactive exchange. 
              Designed to streamline value transfer and simplify your digital economy. 
              Preserve purchasing power without relying on cash.
            </ScrollReveal>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="py-12 border-t perspective-[2000px] overflow-hidden theme-transition" style={{ borderColor: 'var(--border-color)' }}>
          <div className="px-6 md:px-12 mb-6 md:hidden"><h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>The Platform</h3><p className="text-lg font-bold">Ecosystem</p></div>
          <div className="flex flex-col gap-3 px-6 pb-8 md:grid md:grid-cols-4 md:grid-rows-2 md:gap-4 md:px-12 md:h-[600px] md:pb-0 md:overflow-visible">
            <div className="w-full md:w-auto md:col-span-2 md:row-span-2 h-full">
              <BentoBox3D className="h-full flex flex-col justify-between min-h-[280px]" style={{ backgroundColor: 'var(--bg-main)' }} title="Universal Value Transfer">
                <div className="z-10 mt-2 md:mt-10"><RefreshCw size={32} className="mb-4" style={{ color: 'var(--accent-glow)' }} /><h3 className="text-2xl md:text-3xl font-bold mb-2">Frictionless Swaps.</h3><p className="text-sm md:text-base max-w-md leading-relaxed" style={{ color: 'var(--text-muted)' }}>Convert physical assets into Dealit Credits instantly. Bypass the double-coincidence of wants.</p></div>
                <div className="w-full h-32 md:h-40 border mt-4 md:mt-8 rounded-lg relative overflow-hidden flex flex-col justify-end p-4 font-sans text-[10px] md:text-xs shadow-inner" style={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)' }}>
                    {swaps.map((swap, i) => ( <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 mb-2"><span className={`w-1.5 h-1.5 rounded-full ${swap.type === 'credit' ? 'bg-[#FFE28A]' : 'bg-[#A388E1]'}`}></span><span style={{ color: 'var(--text-main)' }} className="font-semibold">{swap.text}</span><span style={{ color: 'var(--text-muted)' }} className="ml-auto">{swap.time}</span></motion.div> ))}
                </div>
              </BentoBox3D>
            </div>
            <div className="w-full md:w-auto md:col-span-2 h-full">
              <BentoBox3D className="h-full min-h-[160px] flex flex-col" title="Algorithmic Pricing">
                <div className="flex items-end justify-between flex-1 relative z-10"><div><h3 className="text-xl md:text-2xl font-bold">Track Value (Cr)</h3><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Real-time platform data appraisal.</p></div><Coins size={32} style={{ color: 'var(--accent-glow)' }} /></div>
                <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20"><svg viewBox="0 0 100 20" className="w-full h-full fill-none" preserveAspectRatio="none"><path d="M0 20 Q 20 5 40 10 T 80 5 T 100 15" strokeWidth="1" stroke="var(--text-main)" /></svg></div>
              </BentoBox3D>
            </div>
            <div className="w-full md:w-auto md:col-span-1 h-full">
              <BentoBox3D className="h-full min-h-[160px]" title="Security">
                <Shield size={32} className="mb-4" style={{ color: 'var(--text-muted)' }} /><h3 className="text-xl font-bold">Verified Escrow</h3><p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Bank-grade drop-offs.</p>
              </BentoBox3D>
            </div>
            
            <div className="w-full md:w-auto md:col-span-1 h-full">
              <BentoBox3D className="h-full min-h-[160px]" title="Network" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)' }}>
                <div className="flex flex-col h-full justify-between">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full shadow-xl" style={{ backgroundColor: 'var(--button-text)', color: 'var(--button-bg)' }}>
                    <Zap size={20} />
                  </div>
                  <div><h3 className="text-xl font-bold leading-tight tracking-tight">Start<br/>Swapping</h3></div>
                </div>
              </BentoBox3D>
            </div>
          </div>
        </section>
        
        <ProcessPipeline />

        <div className="w-full overflow-hidden my-16 md:my-20">
            <div className="py-12 md:py-20 rotate-[-2deg] scale-105 border-y-4" style={{ backgroundColor: 'var(--button-bg)', color: 'var(--button-text)', borderColor: 'var(--button-text)' }}>
              <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: 15, repeat: Infinity }} className="flex whitespace-nowrap gap-8 md:gap-12">
                  {[...Array(10)].map((_, i) => (<span key={i} className="text-4xl md:text-6xl font-black italic tracking-tighter">TRADE VALUE • NOT CASH • EARN CREDITS ✦ </span>))}
              </motion.div>
            </div>
        </div>

        <section id="pricing" className="px-6 md:px-12 py-16 md:py-20 max-w-7xl mx-auto">
          <div className="mb-16 max-w-2xl"><motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Zero Cash.<br/><span style={{ color: 'var(--text-muted)' }}>Absolute Liquidity.</span></motion.h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            
            <BentoBox3D className="relative group rounded-2xl overflow-hidden border-none aspect-[4/3] md:aspect-auto md:h-[500px]" style={{ backgroundColor: 'var(--bg-main)' }}>
               <div className="absolute inset-0 z-10 transition-all duration-700 ease-out" style={{ backgroundColor: 'var(--panel-bg)', opacity: 0.1 }} />
               <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center relative overflow-hidden transform scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out rounded-2xl">
                 <div className="w-48 h-48 rounded-full border border-dashed border-[#A388E1]/30 animate-[spin_20s_linear_infinite] flex items-center justify-center">
                   <div className="w-32 h-32 rounded-full border border-[#FFE28A]/50 animate-[spin_10s_linear_infinite_reverse] flex items-center justify-center shadow-[0_0_50px_rgba(163,136,225,0.2)]">
                     <Coins className="w-12 h-12 text-[#FFE28A] animate-pulse" />
                   </div>
                 </div>
               </div>
            </BentoBox3D>

            <div className="space-y-4">
              {[{ title: '1:1 Value Ratio', desc: 'Transfer purchasing power instantly via Dealit Credits.' }, { title: 'Deflationary Supply', desc: 'Credits maintain high-impact trading value locally.' }, { title: 'Automated Execution', desc: 'Smart matching pairs your inventory with active buyers.' }].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group border-b py-8 active:bg-white/5 transition-all cursor-default interactive" style={{ borderColor: 'var(--border-color)' }}>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center gap-4"><span className="text-xs font-bold border px-2 py-1 rounded" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>0{i+1}</span> {item.title}</h3>
                  <p className="text-base md:text-lg transition-colors pl-12" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t pt-16 md:pt-20 pb-10 px-6 md:px-12 mb-0 theme-transition" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
          <div className="flex flex-col gap-12 mb-16 md:mb-20">
            <div className="w-full border-b pb-8" style={{ borderColor: 'var(--border-color)' }}><h2 className="text-[12vw] font-bold leading-none tracking-tighter select-none" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>DEALIT.</h2></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>Redefining the architecture of asset exchange. Eliminate cash friction and maximize absolute value.</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <MagneticElement as="a" href="#">
                      <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all group relative overflow-hidden border interactive" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--text-main)] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                        <svg viewBox="0 0 384 512" className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                        <div className="text-left relative z-10">
                          <div className="text-[8px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Download on the</div>
                          <div className="text-xs font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>App Store</div>
                        </div>
                      </div>
                    </MagneticElement>

                    <MagneticElement as="a" href="#">
                      <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl transition-all group relative overflow-hidden border interactive" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--panel-bg)' }}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--text-main)] to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                        <svg viewBox="0 0 512 512" className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" style={{ color: 'var(--text-main)' }} fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                        <div className="text-left relative z-10">
                          <div className="text-[8px] uppercase font-bold tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Get it on</div>
                          <div className="text-xs font-black leading-none tracking-tight" style={{ color: 'var(--text-main)' }}>Google Play</div>
                        </div>
                      </div>
                    </MagneticElement>
                  </div>
                </div>
                <div className="flex flex-col gap-4"><h4 className="font-bold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Platform</h4><a href="#features" className="hover:opacity-100 opacity-60 interactive">Network</a><a href="#pricing" className="hover:opacity-100 opacity-60 interactive">Tokenomics</a></div>
                <div className="flex flex-col gap-4"><h4 className="font-bold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Company</h4><a href="/privacy" className="hover:opacity-100 opacity-60 interactive">Terms</a><a href="/privacy" className="hover:opacity-100 opacity-60 interactive">Privacy</a></div>
                <div className="col-span-2 md:col-span-1 flex flex-col gap-4"><h4 className="font-bold text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Support</h4><a href="mailto:support@dealit.shop" className="hover:opacity-100 opacity-60 interactive whitespace-nowrap text-sm">support@dealit.shop</a><div className="flex flex-col gap-1 text-sm"><a href="tel:+917298317177" className="hover:opacity-100 opacity-60 interactive">+91 72983 17177</a></div></div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between border-t pt-8 gap-4" style={{ borderColor: 'var(--border-color)' }}>
             <div className="text-xs font-bold flex items-center gap-2" style={{ color: 'var(--text-muted)' }}><span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-glow)' }}></span>GLOBAL NETWORK ONLINE</div>
             <p className="text-xs" style={{ color: 'var(--text-muted)' }}>© 2026 DEALIT TECHNOLOGIES.</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DesktopLandingPage;