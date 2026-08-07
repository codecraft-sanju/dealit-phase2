import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Sparkles, Plus, Settings, HelpCircle, MessageSquare, X, Trash2,
  Minimize2, ChevronDown, Mic, User, WifiOff, Check, Unlock, Code, Image as ImageIcon, Wand2 // CHANGED: Imported Wand2 for Create AI button
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

import {
  SharedStyles, MagicPoints,
  SUGGESTIONS, extractCarouselFromReply,
  TypingLoader, SoundWave,
  BotMessage, BotUIBlock, MessageFooter,
  ImageGenLoader, BotImageMessage 
} from './AiChatShared';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL  = `${API_BASE}/api`;

const CODE_SUGGESTIONS = [
  "Write a React functional component for a login form",
  "Explain how MongoDB aggregation pipelines work",
  "Write a Node.js Express route with error handling",
  "How do I fix a CORS error in my API?"
];

const GENERAL_SUGGESTIONS = [
  "Explain quantum computing simply",
  "Give me a 3 day workout plan",
  "Write a short story about space",
  "What are some healthy dinner ideas?"
];

const IMAGE_SUGGESTIONS = [
  "A detailed photorealistic cyberpunk anime portrait",
  "Cinematic 3D motion graphics of a tech gadget",
  "A futuristic smart city rendered in Octane",
  "Premium commercial product photography of a watch"
];

const SidebarTooltip = ({ text }) => (
  <div className="absolute left-full ml-4 px-3.5 py-2 bg-[#e5e7eb] text-gray-900 text-[13px] font-bold tracking-wide rounded-[10px] opacity-0 group-hover:opacity-100 pointer-events-none z-[100] whitespace-nowrap shadow-lg transition-all duration-200 translate-x-[-8px] group-hover:translate-x-0 flex items-center">
    {text}
    <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#e5e7eb] rotate-45 rounded-[1px]" />
  </div>
);

const PaymentCarLoader = () => (
  <>
    <style>{`
      .payment-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 10, 10, 0.9); backdrop-filter: blur(12px);
        z-index: 105; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; overflow: hidden;
      }

      .pay-car {
        position: absolute; top: 50%; left: 50%; margin-left: -50px;
        animation: pay-speeder 0.4s linear infinite; z-index: 10;
      }

      .pay-car > span {
        height: 5px; width: 35px; background: #f51313; position: absolute;
        top: -19px; left: 60px; border-radius: 2px 10px 1px 0;
      }

      .pay-base span {
        position: absolute; width: 0; height: 0;
        border-top: 6px solid transparent; border-right: 100px solid #f3cfcf;
        border-bottom: 6px solid transparent;
      }

      .pay-base span:before {
        content: ""; height: 22px; width: 22px; border-radius: 50%;
        background: #f3cfcf; position: absolute; right: -110px; top: -16px;
      }

      .pay-base span:after {
        content: ""; position: absolute; width: 0; height: 0;
        border-top: 0 solid transparent; border-right: 55px solid #f3cfcf;
        border-bottom: 16px solid transparent; top: -16px; right: -98px;
      }

      .pay-face {
        position: absolute; height: 12px; width: 20px;
        background: #f3cfcf; border-radius: 20px 20px 0 0;
        transform: rotate(-40deg); right: -125px; top: -15px;
      }

      .pay-face:after {
        content: ""; height: 12px; width: 12px; background: #f51313;
        right: 4px; top: 7px; position: absolute; transform: rotate(40deg);
        transform-origin: 50% 50%; border-radius: 0 0 2px 2px;
      }

      .pay-car > span > span {
        width: 30px; height: 1px; background: #ffffff; position: absolute;
      }

      .pay-car > span > span:nth-child(1) { animation: pay-fazer1 0.2s linear infinite; }
      .pay-car > span > span:nth-child(2) { top: 3px; animation: pay-fazer2 0.4s linear infinite; }
      .pay-car > span > span:nth-child(3) { top: 1px; animation: pay-fazer3 0.4s linear infinite; animation-delay: -1s; }
      .pay-car > span > span:nth-child(4) { top: 4px; animation: pay-fazer4 1s linear infinite; animation-delay: -1s; }

      @keyframes pay-fazer1 { 0% { left: 0; } 100% { left: -80px; opacity: 0; } }
      @keyframes pay-fazer2 { 0% { left: 0; } 100% { left: -100px; opacity: 0; } }
      @keyframes pay-fazer3 { 0% { left: 0; } 100% { left: -50px; opacity: 0; } }
      @keyframes pay-fazer4 { 0% { left: 0; } 100% { left: -150px; opacity: 0; } }

      @keyframes pay-speeder {
        0% { transform: translate(2px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -3px) rotate(-1deg); }
        20% { transform: translate(-2px, 0px) rotate(1deg); }
        30% { transform: translate(1px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 3px) rotate(-1deg); }
        60% { transform: translate(-1px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-2px, -1px) rotate(1deg); }
        90% { transform: translate(2px, 1px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
      }

      .pay-longfazers { position: absolute; width: 100%; height: 100%; z-index: 5;}
      .pay-longfazers span { position: absolute; height: 2px; width: 20%; background: #ffffff; }
      .pay-longfazers span:nth-child(1) { top: 20%; animation: pay-lf 0.6s linear infinite; animation-delay: -5s; }
      .pay-longfazers span:nth-child(2) { top: 40%; animation: pay-lf2 0.8s linear infinite; animation-delay: -1s; }
      .pay-longfazers span:nth-child(3) { top: 60%; animation: pay-lf3 0.6s linear infinite; }
      .pay-longfazers span:nth-child(4) { top: 80%; animation: pay-lf4 0.5s linear infinite; animation-delay: -3s; }

      @keyframes pay-lf { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
      @keyframes pay-lf2 { 0% { left: 200%; } 100% { left: -200%; opacity: 0; } }
      @keyframes pay-lf3 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }
      @keyframes pay-lf4 { 0% { left: 200%; } 100% { left: -100%; opacity: 0; } }

      .pay-clouds { position: absolute; width: 100%; height: 100%; z-index: 1; overflow: hidden; }
      .pay-cloud { position: absolute; background: #fff; border-radius: 50%; opacity: 0.15; animation: pay-moveClouds linear infinite; }
      .pay-cloud::before, .pay-cloud::after { content: ""; position: absolute; background: #fff; border-radius: 50%; }
      .pay-cloud::before { width: 60%; height: 60%; top: -30%; left: 10%; }
      .pay-cloud::after { width: 40%; height: 40%; top: -20%; left: 50%; }

      .pay-cloud1 { width: 100px; height: 60px; top: 15%; left: 1400px; animation-duration: 2s; }
      .pay-cloud2 { width: 150px; height: 80px; top: 35%; left: 1600px; animation-duration: 3s; }
      .pay-cloud3 { width: 80px; height: 50px; top: 20%; left: 2000px; animation-duration: 4s; }
      .pay-cloud4 { width: 100px; height: 80px; top: 70%; left: 1100px; animation-duration: 3s; }
      .pay-cloud5 { width: 170px; height: 50px; top: 80%; left: 1500px; animation-duration: 2s; }

      @keyframes pay-moveClouds { 0% { transform: translateX(0); } 100% { transform: translateX(-2000px); } }
    `}</style>

    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="payment-overlay"
    >
      <div className="pay-clouds">
        <div className="pay-cloud pay-cloud1"></div>
        <div className="pay-cloud pay-cloud2"></div>
        <div className="pay-cloud pay-cloud3"></div>
        <div className="pay-cloud pay-cloud4"></div>
        <div className="pay-cloud pay-cloud5"></div>
      </div>

      <div className="pay-car">
        <span><span></span><span></span><span></span><span></span></span>
        <div className="pay-base">
          <span></span>
          <div className="pay-face"></div>
        </div>
      </div>

      <div className="pay-longfazers">
        <span></span><span></span><span></span><span></span>
      </div>

      <h3 className="absolute bottom-32 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-extrabold tracking-[0.2em] text-lg md:text-xl animate-pulse z-20">
        PROCESSING PAYMENT
      </h3>
    </motion.div>
  </>
);

