import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X, BarChart3, Palette, FileText, CheckCircle2, UploadCloud, MessageSquare, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const THEMES = [
  { id: 'midnight-glass', name: 'Midnight Glass' },
  { id: 'minimal-snow', name: 'Minimal Snow' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon' }
];

// Ye component lazy load hoga
const CreatorStudio = ({ profile, setProfile, username, initialPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');
  
  // States for features
  const [analytics, setAnalytics] = useState(null);
  const [promptText, setPromptText] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const fileInputRef = useRef(null);

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

  // Optimistic UI Update for Theme
  const handleUpdateTheme = async (themeId) => {
    const previousTheme = profile.theme;
    setProfile(prev => ({ ...prev, theme: themeId })); // Instant UI change
    
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.put(`${API_BASE}/api/personal-ai/theme`, { theme: themeId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Theme applied live!");
    } catch (err) {
      setProfile(prev => ({ ...prev, theme: previousTheme })); // Revert on fail
      toast.error("Failed to save theme");
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

  // Render outside main DOM tree via Portal
  return ReactDOM.createPortal(
    <>
      {/* Subtle FAB (Floating Action Button) */}
      {!isOpen && (
        <motion.button 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] bg-[#0F0F12]/90 border border-purple-500/40 backdrop-blur-xl p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-300 hover:text-white hover:bg-purple-600/50 transition-all"
        >
          <Settings2 className="w-6 h-6 animate-pulse" />
        </motion.button>
      )}

      {/* Glassmorphism Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex justify-end bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white/5 backdrop-blur-2xl border-l border-white/10 h-full flex flex-col text-white shadow-2xl relative"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-purple-400" /> Creator Studio
                  </h2>
                  <p className="text-xs text-gray-400">Manage @{username} inline.</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 bg-black/20">
                {[
                  { id: 'analytics', icon: BarChart3, label: 'Stats' },
                  { id: 'theme', icon: Palette, label: 'Theme' },
                  { id: 'prompt', icon: MessageSquare, label: 'Prompt' },
                  { id: 'knowledge', icon: FileText, label: 'Docs' }
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
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                
                {activeTab === 'theme' && (
                  <div className="space-y-3">
                    {THEMES.map(t => (
                      <div key={t.id} onClick={() => handleUpdateTheme(t.id)} className={`p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${ profile.theme === t.id ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-black/20 hover:border-white/30'}`}>
                        <span className="text-sm font-semibold">{t.name}</span>
                        {profile.theme === t.id && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                      </div>
                    ))}
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
                
                {/* Analytics and Knowledge tab content remains similar to your original code, bas unko yaha paste kar lena */}

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