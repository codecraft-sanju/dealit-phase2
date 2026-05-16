import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; 
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const TypingLoader = () => (
  <div className="flex space-x-1.5 items-center h-6 px-1">
    <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
    <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
    <motion.div className="w-2 h-2 bg-purple-400 rounded-full" animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
  </div>
);

// --- CHANGES MADE: Added animated flag and onComplete callback ---
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, animated]);

  return <div className="break-words whitespace-pre-wrap leading-relaxed">{displayedText}</div>;
};

const SUGGESTIONS = [
  "What is my Aura Score?",
  "How do I earn more Credits?",
  "Explain OTP delivery verification",
  "Tell me my account details"
];

const AiChatPage = ({ user }) => {
  const navigate = useNavigate();
  
  // --- CHANGES MADE: Added unique id and animated flag to track state ---
  const [messages, setMessages] = useState([
    { id: 'init', role: 'bot', content: `Welcome to Dealit AI, ${user?.full_name?.split(' ')[0] || 'friend'}. How can I assist you with your trades today?`, animated: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- CHANGES MADE: Function to mark a message as fully animated ---
  const markAsAnimated = (id) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, animated: false } : m));
  };

  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/ai/chat`,
        { message: userMessage },
        { withCredentials: true }
      );
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', content: response.data.reply || 'I processed your request, but got no text back.', animated: true }
      ]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'bot', content: 'Server connection failed. Please try again later.', animated: true }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    processMessage(input);
  };

  return (
    // --- CHANGES MADE: Replaced h-[100dvh] with fixed inset-0 and overscroll-none to lock the viewport and ensure header never scrolls away ---
    <div className="fixed inset-0 flex flex-col bg-gray-900 z-50 overscroll-none">
      <div className="bg-gray-800/80 backdrop-blur-md border-b border-purple-500/20 p-4 flex items-center gap-4 shrink-0 shadow-sm shadow-purple-900/10 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-gray-900 hover:bg-gray-700 rounded-full text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-emerald-500/10 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(163,136,225,0.2)]">
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 container mx-auto max-w-3xl scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
        {messages.map((msg) => (
          <motion.div 
            /* --- CHANGES MADE: Avoid jump animation for old messages --- */
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
                <BotMessage 
                  content={msg.content} 
                  animated={msg.animated} 
                  onComplete={() => markAsAnimated(msg.id)} 
                />
              ) : (
                msg.content
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-5 py-3 shadow-md">
              <TypingLoader />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- CHANGES MADE: Wrapped input and suggestions in a strictly non-shrinking footer container --- */}
      <div className="shrink-0 bg-gray-900 pb-safe">
        {messages.length === 1 && !isLoading && (
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
              className="w-full bg-gray-900 border border-gray-700 rounded-full py-4 pl-6 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
            />
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
  );
};

export default AiChatPage;