const VoiceAnimationStyles = () => (
  <style>{`
    .loader-wrapper {
      position: relative; display: flex; align-items: center; justify-content: center;
      width: 180px; height: 180px; font-family: "Inter", sans-serif; font-size: 1.2em;
      font-weight: 300; color: white; border-radius: 50%; background-color: transparent; user-select: none;
    }
    .loader {
      position: absolute; top: 0; left: 0; width: 100%; aspect-ratio: 1 / 1; border-radius: 50%;
      background-color: transparent; animation: loader-rotate 2s linear infinite; z-index: 0;
    }
    @keyframes loader-rotate {
      0% { transform: rotate(90deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset; }
      50% { transform: rotate(270deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 10px 0 #d60a47 inset, 0 40px 60px 0 #311e80 inset; }
      100% { transform: rotate(450deg); box-shadow: 0 10px 20px 0 #fff inset, 0 20px 30px 0 #ad5fff inset, 0 60px 60px 0 #471eec inset; }
    }
    .loader-letter {
      display: inline-block; opacity: 0.4; transform: translateY(0); animation: loader-letter-anim 2s infinite;
      z-index: 1; border-radius: 50ch; border: none; margin: 0 1px;
    }
    .loader-letter:nth-child(1) { animation-delay: 0s; } .loader-letter:nth-child(2) { animation-delay: 0.1s; }
    .loader-letter:nth-child(3) { animation-delay: 0.2s; } .loader-letter:nth-child(4) { animation-delay: 0.3s; }
    .loader-letter:nth-child(5) { animation-delay: 0.4s; } .loader-letter:nth-child(6) { animation-delay: 0.5s; }
    .loader-letter:nth-child(7) { animation-delay: 0.6s; } .loader-letter:nth-child(8) { animation-delay: 0.7s; }
    .loader-letter:nth-child(9) { animation-delay: 0.8s; } .loader-letter:nth-child(10) { animation-delay: 0.9s; }
    .loader-letter:nth-child(11) { animation-delay: 1.0s; } .loader-letter:nth-child(12) { animation-delay: 1.1s; }
    @keyframes loader-letter-anim {
      0%, 100% { opacity: 0.4; transform: translateY(0); }
      20% { opacity: 1; transform: scale(1.15); }
      40% { opacity: 0.7; transform: translateY(0); }
    }
  `}</style>
);

const GeneratingLoader = () => (
  <>
    <style>{`
      .full-loader-container{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;z-index:40;background:linear-gradient(0deg,#1a3379,#0f172a,#000);border-radius:inherit}
      .full-loader-wrapper{position:relative;display:flex;align-items:center;justify-content:center;width:180px;height:180px;font-family:"Inter",sans-serif;font-size:1.1em;font-weight:300;color:white;border-radius:50%;background-color:transparent;user-select:none}
      .full-loader-circle{position:absolute;top:0;left:0;width:100%;aspect-ratio:1/1;border-radius:50%;background-color:transparent;animation:full-loader-spin 2.3s linear infinite;z-index:0}
      @keyframes full-loader-spin{
        0%  {transform:rotate(90deg);box-shadow:0 6px 12px 0 #38bdf8 inset,0 12px 18px 0 #005dff inset,0 36px 36px 0 #1e40af inset}
        25% {transform:rotate(180deg);box-shadow:0 6px 12px 0 #0099ff inset,0 12px 18px 0 #38bdf8 inset,0 36px 36px 0 #005dff inset}
        50% {transform:rotate(270deg);box-shadow:0 6px 12px 0 #60a5fa inset,0 12px 6px 0 #0284c7 inset,0 24px 36px 0 #005dff inset}
        75% {transform:rotate(360deg);box-shadow:0 6px 12px 0 #3b82f6 inset,0 12px 18px 0 #0ea5e9 inset,0 36px 36px 0 #2563eb inset}
        100%{transform:rotate(450deg);box-shadow:0 6px 12px 0 #4dc8fd inset,0 12px 18px 0 #005dff inset,0 36px 36px 0 #1e40af inset}
      }
      .full-loader-letter{display:inline-block;opacity:0.4;animation:full-loader-letter 2.4s infinite;z-index:1}
      @keyframes full-loader-letter{0%,100%{opacity:0.4;transform:translateY(0)}20%{opacity:1;text-shadow:#f8fcff 0 0 5px}40%{opacity:0.7}}
      .full-loader-letter:nth-child(1){animation-delay:0s}    .full-loader-letter:nth-child(2){animation-delay:.1s}
      .full-loader-letter:nth-child(3){animation-delay:.2s}   .full-loader-letter:nth-child(4){animation-delay:.3s}
      .full-loader-letter:nth-child(5){animation-delay:.4s}   .full-loader-letter:nth-child(6){animation-delay:.5s}
      .full-loader-letter:nth-child(7){animation-delay:.6s}   .full-loader-letter:nth-child(8){animation-delay:.7s}
      .full-loader-letter:nth-child(9){animation-delay:.8s}   .full-loader-letter:nth-child(10){animation-delay:.9s}
      .full-loader-letter:nth-child(11){animation-delay:1s}   .full-loader-letter:nth-child(12){animation-delay:1.1s}
      .full-loader-letter:nth-child(13){animation-delay:1.2s}
    `}</style>
    <div className="full-loader-container">
      <div className="full-loader-wrapper">
        {'Generating...'.split('').map((ch, i) => (
          <span key={i} className="full-loader-letter">{ch}</span>
        ))}
        <div className="full-loader-circle" />
      </div>
    </div>
  </>
);

