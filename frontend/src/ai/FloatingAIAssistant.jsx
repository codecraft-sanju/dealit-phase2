import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, Sparkles, Maximize2, Mic, ArrowRight, WifiOff, Bot,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Lightfall from './Lightfall';

import {
  SharedStyles, MagicPoints,
  SUGGESTIONS, extractCarouselFromReply,
  TypingLoader, SoundWave,
  BotMessage, MessageFooter,
} from './AiChatShared';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL  = `${API_BASE}/api`;

const FloatingAIAssistant = ({ user }) => {
  const [isOpen,                setIsOpen]                = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const [messages,              setMessages]              = useState([]);
  const [input,                 setInput]                 = useState('');
  const [isLoading,             setIsLoading]             = useState(false);
  const [currentSessionId,      setCurrentSessionId]      = useState(null);
  const [hasStartedChat,        setHasStartedChat]        = useState(false);
  const [voiceState,            setVoiceState]            = useState('idle');
  const [isPremiumVoiceLimited, setIsPremiumVoiceLimited] = useState(false);
  const [isChatLimited,         setIsChatLimited]         = useState(false);
  const [isOffline,             setIsOffline]             = useState(!navigator.onLine);
  const [buttonState,           setButtonState]           = useState('bot');

  // Hardcoded to always be in strict mode for the floating assistant
  const chatMode = 'dealit';

  const messagesEndRef    = useRef(null);
  const abortControllerRef = useRef(null);
  const audioRef          = useRef(null);
  const isStreamingRef    = useRef(false);

  // ---------- network ----------
  useEffect(() => {
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ---------- persist messages ----------
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`dealit_ai_history_${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  // ---------- native speech bridge ----------
  useEffect(() => {
    const handler = (e) => { if (e.detail?.type === 'SPEECH_FINISHED') setVoiceState('idle'); };
    window.addEventListener('NATIVE_APP_EVENT', handler);
    return () => window.removeEventListener('NATIVE_APP_EVENT', handler);
  }, []);

  // ---------- cleanup ----------
  useEffect(() => {
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};
    return () => {
      abortControllerRef.current?.abort();
      window.speechSynthesis?.cancel();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  // ---------- open from minimize ----------
  useEffect(() => {
    if (localStorage.getItem('dealit_open_floating_ai') === 'true') {
      setIsOpen(true);
      localStorage.removeItem('dealit_open_floating_ai');
    }
  }, [location.pathname]);

  // ---------- FAB animation alternation ----------
  useEffect(() => {
    if (isOpen) return;
    const id = setInterval(() => setButtonState((prev) => prev === 'bot' ? 'text' : 'bot'), 2500);
    return () => clearInterval(id);
  }, [isOpen]);

  // ---------- scroll ----------
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => {
    if (isOpen && voiceState === 'idle') scrollToBottom();
  }, [messages, isOpen, isLoading, voiceState]);


  // ---------- voice ----------
  const fallbackToNativeSpeech = (text, pref) => {
    if (window.ReactNativeWebView) {
      setVoiceState('speaking');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'START_NATIVE_SPEECH', text, pref }));
      return;
    }
    if (!window.speechSynthesis) { setVoiceState('idle'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices    = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      pref === 'female'
        ? v.name.toLowerCase().includes('female')
        : v.name.toLowerCase().includes('male'),
    );
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend   = () => setVoiceState('idle');
    utterance.onerror = () => setVoiceState('idle');
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text) => {
    if (!text) return;
    audioRef.current?.pause();
    const pref        = localStorage.getItem('dealit_ai_voice_pref') || 'female';
    const textToSpeak = text.replace(/[*_#`]/g, '');
    setVoiceState('generating_audio');
    try {
      const token = localStorage.getItem('dealit_token');
      const res   = await fetch(`${API_URL}/ai/synthesize-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: textToSpeak, voicePref: pref }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.errorCode === 'DAILY_VOICE_LIMIT_REACHED' || res.status === 429) setIsPremiumVoiceLimited(true);
        throw new Error(err.errorCode || 'API_FAILED');
      }
      const blob     = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio    = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setVoiceState('idle'); URL.revokeObjectURL(audioUrl); };
      audio.onerror = () => { setVoiceState('idle'); URL.revokeObjectURL(audioUrl); };
      setVoiceState('speaking');
      await audio.play();
    } catch {
      fallbackToNativeSpeech(textToSpeak, pref);
    }
  };

  const cancelVoiceMode = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    abortControllerRef.current?.abort();
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'STOP_NATIVE_SPEECH' }));
    setVoiceState('idle');
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

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage, 
          sessionId: currentSessionId, 
          isSmartContextEnabled: smartContext, 
          chatMode: chatMode,
          disableUI: true 
        }),
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
              botReply.trim() ? speakText(botReply) : setVoiceState('idle');
              isStreamingRef.current = false;
            }, 300);
            break outer;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'session_id') { setCurrentSessionId(parsed.sessionId); continue; }
            botReply += parsed.content;
          } catch { /* skip */ }
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
    audioRef.current?.pause();
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
      { id: botMsgId, role: 'bot', content: '', streaming: true, timestamp: ts },
    ]);
    setInput('');
    setIsLoading(true);
    isStreamingRef.current = true;

    try {
      const token        = localStorage.getItem('dealit_token');
      const smartContext = JSON.parse(localStorage.getItem('dealit_ai_context') ?? 'true');

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ 
          message: userMessage, 
          sessionId: currentSessionId, 
          isSmartContextEnabled: smartContext, 
          chatMode: chatMode,
          disableUI: true
        }),
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
                  role: 'bot', 
                  content: p.content,
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (voiceState !== 'idle') cancelVoiceMode();
    processMessage(input);
  };

  const handleClose = () => {
    abortControllerRef.current?.abort();
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setIsOpen(false);
  };

  const handleMaximize = () => {
    abortControllerRef.current?.abort();
    handleClose();
    navigate(currentSessionId ? `/ai-chat/${currentSessionId}` : '/ai-chat');
  };

  const getLightfallConfig = (state) => {
    switch (state) {
      case 'listening': return { colors: ['#f87171', '#ef4444', '#b91c1c'], speed: 1.5, zoom: 4 };
      case 'speaking':  return { colors: ['#c084fc', '#a855f7', '#7e22ce'], speed: 1.2, zoom: 3 };
      default:          return { colors: ['#60a5fa', '#3b82f6', '#1d4ed8'], speed: 0.8, zoom: 3 };
    }
  };

  // ---------- render ----------
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60]">
      <SharedStyles />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed flex flex-col bg-gray-900 shadow-[0_15px_50px_rgba(163,136,225,0.3)] overflow-hidden z-[100] overscroll-none bottom-24 right-4 md:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[500px] max-h-[75dvh] border border-purple-500/30 rounded-2xl"
          >
            {/* Header */}
            <div className="bg-gray-800/90 backdrop-blur-md border-b border-purple-500/20 p-4 flex justify-between items-center shadow-sm shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-500/30">
                  <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="AI" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-wide">Dealit AI</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      Online
                    </p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded border bg-purple-500/10 border-purple-500/30 text-purple-400">
                      Dealit Mode
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleMaximize} className="text-gray-400 hover:text-white bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full transition-colors" title="Expand">
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button onClick={handleClose} className="text-gray-400 hover:text-white bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 flex flex-col overflow-hidden">
              {/* Offline banner */}
              <AnimatePresence>
                {isOffline && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-full shadow-lg whitespace-nowrap"
                  >
                    <WifiOff className="w-3 h-3" />
                    Connection lost. Retrying...
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div
                className={`flex-1 overflow-y-auto p-3 space-y-3 ai-no-scrollbar relative
                  ${!hasStartedChat ? 'flex flex-col items-center justify-center' : ''}`}
              >
                {!hasStartedChat ? (
                  /* Welcome screen */
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center text-center w-full"
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                      className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-purple-600/20 to-emerald-500/20 flex items-center justify-center border border-purple-500/40 relative shadow-[0_0_20px_rgba(163,136,225,0.1)]"
                    >
                      <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full rounded-full object-cover" />
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-lg font-bold text-white mb-1">
                      Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
                    </motion.h2>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-400 text-[11px] mb-4 px-2">
                      How can I assist you with Dealit today?
                    </motion.p>

                    {/* Limit banner in welcome state */}
                    {isChatLimited && (
                      <div className="w-full mb-3 bg-[#1e1e1e] border border-gray-700/80 rounded-xl p-3 text-center">
                        <p className="text-xs text-amber-400 font-semibold mb-1">Daily limit reached</p>
                        <p className="text-[10px] text-gray-400">You've used all your AI chats for today.</p>
                      </div>
                    )}

                    <div className="flex flex-col w-full gap-1.5 px-1">
                      {SUGGESTIONS.map((text, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + i * 0.08 }}
                          onClick={() => processMessage(text)}
                          disabled={isChatLimited}
                          className="flex items-center justify-between bg-gray-800/40 border border-gray-700/50 text-gray-300 text-[11px] font-medium p-2.5 rounded-lg hover:bg-purple-500/10 hover:text-white hover:border-purple-500/30 transition-all w-full text-left group disabled:opacity-40 disabled:cursor-not-allowed"
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
                  messages.map((msg) => {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm
                              ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-md shadow-purple-500/20 break-words whitespace-pre-wrap'
                                : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-sm'}`}
                          >
                            <div className="w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                              {msg.role === 'bot' ? (
                                msg.content
                                  ? <BotMessage content={msg.content} navigate={navigate} compact />
                                  : <TypingLoader />
                              ) : (
                                msg.content
                              )}
                            </div>

                            {/* Footer only on completed messages */}
                            {msg.role === 'bot' && msg.content && !msg.streaming && (
                              <MessageFooter msg={msg} timestamp={msg.timestamp} compact />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Limit banner (chat area) */}
              <AnimatePresence>
                {isChatLimited && hasStartedChat && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mx-3 mb-2 bg-[#1e1e1e] border border-amber-500/20 rounded-xl p-3 text-center shrink-0"
                  >
                    <p className="text-xs text-amber-400 font-semibold">Daily limit reached</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Tap the expand button to unlock with 50 credits.
                    </p>
                    <button
                      onClick={handleMaximize}
                      className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 underline transition-colors"
                    >
                      Open full chat →
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-3 shrink-0 z-10 relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isChatLimited ? 'Daily limit reached…' : 'Ask about items, Aura, rules...'}
                      disabled={isChatLimited}
                      className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-4 pr-10 text-base md:text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleMicClick}
                      disabled={isChatLimited}
                      className="absolute right-1.5 p-1.5 flex items-center justify-center rounded-full transition-all text-gray-400 hover:bg-gray-800 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim() || isChatLimited}
                    className="magic-btn shrink-0 w-10 h-10 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-500/30"
                    style={{ '--round': '9999px', padding: 0 }}
                  >
                    <MagicPoints />
                    <span className="magic-inner">
                      <Send className="w-4 h-4 icon" fill="none" strokeWidth="2.5" />
                    </span>
                  </button>
                </div>
              </form>

              {/* Voice overlay */}
              <AnimatePresence>
                {voiceState !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center w-full h-full overflow-hidden bg-gray-900/85 backdrop-blur-md"
                  >
                    <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
                      <Lightfall
                        colors={getLightfallConfig(voiceState).colors}
                        backgroundColor="#000000"
                        speed={getLightfallConfig(voiceState).speed}
                        zoom={getLightfallConfig(voiceState).zoom}
                        glow={1.2}
                        twinkle={1.5}
                        mouseInteraction
                      />
                    </div>
                    <div className="z-10 flex flex-col items-center w-full px-6 text-center">
                      <div className="relative flex items-center justify-center w-28 h-28 mb-6">
                        {voiceState === 'listening'        && <div className="absolute inset-0 rounded-full bg-red-500/30    animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />}
                        {voiceState === 'speaking'         && <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse" />}
                        {voiceState === 'generating_audio' && <div className="absolute inset-0 rounded-full bg-blue-500/30   animate-pulse" />}
                        <div className="z-10 w-20 h-20 bg-gray-950/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner border border-gray-700 overflow-hidden">
                          {voiceState === 'listening'
                            ? <Mic className="w-8 h-8 text-red-400 animate-pulse" />
                            : <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full object-cover" />}
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2 drop-shadow-md">
                        {voiceState === 'listening'        && 'Listening to you...'}
                        {voiceState === 'thinking'         && 'Analyzing...'}
                        {voiceState === 'generating_audio' && 'Preparing voice...'}
                        {voiceState === 'speaking'         && (isPremiumVoiceLimited ? 'Speaking (Standard Voice)...' : 'Speaking...')}
                      </h2>
                      {voiceState === 'speaking' && isPremiumVoiceLimited && (
                        <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3 animate-pulse">
                          Daily Premium Limit Reached
                        </span>
                      )}
                      <div className="h-10 flex items-center justify-center w-full mb-8 text-white drop-shadow-md">
                        {voiceState === 'listening' && (
                          <div className="flex gap-2">
                            {[0, 0.2, 0.4].map((d, i) => (
                              <span key={i} className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                            ))}
                          </div>
                        )}
                        {(voiceState === 'thinking' || voiceState === 'generating_audio') && <TypingLoader />}
                        {voiceState === 'speaking' && <SoundWave />}
                      </div>
                      <button type="button" onClick={cancelVoiceMode} className="magic-btn text-xs px-6 py-2.5">
                        <MagicPoints />
                        <span className="magic-inner">
                          <X className="w-4 h-4 icon" strokeWidth="2.5" fill="none" /> Stop Listening
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        animate={isOpen ? { y: 0, scale: 0.9 } : { y: [0, -6, 0], scale: 1 }}
        transition={{
          y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
          scale: { type: 'spring', damping: 20, stiffness: 200 },
        }}
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