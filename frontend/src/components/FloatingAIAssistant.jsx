import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const TypingLoader = () => (
  <div className="flex space-x-1.5 items-center h-5 px-1">
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
  </div>
);

const BotMessage = ({ content }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(content.slice(0, i + 1));
      i++;
      if (i >= content.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [content]);

  return <div className="break-words whitespace-pre-wrap leading-relaxed">{displayedText}</div>;
};

// --- Pre-defined suggestions ---
const SUGGESTIONS = [
  "What is Aura Score?",
  "How do I earn Credits?",
  "Delivery rules",
  "My account stats"
];

const FloatingAIAssistant = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  // --- NAYA CHANGE: user?.name ki jagah user?.full_name?.split(' ')[0] kiya ---
  const [messages, setMessages] = useState([
    { role: 'bot', content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I am Dealit's AI Assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);

  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
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
        { role: 'bot', content: response.data.reply || 'I processed your request, but got no text back.' }
      ]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', content: 'Sorry, I am having trouble connecting to the server right now.' }
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
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] bg-gray-900 border border-purple-500/30 rounded-2xl shadow-[0_15px_50px_rgba(163,136,225,0.2)] flex flex-col overflow-hidden"
          >
            <div className="bg-gray-800/90 backdrop-blur-md border-b border-purple-500/20 p-4 flex justify-between items-center shadow-sm">
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
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors bg-gray-700/30 hover:bg-gray-700 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  transition={{ duration: 0.3 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-md shadow-purple-500/20 break-words whitespace-pre-wrap'
                        : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {msg.role === 'bot' ? <BotMessage content={msg.content} /> : msg.content}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <TypingLoader />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && !isLoading && (
              <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {SUGGESTIONS.map((text, i) => (
                  <button
                    key={i}
                    onClick={() => processMessage(text)}
                    className="whitespace-nowrap flex items-center gap-1.5 bg-gray-800 border border-purple-500/30 text-gray-300 text-[11px] font-medium px-3 py-1.5 rounded-full hover:bg-purple-500/20 hover:text-white hover:border-purple-500/50 transition-all flex-shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    {text}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="p-3 bg-gray-800/80 backdrop-blur-sm border-t border-purple-500/20">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about items, Aura, rules..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-full py-3 pl-4 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                />
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full shadow-[0_0_25px_rgba(163,136,225,0.5)] flex items-center justify-center text-white relative z-10 border border-purple-400/30"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>
    </div>
  );
};

export default FloatingAIAssistant;