const SidebarTypingLoader = () => (
  <>
    <style>{`
      .typing-loader-wrapper{position:relative;display:flex;align-items:center;justify-content:flex-start;color:inherit;gap:10px;font-weight:500}
      .typing-loader{width:20px;height:20px;border-radius:50%;animation:typing-rotate 1.5s linear infinite}
      @keyframes typing-rotate{
        0%  {transform:rotate(90deg);box-shadow:0 1px 1px 0 #fff inset,0 3px 5px 0 #ff5f9f inset,0 4px 4px 0 #0693ff inset}
        50% {transform:rotate(270deg);background:#7c0911;box-shadow:0 1px 1px 0 #fff inset,0 3px 5px 0 #d60a47 inset,0 4px 4px 0 #fbef19 inset}
        100%{transform:rotate(450deg);box-shadow:0 1px 1px 0 #fff inset,0 3px 5px 0 #ff5f9f inset,0 4px 4px 0 #28a9ff inset}
      }
      .typing-loader-letter{display:inline-block;opacity:0.4;animation:typing-letter 2s infinite}
      @keyframes typing-letter{0%,100%{opacity:0.4;transform:scale(1)}20%{opacity:1;transform:scale(1.15)}40%{opacity:0.7;transform:scale(1)}}
      .typing-loader-letter:nth-child(1){animation-delay:0s}.typing-loader-letter:nth-child(2){animation-delay:.1s}
      .typing-loader-letter:nth-child(3){animation-delay:.2s}.typing-loader-letter:nth-child(4){animation-delay:.3s}
      .typing-loader-letter:nth-child(5){animation-delay:.4s}.typing-loader-letter:nth-child(6){animation-delay:.5s}
      .typing-loader-letter:nth-child(7){animation-delay:.6s}.typing-loader-letter:nth-child(8){animation-delay:.7s}
      .typing-loader-letter:nth-child(9){animation-delay:.8s}
    `}</style>
    <div className="typing-loader-wrapper h-6 px-1">
      <div className="typing-loader" />
      <div className="flex gap-[1px]">
        {'Searching'.split('').map((ch, i) => (
          <span key={i} className="typing-loader-letter">{ch}</span>
        ))}
      </div>
    </div>
  </>
);

