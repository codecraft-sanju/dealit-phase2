import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, Bot, Link as LinkIcon, CheckCircle2, Copy, 
  ArrowLeft, Loader2, Check, ExternalLink, Lightbulb, User, 
  MessageSquareText, Globe, FileText, UploadCloud, Palette, BarChart3, Activity
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BACKEND_API;

const PROMPT_IDEAS = [
  "An AI assistant for my freelance web design portfolio to share pricing and availability.",
  "A clone AI that answers questions about my startup product features, tech stack, and roadmap.",
  "A personal booking assistant that helps clients understand my services and contact details."
];

const THEMES = [
  { id: 'midnight-glass', name: 'Midnight Glass', preview: 'bg-[#0c0c0c] border-gray-700 text-purple-400' },
  { id: 'minimal-snow', name: 'Minimal Snow', preview: 'bg-slate-50 border-gray-300 text-gray-800' },
  { id: 'cyberpunk-neon', name: 'Cyberpunk Neon', preview: 'bg-black border-pink-500 text-cyan-400' }
];

const CreateAIPage = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('wizard');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Wizard Form Data
  const [baseIdea, setBaseIdea] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [finalLink, setFinalLink] = useState('');

  // New Features Data
  const [pdfFile, setPdfFile] = useState(null);
  const [currentTheme, setCurrentTheme] = useState('midnight-glass');
  const [analytics, setAnalytics] = useState(null);
  const fileInputRef = useRef(null);

  // Load Analytics
  useEffect(() => {
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab]);

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

  // --- WIZARD HANDLERS ---
  const handleInitAI = async (e) => {
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
        setFinalLink(`${window.location.origin}/ai/${username}`);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to compile AI");
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW FEATURES HANDLERS ---
  const handlePdfUpload = async (e) => {
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

  const handleUpdateTheme = async (themeId) => {
    setCurrentTheme(themeId);
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.put(`${API_BASE}/api/personal-ai/theme`, { theme: themeId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Theme updated!");
    } catch (err) {
      toast.error("Failed to update theme");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalLink);
    setIsCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center p-4 md:p-8 relative overflow-hidden font-sans pt-20">
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* TABS HEADER */}
      <div className="w-full max-w-4xl mb-6 flex gap-2 overflow-x-auto no-scrollbar relative z-20 bg-[#0F0F12]/80 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
        {[
          { id: 'wizard', icon: Bot, label: 'Setup Wizard' },
          { id: 'knowledge', icon: FileText, label: 'Knowledge Base' },
          { id: 'theme', icon: Palette, label: 'Appearance' },
          { id: 'analytics', icon: BarChart3, label: 'Analytics' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div layout className="w-full max-w-4xl bg-[#0F0F12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10 min-h-[500px]">
        
        {/* --- TAB: WIZARD --- */}
        {activeTab === 'wizard' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2">Create Your AI Agent</h1>
              <p className="text-gray-400 text-sm">Train a custom interactive AI agent for your bio link in minutes.</p>
            </div>
            {/* Step Progress & Wizard Forms (Reusing existing smooth logic) */}
            <div className="flex items-center justify-center gap-3 mb-8 max-w-xs mx-auto">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    step === s ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30' : step > s ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/5'
                  }`}>
                    {step > s ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 3 && <div className={`flex-1 h-[2px] rounded-full ${step > s ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleInitAI} className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-2"><MessageSquareText className="w-4 h-4 text-purple-400" /> What should your AI do?</label>
                    <textarea value={baseIdea} maxLength={300} onChange={(e) => setBaseIdea(e.target.value)} placeholder="Describe your AI's persona..." className="w-full bg-[#141419] border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none h-32 text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400" /> Custom Bio Handle</label>
                    <div className="flex items-center bg-[#141419] border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50">
                      <span className="pl-4 pr-1 text-gray-500 text-xs font-mono flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> {window.location.host}/ai/</span>
                      <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="username" className="w-full bg-transparent p-3.5 pl-1 text-white text-sm font-mono outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 rounded-2xl hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Next Step</>}
                  </button>
                </motion.form>
              )}
              {step === 2 && (
                <motion.form key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmitAnswers} className="space-y-5">
                  <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                    {questions.map((q, idx) => (
                      <div key={idx} className="bg-[#141419] border border-white/5 rounded-2xl p-4">
                        <label className="block text-xs font-medium text-gray-200 mb-2">{q}</label>
                        <textarea value={answers[idx]} onChange={(e) => { const n = [...answers]; n[idx] = e.target.value; setAnswers(n); }} placeholder="Your answer..." className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl p-3 text-white text-xs focus:ring-1 focus:ring-purple-500 outline-none resize-none min-h-[75px]" />
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm disabled:opacity-50 hover:from-emerald-400 hover:to-teal-400">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Compile Agent <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.form>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-4">Your AI is Live!</h2>
                  <div className="bg-[#141419] border border-white/10 p-3 rounded-xl flex items-center justify-between mb-6">
                    <span className="text-purple-300 font-mono text-xs">{finalLink}</span>
                    <button onClick={copyToClipboard} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"><Copy className="w-4 h-4" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* --- TAB: KNOWLEDGE BASE --- */}
        {activeTab === 'knowledge' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Upload Knowledge Base</h2>
              <p className="text-gray-400 text-sm">Upload a PDF (Resume, Menu, Portfolio) to give your AI specific context.</p>
            </div>
            <form onSubmit={handlePdfUpload} className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${pdfFile ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:border-white/40 bg-white/5'}`}
              >
                <input type="file" ref={fileInputRef} onChange={(e) => setPdfFile(e.target.files[0])} accept="application/pdf" className="hidden" />
                <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${pdfFile ? 'text-purple-400' : 'text-gray-500'}`} />
                {pdfFile ? (
                  <p className="text-purple-300 font-medium text-sm">{pdfFile.name}</p>
                ) : (
                  <>
                    <p className="text-gray-300 font-medium text-sm mb-1">Click to upload or drag and drop</p>
                    <p className="text-gray-500 text-xs">PDF up to 5MB</p>
                  </>
                )}
              </div>
              <button type="submit" disabled={!pdfFile || isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Process PDF'}
              </button>
            </form>
          </motion.div>
        )}

        {/* --- TAB: APPEARANCE (THEMES) --- */}
        {activeTab === 'theme' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select a Theme</h2>
              <p className="text-gray-400 text-sm">Customize how your public AI page looks to visitors.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {THEMES.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleUpdateTheme(t.id)}
                  className={`relative p-1 rounded-2xl cursor-pointer transition-all ${currentTheme === t.id ? 'bg-gradient-to-br from-purple-500 to-blue-500 scale-105 shadow-xl shadow-purple-500/25' : 'bg-transparent hover:bg-white/5 scale-100'}`}
                >
                  <div className={`h-40 rounded-xl border-2 flex items-center justify-center ${t.preview}`}>
                    <span className="font-bold">{t.name}</span>
                  </div>
                  {currentTheme === t.id && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1"><CheckCircle2 className="w-5 h-5" /></div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- TAB: ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#141419] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><User className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-sm">Total Visitors</p>
                  <h3 className="text-2xl font-bold text-white">{analytics?.stats?.totalVisitors || 0}</h3>
                </div>
              </div>
              <div className="bg-[#141419] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><MessageSquareText className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-sm">Messages Received</p>
                  <h3 className="text-2xl font-bold text-white">{analytics?.stats?.totalMessagesReceived || 0}</h3>
                </div>
              </div>
              <div className="bg-[#141419] border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Activity className="w-6 h-6" /></div>
                <div>
                  <p className="text-gray-400 text-sm">AI Responses</p>
                  <h3 className="text-2xl font-bold text-white">{analytics?.stats?.totalInteractions || 0}</h3>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-4">Recent Chat Sessions</h3>
              <div className="bg-[#141419] border border-white/10 rounded-2xl overflow-hidden">
                {isLoading ? (
                  <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
                ) : analytics?.recentChats?.length > 0 ? (
                  <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                    {analytics.recentChats.map((chat, i) => (
                      <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-gray-400 font-mono">Visitor: {chat.visitorId.slice(0, 8)}...</span>
                          <span className="text-xs text-purple-400">{chat.messages.length} msgs</span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-1 border-l-2 border-gray-600 pl-2">
                          "{chat.messages.find(m => m.role === 'user')?.content || 'Started chat...'}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center text-gray-500 text-sm">No visitor chats recorded yet.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
};

export default CreateAIPage;