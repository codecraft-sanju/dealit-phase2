import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Send, Bot, Sparkles, Menu, Plus, Settings, HelpCircle, MessageSquare, X, Trash2, Minimize2, ChevronDown, Mic, User } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import axios from 'axios';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const TypingLoader = () => (
  <div className="flex space-x-1.5 items-center h-6 px-1">
    <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
    <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
    <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
  </div>
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
  const cleanContent = useMemo(() => content.replace(/(\*\*)?\[ANIMATION_[123]\](\*\*)?/g, ''), [content]);
  const [displayedText, setDisplayedText] = useState(animated ? '' : cleanContent);
  
  const triggered1 = useRef(false);
  const triggered2 = useRef(false);
  const triggered3 = useRef(false);

  useEffect(() => {
    if (content.includes('[ANIMATION_1]') && !triggered1.current) {
      triggered1.current = true;
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#A388E1', '#10B981', '#FBBF24', '#EF4444'], zIndex: 99999 });
    }
    if (content.includes('[ANIMATION_2]') && !triggered2.current) {
      triggered2.current = true;
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * (0.3 - 0.1) + 0.1, y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: Math.random() * (0.9 - 0.7) + 0.7, y: Math.random() - 0.2 } });
      }, 250);
    }
    if (content.includes('[ANIMATION_3]') && !triggered3.current) {
      triggered3.current = true;
      const end = Date.now() + 3 * 1000;
      const colors = ['#A388E1', '#ffffff'];
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: colors, zIndex: 99999 });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: colors, zIndex: 99999 });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }, [content]);

  useEffect(() => {
    if (!animated) {
      setDisplayedText(cleanContent);
      return;
    }
    
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(cleanContent.slice(0, i + 1));
      i++;
      if (i >= cleanContent.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanContent, animated]);

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
          td: ({node, ...props}) => <td className="px-4 py-3 text-gray-300" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-3 bg-gray-900/50 rounded-r-lg italic text-gray-400" {...props} />
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
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isSmartContextEnabled, setIsSmartContextEnabled] = useState(() => {
    const saved = localStorage.getItem('dealit_ai_context');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // --- Voice Mode States ---
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [voicePref, setVoicePref] = useState(() => localStorage.getItem('dealit_ai_voice_pref') || 'female');

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {};
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleToggleContext = () => {
    const newVal = !isSmartContextEnabled;
    setIsSmartContextEnabled(newVal);
    localStorage.setItem('dealit_ai_context', JSON.stringify(newVal));
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
    const handleResize = () => {
      if (window.innerWidth > 768) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_URL}/ai/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
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
        console.error('Failed to load chat history:', error);
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
      { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: `Welcome to Dealit AI, ${user?.full_name?.split(' ')[0] || 'friend'}. How can I assist you with your trades today?`, 
        animated: true 
      }
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
      
      if (routeSessionId === id || currentSessionId === id) {
        handleNewChat();
      }
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

  // --- Voice Logic Methods ---
  const speakText = (text) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      setVoiceState('idle');
      return;
    }
    synth.cancel();

    const textToSpeak = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = synth.getVoices();

    const inVoices = voices.filter(v => v.lang.includes('IN') || v.lang.includes('hi'));

    let selectedVoice;
    if (voicePref === 'male') {
        selectedVoice = inVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('rishabh'))
                     || voices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david'))
                     || voices[0];
    } else {
        selectedVoice = inVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('lekha') || v.name.toLowerCase().includes('aditi'))
                     || voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'))
                     || voices[0];
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = () => setVoiceState('idle');

    synth.speak(utterance);
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
          isSmartContextEnabled 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Network response was not ok');

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
                const cleanReplyText = botReply.replace(/(\*\*)?\[ANIMATION_[123]\](\*\*)?/g, '');
                if (cleanReplyText.trim()) {
                  speakText(cleanReplyText);
                } else {
                  setVoiceState('idle');
                }
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
      console.error('AI Voice Error:', error);
      setVoiceState('idle');
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice input.");
      return;
    }
    
    window.speechSynthesis.cancel();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    
    recognition.onstart = () => setVoiceState('listening');
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      processVoiceMessage(transcript);
    };
    
    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e);
      setVoiceState('idle');
    };
    
    recognition.onend = () => {
      setVoiceState(prev => prev === 'listening' ? 'idle' : prev);
    };
    
    recognition.start();
  };

  const cancelVoiceMode = () => {
    window.speechSynthesis.cancel();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setVoiceState('idle');
  };
  // --- END Voice Logic Methods ---

  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
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
          isSmartContextEnabled 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
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
                const cleanReplyText = botReply.replace(/(\*\*)?\[ANIMATION_[123]\](\*\*)?/g, '');
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === botMessageId ? { ...msg, content: cleanReplyText } : msg
                  )
                );
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
              
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId ? { ...msg, content: botReply } : msg
                )
              );
            } catch (e) {
            }
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('AI Chat Error:', error);
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: 'Server connection failed. Please try again later.' } : msg
        )
      );
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    processMessage(input);
  };

  const handleMinimize = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    localStorage.setItem('dealit_open_floating_ai', 'true');
    window.speechSynthesis.cancel();
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1); 
    } else {
      navigate('/'); 
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    window.speechSynthesis.cancel();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 flex bg-gray-900 z-50 overflow-hidden overscroll-none">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed md:relative z-50 flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:w-0 md:hidden absolute'}`}>
        
        <div className="p-3 flex items-center gap-2">
          <button 
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 text-white transition-all border border-gray-700/50 shadow-sm"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-1 shadow-inner">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm">New Chat</span>
          </button>

          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors border border-gray-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="text-xs font-bold tracking-wider text-gray-500 mb-3 px-2 uppercase">Recent Chats</div>
          
          <div className="space-y-1">
            {sessions.map(session => (
              <div 
                key={session._id}
                onClick={() => selectSession(session._id)}
                className={`group flex items-center justify-between w-full p-2.5 rounded-lg cursor-pointer transition-colors border ${
                  routeSessionId === session._id || currentSessionId === session._id 
                    ? 'bg-gray-800/80 text-gray-200 border-gray-700/50' 
                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 border-transparent'
                }`}
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
        </div>

        <div className="p-3 border-t border-gray-800/80 space-y-1 bg-gray-950 flex-shrink-0">
          <button 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors ${isSettingsOpen ? 'bg-gray-800/80 text-white' : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </div>
            <motion.div animate={{ rotate: isSettingsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
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
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isSmartContextEnabled}
                        onChange={handleToggleContext}
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
                    <div>
                      <p className="text-sm font-medium text-white">AI Voice</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{voicePref} Voice</p>
                    </div>
                    <button
                      onClick={handleToggleVoicePref}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors"
                    >
                      <User className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>

                  <div className="pt-3 border-t border-gray-800/80">
                    <button 
                      onClick={() => {
                        if(window.confirm("Are you sure you want to clear all your chat history? This action cannot be undone.")) {
                          deleteAllSessions();
                        }
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

          <button onClick={() => navigate('/help-support')} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help & FAQ</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-gray-900">
        
        {/* --- IMMERSIVE VOICE MODE OVERLAY --- */}
        <AnimatePresence>
          {voiceState !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-md flex flex-col items-center justify-center"
            >
              <div className="relative flex items-center justify-center w-32 h-32 mb-8">
                 {voiceState === 'listening' && (
                    <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                 )}
                 {voiceState === 'speaking' && (
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-pulse shadow-[0_0_50px_rgba(163,136,225,0.3)]" />
                 )}
                 <div className="z-10 w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center shadow-lg border border-purple-400/50">
                    {voiceState === 'listening' ? <Mic className="w-12 h-12 text-white animate-pulse" /> : <Bot className="w-12 h-12 text-white" />}
                 </div>
              </div>

              <h3 className="text-3xl font-black text-white mb-3 text-center px-4">
                 {voiceState === 'listening' && 'Speak please... 🎙️'}
                 {voiceState === 'thinking' && 'Thinking...'}
                 {voiceState === 'speaking' && 'AI is speaking...'}
              </h3>
              
              <div className="h-10 flex items-center justify-center">
                {voiceState === 'listening' && <p className="text-gray-400 text-sm animate-pulse">I'm listening to your voice.</p>}
                {voiceState === 'thinking' && <TypingLoader />}
                {voiceState === 'speaking' && <SoundWave />}
              </div>
              
              <button 
                 onClick={cancelVoiceMode}
                 className="mt-16 px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors border border-red-500/20 text-sm font-semibold"
              >
                 Cancel Voice Mode
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* --- END VOICE OVERLAY --- */}

        <div className="bg-gray-800/80 backdrop-blur-md border-b border-purple-500/20 p-4 flex items-center justify-between shadow-sm shadow-purple-900/10 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-gray-900 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors mr-1"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(163,136,225,0.2)] hidden sm:flex">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-wide">Dealit AI</h1>
              <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Always here to help
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleMinimize}
              className="p-2 bg-gray-900 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
              title="Minimize to Widget"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            <button 
              onClick={handleClose}
              className="p-2 bg-gray-900 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-300 transition-colors"
              title="Close Full Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 container mx-auto max-w-3xl scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
          {messages.map((msg) => (
            <motion.div 
              initial={msg.animated ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              transition={{ duration: 0.3 }}
              key={msg.id} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-lg shadow-purple-500/20 break-words whitespace-pre-wrap'
                    : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-md'
                }`}
              >
                {msg.role === 'bot' ? (
                  msg.content ? (
                    <BotMessage 
                      content={msg.content} 
                      animated={msg.animated} 
                      onComplete={() => markAsAnimated(msg.id)} 
                    />
                  ) : (
                    <TypingLoader />
                  )
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}
      
          {isLoading && messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
                <TypingLoader />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 bg-gray-900 pb-safe">
          {messages.length <= 1 && !isLoading && (
            <div className="container mx-auto max-w-3xl px-4 pb-3 flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((text, i) => (
                <button
                  key={i}
                  onClick={() => processMessage(text)}
                  className="flex items-center gap-1.5 bg-gray-800/80 border border-purple-500/30 text-gray-300 text-xs font-medium px-4 py-2 rounded-full hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  {text}
                </button>
              ))}
            </div>
          )}

          <div className="bg-gray-800/50 backdrop-blur-sm border-t border-purple-500/20 p-4 container mx-auto max-w-3xl">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Dealit AI..."
                className="w-full bg-gray-900 border border-gray-700 rounded-full py-4 pl-6 pr-24 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
              />
              
              <button
                type="button"
                onClick={handleMicClick}
                className="absolute right-14 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-purple-400 transition-all"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/30"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AiChatPage;