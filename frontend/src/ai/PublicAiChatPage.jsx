import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, AlertCircle, RefreshCw, Copy, CheckCircle2 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';

// 1. Lazy load the Creator Studio
const CreatorStudio = lazy(() => import('./CreatorStudio'));

const API_BASE = import.meta.env.VITE_BACKEND_API;

const themeConfig = {
  'midnight-glass': {
    wrapper: 'bg-[#0c0c0c] border-gray-800/80 sm:shadow-2xl text-white',
    glowTop: 'bg-purple-600/15 via-purple-600/5',
    userBubble: 'bg-gradient-to-br from-gray-100 to-gray-300 text-black',
    botBubble: 'bg-[#181818] text-gray-200 border border-gray-800/80',
    inputWrap: 'bg-[#1A1A1A] border-gray-700/80 focus-within:border-purple-500/50',
    inputText: 'text-white placeholder-gray-500',
    inputBtn: 'bg-white text-black hover:bg-gray-200',
    tag: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
  'minimal-snow': {
    wrapper: 'bg-[#f8fafc] border-gray-200 sm:shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-gray-900',
    glowTop: 'bg-transparent via-transparent',
    userBubble: 'bg-blue-600 text-white shadow-sm',
    botBubble: 'bg-white text-gray-800 border border-gray-200 shadow-sm',
    inputWrap: 'bg-white border-gray-300 focus-within:border-blue-500 shadow-sm',
    inputText: 'text-gray-900 placeholder-gray-400',
    inputBtn: 'bg-blue-600 text-white hover:bg-blue-700',
    tag: 'text-blue-600 bg-blue-500/10 border-blue-500/20'
  },
  'cyberpunk-neon': {
    wrapper: 'bg-black border-cyan-500/50 sm:shadow-[0_0_30px_rgba(6,182,212,0.15)] text-cyan-50',
    glowTop: 'bg-pink-600/10 via-cyan-600/5',
    userBubble: 'bg-pink-600 text-white shadow-[0_0_10px_rgba(219,39,119,0.3)]',
    botBubble: 'bg-black text-cyan-300 border border-cyan-500/50 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]',
    inputWrap: 'bg-black border-pink-500/50 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    inputText: 'text-cyan-300 placeholder-cyan-800',
    inputBtn: 'bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
    tag: 'text-pink-400 bg-pink-500/10 border-pink-500/30 shadow-[0_0_10px_rgba(219,39,119,0.2)]'
  }
};

const PublicAiChatPage = ({ user }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visitorId, setVisitorId] = useState('');

  // Ownership State
  const [isOwner, setIsOwner] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    let vid = localStorage.getItem('dealit_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('dealit_visitor_id', vid);
    }
    setVisitorId(vid);
  }, []);

  // Fetch AI Profile Details
