import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings2, X, BarChart3, Palette, FileText, CheckCircle2, 
  UploadCloud, MessageSquare, Loader2, AlignCenter, AlignLeft, AlignRight, LayoutPanelTop
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const THEMES = [
  { id: 'midnight-glass', name: 'Midnight Glass' },
  { id: 'minimal-snow', name: 'Minimal Snow' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon' }
];

const LAYOUTS = [
  { id: 'center', name: 'Center', icon: AlignCenter },
  { id: 'left', name: 'Left', icon: AlignLeft },
  { id: 'right', name: 'Right', icon: AlignRight }
];

const CreatorStudio = ({ profile, setProfile, username, initialPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('theme'); // Defaulting to theme for faster UX
  
  // States for features
  const [analytics, setAnalytics] = useState(null);
  const [promptText, setPromptText] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'analytics' && !analytics) {
      fetchAnalytics();
    }
  }, [isOpen, activeTab]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_BASE}/api/personal-ai/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setAnalytics(res.data);
    } catch (err) {
      toast.error("Failed to fetch analytics");
    }
  };

  const handleUpdateTheme = async (themeId) => {
    const previousTheme = profile.theme;
    setProfile(prev => ({ ...prev, theme: themeId })); 
    
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.put(`${API_BASE}/api/personal-ai/theme`, { theme: themeId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Theme applied live!");
    } catch (err) {
      setProfile(prev => ({ ...prev, theme: previousTheme })); 
      toast.error("Failed to save theme");
    }
  };

  const handleUpdateLayout = async (layoutId) => {
    const previousLayout = profile.layout;
    setProfile(prev => ({ ...prev, layout: layoutId })); 
    
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.put(`${API_BASE}/api/personal-ai/layout`, { layout: layoutId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Layout applied live!");
    } catch (err) {
      setProfile(prev => ({ ...prev, layout: previousLayout })); 
      toast.error("Failed to save layout");
    }
  };

  const handleUpdatePrompt = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.put(`${API_BASE}/api/personal-ai/prompt`, { newPrompt: promptText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("AI Prompt updated successfully!");
    } catch (err) {
      toast.error("Failed to update prompt");
    } finally {
      setIsLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <>
      {!isOpen && (
        <motion.button 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] bg-[#0F0F12]/90 border border-purple-500/40 backdrop-blur-xl p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-300 hover:text-white hover:bg-purple-600/50 transition-all"
        >
          <Settings2 className="w-6 h-6 animate-pulse" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex flex-col lg:flex-row justify-end bg-black/40 backdrop-blur-sm pointer-events-none">
            
            {/* Click outside to close (Desktop) */}
            <div className="absolute inset-0 pointer-events-auto hidden lg:block" onClick={() => setIsOpen(false)} />

            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag={window.innerWidth < 1024 ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              className="w-full lg:max-w-md bg-[#0F0F12] border-t lg:border-t-0 lg:border-l border-white/10 h-[65vh] lg:h-full flex flex-col text-white shadow-[0_-15px_40px_rgba(0,0,0,0.8)] rounded-t-[1.5rem] lg:rounded-none relative overflow-hidden mt-auto lg:mt-0 pointer-events-auto"
            >
              {/* Drag Handle & Close Button (Mobile) */}
              <div className="lg:hidden w-full flex items-center justify-between pt-4 pb-2 px-5 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-8 h-8" />
                <div className="w-12 h-1.5 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" />
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:flex p-6 border-b border-white/10 items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-5 h-5 rounded-full object-cover border border-white/10" /> Creator Studio
                  </h2>
                  <p className="text-xs text-gray-400">Manage @{username} inline.</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 bg-black/20 shrink-0">
                {[
                  { id: 'theme', icon: Palette, label: 'Look' },
                  { id: 'analytics', icon: BarChart3, label: 'Stats' },
                  { id: 'prompt', icon: MessageSquare, label: 'Prompt' }
                ].map(tab => (
                  <button
                    key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-[11px] uppercase tracking-wider font-semibold flex flex-col items-center gap-1 border-b-2 transition-all ${
                      activeTab === tab.id ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div 
                className="flex-1 overflow-y-auto p-5 lg:p-6 space-y-6 no-scrollbar pb-10 lg:pb-6"
                onPointerDown={(e) => e.stopPropagation()} // Prevents scrolling from triggering the drag
              >
                
                {/* --- APPEARANCE TAB (Themes + Layouts) --- */}
                {activeTab === 'theme' && (
                  <div className="space-y-8">
                    
                    {/* Theme Section */}
                    <div>
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5"/> Color Theme
                      </h3>
                      <div className="space-y-2">
                        {THEMES.map(t => (
                          <div key={t.id} onClick={() => handleUpdateTheme(t.id)} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${ profile.theme === t.id ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-white/10 bg-black/20 hover:border-white/30 text-gray-300'}`}>
                            <span className="text-sm font-semibold">{t.name}</span>
                            {profile.theme === t.id && <CheckCircle2 className="w-5 h-5" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Layout Section */}
                    <div className="pt-2">
                      <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <LayoutPanelTop className="w-3.5 h-3.5"/> Header Layout
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {LAYOUTS.map(l => (
                          <div 
                            key={l.id} 
                            onClick={() => handleUpdateLayout(l.id)} 
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                              (profile.layout || 'center') === l.id ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-white/10 bg-black/20 hover:bg-white/5 text-gray-400'
                            }`}
                          >
                            <l.icon className="w-5 h-5" />
                            <span className="text-[11px] font-semibold">{l.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'prompt' && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400">Tweak your AI's core behavior on the fly.</p>
                    <textarea 
                      value={promptText} onChange={(e) => setPromptText(e.target.value)}
                      className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                    <button onClick={handleUpdatePrompt} disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Prompt Live'}
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    document.getElementById('portal-root')
  );
};

export default CreatorStudio;