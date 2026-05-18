import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Maximize2, Minimize2, Mic, User } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const TypingLoader = () => (
  <div className="flex space-x-1.5 items-center h-5 px-1">
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
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
  "What is Aura Score?",
  "How do I earn Credits?",
  "Delivery rules",
  "My account stats"
];

const FloatingAIAssistant = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [messages, setMessages] = useState([
    { id: 'init', role: 'bot', content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I am Dealit's AI Assistant. How can I help you today?`, animated: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // 'idle' | 'listening' | 'thinking' | 'generating_audio' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle');
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const audioRef = useRef(null);
  const [buttonState, setButtonState] = useState('bot');
  
  // CHANGED: Added safe checks for window.speechSynthesis to prevent WebView crash
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {};
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkOpen = () => {
      if (localStorage.getItem('dealit_open_floating_ai') === 'true') {
        setIsOpen(true);
        setHasFetchedHistory(false); 
        localStorage.removeItem('dealit_open_floating_ai');
      }
    };
    checkOpen();
  }, [location.pathname]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading, voiceState]);
  
  useEffect(() => {
    if (isOpen && !hasFetchedHistory) {
      const loadHistory = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('dealit_token');
          const res = await axios.get(`${API_URL}/ai/chat/history/latest`, {
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
          }
        } catch (error) {
          console.error('Failed to load chat history:', error);
        } finally {
          setIsLoading(false);
          setHasFetchedHistory(true);
        }
      };
      loadHistory();
    }
  }, [isOpen, hasFetchedHistory]);
  
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => {
      setButtonState((prev) => (prev === 'bot' ? 'text' : 'bot'));
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen]);
  
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
      console.error('Native TTS Error:', e);
      setVoiceState('idle');
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text) => {
    if (!text) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const voicePref = localStorage.getItem('dealit_ai_voice_pref') || 'female';
    const textToSpeak = text.replace(/[*_#`]/g, '');

    // Show "Preparing voice..." while we wait for ElevenLabs to return audio
    setVoiceState('generating_audio');
    try {
      const token = localStorage.getItem('dealit_token');
      
      const response = await fetch(`${API_URL}/ai/synthesize-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text: textToSpeak,
          voicePref: voicePref 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
      // Audio is ready — switch to "Speaking..." right before play
      setVoiceState('speaking');
      await audio.play();
    } catch (error) {
      console.warn('Premium voice failed, falling back to native browser voice:', error.message);
      fallbackToNativeSpeech(textToSpeak, voicePref);
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
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setVoiceState('idle');
  };
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
                continue;
              }
              botReply += parsed.content;
              
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId ? { ...msg, content: botReply } : msg
                )
              );
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('AI Chat Error:', error);
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: 'Sorry, I am having trouble connecting to the server right now.' } : msg
        )
      );
    }
  };
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (voiceState !== 'idle') cancelVoiceMode();
    processMessage(input);
  };
  const handleClose = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsOpen(false);
  };
  
  const handleMaximize = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    handleClose();
    if(currentSessionId) {
      navigate(`/ai-chat/${currentSessionId}`);
    } else {
      navigate('/ai-chat');
    }
  };
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed flex flex-col bg-gray-900 shadow-[0_15px_50px_rgba(163,136,225,0.2)] overflow-hidden z-[100] overscroll-none bottom-24 right-4 md:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[500px] border border-purple-500/30 rounded-2xl`}
          >
            <div className="bg-gray-800/90 backdrop-blur-md border-b border-purple-500/20 p-4 flex justify-between items-center shadow-sm shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/10 flex items-center justify-center border border-purple-500/30">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">Dealit AI</h3>
                  <p className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMaximize}
                  className="text-gray-400 hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full"
                  title="Open Full App"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
              {messages.map((msg) => (
                <motion.div 
                  initial={msg.animated ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  transition={{ duration: 0.3 }}
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-md shadow-purple-500/20 break-words whitespace-pre-wrap'
                        : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-sm'
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
              {isLoading && voiceState === 'idle' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <TypingLoader />
                  </div>
                </motion.div>
              )}

              {/* --- INLINE VOICE UI --- */}
              <AnimatePresence>
                {voiceState !== 'idle' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="flex justify-center w-full my-4"
                  >
                    <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-purple-500/30 rounded-[2rem] p-6 shadow-lg flex flex-col items-center w-[90%] text-center relative overflow-hidden">
                      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
                        {voiceState === 'listening' && (
                          <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                        )}
                        {voiceState === 'speaking' && (
                          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-pulse" />
                        )}
                        {voiceState === 'generating_audio' && (
                          <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
                        )}
                        <div className="z-10 w-12 h-12 bg-gray-950 rounded-full flex items-center justify-center shadow-inner border border-gray-700">
                          {voiceState === 'listening'
                            ? <Mic className="w-5 h-5 text-red-400 animate-pulse" />
                            : <Bot className="w-5 h-5 text-purple-400" />
                          }
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-2">
                        {voiceState === 'listening' && 'Listening to you...'}
                        {voiceState === 'thinking' && 'Analyzing...'}
                        {voiceState === 'generating_audio' && 'Preparing voice...'}
                        {voiceState === 'speaking' && 'Speaking...'}
                      </h4>
                      
                      <div className="h-8 flex items-center justify-center w-full">
                        {voiceState === 'listening' && (
                          <div className="flex gap-1.5">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                          </div>
                        )}
                        {(voiceState === 'thinking' || voiceState === 'generating_audio') && <TypingLoader />}
                        {voiceState === 'speaking' && <SoundWave />}
                      </div>
                      
                      <button onClick={cancelVoiceMode} className="mt-4 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors border border-gray-600 text-xs font-semibold flex items-center gap-2">
                        <X className="w-3.5 h-3.5" /> Stop
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            {messages.length <= 1 && !isLoading && voiceState === 'idle' && (
              <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                {SUGGESTIONS.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      processMessage(text);
                    }}
                    className="whitespace-nowrap flex items-center gap-1.5 bg-gray-800 border border-purple-500/30 text-gray-300 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all flex-shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    {text}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="p-3 bg-gray-800/80 backdrop-blur-sm border-t border-purple-500/20 shrink-0 z-10">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about items, Aura, rules..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-4 pr-20 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                />
                
                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`absolute right-12 w-8 h-8 flex items-center justify-center rounded-full transition-all ${voiceState === 'listening' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-400'}`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105 active:scale-95 shadow-md shadow-purple-500/30"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        animate={isOpen ? { y: 0 } : { y: [0, -6, 0] }}
        transition={{ 
          y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } 
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full shadow-[0_0_25px_rgba(163,136,225,0.5)] flex items-center justify-center text-white relative z-10 border border-purple-400/30 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : buttonState === 'bot' ? (
            <motion.div key="bot" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
              <Bot className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="ask" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }} className="flex flex-col items-center justify-center">
              <span className="text-xs font-black tracking-wider leading-none mt-0.5">Ask?</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
export default FloatingAIAssistant;