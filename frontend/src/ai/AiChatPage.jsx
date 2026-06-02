import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Send, Bot, Sparkles, Menu, Plus, Settings, HelpCircle, MessageSquare, X, Trash2, Minimize2, ChevronDown, Mic, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const GeneratingLoader = () => (
  <>
    <style>
      {`
        .custom-loader-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 40;
          background: linear-gradient(0deg, #1a3379, #0f172a, #000);
          border-radius: inherit;
        }
        .loader-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px;
          height: 180px;
          font-family: "Inter", sans-serif;
          font-size: 1.1em;
          font-weight: 300;
          color: white;
          border-radius: 50%;
          background-color: transparent;
          user-select: none;
        }
        .loader-circle {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          background-color: transparent;
          animation: loader-combined 2.3s linear infinite;
          z-index: 0;
        }
        @keyframes loader-combined {
          0% { transform: rotate(90deg); box-shadow: 0 6px 12px 0 #38bdf8 inset, 0 12px 18px 0 #005dff inset, 0 36px 36px 0 #1e40af inset, 0 0 3px 1.2px rgba(56, 189, 248, 0.3), 0 0 6px 1.8px rgba(0, 93, 255, 0.2); }
          25% { transform: rotate(180deg); box-shadow: 0 6px 12px 0 #0099ff inset, 0 12px 18px 0 #38bdf8 inset, 0 36px 36px 0 #005dff inset, 0 0 6px 2.4px rgba(56, 189, 248, 0.3), 0 0 12px 3.6px rgba(0, 93, 255, 0.2), 0 0 18px 6px rgba(30, 64, 175, 0.15); }
          50% { transform: rotate(270deg); box-shadow: 0 6px 12px 0 #60a5fa inset, 0 12px 6px 0 #0284c7 inset, 0 24px 36px 0 #005dff inset, 0 0 3px 1.2px rgba(56, 189, 248, 0.3), 0 0 6px 1.8px rgba(0, 93, 255, 0.2); }
          75% { transform: rotate(360deg); box-shadow: 0 6px 12px 0 #3b82f6 inset, 0 12px 18px 0 #0ea5e9 inset, 0 36px 36px 0 #2563eb inset, 0 0 6px 2.4px rgba(56, 189, 248, 0.3), 0 0 12px 3.6px rgba(0, 93, 255, 0.2), 0 0 18px 6px rgba(30, 64, 175, 0.15); }
          100% { transform: rotate(450deg); box-shadow: 0 6px 12px 0 #4dc8fd inset, 0 12px 18px 0 #005dff inset, 0 36px 36px 0 #1e40af inset, 0 0 3px 1.2px rgba(56, 189, 248, 0.3), 0 0 6px 1.8px rgba(0, 93, 255, 0.2); }
        }
        .loader-letter {
          display: inline-block;
          opacity: 0.4;
          transform: translateY(0);
          animation: loader-letter-anim 2.4s infinite;
          z-index: 1;
        }
        .loader-letter:nth-child(1) { animation-delay: 0s; }
        .loader-letter:nth-child(2) { animation-delay: 0.1s; }
        .loader-letter:nth-child(3) { animation-delay: 0.2s; }
        .loader-letter:nth-child(4) { animation-delay: 0.3s; }
        .loader-letter:nth-child(5) { animation-delay: 0.4s; }
        .loader-letter:nth-child(6) { animation-delay: 0.5s; }
        .loader-letter:nth-child(7) { animation-delay: 0.6s; }
        .loader-letter:nth-child(8) { animation-delay: 0.7s; }
        .loader-letter:nth-child(9) { animation-delay: 0.8s; }
        .loader-letter:nth-child(10) { animation-delay: 0.9s; }
        .loader-letter:nth-child(11) { animation-delay: 1s; }
        .loader-letter:nth-child(12) { animation-delay: 1.1s; }
        .loader-letter:nth-child(13) { animation-delay: 1.2s; }
        @keyframes loader-letter-anim {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          20% { opacity: 1; text-shadow: #f8fcff 0 0 5px; }
          40% { opacity: 0.7; transform: translateY(0); }
        }
      `}
    </style>
    <div className="custom-loader-container">
      <div className="loader-wrapper">
        <span className="loader-letter">G</span><span className="loader-letter">e</span><span className="loader-letter">n</span>
        <span className="loader-letter">e</span><span className="loader-letter">r</span><span className="loader-letter">a</span>
        <span className="loader-letter">t</span><span className="loader-letter">i</span><span className="loader-letter">n</span>
        <span className="loader-letter">g</span><span className="loader-letter">.</span><span className="loader-letter">.</span><span className="loader-letter">.</span>
        <div className="loader-circle"></div>
      </div>
    </div>
  </>
);

