import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, AlertCircle, RefreshCw, Copy, CheckCircle2, 
  Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';

const CreatorStudio = lazy(() => import('./CreatorStudio'));

const API_BASE = import.meta.env.VITE_BACKEND_API;

const themeConfig = {
  'midnight-glass': {
    wrapper: 'bg-[#0c0c0c] border-gray-800/80 sm:shadow-2xl text-white',
    botBubble: 'bg-[#181818] text-gray-200 border border-gray-800/80',
    inputWrap: 'bg-[#1A1A1A] border-gray-700/80',
    inputText: 'text-white placeholder-gray-500',
  },
  'minimal-snow': {
    wrapper: 'bg-[#f8fafc] border-gray-200 sm:shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-gray-900',
    botBubble: 'bg-white text-gray-800 border border-gray-200 shadow-sm',
    inputWrap: 'bg-white border-gray-300 shadow-sm',
    inputText: 'text-gray-900 placeholder-gray-400',
  },
  'cyberpunk-neon': {
    wrapper: 'bg-black border-[var(--ai-primary-50)] sm:shadow-[0_0_30px_var(--ai-primary-20)] text-cyan-50',
    botBubble: 'bg-black text-gray-200 border border-[var(--ai-primary-50)]',
    inputWrap: 'bg-black border-[var(--ai-primary-50)]',
    inputText: 'text-cyan-300 placeholder-cyan-800',
  }
};

