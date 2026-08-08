import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, Bot, Link as LinkIcon, CheckCircle2, Copy, 
  Loader2, Check, User, MessageSquareText, Globe, FileText, UploadCloud, 
  Palette, BarChart3, Activity, RefreshCw, X, AlignCenter, AlignLeft, AlignRight, LayoutPanelTop, Type, Save, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BACKEND_API;

const THEMES = [
  { id: 'midnight-glass', name: 'Midnight Glass', preview: 'bg-[#0c0c0c] border-gray-700 text-purple-400' },
  { id: 'minimal-snow', name: 'Minimal Snow', preview: 'bg-slate-50 border-gray-300 text-gray-800' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', preview: 'bg-black border-pink-500 text-cyan-400' }
];

const LAYOUTS = [
  { id: 'center', name: 'Center', icon: AlignCenter },
  { id: 'left', name: 'Left', icon: AlignLeft },
  { id: 'right', name: 'Right', icon: AlignRight }
];

const FONTS = ['Inter', 'Space Grotesk', 'Playfair Display', 'Poppins'];
const PRESET_COLORS = ['#A855F7', '#3B82F6', '#10B981', '#F43F5E', '#F59E0B', '#EAB308'];

const CreateAIPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Agent Status States
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [hasAgent, setHasAgent] = useState(false);
  const [myAgentData, setMyAgentData] = useState(null);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0); 
  
  // Mobile Bottom Sheet
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(true); 

  // Wizard Form Data
  const [baseIdea, setBaseIdea] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [finalLink, setFinalLink] = useState('');

  // Features Data
  const [pdfFile, setPdfFile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const fileInputRef = useRef(null);

  // Design States (Local Unsaved States)
  const [currentTheme, setCurrentTheme] = useState('midnight-glass');
  const [currentLayout, setCurrentLayout] = useState('center');
  const [currentPrimaryColor, setCurrentPrimaryColor] = useState('#A855F7');
  const [currentFontFamily, setCurrentFontFamily] = useState('Inter');
  const [isSavingDesign, setIsSavingDesign] = useState(false);

  useEffect(() => {
    checkExistingAgent();
  }, []);

  const checkExistingAgent = async () => {
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_BASE}/api/personal-ai/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success && res.data.hasAgent) {
        setHasAgent(true);
        setMyAgentData(res.data.data);
        setCurrentTheme(res.data.data.theme || 'midnight-glass');
        setCurrentLayout(res.data.data.layout || 'center');
        setCurrentPrimaryColor(res.data.data.primaryColor || '#A855F7');
        setCurrentFontFamily(res.data.data.fontFamily || 'Inter');
        setFinalLink(`${window.location.origin}/ai/${res.data.data.username}`);
        setActiveTab('analytics');
      } else {
        setHasAgent(false);
        setActiveTab('wizard');
      }
    } catch (err) {
      console.error("Failed to check agent status");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics' && hasAgent) fetchAnalytics();
  }, [activeTab, hasAgent]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_BASE}/api/personal-ai/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setAnalytics(res.data);
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitAI = async (e) => {
    // ... [Unchanged] ...
    e.preventDefault();
    if (!baseIdea.trim() || !username.trim()) return toast.error("Please fill all fields");
    if (!/^[a-z0-9_]+$/.test(username)) return toast.error("Username can only contain lowercase letters, numbers, and underscores.");

    setIsLoading(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.post(`${API_BASE}/api/personal-ai/init`, 
        { baseIdea, username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setQuestions(res.data.questions);
        setAnswers(new Array(res.data.questions.length).fill(''));
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initialize AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswers = async (e) => {
    // ... [Unchanged] ...
    e.preventDefault();
    if (answers.some(ans => !ans.trim())) return toast.error("Please answer all questions.");

    setIsLoading(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.post(`${API_BASE}/api/personal-ai/submit-answers`, 
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Agent Created Successfully!");
        checkExistingAgent(); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to compile AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    // ... [Unchanged] ...
    e.preventDefault();
    if (!pdfFile) return toast.error("Please select a PDF file first.");

    setIsLoading(true);
    const formData = new FormData();
    formData.append('document', pdfFile);

    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.post(`${API_BASE}/api/personal-ai/upload-pdf`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        toast.success("Knowledge Base updated!");
        setPdfFile(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Handle Local Design Changes Without Saving ---
  const handleDesignChange = (field, value) => {
    if (field === 'theme') setCurrentTheme(value);
    if (field === 'layout') setCurrentLayout(value);
    if (field === 'primaryColor') setCurrentPrimaryColor(value);
    if (field === 'fontFamily') setCurrentFontFamily(value);
  };

  // --- NEW: Save Design to Database ---
  const handleSaveDesign = async () => {
    setIsSavingDesign(true);
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.put(`${API_BASE}/api/personal-ai/design`, { 
        theme: currentTheme, 
        layout: currentLayout, 
        primaryColor: currentPrimaryColor, 
        fontFamily: currentFontFamily 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Design saved successfully!");
      // Update our source of truth
      setMyAgentData(prev => ({
        ...prev,
        theme: currentTheme,
        layout: currentLayout,
        primaryColor: currentPrimaryColor,
        fontFamily: currentFontFamily
      }));
      setPreviewRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error("Failed to save design");
    } finally {
      setIsSavingDesign(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalLink);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = myAgentData && (
    currentTheme !== myAgentData.theme ||
    currentLayout !== myAgentData.layout ||
    currentPrimaryColor !== myAgentData.primaryColor ||
    currentFontFamily !== myAgentData.fontFamily
  );

  // DYNAMIC IFRAME URL: Passes local state as query params for live unsaved preview
  const iframeSrc = myAgentData 
    ? `/ai/${myAgentData.username}?preview=true&theme=${currentTheme}&layout=${currentLayout}&primaryColor=${encodeURIComponent(currentPrimaryColor)}&fontFamily=${encodeURIComponent(currentFontFamily)}`
    : '';

  if (isCheckingStatus) {
    return (
      <div className="h-[100dvh] bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  const TABS = hasAgent 
    ? [
        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        { id: 'knowledge', icon: FileText, label: 'Knowledge' },
        { id: 'theme', icon: Palette, label: 'Appearance' }
      ]
    : [
        { id: 'wizard', icon: Bot, label: 'Setup Wizard' }
      ];

  const renderTabContent = () => (
    <AnimatePresence mode="wait">
      {/* ... [WIZARD TAB REMAINS SAME] ... */}
      {activeTab === 'wizard' && !hasAgent && (
        <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto w-full flex flex-col h-full justify-center py-6">
          <div className="text-center mb-10 mt-6 lg:mt-0">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] overflow-hidden bg-white/5 border border-purple-500/20 hover:scale-105 transition-transform duration-300">
              <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full object-cover rounded-full" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Deploy Your Clone</h1>
            <p className="text-gray-400 text-sm">Train a custom interactive AI agent for your bio link in minutes.</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-10 max-w-xs mx-auto">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                  step === s ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30 scale-110' : step > s ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/5'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 2 && <div className={`flex-1 h-[2px] rounded-full transition-all duration-300 ${step > s ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleInitAI} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-2"><MessageSquareText className="w-4 h-4 text-purple-400" /> What should your AI do?</label>
                  <textarea value={baseIdea} maxLength={300} onChange={(e) => setBaseIdea(e.target.value)} placeholder="e.g., An AI assistant for my freelance web design portfolio that can quote prices..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white hover:border-white/20 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none h-32 text-sm resize-none transition-all placeholder:text-gray-600 shadow-inner" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" /> Choose your Handle</label>
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all shadow-inner">
                    <span className="pl-4 pr-1 text-gray-500 text-sm font-mono flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> dealit.com/ai/</span>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="username" className="w-full bg-transparent p-4 pl-1 text-white text-sm font-mono outline-none placeholder:text-gray-600" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-4 shadow-lg hover:shadow-xl">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue Setup <ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.form>
            )}
            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmitAnswers} className="space-y-6 flex flex-col h-full">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar pb-10">
                  {questions.map((q, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300 hover:shadow-md">
                      <label className="block text-sm font-medium text-purple-300 mb-3 leading-relaxed">{idx + 1}. {q}</label>
                      <textarea value={answers[idx]} onChange={(e) => { const n = [...answers]; n[idx] = e.target.value; setAnswers(n); }} placeholder="Write your detailed answer here..." className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm hover:border-white/20 focus:ring-2 focus:ring-purple-500/50 outline-none resize-none min-h-[100px] placeholder:text-gray-600 transition-all shadow-inner" />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={isLoading} className="w-full shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Launch AI Agent</>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* --- TAB: KNOWLEDGE BASE --- */}
      {activeTab === 'knowledge' && hasAgent && (
        <motion.div key="knowledge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 lg:space-y-8 max-w-2xl mx-auto lg:mx-0">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Train your Agent</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Upload a PDF document to expand your AI's brain. It will instantly learn to reference your Resume, Menu, FAQs, or Portfolio data.</p>
          </div>
          
          <form onSubmit={handlePdfUpload} className="space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative group border-2 border-dashed rounded-3xl p-10 lg:p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${pdfFile ? 'border-purple-500 bg-purple-500/5 scale-[1.01]' : 'border-white/10 hover:border-purple-500/50 bg-white/5 hover:bg-purple-500/5 hover:scale-[1.01]'}`}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => setPdfFile(e.target.files[0])} accept="application/pdf" className="hidden" />
              
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${pdfFile ? 'bg-purple-500/20 text-purple-400 scale-110' : 'bg-white/10 text-gray-400 group-hover:bg-purple-500/20 group-hover:text-purple-400 group-hover:scale-110'}`}>
                <UploadCloud className="w-8 h-8" />
              </div>
              
              {pdfFile ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <p className="text-purple-300 font-semibold text-sm">{pdfFile.name}</p>
                  <p className="text-gray-500 text-xs">Ready to upload</p>
                </motion.div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-gray-200 font-semibold text-sm">Tap to upload or drag and drop</p>
                  <p className="text-gray-500 text-xs font-mono">PDF formats up to 5MB</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={!pdfFile || isLoading} className="w-full lg:w-auto px-8 bg-white hover:bg-gray-200 text-black font-bold py-4 lg:py-3.5 rounded-2xl lg:rounded-xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 shadow-lg hover:shadow-xl">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Process Knowledge Base'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* --- TAB: APPEARANCE (ULTRA PERSONALIZATION) --- */}
      {activeTab === 'theme' && hasAgent && (
        <motion.div key="theme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-8 lg:pb-0 relative">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Appearance</h2>
            <p className="text-gray-400 text-sm">Test different designs below. Click "Save" when you're ready.</p>
          </div>

          {/* Accent Color Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Palette className="w-4 h-4"/> Accent Color</h3>
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              {PRESET_COLORS.map(color => (
                <div 
                  key={color} 
                  onClick={() => handleDesignChange('primaryColor', color)}
                  className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center ${currentPrimaryColor === color ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)] ring-2 ring-white ring-offset-2 ring-offset-[#050505]' : 'hover:scale-110 hover:shadow-lg'}`}
                  style={{ backgroundColor: color }}
                >
                  {currentPrimaryColor === color && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                </div>
              ))}
              
              {/* Custom Hex Picker */}
              <div className={`relative w-10 h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 cursor-pointer flex items-center justify-center transition-all duration-300 ${!PRESET_COLORS.includes(currentPrimaryColor) ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#050505] border-transparent shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'border-white/20 hover:scale-110 hover:border-white/50'}`}>
                <div className="absolute inset-0 bg-[conic-gradient(red,yellow,green,cyan,blue,magenta,red)]" />
                <input 
                  type="color" 
                  value={currentPrimaryColor} 
                  onChange={(e) => handleDesignChange('primaryColor', e.target.value)}
                  className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0 z-10"
                  title="Choose Custom Color"
                />
                {!PRESET_COLORS.includes(currentPrimaryColor) && <Check className="w-5 h-5 text-white drop-shadow-md relative z-0" />}
              </div>
            </div>
          </div>

          {/* Typography Selection */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Type className="w-4 h-4"/> Typography</h3>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {FONTS.map(font => (
                <div 
                  key={font} 
                  onClick={() => handleDesignChange('fontFamily', font)}
                  className={`p-3 lg:p-4 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-300 ${currentFontFamily === font ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] scale-[1.02]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 text-gray-300 hover:scale-[1.02]'}`}
                  style={{ fontFamily: font }}
                >
                  <span className="text-sm lg:text-base">{font}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Theme Selection */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><Palette className="w-4 h-4"/> Base Theme</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
              {THEMES.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleDesignChange('theme', t.id)}
                  className={`relative p-1.5 rounded-3xl cursor-pointer transition-all duration-300 ${currentTheme === t.id ? 'bg-gradient-to-br from-purple-500 to-blue-500 scale-[1.03] shadow-[0_0_30px_rgba(168,85,247,0.3)]' : 'bg-white/5 hover:bg-white/10 active:scale-95'}`}
                >
                  <div className={`h-32 lg:h-40 rounded-[1.25rem] border border-white/10 flex flex-col items-center justify-center gap-3 transition-colors ${t.preview}`}>
                    <Palette className={`w-6 h-6 ${currentTheme === t.id ? 'opacity-100' : 'opacity-50'}`} />
                    <span className="font-semibold text-xs lg:text-sm tracking-wide text-center px-2">{t.name}</span>
                  </div>
                  {currentTheme === t.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-[#050505] rounded-full p-0.5 border border-white/10 shadow-lg">
                      <CheckCircle2 className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Layout Selection */}
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2"><LayoutPanelTop className="w-4 h-4"/> Header Layout</h3>
            <div className="grid grid-cols-3 gap-3">
              {LAYOUTS.map(l => (
                <div 
                  key={l.id} 
                  onClick={() => handleDesignChange('layout', l.id)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                    currentLayout === l.id ? 'border-purple-500 bg-purple-500/10 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] scale-[1.05]' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 text-gray-400 hover:scale-[1.02]'
                  }`}
                >
                  <l.icon className={`w-6 h-6 transition-colors duration-300 ${currentLayout === l.id ? 'text-purple-400' : 'text-gray-500'}`} />
                  <span className="text-xs font-semibold">{l.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STICKY SAVE BUTTON FOR UNSAVED CHANGES */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="sticky bottom-0 mt-8 p-4 lg:p-5 bg-[#18181b]/95 backdrop-blur-xl border border-purple-500/50 rounded-2xl shadow-[0_-10px_40px_rgba(168,85,247,0.2)] flex items-center justify-between z-40"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-500"/> Unsaved Changes</span>
                  <span className="text-[11px] lg:text-xs text-gray-400">Save to make your design public</span>
                </div>
                <button 
                  onClick={handleSaveDesign} 
                  disabled={isSavingDesign}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-50"
                >
                  {isSavingDesign ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4"/> Save Design</>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}

      {/* --- TAB: ANALYTICS REMAINS UNCHANGED --- */}
      {activeTab === 'analytics' && hasAgent && (
        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 lg:space-y-8 flex flex-col h-full relative">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Analytics & Insights</h2>
            <p className="text-gray-400 text-sm">Monitor how visitors interact with your agent.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 shrink-0">
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 lg:p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 w-fit mb-3"><User className="w-4 h-4 lg:w-5 lg:h-5" /></div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-0.5">{analytics?.stats?.totalVisitors || 0}</h3>
                <p className="text-gray-400 text-[10px] lg:text-xs font-medium uppercase tracking-wider">Visitors</p>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5 lg:p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/10 transition-all duration-300">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 w-fit mb-3"><MessageSquareText className="w-4 h-4 lg:w-5 lg:h-5" /></div>
              <div>
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-0.5">{analytics?.stats?.totalMessagesReceived || 0}</h3>
                <p className="text-gray-400 text-[10px] lg:text-xs font-medium uppercase tracking-wider">Messages</p>
              </div>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-white/5 border border-white/5 rounded-3xl p-5 lg:p-6 flex lg:flex-col justify-between items-center lg:items-start hover:bg-white/10 hover:border-white/10 transition-all duration-300">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 w-fit lg:mb-3"><Activity className="w-4 h-4 lg:w-5 lg:h-5" /></div>
              <div className="text-right lg:text-left">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-0.5">{analytics?.stats?.totalInteractions || 0}</h3>
                <p className="text-gray-400 text-[10px] lg:text-xs font-medium uppercase tracking-wider">AI Responses</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px] bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-inner">
            <div className="p-4 lg:p-5 border-b border-white/5 bg-black/20 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                Recent Chat Sessions 
                <span className="text-[10px] lg:text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded-md">Tap to view</span>
              </h3>
            </div>
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
            ) : analytics?.recentChats?.length > 0 ? (
              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
                {analytics.recentChats.map((chat, i) => (
                  <div key={i} onClick={() => setSelectedChat(chat)} className="p-4 lg:p-5 hover:bg-white/10 transition-colors group cursor-pointer active:bg-white/5">
                    <div className="flex justify-between items-center mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        <span className="text-xs text-gray-400 font-mono">ID: {chat.visitorId.slice(0, 8)}..</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {chat.messages.length} Events
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-1 border-l-2 border-gray-600 pl-3 group-hover:border-purple-400 transition-colors">
                      "{chat.messages.find(m => m.role === 'user')?.content || 'Started chat session...'}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-50">
                <MessageSquareText className="w-10 h-10 mb-3 text-gray-500" />
                <p className="text-sm font-medium text-gray-400">No visitor chats recorded yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white flex flex-col relative font-sans overflow-hidden">
      
      {/* GLOBAL STYLES FOR HIDDEN SCROLLBARS */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* ========================================================================= */}
      {/* MOBILE SPLIT SCREEN LAYOUT                                                */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col h-[100dvh] bg-[#050505] relative z-10 overflow-hidden">
        
        {hasAgent && (
          <div className="flex items-center justify-between px-5 py-3 bg-[#0F0F12] border-b border-white/10 shrink-0 relative z-40">
            <h1 className="text-lg font-extrabold flex items-center gap-2">
              <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-6 h-6 rounded-full object-cover border border-white/10" /> Dealit AI
            </h1>
            <button 
              onClick={copyToClipboard} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all text-[11px] font-semibold tracking-wide border border-white/5"
            >
              {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5 text-white" />} 
              Share
            </button>
          </div>
        )}

        {/* Live Preview Area */}
        {hasAgent ? (
          <div className="flex-1 relative overflow-hidden bg-[#050505]">
            <iframe 
              key={previewRefreshKey}
              src={iframeSrc} 
              className="w-full h-full border-none bg-transparent"
              title="Agent Preview Mobile"
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 no-scrollbar">
             {renderTabContent()}
          </div>
        )}

        <AnimatePresence>
          {hasAgent && !isMobileSheetOpen && (
            <motion.button
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={() => setIsMobileSheetOpen(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-3.5 rounded-full text-sm font-bold shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_10px_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all duration-300"
            >
              {hasUnsavedChanges ? <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span></span> : null}
              <Palette className="w-4 h-4" /> Customize
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hasAgent && isMobileSheetOpen && (
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.2}
              onDragEnd={(e, info) => { if (info.offset.y > 100 || info.velocity.y > 500) setIsMobileSheetOpen(false); }}
              className="absolute bottom-0 left-0 w-full h-[65vh] min-h-[400px] bg-[#0F0F12] border-t border-white/10 rounded-t-[1.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.8)] flex flex-col z-50"
            >
              <div className="w-full flex items-center justify-between pt-4 pb-2 px-5 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-8 h-8" />
                <div className="w-12 h-1.5 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" />
                <button 
                  onClick={() => setIsMobileSheetOpen(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="flex overflow-x-auto no-scrollbar px-6 gap-6 border-b border-white/10 shrink-0">
                 {TABS.map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`pb-3 pt-1 text-[13px] font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
                       activeTab === tab.id 
                         ? 'text-white border-white' 
                         : 'text-gray-500 border-transparent hover:text-gray-300'
                     }`}
                   >
                     <tab.icon className="w-4 h-4" />
                     {tab.label}
                   </button>
                 ))}
              </div>

              <div 
                className="flex-1 overflow-y-auto p-6 no-scrollbar pb-12"
                onPointerDown={(e) => e.stopPropagation()} 
              >
                 {renderTabContent()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT                                                            */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 w-full max-w-[1600px] mx-auto overflow-hidden relative z-10 py-6 px-8 gap-8">
        
        {/* LEFT SIDEBAR */}
        {hasAgent && (
          <div className="w-64 flex flex-col gap-2 shrink-0 h-full bg-[#0F0F12]/50 backdrop-blur-xl rounded-3xl border border-white/10 p-4 shadow-2xl">
            <div className="mb-6 px-2 shrink-0 mt-2">
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-7 h-7 rounded-full object-cover shadow-[0_0_10px_rgba(163,136,225,0.15)] border border-white/10" />
                Dealit AI
              </h1>
              <p className="text-xs text-gray-400 mt-1 pl-9">Agent Dashboard</p>
            </div>

            <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto no-scrollbar">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative w-full flex items-center gap-3 py-3.5 px-4 rounded-2xl text-sm font-semibold transition-all group ${
                    activeTab === tab.id 
                      ? 'bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-inner' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`} /> 
                  {tab.label}
                  {tab.id === 'theme' && hasUnsavedChanges && (
                     <span className="absolute top-3 right-3 flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                     </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
              <button onClick={copyToClipboard} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-semibold border border-white/10 active:scale-95 group">
                {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />} 
                {isCopied ? 'Link Copied!' : 'Copy Public Link'}
              </button>
            </div>
          </div>
        )}

        {/* CENTER CONTENT AREA */}
        <div className={`flex-1 flex flex-col h-full overflow-y-auto no-scrollbar ${!hasAgent ? 'max-w-4xl mx-auto w-full' : ''}`}>
          <div className={`w-full h-full bg-[#0F0F12]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto no-scrollbar ${!hasAgent ? 'bg-transparent border-none p-0' : ''}`}>
            {renderTabContent()}
          </div>
        </div>

        {/* RIGHT SIDEBAR: LIVE PREVIEW */}
        {hasAgent && (
           <div className="w-[320px] xl:w-[360px] flex flex-col items-center justify-center shrink-0 h-full py-4 relative">
             <div className="w-full flex justify-between items-center mb-4 px-1 shrink-0">
               <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 Live Preview
               </h3>
               <button 
                 onClick={() => setPreviewRefreshKey(k => k + 1)} 
                 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors text-gray-400 hover:text-white border border-white/10 active:scale-95"
               >
                 <RefreshCw className="w-3 h-3" /> Reload
               </button>
             </div>
             
             {/* Dynamic iPhone Mockup */}
             <div className="w-full flex-1 max-h-[750px] min-h-[500px] rounded-[2.5rem] border-[10px] border-[#18181b] bg-[#050505] overflow-hidden shadow-2xl relative transition-all duration-300">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[25px] bg-[#18181b] rounded-b-2xl z-50 pointer-events-none flex justify-center items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#111] absolute right-4"></div>
                </div>
                <iframe 
                  key={previewRefreshKey}
                  src={iframeSrc} 
                  className="w-full h-full border-none bg-transparent transition-opacity duration-500"
                  title="Agent Preview"
                />
             </div>
           </div>
        )}
      </div>

      {/* CHAT VIEW MODAL (For Analytics) */}
      <AnimatePresence>
        {selectedChat && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute inset-x-0 bottom-0 top-[10%] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 flex flex-col bg-[#0F0F12]/95 lg:w-full lg:max-w-xl lg:h-[80vh] lg:rounded-3xl rounded-t-3xl border border-white/10 overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,0.5)] lg:shadow-2xl backdrop-blur-2xl"
          >
             {/* ... [ANALYTICS MODAL REMAINS UNCHANGED] ... */}
             <div className="p-4 lg:p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" /> Visitor History
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {selectedChat.visitorId}</p>
              </div>
              <button onClick={() => setSelectedChat(null)} className="p-2 bg-white/5 hover:bg-white/10 active:scale-95 rounded-full transition-all">
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 no-scrollbar pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {selectedChat.messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] lg:max-w-[80%] p-3.5 lg:p-4 text-[13px] lg:text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-purple-600/20 border border-purple-500/30 text-purple-100 rounded-2xl rounded-tr-sm shadow-sm' 
                      : 'bg-white/5 border border-white/10 text-gray-300 rounded-2xl rounded-tl-sm shadow-sm'
                  }`}>
                    <span className="block text-[10px] uppercase font-bold tracking-wider mb-1.5 opacity-50">
                      {msg.role === 'user' ? 'Visitor' : 'AI Agent'}
                    </span>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CreateAIPage;