const TypingLoader = () => (
  <>
    <style>
      {`
        .typing-loader-wrapper { position: relative; display: flex; align-items: center; justify-content: center; color: inherit; gap: 10px; font-weight: 500; }
        .typing-loader { width: 20px; height: 20px; border-radius: 50%; animation: typing-loader-rotate 1.5s linear infinite; }
        @keyframes typing-loader-rotate {
          0% { transform: rotate(90deg); box-shadow: 0 1px 1px 0 #fff inset, 0 3px 5px 0 #ff5f9f inset, 0 4px 4px 0 #0693ff inset; }
          50% { transform: rotate(270deg); background: #7c0911; box-shadow: 0 1px 1px 0 #fff inset, 0 3px 5px 0 #d60a47 inset, 0 4px 4px 0 #fbef19 inset; }
          100% { transform: rotate(450deg); box-shadow: 0 1px 1px 0 #fff inset, 0 3px 5px 0 #ff5f9f inset, 0 4px 4px 0 #28a9ff inset; }
        }
        .typing-loader-letter { display: inline-block; opacity: 0.4; animation: typing-loader-letter-anim 2s infinite; }
        .typing-loader-letter:nth-child(1) { animation-delay: 0s; } .typing-loader-letter:nth-child(2) { animation-delay: 0.1s; }
        .typing-loader-letter:nth-child(3) { animation-delay: 0.2s; } .typing-loader-letter:nth-child(4) { animation-delay: 0.3s; }
        .typing-loader-letter:nth-child(5) { animation-delay: 0.4s; } .typing-loader-letter:nth-child(6) { animation-delay: 0.5s; }
        .typing-loader-letter:nth-child(7) { animation-delay: 0.6s; } .typing-loader-letter:nth-child(8) { animation-delay: 0.7s; }
        .typing-loader-letter:nth-child(9) { animation-delay: 0.8s; }
        @keyframes typing-loader-letter-anim { 0%, 100% { opacity: 0.4; transform: scale(1); } 20% { opacity: 1; transform: scale(1.15); } 40% { opacity: 0.7; transform: scale(1); } }
      `}
    </style>
    <div className="typing-loader-wrapper h-6 px-1">
      <div className="typing-loader"></div>
      <div className="flex gap-[1px]">
        <span className="typing-loader-letter">S</span><span className="typing-loader-letter">e</span><span className="typing-loader-letter">a</span>
        <span className="typing-loader-letter">r</span><span className="typing-loader-letter">c</span><span className="typing-loader-letter">h</span>
        <span className="typing-loader-letter">i</span><span className="typing-loader-letter">n</span><span className="typing-loader-letter">g</span>
      </div>
    </div>
  </>
);