const AiChatPage = ({ user }) => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();

  const [messages,            setMessages]            = useState([]);
  const [input,               setInput]               = useState('');
  const [isLoading,           setIsLoading]           = useState(false);
  const [hasStartedChat,      setHasStartedChat]      = useState(false);
  const [isInputFocused,      setIsInputFocused]      = useState(false);
  const [isSidebarOpen,       setIsSidebarOpen]       = useState(window.innerWidth > 768);
  const [sessions,            setSessions]            = useState([]);
  const [currentSessionId,    setCurrentSessionId]    = useState(null);
  const [viewportHeight,      setViewportHeight]      = useState('100dvh');
  const [isSettingsOpen,      setIsSettingsOpen]      = useState(false);
  const [isModeDropdownOpen,  setIsModeDropdownOpen]  = useState(false);
  const [isSmartContextEnabled, setIsSmartContextEnabled] = useState(() => {
    const saved = localStorage.getItem('dealit_ai_context');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [chatMode, setChatMode] = useState(
    () => localStorage.getItem('dealit_ai_mode') || 'dealit',
  );
  
  const [isVoiceOverlayOpen,   setIsVoiceOverlayOpen]  = useState(false);
  const [voiceState,           setVoiceState]          = useState('idle');
  const [voicePref,            setVoicePref]           = useState(
    () => localStorage.getItem('dealit_ai_voice_pref') || 'female',
  );
  const [isPremiumVoiceLimited, setIsPremiumVoiceLimited] = useState(false);
  const [isChatLimited,         setIsChatLimited]       = useState(false);
  const [isPurchasingReset,     setIsPurchasingReset]   = useState(false);
  const [showSuccessAnim,       setShowSuccessAnim]     = useState(false);
  const [isOffline,             setIsOffline]           = useState(!navigator.onLine);
  const [localCredits, setLocalCredits] = useState(user?.account_credits || 0);

  const autoMicRef = useRef(false);
  const handleMicClickRef = useRef(null);

  const abortControllerRef = useRef(null);
  const messagesEndRef     = useRef(null);
  const audioRef           = useRef(null);
  const isStreamingRef     = useRef(false);
  const textareaRef        = useRef(null);

  const currentSuggestions = chatMode === 'code' 
    ? CODE_SUGGESTIONS 
    : chatMode === 'image' 
      ? IMAGE_SUGGESTIONS
      : chatMode === 'general' 
        ? GENERAL_SUGGESTIONS 
        : SUGGESTIONS;

  useEffect(() => {
    if (user?.account_credits !== undefined) {
      setLocalCredits(user.account_credits);
    }
  }, [user?.account_credits]);

  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`dealit_ai_history_${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    handleMicClickRef.current = handleMicClick;
  });

  useEffect(() => {
    const handler = (e) => { 
      if (e.detail?.type === 'SPEECH_FINISHED') {
        if (autoMicRef.current && handleMicClickRef.current) {
          handleMicClickRef.current();
        } else {
          setVoiceState('idle');
        }
      } 
    };
    window.addEventListener('NATIVE_APP_EVENT', handler);
    return () => window.removeEventListener('NATIVE_APP_EVENT', handler);
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;
    const handle = () => setViewportHeight(`${window.visualViewport.height}px`);
    window.visualViewport.addEventListener('resize', handle);
    window.visualViewport.addEventListener('scroll', handle);
    handle();
    return () => {
      window.visualViewport.removeEventListener('resize', handle);
      window.visualViewport.removeEventListener('scroll', handle);
    };
  }, []);

  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};
    return () => {
      abortControllerRef.current?.abort();
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const sync = () => setChatMode(localStorage.getItem('dealit_ai_mode') || 'dealit');
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  useEffect(() => {
    const handle = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  const handleToggleContext = () => {
    const next = !isSmartContextEnabled;
    setIsSmartContextEnabled(next);
    localStorage.setItem('dealit_ai_context', JSON.stringify(next));
  };

  const handleModeChange = (mode) => {
    setChatMode(mode);
    localStorage.setItem('dealit_ai_mode', mode);
    setIsModeDropdownOpen(false);
  };

  const handleToggleVoicePref = () => {
    const next = voicePref === 'female' ? 'male' : 'female';
    setVoicePref(next);
    localStorage.setItem('dealit_ai_voice_pref', next);
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    if (voiceState === 'idle') scrollToBottom();
  }, [messages, isLoading, voiceState]);

  const fetchSessions = useCallback(async () => {
    try {
      const cached = localStorage.getItem('dealit_ai_sessions');
      if (cached) setSessions(JSON.parse(cached));
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_URL}/ai/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      if (res.data.success) {
        setSessions(res.data.sessions);
        localStorage.setItem('dealit_ai_sessions', JSON.stringify(res.data.sessions));
      }
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  useEffect(() => {
    const loadHistory = async () => {
      if (isStreamingRef.current) return;

      if (!routeSessionId) {
        setMessages([]);
        setHasStartedChat(false);
        setCurrentSessionId(null);
        setIsLoading(false);
        return;
      }

      const cached = localStorage.getItem(`dealit_ai_history_${routeSessionId}`);
      if (cached) {
        setMessages(JSON.parse(cached));
        setHasStartedChat(true);
        setCurrentSessionId(routeSessionId);
      } else {
        setIsLoading(true);
      }

      try {
        const token = localStorage.getItem('dealit_token');
        const res = await axios.get(`${API_URL}/ai/chat/history/${routeSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (res.data.success && res.data.history?.length > 0) {
          const formatted = res.data.history.map((msg, idx) => ({
            id: msg._id || `hist_${idx}`,
            role: msg.role === 'assistant' ? 'bot' : msg.role,
            content: msg.content,
            type: msg.type || 'text', // Handle legacy texts
            imageUrl: msg.imageUrl, // Handle stored images
            prompt: msg.prompt,
            timestamp: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            }),
          }));
          setMessages(formatted);
          setHasStartedChat(true);
          setCurrentSessionId(res.data.sessionId);
          localStorage.setItem(`dealit_ai_history_${routeSessionId}`, JSON.stringify(formatted));
        } else {
          navigate('/ai-chat', { replace: true });
        }
      } catch {
        navigate('/ai-chat', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [routeSessionId, navigate]);

  const handleNewChat = () => {
    if (chatMode === 'code' || chatMode === 'image') {
      setChatMode('dealit');
      localStorage.setItem('dealit_ai_mode', 'dealit');
    }
    setCurrentSessionId(null);
    setIsLoading(false);
    setHasStartedChat(false);
    setMessages([]);
    navigate('/ai-chat', { replace: true });
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleCodeChat = () => {
    setChatMode('code');
    localStorage.setItem('dealit_ai_mode', 'code');
    setCurrentSessionId(null);
    setIsLoading(false);
    setHasStartedChat(false);
    setMessages([]);
    navigate('/ai-chat', { replace: true });
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const handleImageChat = () => {
    setChatMode('image');
    localStorage.setItem('dealit_ai_mode', 'image');
    setCurrentSessionId(null);
    setIsLoading(false);
    setHasStartedChat(false);
    setMessages([]);
    navigate('/ai-chat', { replace: true });
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const selectSession = (id) => {
    if (currentSessionId === id || routeSessionId === id) {
      if (window.innerWidth <= 768) setIsSidebarOpen(false);
      return;
    }
    navigate(`/ai-chat/${id}`);
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.delete(`${API_URL}/ai/chat/session/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setSessions((prev) => prev.filter((s) => s._id !== id));
      localStorage.removeItem(`dealit_ai_history_${id}`);
      if (routeSessionId === id || currentSessionId === id) handleNewChat();
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const deleteAllSessions = async () => {
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.delete(`${API_URL}/ai/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setSessions([]);
      setIsSettingsOpen(false);
      handleNewChat();
    } catch (err) {
      console.error('Error deleting all sessions:', err);
    }
  };

  const stopVoiceAction = () => {
    autoMicRef.current = false;
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    abortControllerRef.current?.abort();
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'STOP_NATIVE_SPEECH' }));
    setVoiceState('idle');
  };

  const closeVoiceOverlay = () => {
    stopVoiceAction();
    setIsVoiceOverlayOpen(false);
  };

  const startVoiceInteraction = () => {
    setIsVoiceOverlayOpen(true);
    autoMicRef.current = true;
    handleMicClick();
  };

  const fallbackToNativeSpeech = (text, pref) => {
    if (window.ReactNativeWebView) {
      setVoiceState('speaking');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'START_NATIVE_SPEECH', text, pref }));
      return;
    }
    if (!window.speechSynthesis) { setVoiceState('idle'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      pref === 'female'
        ? v.name.toLowerCase().includes('female')
        : v.name.toLowerCase().includes('male'),
    );
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend   = () => {
      if (autoMicRef.current && handleMicClickRef.current) handleMicClickRef.current();
      else setVoiceState('idle');
    };
    utterance.onerror = () => {
      if (autoMicRef.current && handleMicClickRef.current) handleMicClickRef.current();
      else setVoiceState('idle');
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text) => {
    if (!text) return;
    audioRef.current?.pause();
    const clean = text.replace(/[*_#`]/g, '');
    const pref  = voicePref || localStorage.getItem('dealit_ai_voice_pref') || 'female';
    setVoiceState('generating_audio');
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await fetch(`${API_URL}/ai/synthesize-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: clean, voicePref: pref }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.errorCode === 'DAILY_VOICE_LIMIT_REACHED' || res.status === 429) {
          setIsPremiumVoiceLimited(true);
        }
        throw new Error(err.errorCode || 'API_FAILED');
      }
      const blob     = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio    = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { 
        URL.revokeObjectURL(audioUrl); 
        if (autoMicRef.current && handleMicClickRef.current) handleMicClickRef.current();
        else setVoiceState('idle');
      };
      audio.onerror = () => { 
        URL.revokeObjectURL(audioUrl); 
        if (autoMicRef.current && handleMicClickRef.current) handleMicClickRef.current();
        else setVoiceState('idle');
      };
      setVoiceState('speaking');
      await audio.play();
    } catch {
      fallbackToNativeSpeech(clean, pref);
    }
  };

  const processVoiceMessage = async (userMessage) => {
    if (!userMessage.trim())    { setVoiceState('idle'); return; }
    if (!navigator.onLine)      { setIsOffline(true); setTimeout(() => setIsOffline(false), 4000); return; }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    setVoiceState('thinking');
    isStreamingRef.current = true;
    setHasStartedChat(true);

    try {
      const token        = localStorage.getItem('dealit_token');
      const smartContext = JSON.parse(localStorage.getItem('dealit_ai_context') ?? 'true');
      const endpoint     = chatMode === 'code' ? `${API_URL}/ai/chat/code` : `${API_URL}/ai/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage, sessionId: currentSessionId, isSmartContextEnabled: smartContext, chatMode }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429 || errData.errorCode === 'DAILY_CHAT_LIMIT_REACHED') {
          setIsChatLimited(true);
          setVoiceState('idle');
          isStreamingRef.current = false;
          return;
        }
        throw new Error(errData.message || 'Voice chat failed.');
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botReply  = '';
      let streamBuffer = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop();

       for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') {
            setTimeout(() => {
              if (botReply.trim()) {
                const parts = extractCarouselFromReply(botReply);
                
                const textToSpeak = parts
                  .filter((p) => p.type === 'text')
                  .map((p) => p.content)
                  .join(' ')
                  .trim();
                
                const hasUI = parts.some((p) => p.type === 'ui');

                let finalSpeech = textToSpeak;
                if (!finalSpeech && hasUI) {
                  finalSpeech = "Here are the items I found for you.";
                }

                if (finalSpeech) {
                  speakText(finalSpeech);
                } else {
                  if (autoMicRef.current && handleMicClickRef.current) {
                    handleMicClickRef.current();
                  } else {
                    setVoiceState('idle');
                  }
                }
              } else {
                if (autoMicRef.current && handleMicClickRef.current) {
                  handleMicClickRef.current();
                } else {
                  setVoiceState('idle');
                }
              }
         
              isStreamingRef.current = false;
            }, 300);
            break outer;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'session_id') { setCurrentSessionId(parsed.sessionId); continue; }
            botReply += parsed.content;
          } catch { /* malformed chunk */ }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      isStreamingRef.current = false;
      setVoiceState('idle');
    }
  };

  const handleMicClick = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Your browser does not support voice input.'); return; }
    
    stopVoiceAction();
    autoMicRef.current = true;
    
    const recognition    = new SR();
    recognition.lang     = 'en-IN';
    recognition.onstart  = () => setVoiceState('listening');
    recognition.onresult = (e) => processVoiceMessage(e.results[0][0].transcript);
    recognition.onerror  = (e) => {
      if (e.error === 'not-allowed') alert("⚠️ Mic blocked. URL bar ke left icon par click karein aur 'Allow' karein.");
      else if (e.error !== 'no-speech') alert(`Mic Issue: ${e.error}`);
      setVoiceState((prev) => prev === 'listening' ? 'idle' : prev);
    };
    recognition.onend = () => setVoiceState((prev) => prev === 'listening' ? 'idle' : prev);
    recognition.start();
  };

  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    if (!navigator.onLine)   { setIsOffline(true); setTimeout(() => setIsOffline(false), 4000); return; }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setHasStartedChat(true);
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const botMsgId = `bot_${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', content: userMessage, timestamp: ts },
    ]);
    setInput('');
    setIsLoading(true);
    isStreamingRef.current = true;

    // --- Image Generation Logic ---
    if (chatMode === 'image') {
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: 'bot', type: 'image_loader', timestamp: ts }
      ]);

      try {
        const token = localStorage.getItem('dealit_token');
        const res = await axios.post(
          `${API_URL}/ai/generate-image`,
          { prompt: userMessage, sessionId: currentSessionId },
          { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
        );

        if (res.data.success) {
          if (res.data.sessionId) {
             setCurrentSessionId(res.data.sessionId);
             fetchSessions();
          }
          
          setMessages((prev) => prev.map((m) => 
            m.id === botMsgId 
              ? { id: botMsgId, role: 'bot', type: 'image', imageUrl: res.data.imageUrl, prompt: userMessage, timestamp: ts } 
              : m
          ));
        } else {
          setMessages((prev) => prev.map((m) => 
            m.id === botMsgId ? { ...m, type: 'text', content: `⚠️ Error: ${res.data.message || 'Failed to generate image.'}` } : m
          ));
        }
      } catch (err) {
        setMessages((prev) => prev.map((m) => 
          m.id === botMsgId ? { ...m, type: 'text', content: '⚠️ Server connection failed while generating image.' } : m
        ));
      } finally {
        setIsLoading(false);
        isStreamingRef.current = false;
      }
      return; 
    }
    // --------------------------------

    setMessages((prev) => [
      ...prev,
      { id: botMsgId, role: 'bot', content: '', streaming: true, timestamp: ts, type: 'text' },
    ]);

    try {
      const token        = localStorage.getItem('dealit_token');
      const smartContext = JSON.parse(localStorage.getItem('dealit_ai_context') ?? 'true');
      const endpoint     = chatMode === 'code' ? `${API_URL}/ai/chat/code` : `${API_URL}/ai/chat`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage, sessionId: currentSessionId, isSmartContextEnabled: smartContext, chatMode }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429 || errData.errorCode === 'DAILY_CHAT_LIMIT_REACHED') {
          setIsChatLimited(true);
          setIsLoading(false);
          isStreamingRef.current = false;
          setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
          return;
        }
        throw new Error(errData.reply || errData.message || 'Server connection failed.');
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botReply  = '';
      let streamBuffer = '';
      setIsLoading(false);

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);

          if (dataStr === '[DONE]') {
            const parts = extractCarouselFromReply(botReply);

            setMessages((prev) => {
              const withoutPlaceholder = prev.filter((m) => m.id !== botMsgId);
              const newMsgs = parts
                .filter((p) => p.content.trim())
                .map((p, idx) => ({
                  id: `${botMsgId}_${idx}`,
                  role: p.type === 'ui' ? 'bot_ui' : 'bot',
                  content: p.content,
                  type: 'text',
                  timestamp: ts,
                }));
              return [...withoutPlaceholder, ...newMsgs];
            });

            isStreamingRef.current = false;
            break outer;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'session_id') {
              setCurrentSessionId(parsed.sessionId);
              navigate(`/ai-chat/${parsed.sessionId}`, { replace: true });
              fetchSessions();
              continue;
            }
            botReply += parsed.content;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId
                  ? { ...m, content: botReply }
                  : m,
              ),
            );
          } catch { /* malformed chunk — skip */ }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setIsLoading(false);
      isStreamingRef.current = false;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, content: `⚠️ ${err.message}`, streaming: false }
            : m,
        ),
      );
    }
  };

  const handleMinimize = () => {
    closeVoiceOverlay();
    localStorage.setItem('dealit_open_floating_ai', 'true');
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/');
  };

  const handleClose = () => {
    closeVoiceOverlay();
    navigate('/');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    closeVoiceOverlay();
    processMessage(input);
    setIsInputFocused(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleUnlockAI = async () => {
    setIsPurchasingReset(true);
    try {
      const token = localStorage.getItem('dealit_token');
      
      const apiPromise = fetch(`${API_URL}/ai/reset-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      
      const [res] = await Promise.all([
        apiPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      const data = await res.json();
      if (!res.ok) { 
        alert(data.message || 'Failed to unlock limits'); 
        setIsPurchasingReset(false); 
        return; 
      }
      
      if (data.account_credits !== undefined) {
        setLocalCredits(data.account_credits);
      }

      setIsChatLimited(false);
      setIsPremiumVoiceLimited(false);
      
      setIsPurchasingReset(false);
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 4000);
    } catch {
      alert('Network error. Please try again.');
      setIsPurchasingReset(false);
    }
  };

  const getSpinnerText = (state) => {
    switch (state) {
      case 'listening': return 'Listening';
      case 'thinking': return 'Analyzing';
      case 'generating_audio': return 'Preparing';
      case 'speaking': return 'Speaking';
      default: return 'Dealit AI';
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 flex bg-gray-900 z-50 overflow-hidden overscroll-none"
      style={{ height: viewportHeight }}
    >
      <SharedStyles />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {isModeDropdownOpen && (
        <div className="fixed inset-0 z-[45]" onClick={() => setIsModeDropdownOpen(false)} />
      )}

      {/* Payment Processing Overlay (Car Animation) */}
      <AnimatePresence>
        {isPurchasingReset && <PaymentCarLoader />}
      </AnimatePresence>

      {/* Premium Success Animation */}
      <AnimatePresence>
        {showSuccessAnim && !isPurchasingReset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: -30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative w-[90%] max-w-sm overflow-hidden rounded-[2rem] bg-[#0A0A0A] border border-white/10 p-8 shadow-[0_0_80px_-15px_rgba(168,85,247,0.4)]"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/30 blur-[60px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 blur-[60px] rounded-full" />

              <div className="flex justify-center mb-6 relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.1, damping: 15, stiffness: 200 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 p-[2px] shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  <div className="w-full h-full rounded-full bg-[#0A0A0A] flex items-center justify-center">
                    <Check className="w-8 h-8 text-emerald-400" strokeWidth={3} />
                  </div>
                </motion.div>
              </div>

              <div className="text-center relative z-10">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-white mb-1 tracking-wide"
                >
                  Limits Unlocked
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-400 text-sm mb-6"
                >
                  Your daily AI tokens have been fully restored.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-sm"
                >
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="text-red-400 font-semibold">-50 Credits</span>
                  </div>
                  <div className="w-full h-[1px] bg-white/10" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Wallet Balance</span>
                    <span className="text-emerald-400 font-bold">{localCredits} Credits</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`fixed md:relative z-[60] flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300 ease-in-out
          ${isSidebarOpen 
            ? 'w-72 translate-x-0' 
            : '-translate-x-full w-72 md:translate-x-0 md:w-[80px]'
          }`}
      >
        <div className={`p-4 pb-0 flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full border border-purple-500/40 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(163,136,225,0.15)] relative group cursor-default">
            <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full object-cover" />
            {!isSidebarOpen && <SidebarTooltip text="Dealit AI" />}
          </div>
          {isSidebarOpen && (
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400 whitespace-nowrap">
              Dealit AI
            </span>
          )}
        </div>

        <div className={`p-3 flex flex-col ${isSidebarOpen ? 'gap-2' : 'gap-4 items-center'}`}>
          <div className="flex items-center gap-2 w-full">
          
          <button
            onClick={handleNewChat}
            className={`relative group flex items-center rounded-xl bg-[#030712] hover:bg-gray-900 text-white transition-all  shadow-sm
              ${isSidebarOpen ? 'p-3 gap-3 w-full' : 'justify-center w-12 h-12'}`}
          >
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-1 shadow-inner shrink-0">
                <Plus className="w-4 h-4 text-white" />
              </div>
              {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">New Chat</span>}
              {!isSidebarOpen && <SidebarTooltip text="New chat" />}
            </button>
          </div>
          
        
          <button
            onClick={handleCodeChat}
            className={`relative group flex items-center rounded-xl bg-[#030712] hover:bg-gray-900 text-white transition-all  shadow-sm
              ${isSidebarOpen ? 'p-3 gap-3 w-full' : 'justify-center w-12 h-12'}`}
          >
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full p-1 shadow-inner shrink-0">
              <Code className="w-4 h-4 text-white" />
            </div>
            {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">&lt;/&gt; Code Assistant</span>}
            {!isSidebarOpen && <SidebarTooltip text="Code Assistant" />}
          </button>

          <button
            onClick={handleImageChat}
            className={`relative group flex items-center rounded-xl bg-[#030712] hover:bg-gray-900 text-white transition-all shadow-sm
              ${isSidebarOpen ? 'p-3 gap-3 w-full' : 'justify-center w-12 h-12'}`}
          >
            <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-1 shadow-inner shrink-0">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Image Generator</span>}
            {!isSidebarOpen && <SidebarTooltip text="Image Generator" />}
          </button>

       
          <button
            onClick={() => {
              navigate('/create-ai');
              if (window.innerWidth <= 768) setIsSidebarOpen(false);
            }}
            className={`relative group flex items-center rounded-xl bg-[#030712] hover:bg-gray-900 text-white transition-all shadow-sm
              ${isSidebarOpen ? 'p-3 gap-3 w-full' : 'justify-center w-12 h-12'}`}
          >
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-1 shadow-inner shrink-0">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            {isSidebarOpen && <span className="font-semibold text-sm whitespace-nowrap">Create AI Agent</span>}
            {!isSidebarOpen && <SidebarTooltip text="Create AI Agent" />}
          </button>
      
        </div>

        <div className={`flex-1 overflow-y-auto px-3 py-2 ai-no-scrollbar`}>
          {isSidebarOpen && (
            <>
              <div className="text-xs font-bold tracking-wider text-gray-500 mb-3 px-2 uppercase">Recent Chats</div>
              <div className="space-y-1">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    onClick={() => selectSession(session._id)}
                    className={`group flex items-center justify-between w-full p-2.5 rounded-lg cursor-pointer transition-colors border
                      ${routeSessionId === session._id || currentSessionId === session._id
                        ? 'bg-gray-800/80 text-gray-200 border-gray-700/50'
                        : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 border-transparent'}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-sm font-medium text-left">{session.title || 'Chat Session'}</span>
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, session._id)}
                      className="p-1 text-gray-500 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-xs text-gray-600 text-center mt-4">No recent chats found.</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`p-3 border-t border-gray-800/80 space-y-2 bg-gray-950 flex-shrink-0 ${isSidebarOpen ? '' : 'flex flex-col items-center'}`}>
          <button
            onClick={() => {
              if (!isSidebarOpen) {
                setIsSidebarOpen(true);
                setIsSettingsOpen(true);
              } else {
                setIsSettingsOpen(!isSettingsOpen);
              }
            }}
            className={`relative group flex items-center transition-colors rounded-lg
              ${isSettingsOpen ? 'bg-gray-800/80 text-white' : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'}
              ${isSidebarOpen ? 'justify-between w-full p-2.5' : 'justify-center w-12 h-12'}`}
          >
            <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <Settings className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
            </div>
            {isSidebarOpen && (
              <motion.div animate={{ rotate: isSettingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 shrink-0" />
              </motion.div>
            )}
            {!isSidebarOpen && <SidebarTooltip text="Settings" />}
          </button>

          <AnimatePresence>
            {isSidebarOpen && isSettingsOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 mx-1 mb-1 mt-1 bg-gray-900 border border-gray-700/50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Smart Context</p>
                      <p className="text-xs text-gray-400 mt-0.5">Read inventory</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isSmartContextEnabled} onChange={handleToggleContext} />
                      <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                    <div>
                      <p className="text-sm font-medium text-white">AI Voice</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{voicePref} Voice</p>
                    </div>
                    <button onClick={handleToggleVoicePref} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors">
                      <User className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                  <div className="pt-3 border-t border-gray-800/80">
                    <button
                      onClick={() => {
                        if (window.confirm('Clear all chat history? This cannot be undone.')) deleteAllSessions();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20 text-xs font-semibold shadow-inner"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Chats
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => navigate('/help-support')}
            className={`relative group flex items-center transition-colors rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200
              ${isSidebarOpen ? 'gap-3 w-full p-2.5' : 'justify-center w-12 h-12'}`}
          >
            <HelpCircle className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium whitespace-nowrap">Help & FAQ</span>}
            {!isSidebarOpen && <SidebarTooltip text="Help & FAQ" />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#1A1A1A]">
        {/* Header */}
        <div className="bg-[#1A1A1A] p-4 flex items-center justify-between shadow-sm z-50 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 relative">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-300 hover:text-white transition-colors p-1"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="3" y1="16" x2="21" y2="16" />
              </svg>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="flex items-center gap-2 text-white font-semibold text-[15px] hover:opacity-80 transition-opacity"
              >
                {/* [MODIFIED] Added 'image' to header text map */}
                {chatMode === 'dealit' ? 'Dealit Strict' : chatMode === 'code' ? 'Code Assistant' : chatMode === 'image' ? 'Image Generator' : 'General AI'}
                <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5" />
              </button>
              <AnimatePresence>
                {isModeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-3 w-56 bg-[#2A2A2A] border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* [MODIFIED] Added 'image' to dropdown options */}
                    {['dealit', 'general', 'code', 'image'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-700/30 last:border-0
                          ${chatMode === mode
                            ? 'bg-purple-500/20 text-white'
                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}
                      >
                        <div className="font-semibold">
                          {mode === 'dealit' ? 'Dealit Strict' : mode === 'code' ? 'Code Assistant' : mode === 'image' ? 'Image Generator' : 'General AI'}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {mode === 'dealit' ? 'Focused on marketplace & trades' : mode === 'code' ? 'Programming & debug help' : mode === 'image' ? 'Generate stunning visuals' : 'Open-ended general chat'}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-300">
            <button onClick={handleMinimize} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white" title="Minimize">
              <Minimize2 className="w-5 h-5" />
            </button>
            <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-red-400" title="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col overflow-hidden">
          <AnimatePresence>
            {isOffline && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-full shadow-lg"
              >
                <WifiOff className="w-4 h-4" />
                Connection lost. Waiting for network...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages Container */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 container mx-auto max-w-3xl ai-no-scrollbar relative
              ${!hasStartedChat ? 'flex flex-col items-center justify-center' : ''}`}
          >
            {isLoading && messages.length === 0 ? (
              <GeneratingLoader />
            ) : !hasStartedChat ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto"
              >
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className={`w-24 h-24 mb-6 rounded-full flex items-center justify-center relative shadow-lg
                    ${chatMode === 'code' 
                      ? 'bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/40 shadow-[0_0_40px_rgba(59,130,246,0.15)]' 
                      : chatMode === 'image'
                        ? 'bg-gradient-to-br from-purple-600/20 to-blue-500/20 border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.15)]'
                        : 'bg-gradient-to-br from-purple-600/20 to-emerald-500/20 border border-purple-500/40 shadow-[0_0_40px_rgba(163,136,225,0.15)]'}`}
                >
                  <div className={`absolute inset-0 rounded-full border animate-[spin_10s_linear_infinite]
                    ${chatMode === 'code' ? 'border-blue-400/30' : 'border-purple-400/30'}`} 
                  />
                  {chatMode === 'code' ? (
                    <Code className="w-12 h-12 text-blue-400 relative z-10" />
                  ) : chatMode === 'image' ? (
                    <ImageIcon className="w-12 h-12 text-purple-400 relative z-10" />
                  ) : (
                    <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-16 h-16 rounded-full object-cover relative z-10" />
                  )}
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className={`text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text mb-3
                    ${chatMode === 'code' 
                      ? 'bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400' 
                      : chatMode === 'image'
                        ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400'
                        : 'bg-gradient-to-r from-purple-400 via-emerald-400 to-purple-400'}`}
                >
                  {chatMode === 'code' 
                    ? 'Code Assistant' 
                    : chatMode === 'image'
                      ? 'Image Generator'
                      : chatMode === 'general' 
                        ? 'General AI' 
                        : `Welcome to Dealit AI`}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-gray-400 text-sm md:text-base mb-8 max-w-md"
                >
                  {chatMode === 'code' 
                    ? 'Your unrestricted expert for writing, debugging, and refactoring code.' 
                    : chatMode === 'image'
                      ? 'Describe what you want to see. I will bring it to life with cinematic visuals.'
                      : chatMode === 'general'
                        ? 'Your versatile AI assistant. Ask me anything outside of the marketplace!'
                        : 'Your personal assistant for trades, credits, and navigating the Dealit marketplace.'}
                </motion.p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {currentSuggestions.map((text, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                      onClick={() => processMessage(text)}
                      className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 text-gray-300 text-sm font-medium p-4 rounded-xl hover:bg-purple-500/10 hover:text-white hover:border-purple-500/40 transition-all text-left shadow-sm group"
                    >
                      <div className="p-2 rounded-lg bg-gray-900 group-hover:bg-purple-500/20 transition-colors">
                        {chatMode === 'code' ? (
                          <Code className="w-4 h-4 text-blue-400" />
                        ) : chatMode === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-pink-400" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-purple-400" />
                        )}
                      </div>
                      {text}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.map((msg) => {
                if (msg.role === 'bot_ui') {
                  return (
                    <div key={msg.id} className="w-full">
                      <BotUIBlock content={msg.content} navigate={navigate} variant="full" />
                    </div>
                  );
                }

                // [NEW] Render the animated Image loader in the chat flow
                if (msg.type === 'image_loader') {
                   return (
                     <div key={msg.id} className="flex w-full justify-start">
                       <div className="w-full px-2 md:px-4 items-start">
                         <ImageGenLoader />
                       </div>
                     </div>
                   );
                }

                // [NEW] Render the final generated image
                if (msg.type === 'image') {
                  return (
                    <div key={msg.id} className="flex w-full justify-start">
                      <div className="w-full px-2 md:px-4 items-start">
                        <BotImageMessage imageUrl={msg.imageUrl} prompt={msg.prompt} />
                      </div>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col ${msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%] items-end' : 'w-full px-2 md:px-4 items-start'}`}>
                      <div
                        className={`text-sm flex flex-col w-full
                          ${msg.role === 'user'
                            ? 'rounded-2xl px-5 py-3.5 bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-lg shadow-purple-500/20 overflow-hidden'
                            : 'text-gray-200 py-2'}`}
                      >
                        <div className="w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {msg.role === 'bot' ? (
                            msg.content
                              ? <BotMessage content={msg.content} navigate={navigate} />
                              : <SidebarTypingLoader />
                          ) : (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          )}
                        </div>

                        {msg.role === 'bot' && msg.content && !msg.streaming && (
                          <MessageFooter msg={msg} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 pb-safe z-10 relative">
            <div className="p-4 container mx-auto max-w-3xl relative">

              <AnimatePresence>
                {(isChatLimited || isPremiumVoiceLimited) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-full left-0 right-0 mb-4 mx-4 z-20"
                  >
                    <div className="bg-[#242424] border border-gray-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-4 w-full">
                        <div className="p-2.5 bg-gradient-to-br from-purple-500/10 to-emerald-500/10 rounded-xl border border-gray-600/30">
                          <Unlock className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">Dealit AI limit reached</h4>
                          <p className="text-xs text-gray-400 mt-0.5">Use credits to continue chatting today.</p>
                          <p className="text-xs font-medium text-emerald-400 mt-1">Wallet: {localCredits} Credits</p>
                        </div>
                      </div>
                      <button
                        onClick={handleUnlockAI}
                        disabled={isPurchasingReset}
                        className="w-full sm:w-auto whitespace-nowrap bg-white text-black hover:bg-gray-200 font-bold py-2.5 px-5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isPurchasingReset && (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        )}
                        Unlock for 50 Credits
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="relative z-10 flex items-center gap-2">
                <div className="relative flex-1 flex items-center group">
                  <div
                    className={`absolute -inset-0.5 rounded-[28px] blur transition-all duration-500 z-0
                      ${isInputFocused ? 'opacity-70' : 'opacity-0'}
                      ${chatMode === 'code' ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500' : 'bg-gradient-to-r from-purple-500 via-emerald-400 to-blue-500'}`}
                    style={{ backgroundSize: '200% 200%', animation: isInputFocused ? 'gradient-xy 3s ease infinite' : 'none' }}
                  />
                  
                  <textarea
                    ref={textareaRef}
                    value={input}
                    rows={1}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={
                      chatMode === 'code' ? "Ask Code Assistant..." : 
                      chatMode === 'image' ? "Describe the image you want to generate..." :
                      chatMode === 'general' ? "Ask me anything..." : 
                      "Ask about trades, items, credits..."
                    }
                    className="relative z-10 w-full bg-gray-900 border border-gray-700 rounded-[24px] py-[14px] pl-5 pr-12 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-transparent transition-all shadow-inner resize-none overflow-y-auto ai-no-scrollbar max-h-[80px]"
                    style={{ minHeight: '52px' }}
                  />
                  <button
                    type="button"
                    onClick={startVoiceInteraction}
                    className="absolute right-2 z-20 p-2 flex items-center justify-center rounded-full transition-all text-gray-400 hover:bg-gray-800 hover:text-purple-400"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="magic-btn shrink-0 w-12 h-12 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
                  style={{ '--round': '9999px', padding: 0 }}
                >
                  <MagicPoints />
                  <span className="magic-inner">
                    <Send className="w-5 h-5 icon" fill="none" strokeWidth="2.5" />
                  </span>
                </button>
              </form>
            </div>
          </div>

          <AnimatePresence>
            {isVoiceOverlayOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-12 w-full h-full overflow-hidden bg-[#1A1A1A]"
              >
                <VoiceAnimationStyles />
                
                <button 
                  onClick={closeVoiceOverlay} 
                  className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors z-50"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="h-10"></div>

                <div className="flex flex-col items-center w-full max-w-md px-6 text-center z-10 flex-1 justify-center">
                  {voiceState !== 'idle' ? (
                    <>
                      <div className="loader-wrapper mb-8 scale-[1.2]">
                        {getSpinnerText(voiceState).split('').map((char, i) => (
                          <span key={i} className="loader-letter">
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        ))}
                        <div className="loader"></div>
                      </div>

                      <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-md">
                        {voiceState === 'listening'        && 'Listening to you...'}
                        {voiceState === 'thinking'         && 'Analyzing...'}
                        {voiceState === 'generating_audio' && 'Preparing voice...'}
                        {voiceState === 'speaking'         && (isPremiumVoiceLimited ? 'Speaking (Standard)...' : 'Speaking...')}
                      </h2>
                      
                      {voiceState === 'speaking' && isPremiumVoiceLimited && (
                        <span className="text-xs text-amber-400 font-medium px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4 animate-pulse">
                          Daily Premium Limit Reached
                        </span>
                      )}
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-32 h-32 mb-8 rounded-full border border-gray-700 bg-[#2A2A2A] flex items-center justify-center shadow-lg overflow-hidden opacity-80">
                        <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full object-cover grayscale-[20%]" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-300 mb-2 drop-shadow-md">
                        Ready to assist
                      </h2>
                      <p className="text-sm text-gray-400">Tap 'Speak Again' below to continue</p>
                    </motion.div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-center gap-6 pb-6 z-10 w-full px-6">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    {voiceState === 'listening' && (
                      <div className="absolute inset-0 rounded-full bg-red-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    )}
                    <div className={`z-10 w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center shadow-inner border border-gray-700 overflow-hidden ${voiceState === 'idle' ? 'opacity-50' : ''}`}>
                      {voiceState === 'listening'
                        ? <Mic className="w-5 h-5 text-red-400 animate-pulse" />
                        : <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full object-cover opacity-50" />}
                    </div>
                  </div>

                  {voiceState === 'idle' ? (
                    <button
                      type="button"
                      onClick={handleMicClick}
                      className="magic-btn text-sm w-52 mx-auto shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    >
                      <MagicPoints />
                      <span className="magic-inner text-white font-medium tracking-wide">
                        <Mic className="w-5 h-5 icon mr-2" fill="none" strokeWidth="2.5" /> Speak Again
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceAction}
                      className="magic-btn text-sm w-48 mx-auto shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                      <MagicPoints />
                      <span className="magic-inner text-gray-100">
                        <X className="w-5 h-5 icon mr-2" fill="none" strokeWidth="2.5" /> Stop
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;