import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Bot, Sparkles, Menu, Plus, Settings, HelpCircle, MessageSquare, X, Trash2, Minimize2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
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
  const { sessionId: routeSessionId } = useParams();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // NEW: Dynamic Smart Context State (Saved in localStorage)
  const [isSmartContextEnabled, setIsSmartContextEnabled] = useState(() => {
    const saved = localStorage.getItem('dealit_ai_context');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleToggleContext = () => {
    const newVal = !isSmartContextEnabled;
    setIsSmartContextEnabled(newVal);
    localStorage.setItem('dealit_ai_context', JSON.stringify(newVal));
  };
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

  // NEW: Delete All Sessions Function
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
          sessionId: currentSessionId,
          isSmartContextEnabled // NEW: Sent to backend
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
            if (dataStr === '[DONE]') {
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
              // Ignore partial JSON parse errors
            }
          }
        }
      }

    } catch (error) {
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
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1); 
    } else {
      navigate('/'); 
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="fixed top-0 left-0 w-full h-[100dvh] flex bg-gray-900 z-50 overscroll-none">
      
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
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
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

        <div className="p-3 border-t border-gray-800/80 space-y-1 bg-gray-950">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button onClick={() => navigate('/help-support')} className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help & FAQ</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-gray-900">
        
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

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 md:px-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-gray-900 border border-gray-700/50 rounded-2xl shadow-[0_20px_60px_rgba(163,136,225,0.15)] overflow-hidden"
            >
              <div className="bg-gray-800/80 border-b border-gray-700/50 p-4 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Chat Settings
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Smart Context</p>
                    <p className="text-xs text-gray-400 mt-0.5">Allow AI to read your inventory</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={isSmartContextEnabled}
                      onChange={handleToggleContext}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-800/80">
                  <button 
                    onClick={() => {
                      if(window.confirm("Are you sure you want to clear all your chat history? This action cannot be undone.")) {
                        deleteAllSessions();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors border border-red-500/20 text-sm font-semibold shadow-inner"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Conversations
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AiChatPage;