const SoundWave = () => (
  <div className="flex items-center justify-center gap-1.5 h-12">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="w-2.5 bg-purple-400 rounded-full"
        animate={{ height: ['20%', '100%', '20%'] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const BotMessage = ({ content, animated, onComplete }) => {
  const [displayedText, setDisplayedText] = useState(animated ? '' : content);
  
  useEffect(() => {
    if (!animated) {
      setDisplayedText(content);
      return;
    }
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i >= content.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [content, animated]);
  
  return (
    <div className="break-words leading-relaxed text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4 text-white" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-4 text-white" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-3 text-white" {...props} />,
          a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
          code: ({node, inline, ...props}) => 
            inline ? (
              <code className="bg-gray-900 text-purple-300 px-1.5 py-0.5 rounded-md text-xs font-mono border border-gray-700" {...props} />
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-700 my-3 bg-gray-950 shadow-inner">
                <pre className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-800">
                  <code className="text-gray-300 text-xs font-mono" {...props} />
                </pre>
              </div>
            ),
          table: ({node, ...props}) => (
            <div className="overflow-x-auto my-4 border border-gray-700 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-700 text-sm" {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className="bg-gray-900" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-700 bg-gray-800/50" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-gray-300" {...props} />
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

const SUGGESTIONS = [
  "What is my Aura Score?",
  "How do I earn more Credits?",
  "Explain OTP delivery verification",
  "Tell me my account details"
];

const AiChatPage = ({ user }) => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSmartContextEnabled, setIsSmartContextEnabled] = useState(() => {
    const saved = localStorage.getItem('dealit_ai_context');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [chatMode, setChatMode] = useState(() => localStorage.getItem('dealit_ai_mode') || 'dealit');

  const [voiceState, setVoiceState] = useState('idle');
  const [voicePref, setVoicePref] = useState(() => localStorage.getItem('dealit_ai_voice_pref') || 'female');
  const [isPremiumVoiceLimited, setIsPremiumVoiceLimited] = useState(false);
  
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize();
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const syncMode = () => setChatMode(localStorage.getItem('dealit_ai_mode') || 'dealit');
    window.addEventListener('storage', syncMode);
    return () => window.removeEventListener('storage', syncMode);
  }, []);

  const handleToggleContext = () => {
    const newVal = !isSmartContextEnabled;
    setIsSmartContextEnabled(newVal);
    localStorage.setItem('dealit_ai_context', JSON.stringify(newVal));
  };

  const handleToggleMode = () => {
    const newMode = chatMode === 'dealit' ? 'general' : 'dealit';
    setChatMode(newMode);
    localStorage.setItem('dealit_ai_mode', newMode);
  };
  
  const handleToggleVoicePref = () => {
    const newPref = voicePref === 'female' ? 'male' : 'female';
    setVoicePref(newPref);
    localStorage.setItem('dealit_ai_voice_pref', newPref);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (voiceState === 'idle') scrollToBottom();
  }, [messages, isLoading, voiceState]);
  
  useEffect(() => {
    const handleResizeSidebar = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResizeSidebar);
    return () => window.removeEventListener('resize', handleResizeSidebar);
  }, []);
  
  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_URL}/ai/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (res.data.success) setSessions(res.data.sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  
  useEffect(() => {
    const loadHistory = async () => {
      if (!routeSessionId) {
        setMessages([
          { id: 'init', role: 'bot', content: `Welcome to Dealit AI, ${user?.full_name?.split(' ')[0] || 'friend'}. How can I assist you with your trades today?`, animated: true }
        ]);
        setCurrentSessionId(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const token = localStorage.getItem('dealit_token');
        const res = await axios.get(`${API_URL}/ai/chat/history/${routeSessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        
        if (res.data.success && res.data.history && res.data.history.length > 0) {
          const formattedHistory = res.data.history.map((msg, index) => ({
            id: msg._id || `hist_${index}`,
            role: msg.role === 'assistant' ? 'bot' : 'user',
            content: msg.content,
            animated: false 
          }));
          setMessages(formattedHistory);
          setCurrentSessionId(res.data.sessionId);
        } else {
          navigate('/ai-chat', { replace: true });
        }
      } catch (error) {
        navigate('/ai-chat', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [routeSessionId, user, navigate]);
  
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setIsLoading(false);
    setMessages([
      { id: Date.now().toString(), role: 'bot', content: `Welcome to Dealit AI, ${user?.full_name?.split(' ')[0] || 'friend'}. How can I assist you with your trades today?`, animated: true }
    ]);
    navigate('/ai-chat', { replace: true });
    window.history.pushState(null, '', '/ai-chat');
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
        withCredentials: true
      });
      setSessions(prev => prev.filter(s => s._id !== id));
      if (routeSessionId === id || currentSessionId === id) handleNewChat();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };
  
  const deleteAllSessions = async () => {
    try {
      const token = localStorage.getItem('dealit_token');
      await axios.delete(`${API_URL}/ai/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      setSessions([]); 
      setIsSettingsOpen(false); 
      handleNewChat(); 
    } catch (error) {
      console.error('Error deleting all sessions:', error);
    }
  };
  
  const markAsAnimated = (id) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, animated: false } : m));
  };

  const fallbackToNativeSpeech = (text, pref) => {
    if (!window.speechSynthesis) {
      setVoiceState('idle');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find(v => 
        pref === 'female' ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male')
      );
      if (preferredVoice) utterance.voice = preferredVoice;
    }
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = (e) => {
      setVoiceState('idle');
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text) => {
    if (!text) return;
    if (audioRef.current) audioRef.current.pause();
    const textToSpeak = text.replace(/[*_#`]/g, '');
    const currentVoicePref = typeof voicePref !== 'undefined' ? voicePref : (localStorage.getItem('dealit_ai_voice_pref') || 'female');
    
    setVoiceState('generating_audio');
    try {
      const token = localStorage.getItem('dealit_token');
      const response = await fetch(`${API_URL}/ai/synthesize-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSpeak, voicePref: currentVoicePref })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.errorCode === 'DAILY_VOICE_LIMIT_REACHED' || response.status === 429) {
          setIsPremiumVoiceLimited(true);
        }
        throw new Error(errorData.errorCode || 'API_FAILED');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audioRef.current = audio;
      audio.onended = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(audioUrl);
      };
      setVoiceState('speaking');
      await audio.play();
    } catch (error) {
      fallbackToNativeSpeech(textToSpeak, currentVoicePref);
    }
  };

  const processVoiceMessage = async (userMessage) => {
    if (!userMessage.trim()) {
      setVoiceState('idle');
      return;
    }
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setVoiceState('thinking');
    try {
      const token = localStorage.getItem('dealit_token');
      const smartContextStr = localStorage.getItem('dealit_ai_context');
      const isSmartContextEnabled = smartContextStr !== null ? JSON.parse(smartContextStr) : true;
      
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage,
          sessionId: currentSessionId,
          isSmartContextEnabled,
          chatMode
        }),
        signal: abortControllerRef.current.signal
      });

      // ADDED: Better limit error handling
      if (!response.ok) {
        let errorMessage = 'Voice chat failed.';
        try {
          const errData = await response.json();
          errorMessage = errData.reply || errData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botReply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') {
              setTimeout(() => {
                if (botReply.trim()) speakText(botReply);
                else setVoiceState('idle');
              }, 300);
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'session_id') {
                setCurrentSessionId(parsed.sessionId);
                continue;
              }
              botReply += parsed.content;
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      setVoiceState('idle');
      alert(`Voice Error: ${error.message}`);
    }
  };
  
  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    if (audioRef.current) audioRef.current.pause();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setVoiceState('listening');
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      processVoiceMessage(transcript);
    };
    recognition.onerror = (e) => setVoiceState('idle');
    recognition.onend = () => setVoiceState(prev => prev === 'listening' ? 'idle' : prev);
    recognition.start();
  };
  
  const cancelVoiceMode = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setVoiceState('idle');
  };
  
  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const newMessages = [...messages, { id: Date.now(), role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    const botMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: 'bot', content: '', animated: false } 
    ]);
    
    try {
      const token = localStorage.getItem('dealit_token');
      const smartContextStr = localStorage.getItem('dealit_ai_context');
      const isSmartContextEnabled = smartContextStr !== null ? JSON.parse(smartContextStr) : true;
      
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage,
          sessionId: currentSessionId,
          isSmartContextEnabled,
          chatMode
        }),
        signal: abortControllerRef.current.signal
      });

      // ADDED: Parse error json on rate limits
      if (!response.ok) {
        let errorMessage = 'Server connection failed.';
        try {
          const errData = await response.json();
          errorMessage = errData.reply || errData.message || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let botReply = "";
      setIsLoading(false); 
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') {
              setTimeout(() => {
                setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, content: botReply } : msg));
              }, 1000);
              break;
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
              setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, content: botReply } : msg));
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      setIsLoading(false);
      setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, content: `⚠️ ${error.message}` } : msg));
    }
  };
  
  const handleMinimize = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    localStorage.setItem('dealit_open_floating_ai', 'true');
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.history.state && window.history.state.idx > 0) navigate(-1); 
    else navigate('/'); 
  };
  
  const handleClose = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    navigate('/');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (voiceState !== 'idle') cancelVoiceMode();
    processMessage(input);
  };
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 flex bg-gray-900 z-50 overflow-hidden overscroll-none"
      style={{ height: viewportHeight }}
    >
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <div className={`fixed md:relative z-50 flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:w-0 md:hidden absolute'}`}>
        <div className="p-3 flex items-center gap-2">
          <button onClick={handleNewChat} className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-white transition-all border border-gray-700/50 shadow-sm">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-1 shadow-inner"><Plus className="w-4 h-4 text-white" /></div>
            <span className="font-semibold text-sm">New Chat</span>
          </button>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="text-xs font-bold tracking-wider text-gray-500 mb-3 px-2 uppercase">Recent Chats</div>
          <div className="space-y-1">
            {sessions.map(session => (
              <div key={session._id} onClick={() => selectSession(session._id)} className={`group flex items-center justify-between w-full p-2.5 rounded-lg cursor-pointer transition-colors border ${routeSessionId === session._id || currentSessionId === session._id ? 'bg-gray-800/80 text-gray-200 border-gray-700/50' : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 border-transparent'}`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate text-sm font-medium text-left">{session.title || 'Chat Session'}</span>
                </div>
                <button onClick={(e) => deleteSession(e, session._id)} className="p-1 text-gray-500 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {sessions.length === 0 && <p className="text-xs text-gray-600 text-center mt-4">No recent chats found.</p>}
          </div>
        </div>
        <div className="p-3 border-t border-gray-800/80 space-y-1 bg-gray-950 flex-shrink-0">
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors ${isSettingsOpen ? 'bg-gray-800/80 text-white' : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'}`}>
            <div className="flex items-center gap-3"><Settings className="w-5 h-5" /><span className="text-sm font-medium">Settings</span></div>
            <motion.div animate={{ rotate: isSettingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-4 h-4" /></motion.div>
          </button>
          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-3 mx-1 mb-1 mt-1 bg-gray-900 border border-gray-700/50 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-white">AI Mode</p><p className="text-xs text-gray-400 mt-0.5 capitalize">{chatMode === 'dealit' ? 'Dealit Strict' : 'General AI'}</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={chatMode === 'general'} onChange={handleToggleMode} />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                    <div><p className="text-sm font-medium text-white">Smart Context</p><p className="text-xs text-gray-400 mt-0.5">Read inventory</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={isSmartContextEnabled} onChange={handleToggleContext} />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                    <div><p className="text-sm font-medium text-white">AI Voice</p><p className="text-xs text-gray-400 mt-0.5 capitalize">{voicePref} Voice</p></div>
                    <button onClick={handleToggleVoicePref} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors"><User className="w-4 h-4 text-purple-400" /></button>
                  </div>
                  <div className="pt-3 border-t border-gray-800/80">
                    <button onClick={() => { if(window.confirm("Are you sure you want to clear all your chat history? This action cannot be undone.")) { deleteAllSessions(); } }} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20 text-xs font-semibold shadow-inner"><Trash2 className="w-4 h-4" />Clear All Chats</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => navigate('/help-support')} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"><HelpCircle className="w-5 h-5" /><span className="text-sm font-medium">Help & FAQ</span></button>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-gray-900">
        
        <div className="bg-gray-800/80 backdrop-blur-md border-b border-purple-500/20 p-4 flex items-center justify-between shadow-sm shadow-purple-900/10 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-900 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors mr-1" title="Toggle Sidebar"><Menu className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(163,136,225,0.2)] hidden sm:flex"><Bot className="w-6 h-6 text-purple-400" /></div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-wide">Dealit AI</h1>
              <p className="text-emerald-400 text-xs font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleMinimize} className="p-2 bg-gray-900 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors" title="Minimize to Widget"><Minimize2 className="w-5 h-5" /></button>
            <button onClick={handleClose} className="p-2 bg-gray-900 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-300 transition-colors" title="Close Full Chat"><X className="w-5 h-5" /></button>
          </div>
        </div>
        
        {voiceState !== 'idle' ? (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-gray-900"
            >
              <div className={`absolute inset-0 transition-opacity duration-700 opacity-20 ${voiceState === 'listening' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-500/40 via-gray-900 to-gray-900' : voiceState === 'speaking' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/40 via-gray-900 to-gray-900' : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/40 via-gray-900 to-gray-900'}`} />
              
              <div className="z-10 flex flex-col items-center w-full max-w-md px-6 text-center">
                <div className="relative flex items-center justify-center w-32 h-32 mb-8">
                  {voiceState === 'listening' && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  )}
                  {voiceState === 'speaking' && (
                    <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse" />
                  )}
                  {voiceState === 'generating_audio' && (
                    <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse" />
                  )}
                  <div className="z-10 w-24 h-24 bg-gray-950 rounded-full flex items-center justify-center shadow-inner border border-gray-700">
                    {voiceState === 'listening' ? <Mic className="w-10 h-10 text-red-400 animate-pulse" /> : <Bot className="w-10 h-10 text-purple-400" />}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">
                  {voiceState === 'listening' && 'Listening to you...'}
                  {voiceState === 'thinking' && 'Analyzing...'}
                  {voiceState === 'generating_audio' && 'Preparing voice...'}
                  {voiceState === 'speaking' && (isPremiumVoiceLimited ? 'Speaking (Standard Voice)...' : 'Speaking...')}
                </h2>
                
                {voiceState === 'speaking' && isPremiumVoiceLimited && (
                  <span className="text-xs text-amber-400 font-medium px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-4 animate-pulse">
                    Daily Premium Limit Reached
                  </span>
                )}
                
                <div className="h-12 flex items-center justify-center w-full mb-10">
                  {voiceState === 'listening' && (
                    <div className="flex gap-2.5">
                      <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-bounce"></span>
                      <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  )}
                  {(voiceState === 'thinking' || voiceState === 'generating_audio') && <TypingLoader />}
                  {voiceState === 'speaking' && <SoundWave />}
                </div>
                
                <button onClick={cancelVoiceMode} className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-all border border-red-500/30 text-sm font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)] w-48 mx-auto">
                  <X className="w-5 h-5" /> Stop Listening
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 container mx-auto max-w-3xl scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent relative">
              {isLoading && messages.length === 0 ? (
                <GeneratingLoader />
              ) : (
                messages.map((msg) => (
                  <motion.div 
                    initial={msg.animated ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    transition={{ duration: 0.3 }}
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-lg shadow-purple-500/20 break-words whitespace-pre-wrap' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-md'}`}>
                      {msg.role === 'bot' ? (msg.content ? <BotMessage content={msg.content} animated={msg.animated} onComplete={() => markAsAnimated(msg.id)} /> : <TypingLoader />) : msg.content}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="shrink-0 bg-gray-900 pb-safe">
              {messages.length <= 1 && !isLoading && (
                <div className="container mx-auto max-w-3xl px-4 pb-3 flex flex-wrap gap-2 justify-center">
                  {SUGGESTIONS.map((text, i) => (
                    <button key={i} onClick={() => processMessage(text)} className="flex items-center gap-1.5 bg-gray-800/80 border border-purple-500/30 text-gray-300 text-xs font-medium px-4 py-2 rounded-full hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />{text}
                    </button>
                  ))}
                </div>
              )}
              <div className="bg-gray-800/50 backdrop-blur-sm border-t border-purple-500/20 p-4 container mx-auto max-w-3xl">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Dealit AI..." className="w-full bg-gray-900 border border-gray-700 rounded-full py-4 pl-6 pr-24 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner" />
                  <button type="button" onClick={handleMicClick} className="absolute right-14 w-10 h-10 flex items-center justify-center rounded-full transition-all text-gray-400 hover:text-purple-400">
                    <Mic className="w-5 h-5" />
                  </button>
                  <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30">
                    <Send className="w-5 h-5 ml-1" />
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default AiChatPage;