import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

const TypingLoader = () => (
  <div className="flex space-x-1.5 items-center h-5 px-1">
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
    <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, animated]);

  return <div className="break-words whitespace-pre-wrap leading-relaxed">{displayedText}</div>;
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
  
  const [messages, setMessages] = useState([
    { id: 'init', role: 'bot', content: `Hi ${user?.full_name?.split(' ')[0] || 'there'}! I am Dealit's AI Assistant. How can I help you today?`, animated: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const [buttonState, setButtonState] = useState('bot');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- CHANGED: Removed isFullScreen dependency ---
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isLoading]);
  // --- END CHANGED ---

  // Fetch Chat History (Latest Session) only when widget is opened for the first time
  useEffect(() => {
    if (isOpen && !hasFetchedHistory) {
      const loadHistory = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('dealit_token');
          // Use 'latest' to get the most recent session or create an internal reference
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

  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
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
          sessionId: currentSessionId
        }),
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
            if (dataStr === '[DONE]') break;
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
      console.error('AI Chat Error:', error);
      setIsLoading(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, content: 'Sorry, I am having trouble connecting to the server right now.' } : msg
        )
      );
    }
  };

  // --- CHANGED: Removed setIsFullScreen(true) so it doesn't jarringly expand on type ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    processMessage(input);
  };
  // --- END CHANGED ---

  const handleClose = () => {
    setIsOpen(false);
  };
  
  // Expand to full page router view instead of just widget fullscreen
  const handleMaximize = () => {
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
            // --- CHANGED: Hardcoded the smaller size styling since it's only a floating widget now ---
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
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && !isLoading && (
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
                  // --- CHANGED: Removed aggressive onFocus full screen behavior ---
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