// Fetch AI Profile Details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        // NEW: Check if token exists in localStorage
        const token = localStorage.getItem('dealit_token'); 
        
        // NEW: Send token in headers if it exists
        const res = await axios.get(`${API_BASE}/api/personal-ai/profile/${username}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data.success) {
          setProfile(res.data.data);
          setMessages([
            { id: 'greet', role: 'assistant', content: `Hi there! I'm the AI assistant for **${res.data.data.creatorName}**. How can I help you today?` }
          ]);
          
          // Check Ownership
          if (user && (user.username === username || user._id === res.data.data.creatorId)) {
            setIsOwner(true);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "AI Agent not found or inactive.");
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [username, user]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setIsTyping(true);

    const ts = Date.now();
    const botMsgId = `bot_${ts}`;

    setMessages(prev => [
      ...prev, 
      { id: `user_${ts}`, role: 'user', content: userMessage },
      { id: botMsgId, role: 'assistant', content: '', isStreaming: true }
    ]);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/personal-ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, aiId: profile.aiId, visitorId }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botReply = '';
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            botReply += parsed.content;
            setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: botReply } : m));
          } catch (e) {}
        }
      }
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: `⚠️ ${err.message}`, isStreaming: false } : m));
    } finally {
      setIsTyping(false);
    }
  };

  const copyPageLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoadingProfile) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-50">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center p-6 text-center z-50">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">AI Profile Unavailable</h1>
        <p className="text-gray-400">{error || "This link seems to be broken."}</p>
      </div>
    );
  }

  const theme = profile.theme || 'midnight-glass';
  const style = themeConfig[theme] || themeConfig['midnight-glass'];

  return (
    <div className={`fixed inset-0 flex justify-center items-center z-[100] selection:bg-purple-500/30 font-sans ${theme === 'minimal-snow' ? 'bg-slate-200' : 'bg-[#050505]'}`}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Background Glows */}
      {theme !== 'minimal-snow' && (
        <>
          <div className="hidden sm:block absolute top-[15%] left-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="hidden sm:block absolute bottom-[15%] right-[20%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Main Responsive Phone View Box */}
      <div className={`w-full h-[100dvh] sm:h-[90dvh] sm:max-h-[850px] sm:max-w-[420px] sm:rounded-[2.5rem] sm:border flex flex-col relative overflow-hidden z-10 transition-colors duration-500 ${style.wrapper}`}>
        
        <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b to-transparent pointer-events-none z-0 ${style.glowTop}`} />

        {/* Profile Header */}
        <div className="pt-10 pb-4 px-6 flex flex-col items-center shrink-0 z-10 relative">
          
          {/* Subtle Copy Link Button (Moved here since top bar is removed) */}
          <button 
            onClick={copyPageLink}
            className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 border border-white/10 rounded-full backdrop-blur-md transition-all text-gray-300"
            title="Copy Profile Link"
          >
            {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 mb-3 shadow-lg">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 border-2 border-transparent">
              <img src={profile.creatorPic || "https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg"} alt={profile.creatorName} className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-lg font-bold mb-1 tracking-wide">@{profile.username}</h1>
          <div className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wider px-3 py-1 rounded-full border uppercase ${style.tag}`}>
            <Sparkles className="w-3 h-3" /> AI Agent
          </div>
        </div>

        {/* Chat Scroll Container */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-5 no-scrollbar z-10">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] px-4 py-3.5 text-sm leading-relaxed ${msg.role === 'user' ? `rounded-2xl rounded-tr-sm font-medium ${style.userBubble}` : `rounded-2xl rounded-tl-sm ${style.botBubble}`}`}
                  style={{ wordBreak: 'break-word' }}
                >
                  {msg.role === 'assistant' ? (
                    msg.content === '' && msg.isStreaming ? (
                      <div className="flex gap-1.5 items-center h-5 px-1">
                        <span className="w-1.5 h-1.5 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0s'}} />
                        <span className="w-1.5 h-1.5 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.15s'}} />
                        <span className="w-1.5 h-1.5 bg-current opacity-60 rounded-full animate-bounce" style={{ animationDelay: '0.3s'}} />
                      </div>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2.5 last:mb-0" {...props} />,
                          a: ({node, ...props}) => <a className="underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity" target="_blank" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <div className={`p-4 shrink-0 bg-gradient-to-t to-transparent z-20 pb-safe ${theme === 'minimal-snow' ? 'from-[#f8fafc] via-[#f8fafc]' : 'from-[#0c0c0c] via-[#0c0c0c]'}`}>
          <form onSubmit={handleSendMessage} className={`relative flex items-center border rounded-full p-1.5 transition-colors ${style.inputWrap}`}>
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Message..." disabled={isTyping}
              className={`flex-1 bg-transparent border-none outline-none text-[15px] px-4 disabled:opacity-50 ${style.inputText}`}
            />
            <button 
              type="submit" disabled={isTyping || !input.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 shrink-0 ${style.inputBtn}`}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          
          <div className="text-center mt-4 mb-1">
            <a href="https://dealiit.com" target="_blank" rel="noreferrer" className="text-[10px] text-gray-500 hover:text-gray-400 transition-colors font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
              Powered by <span className="font-bold flex items-center gap-0.5 opacity-80"><Sparkles className="w-2.5 h-2.5"/> Dealit AI</span>
            </a>
          </div>
        </div>

      </div>

      {/* 2. End of component - Portal/Lazy Component Trigger */}
      {isOwner && profile && (
        <Suspense fallback={null}>
           <CreatorStudio 
             profile={profile} 
             setProfile={setProfile} 
             username={username}
             initialPrompt={profile.finalSystemPrompt || ""} 
           />
        </Suspense>
      )}

    </div>
  );
};

export default PublicAiChatPage;