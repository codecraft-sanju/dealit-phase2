import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Maximize2, Minimize2, Mic, User, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

const FloatingAIAssistant = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const [voiceState, setVoiceState] = useState('idle');
  const [isPremiumVoiceLimited, setIsPremiumVoiceLimited] = useState(false);

  const [chatMode, setChatMode] = useState(() => localStorage.getItem('dealit_ai_mode') || 'dealit');
  
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const audioRef = useRef(null);
  const [buttonState, setButtonState] = useState('bot');
  const isStreamingRef = useRef(false);
  
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
    const checkOpen = () => {
      if (localStorage.getItem('dealit_open_floating_ai') === 'true') {
        setIsOpen(true);
        localStorage.removeItem('dealit_open_floating_ai');
      }
    };
    checkOpen();
  }, [location.pathname]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    if (isOpen && voiceState === 'idle') scrollToBottom();
  }, [messages, isOpen, isLoading, voiceState]);
  
  useEffect(() => {
    if (isOpen) return;
    const interval = setInterval(() => setButtonState((prev) => (prev === 'bot' ? 'text' : 'bot')), 2500);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    const syncMode = () => setChatMode(localStorage.getItem('dealit_ai_mode') || 'dealit');
    window.addEventListener('storage', syncMode);
    return () => window.removeEventListener('storage', syncMode);
  }, []);
  
  const markAsAnimated = (id) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, animated: false } : m));
  };

  const handleToggleMode = () => {
    const newMode = chatMode === 'dealit' ? 'general' : 'dealit';
    setChatMode(newMode);
    localStorage.setItem('dealit_ai_mode', newMode);
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
      const preferredVoice = voices.find(v => pref === 'female' ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male'));
      if (preferredVoice) utterance.voice = preferredVoice;
    }
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = (e) => setVoiceState('idle');
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text) => {
    if (!text) return;
    if (audioRef.current) audioRef.current.pause();
    const voicePref = localStorage.getItem('dealit_ai_voice_pref') || 'female';
    const textToSpeak = text.replace(/[*_#`]/g, '');

    setVoiceState('generating_audio');
    try {
      const token = localStorage.getItem('dealit_token');
      const response = await fetch(`${API_URL}/ai/synthesize-voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSpeak, voicePref: voicePref })
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
      audio.onended = () => { setVoiceState('idle'); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setVoiceState('idle'); URL.revokeObjectURL(audioUrl); };
      
      setVoiceState('speaking');
      await audio.play();
    } catch (error) {
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
    isStreamingRef.current = true;
    setHasStartedChat(true);

    try {
      const token = localStorage.getItem('dealit_token');
      const smartContextStr = localStorage.getItem('dealit_ai_context');
      const isSmartContextEnabled = smartContextStr !== null ? JSON.parse(smartContextStr) : true;
      
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage, sessionId: currentSessionId, isSmartContextEnabled, chatMode }),
        signal: abortControllerRef.current.signal
      });

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
                isStreamingRef.current = false;
              }, 300);
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'session_id') { setCurrentSessionId(parsed.sessionId); continue; }
              botReply += parsed.content;
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      isStreamingRef.current = false;
      setVoiceState('idle');
      alert(`Voice Error: ${error.message}`);
    }
  };
  
  const handleMicClick = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Your browser does not support voice input."); return; }
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
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setVoiceState('idle');
  };
  
  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    setHasStartedChat(true);
    const newMessages = [...messages, { id: Date.now(), role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    const botMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: botMessageId, role: 'bot', content: '', animated: false }]);
    
    isStreamingRef.current = true;

    try {
      const token = localStorage.getItem('dealit_token');
      const smartContextStr = localStorage.getItem('dealit_ai_context');
      const isSmartContextEnabled = smartContextStr !== null ? JSON.parse(smartContextStr) : true;
      
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage, sessionId: currentSessionId, isSmartContextEnabled, chatMode }),
        signal: abortControllerRef.current.signal
      });

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
                isStreamingRef.current = false;
              }, 1000);
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'session_id') { setCurrentSessionId(parsed.sessionId); continue; }
              botReply += parsed.content;
              setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, content: botReply } : msg));
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      setIsLoading(false);
      isStreamingRef.current = false;
      setMessages((prev) => prev.map((msg) => msg.id === botMessageId ? { ...msg, content: `⚠️ ${error.message}` } : msg));
    }
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (voiceState !== 'idle') cancelVoiceMode();
    processMessage(input);
  };
  
  const handleClose = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsOpen(false);
  };
  
  const handleMaximize = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    handleClose();
    if(currentSessionId) navigate(`/ai-chat/${currentSessionId}`);
    else navigate('/ai-chat');
  };
  
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className={`fixed flex flex-col bg-gray-900 shadow-[0_15px_50px_rgba(163,136,225,0.3)] overflow-hidden z-[100] overscroll-none bottom-24 right-4 md:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[500px] max-h-[75dvh] border border-purple-500/30 rounded-2xl`}
          >
            <div className="bg-gray-800/90 backdrop-blur-md border-b border-purple-500/20 p-4 flex justify-between items-center shadow-sm shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/10 flex items-center justify-center border border-purple-500/30">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">Dealit AI</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      Online
                    </p>
                    <button 
                      onClick={handleToggleMode}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${chatMode === 'general' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' : 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'}`}
                      title="Click to switch AI Mode"
                    >
                      {chatMode === 'general' ? 'General Mode' : 'Dealit Mode'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleMaximize} className="text-gray-400 hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full" title="Open Full App"><Maximize2 className="w-4 h-4" /></button>
                <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full"><X className="w-4 h-4" /></button>
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
                  
                  <div className="z-10 flex flex-col items-center w-full px-6 text-center">
                    <div className="relative flex items-center justify-center w-28 h-28 mb-6">
                      {voiceState === 'listening' && (
                        <div className="absolute inset-0 rounded-full bg-red-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                      )}
                      {voiceState === 'speaking' && (
                        <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse" />
                      )}
                      {voiceState === 'generating_audio' && (
                        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse" />
                      )}
                      <div className="z-10 w-20 h-20 bg-gray-950 rounded-full flex items-center justify-center shadow-inner border border-gray-700">
                        {voiceState === 'listening' ? <Mic className="w-8 h-8 text-red-400 animate-pulse" /> : <Bot className="w-8 h-8 text-purple-400" />}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">
                      {voiceState === 'listening' && 'Listening to you...'}
                      {voiceState === 'thinking' && 'Analyzing...'}
                      {voiceState === 'generating_audio' && 'Preparing voice...'}
                      {voiceState === 'speaking' && (isPremiumVoiceLimited ? 'Speaking (Standard Voice)...' : 'Speaking...')}
                    </h2>
                    
                    {voiceState === 'speaking' && isPremiumVoiceLimited && (
                      <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3 animate-pulse">
                        Daily Premium Limit Reached
                      </span>
                    )}
                    
                    <div className="h-10 flex items-center justify-center w-full mb-8">
                      {voiceState === 'listening' && (
                        <div className="flex gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                      )}
                      {(voiceState === 'thinking' || voiceState === 'generating_audio') && <TypingLoader />}
                      {voiceState === 'speaking' && <SoundWave />}
                    </div>
                    
                    <button onClick={cancelVoiceMode} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-all border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      <X className="w-4 h-4" /> Stop Listening
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <>
                <div className={`flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent relative ${!hasStartedChat && 'flex flex-col items-center justify-center'}`}>
                  {!hasStartedChat ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="flex flex-col items-center justify-center text-center w-full"
                    >
                      <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                        className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-purple-600/20 to-emerald-500/20 flex items-center justify-center border border-purple-500/40 relative shadow-[0_0_20px_rgba(163,136,225,0.1)]"
                      >
                        <Bot className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(163,136,225,0.4)]" />
                      </motion.div>
                      <motion.h2 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-lg font-bold text-white mb-1"
                      >
                        Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="text-gray-400 text-[11px] mb-4 px-2"
                      >
                        How can I assist you with Dealit today?
                      </motion.p>
                      
                      <div className="flex flex-col w-full gap-1.5 px-1">
                        {SUGGESTIONS.map((text, i) => (
                          <motion.button 
                            key={i} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.5 + (i * 0.08) }}
                            onClick={() => processMessage(text)} 
                            className="flex items-center justify-between bg-gray-800/40 border border-gray-700/50 text-gray-300 text-[11px] font-medium p-2.5 rounded-lg hover:bg-purple-500/10 hover:text-white hover:border-purple-500/30 transition-all w-full text-left group"
                          >
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-purple-400/70 group-hover:text-purple-400 transition-colors" />
                              {text}
                            </span>
                            <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-400" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    messages.map((msg) => (
                      <motion.div 
                        initial={msg.animated ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        transition={{ duration: 0.3 }}
                        key={msg.id} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-md shadow-purple-500/20 break-words whitespace-pre-wrap' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-sm'}`}>
                          {msg.role === 'bot' ? (msg.content ? <BotMessage content={msg.content} animated={msg.animated} onComplete={() => markAsAnimated(msg.id)} /> : <TypingLoader />) : msg.content}
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-3 bg-gray-800/80 backdrop-blur-sm border-t border-purple-500/20 shrink-0 z-10">
                  <div className="relative flex items-center">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about items, Aura, rules..." className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-4 pr-20 text-base md:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner" />
                    <button type="button" onClick={handleMicClick} className="absolute right-12 w-8 h-8 flex items-center justify-center rounded-full transition-all text-gray-400 hover:text-purple-400"><Mic className="w-4 h-4" /></button>
                    <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105 active:scale-95 shadow-md shadow-purple-500/30"><Send className="w-3.5 h-3.5 ml-0.5" /></button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* CHANGES MADE HERE:
        Updated onClick to navigate to full screen chat directly if the widget is not already open.
      */}
      <motion.button
        animate={isOpen ? { y: 0, scale: 0.9 } : { y: [0, -6, 0], scale: 1 }}
        transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" }, scale: { type: "spring", damping: 20, stiffness: 200 } }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            navigate(currentSessionId ? `/ai-chat/${currentSessionId}` : '/ai-chat');
          }
        }}
        className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full shadow-[0_0_25px_rgba(163,136,225,0.5)] flex items-center justify-center text-white relative z-10 border border-purple-400/30 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}><X className="w-6 h-6" /></motion.div>
          ) : buttonState === 'bot' ? (
            <motion.div key="bot" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}><Bot className="w-6 h-6" /></motion.div>
          ) : (
            <motion.div key="ask" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }} className="flex flex-col items-center justify-center"><span className="text-xs font-black tracking-wider leading-none mt-0.5">Ask?</span></motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
export default FloatingAIAssistant;