const PublicAiChatPage = ({ user }) => {
  const { username } = useParams();
  const location = useLocation(); 
  
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visitorId, setVisitorId] = useState('');

  const [isOwner, setIsOwner] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Voice Features States
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Controls Text-to-Speech

  const queryParams = new URLSearchParams(location.search);
  const isPreviewMode = queryParams.get('preview') === 'true';

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let vid = localStorage.getItem('dealit_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now();
      localStorage.setItem('dealit_visitor_id', vid);
    }
    setVisitorId(vid);

    // Initialize Web Speech API for Mic
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Default to English, change to 'hi-IN' if you want Hindi priority

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Clean Markdown & Speak Function (Text-to-Speech)
  const speakAIResponse = (text) => {
    if (!isVoiceMode || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Remove Markdown formatting so it sounds natural (*, #, _, etc.)
    const cleanText = text.replace(/([*#_`~>])/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Stop TTS if user starts speaking
      window.speechSynthesis?.cancel();
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      window.speechSynthesis?.cancel(); // Stop talking immediately if turned off
    }
    setIsVoiceMode(!isVoiceMode);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const token = localStorage.getItem('dealit_token'); 
        
        const res = await axios.get(`${API_BASE}/api/personal-ai/profile/${username}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data.success) {
          setProfile(res.data.data);
          const greetingMsg = `Hi there! I'm the AI assistant for **${res.data.data.creatorName}**. How can I help you today?`;
          setMessages([{ id: 'greet', role: 'assistant', content: greetingMsg }]);
          
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
    
    // Cleanup Speech Synth on unmount
    return () => window.speechSynthesis?.cancel();
  }, [username, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    // Stop listening/speaking if new message is sent
    if (isListening) recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();

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
      
      // AI Finished Streaming -> Speak Response if Voice Mode is ON
      speakAIResponse(botReply);

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

  const theme = (isPreviewMode ? queryParams.get('theme') : null) || profile.theme || 'midnight-glass';
  const layout = (isPreviewMode ? queryParams.get('layout') : null) || profile.layout || 'center'; 
  const primaryColor = (isPreviewMode ? queryParams.get('primaryColor') : null) || profile.primaryColor || '#A855F7';
  const fontFamily = (isPreviewMode ? queryParams.get('fontFamily') : null) || profile.fontFamily || 'Inter';
  
  const style = themeConfig[theme] || themeConfig['midnight-glass'];
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;

  return (
    <div className={`fixed inset-0 flex justify-center items-center z-[100] font-sans ${theme === 'minimal-snow' ? 'bg-slate-200' : 'bg-[#050505]'}`}>
      
      <style>{`
        @import url('${fontUrl}');
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        :root {
          --ai-primary: ${primaryColor};
          --ai-primary-10: ${primaryColor}1A;
          --ai-primary-20: ${primaryColor}33;
          --ai-primary-50: ${primaryColor}80;
        }

        .ai-font-custom {
          font-family: '${fontFamily}', sans-serif;
        }
      `}</style>

      {theme !== 'minimal-snow' && (
        <>
          <div className="hidden sm:block absolute top-[15%] left-[20%] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none transition-colors duration-700" style={{ backgroundColor: 'var(--ai-primary-20)' }} />
          <div className="hidden sm:block absolute bottom-[15%] right-[20%] w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none transition-colors duration-700" style={{ backgroundColor: 'var(--ai-primary-20)' }} />
        </>
      )}

      <div className={`w-full h-[100dvh] sm:h-[90dvh] sm:max-h-[850px] sm:max-w-[420px] sm:rounded-[2.5rem] sm:border flex flex-col relative overflow-hidden z-10 transition-all duration-500 ai-font-custom ${style.wrapper}`}>
        
        <div className={`absolute top-0 left-0 right-0 h-48 bg-gradient-to-b to-transparent pointer-events-none z-0 transition-colors duration-500`} style={{ backgroundImage: `linear-gradient(to bottom, var(--ai-primary-10), transparent)` }} />

        <div className={`pt-10 pb-4 px-6 flex shrink-0 z-10 relative transition-all duration-500 ${
          layout === 'left' ? 'flex-row items-center justify-start gap-4 text-left' :
          layout === 'right' ? 'flex-row-reverse items-center justify-start gap-4 text-right' :
          'flex-col items-center justify-center text-center'
        }`}>
          
          {/* Header Controls (Copy Link & Voice Toggle) */}
          <div className={`absolute top-6 ${layout === 'right' ? 'left-6' : 'right-6'} flex items-center gap-2 z-20`}>
            {/* Voice Toggle Button */}
            <button 
              onClick={toggleVoiceMode}
              className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-95 border ${isVoiceMode ? 'bg-[var(--ai-primary)] text-white border-[var(--ai-primary)] shadow-[0_0_15px_var(--ai-primary-50)]' : 'bg-black/20 hover:bg-black/40 text-gray-300 border-white/10 hover:shadow-lg'}`}
              title={isVoiceMode ? "Voice Response ON" : "Voice Response OFF"}
            >
              {isVoiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {!isPreviewMode && (
              <button 
                onClick={copyPageLink}
                className="p-2 bg-black/20 hover:bg-black/40 border border-white/10 rounded-full backdrop-blur-md transition-all active:scale-95 text-gray-300 hover:shadow-lg"
                title="Copy Profile Link"
              >
                {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className={`w-20 h-20 shrink-0 rounded-full p-[3px] shadow-[0_0_20px_var(--ai-primary-20)] transition-all duration-500 hover:scale-105 ${layout === 'center' ? 'mb-3' : ''}`} style={{ background: `linear-gradient(to bottom right, var(--ai-primary), var(--ai-primary-50))` }}>
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 border-2 border-transparent">
              <img src={profile.creatorPic || "https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg"} alt={profile.creatorName} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            </div>
          </div>
          
          <div className={`flex flex-col ${layout === 'left' ? 'items-start' : layout === 'right' ? 'items-end' : 'items-center'}`}>
            <h1 className="text-lg font-bold mb-1 tracking-wide">@{profile.username}</h1>
            <div 
              className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider px-3 py-1 rounded-full border uppercase shadow-sm transition-colors duration-500"
              style={{ color: 'var(--ai-primary)', backgroundColor: 'var(--ai-primary-10)', borderColor: 'var(--ai-primary-20)' }}
            >
              <Sparkles className="w-3 h-3" /> AI Agent
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-5 no-scrollbar z-10">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] px-4 py-3.5 text-sm leading-relaxed break-words ${msg.role === 'user' ? 'rounded-2xl rounded-tr-sm font-medium shadow-md' : `rounded-2xl rounded-tl-sm ${style.botBubble}`}`}
                  style={msg.role === 'user' ? { backgroundColor: 'var(--ai-primary)', color: '#fff' } : {}}
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

        <div className={`p-4 shrink-0 bg-gradient-to-t to-transparent z-20 pb-safe ${theme === 'minimal-snow' ? 'from-[#f8fafc] via-[#f8fafc]' : 'from-[#0c0c0c] via-[#0c0c0c]'}`}>
          <form 
            onSubmit={handleSendMessage} 
            className={`relative flex items-center border rounded-full p-1.5 transition-colors duration-300 hover:shadow-[0_0_15px_var(--ai-primary-20)] focus-within:ring-1 focus-within:shadow-[0_0_15px_var(--ai-primary-20)] ${style.inputWrap}`}
            style={{ '--tw-ring-color': 'var(--ai-primary)' }}
          >
            {/* STT Mic Button */}
            {window.SpeechRecognition || window.webkitSpeechRecognition ? (
              <button 
                type="button" 
                onClick={toggleListening}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:text-[var(--ai-primary)] hover:bg-[var(--ai-primary-10)]'}`}
                title="Hold to Speak"
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            ) : null}

            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Message..."} disabled={isTyping}
              className={`flex-1 bg-transparent border-none outline-none text-[15px] px-3 disabled:opacity-50 ${style.inputText} ${isListening ? 'text-[var(--ai-primary)] placeholder-[var(--ai-primary)]' : ''}`}
            />
            
            <button 
              type="submit" disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0 text-white shadow-lg"
              style={{ backgroundColor: 'var(--ai-primary)' }}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>

      </div>

      {isOwner && profile && !isPreviewMode && (
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