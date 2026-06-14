import React, {useState,useRef, useEffect,
  useCallback,
} from 'react';
import {Send,
  Sparkles,
  Plus,
  Settings,
  HelpCircle,
  MessageSquare,
  X,
  Trash2,
  Minimize2,
  ChevronDown,
  Mic,
  User,
  WifiOff,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Unlock
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Lightfall from './Lightfall';
import AiChatProductCard from '../components/AiChatProductCard';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL = `${API_BASE}/api`;

/**
 * Splits a bot reply string into alternating text and UI blocks.
 * UI blocks are JSON fences containing a recognized ui_type.
 * Returns an array of { type: 'text' | 'ui', content: string }.
 */
const extractCarouselFromReply = (replyText) => {
  const tick3 = '`' + '`' + '`';
  const jsonBlockRegex = new RegExp(tick3 + '(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*' + tick3, 'g');
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = jsonBlockRegex.exec(replyText)) !== null) {
    if (match.index > lastIndex) {
      const textSlice = replyText.slice(lastIndex, match.index).trim();
      if (textSlice) parts.push({ type: 'text', content: textSlice });
    }
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.ui_type === 'product_carousel' || parsed.ui_type === 'action_button') {
        parts.push({ type: 'ui', content: match[0] });
      } else {
        parts.push({ type: 'text', content: match[0] });
      }
    } catch {
      parts.push({ type: 'text', content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  const remaining = replyText.slice(lastIndex).trim();
  if (remaining) parts.push({ type: 'text', content: remaining });

  return parts.length > 0 ? parts : [{ type: 'text', content: replyText }];
};

const MagicButtonStyles = () => (
  <style>
    {`
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

      .magic-btn {
        --round: 0.75rem;
        cursor: pointer;
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: all 0.25s ease;
        background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(223,113,255,0.8) 0%, rgba(223,113,255,0) 100%), linear-gradient(0deg, #7a5af8, #7a5af8);
        border-radius: var(--round);
        border: none;
        outline: none;
        padding: 12px 18px;
      }
      .magic-btn::before, .magic-btn::after {
        content: "";
        position: absolute;
        inset: var(--space);
        transition: all 0.5s ease-in-out;
        border-radius: calc(var(--round) - var(--space));
        z-index: 0;
      }
      .magic-btn::before { --space: 1px; background: linear-gradient(177.95deg, rgba(255,255,255,0.19) 0%, rgba(255,255,255,0) 100%); }
      .magic-btn::after { --space: 2px; background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(223,113,255,0.8) 0%, rgba(223,113,255,0) 100%), linear-gradient(0deg, #7a5af8, #7a5af8); }
      .magic-btn:active { transform: scale(0.95); }

      .magic-points_wrapper { overflow: hidden; width: 100%; height: 100%; pointer-events: none; position: absolute; z-index: 1; }
      .magic-points_wrapper .point { bottom: -10px; position: absolute; animation: floating-points infinite ease-in-out; pointer-events: none; width: 2px; height: 2px; background-color: #fff; border-radius: 9999px; }
      @keyframes floating-points { 0% { transform: translateY(0); } 85% { opacity: 0; } 100% { transform: translateY(-55px); opacity: 0; } }
      .magic-points_wrapper .point:nth-child(1) { left: 10%; opacity: 1; animation-duration: 2.35s; animation-delay: 0.2s; }
      .magic-points_wrapper .point:nth-child(2) { left: 30%; opacity: 0.7; animation-duration: 2.5s; animation-delay: 0.5s; }
      .magic-points_wrapper .point:nth-child(3) { left: 25%; opacity: 0.8; animation-duration: 2.2s; animation-delay: 0.1s; }
      .magic-points_wrapper .point:nth-child(4) { left: 44%; opacity: 0.6; animation-duration: 2.05s; }
      .magic-points_wrapper .point:nth-child(5) { left: 50%; opacity: 1; animation-duration: 1.9s; }
      .magic-points_wrapper .point:nth-child(6) { left: 75%; opacity: 0.5; animation-duration: 1.5s; animation-delay: 1.5s; }
      .magic-points_wrapper .point:nth-child(7) { left: 88%; opacity: 0.9; animation-duration: 2.2s; animation-delay: 0.2s; }
      .magic-points_wrapper .point:nth-child(8) { left: 58%; opacity: 0.8; animation-duration: 2.25s; animation-delay: 0.2s; }
      .magic-points_wrapper .point:nth-child(9) { left: 98%; opacity: 0.6; animation-duration: 2.6s; animation-delay: 0.1s; }
      .magic-points_wrapper .point:nth-child(10) { left: 65%; opacity: 1; animation-duration: 2.5s; animation-delay: 0.2s; }

      .magic-inner { z-index: 2; gap: 6px; position: relative; color: white; display: inline-flex; align-items: center; justify-content: center; font-weight: 500; width: 100%; height: 100%; }
      .magic-inner svg.icon { fill: transparent; animation: magic-auto-draw 2s linear infinite; }
      @keyframes magic-auto-draw {
        0% { stroke-dasharray: 0 0 0 0; fill: transparent; }
        25% { stroke-dasharray: 68 68 0 0; fill: transparent; }
        30% { fill: white; }
        80% { stroke-dasharray: 68 68 0 0; fill: white; }
        100% { stroke-dasharray: 0 0 0 0; fill: transparent; }
      }
      @keyframes gradient-xy {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}
  </style>
);

const GeneratingLoader = () => (
  <>
    <style>{`
      .custom-loader-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; z-index: 40; background: linear-gradient(0deg, #1a3379, #0f172a, #000); border-radius: inherit; }
      .loader-wrapper { position: relative; display: flex; align-items: center; justify-content: center; width: 180px; height: 180px; font-family: "Inter", sans-serif; font-size: 1.1em; font-weight: 300; color: white; border-radius: 50%; background-color: transparent; user-select: none; }
      .loader-circle { position: absolute; top: 0; left: 0; width: 100%; aspect-ratio: 1/1; border-radius: 50%; background-color: transparent; animation: loader-combined 2.3s linear infinite; z-index: 0; }
      @keyframes loader-combined {
        0% { transform: rotate(90deg); box-shadow: 0 6px 12px 0 #38bdf8 inset, 0 12px 18px 0 #005dff inset, 0 36px 36px 0 #1e40af inset; }
        25% { transform: rotate(180deg); box-shadow: 0 6px 12px 0 #0099ff inset, 0 12px 18px 0 #38bdf8 inset, 0 36px 36px 0 #005dff inset; }
        50% { transform: rotate(270deg); box-shadow: 0 6px 12px 0 #60a5fa inset, 0 12px 6px 0 #0284c7 inset, 0 24px 36px 0 #005dff inset; }
        75% { transform: rotate(360deg); box-shadow: 0 6px 12px 0 #3b82f6 inset, 0 12px 18px 0 #0ea5e9 inset, 0 36px 36px 0 #2563eb inset; }
        100% { transform: rotate(450deg); box-shadow: 0 6px 12px 0 #4dc8fd inset, 0 12px 18px 0 #005dff inset, 0 36px 36px 0 #1e40af inset; }
      }
      .loader-letter { display: inline-block; opacity: 0.4; animation: loader-letter-anim 2.4s infinite; z-index: 1; }
      .loader-letter:nth-child(1){animation-delay:0s}.loader-letter:nth-child(2){animation-delay:0.1s}.loader-letter:nth-child(3){animation-delay:0.2s}.loader-letter:nth-child(4){animation-delay:0.3s}.loader-letter:nth-child(5){animation-delay:0.4s}.loader-letter:nth-child(6){animation-delay:0.5s}.loader-letter:nth-child(7){animation-delay:0.6s}.loader-letter:nth-child(8){animation-delay:0.7s}.loader-letter:nth-child(9){animation-delay:0.8s}.loader-letter:nth-child(10){animation-delay:0.9s}.loader-letter:nth-child(11){animation-delay:1s}.loader-letter:nth-child(12){animation-delay:1.1s}.loader-letter:nth-child(13){animation-delay:1.2s}
      @keyframes loader-letter-anim { 0%,100% { opacity:0.4; transform:translateY(0); } 20% { opacity:1; text-shadow:#f8fcff 0 0 5px; } 40% { opacity:0.7; } }
    `}</style>
    <div className="custom-loader-container">
      <div className="loader-wrapper">
        {'Generating...'.split('').map((ch, i) => (
          <span key={i} className="loader-letter">{ch}</span>
        ))}
        <div className="loader-circle" />
      </div>
    </div>
  </>
);

const TypingLoader = () => (
  <>
    <style>{`
      .typing-loader-wrapper { position:relative; display:flex; align-items:center; justify-content:center; color:inherit; gap:10px; font-weight:500; }
      .typing-loader { width:20px; height:20px; border-radius:50%; animation:typing-loader-rotate 1.5s linear infinite; }
      @keyframes typing-loader-rotate {
        0% { transform:rotate(90deg); box-shadow:0 1px 1px 0 #fff inset,0 3px 5px 0 #ff5f9f inset,0 4px 4px 0 #0693ff inset; }
        50% { transform:rotate(270deg); background:#7c0911; box-shadow:0 1px 1px 0 #fff inset,0 3px 5px 0 #d60a47 inset,0 4px 4px 0 #fbef19 inset; }
        100% { transform:rotate(450deg); box-shadow:0 1px 1px 0 #fff inset,0 3px 5px 0 #ff5f9f inset,0 4px 4px 0 #28a9ff inset; }
      }
      .typing-loader-letter { display:inline-block; opacity:0.4; animation:typing-loader-letter-anim 2s infinite; }
      .typing-loader-letter:nth-child(1){animation-delay:0s}.typing-loader-letter:nth-child(2){animation-delay:0.1s}.typing-loader-letter:nth-child(3){animation-delay:0.2s}.typing-loader-letter:nth-child(4){animation-delay:0.3s}.typing-loader-letter:nth-child(5){animation-delay:0.4s}.typing-loader-letter:nth-child(6){animation-delay:0.5s}.typing-loader-letter:nth-child(7){animation-delay:0.6s}.typing-loader-letter:nth-child(8){animation-delay:0.7s}.typing-loader-letter:nth-child(9){animation-delay:0.8s}
      @keyframes typing-loader-letter-anim { 0%,100% { opacity:0.4; transform:scale(1); } 20% { opacity:1; transform:scale(1.15); } 40% { opacity:0.7; transform:scale(1); } }
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

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
      title="Copy response"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const CopyCodeButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm border border-gray-700 cursor-pointer z-10"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Code'}
    </button>
  );
};

/**
 * Renders a horizontal snap-scroll product carousel for AiChatPage.
 * Sits outside the message bubble at full container width.
 */
const ProductCarousel = ({ items, navigate }) => (
  <div className="w-full">
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar">
      {items.map((item, idx) => (
        <div key={item._id || idx} className="snap-start shrink-0 w-[160px] sm:w-[180px]">
          <AiChatProductCard item={item} onClick={(id) => navigate(`/item/${id}`)} />
        </div>
      ))}
    </div>
    <p className="text-[10px] text-gray-600 mt-1 text-right pr-1">
      {items.length} item{items.length !== 1 ? 's' : ''} · swipe to browse
    </p>
  </div>
);

const BotMessage = ({ content, animated, onComplete, navigate }) => {
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
    <div className="leading-relaxed text-sm w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4 text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-4 text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 text-white" {...props} />,
          a: ({ node, ...props }) => <a className="text-purple-400 hover:text-purple-300 underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
          code: ({ node, inline, className, children, ...props }) => {
            const codeString = String(children).replace(/\n$/, '');
            const isJsonBlock = className === 'language-json' || codeString.includes('"ui_type"');
            if (!inline && isJsonBlock) {
              try {
                const parsedData = JSON.parse(codeString);
                if (parsedData.ui_type === 'product_carousel' && Array.isArray(parsedData.items)) {
                  return <ProductCarousel items={parsedData.items} navigate={navigate} />;
                }
                if (parsedData.ui_type === 'action_button' && parsedData.label && parsedData.action) {
                  return (
                    <button
                      onClick={() => navigate(parsedData.action)}
                      className="mt-3 mb-2 w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {parsedData.label}
                    </button>
                  );
                }
              } catch {
                return (
                  <div className="my-3 p-4 bg-gray-900 rounded-xl border border-purple-500/30 flex items-center justify-center gap-2 text-purple-400 text-xs animate-pulse">
                    <Sparkles className="w-4 h-4" /> Generating Interface...
                  </div>
                );
              }
            }
            return inline ? (
              <code className="bg-gray-900 text-purple-300 px-1.5 py-0.5 rounded-md text-xs font-mono border border-gray-700" {...props}>
                {children}
              </code>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-gray-700 my-3 bg-gray-950 shadow-inner max-w-full">
                <CopyCodeButton text={codeString} />
                <pre className="p-4 pt-12 overflow-x-auto no-scrollbar">
                  <code className={`text-gray-300 text-xs font-mono ${className || ''}`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border border-gray-700 rounded-xl shadow-sm max-w-full no-scrollbar">
              <table className="min-w-full divide-y divide-gray-700 text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-900" {...props} />,
          th: ({ node, ...props }) => <th className="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-gray-700 bg-gray-800/50" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 text-gray-300" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Renders a bot_ui message (carousel/action) as a standalone full-width block
 * with a subtle entry animation. Lives outside the chat bubble.
 */
const BotUIBlock = ({ content, navigate }) => {
  const tick3 = '`' + '`' + '`';
  const codeMatch = content.match(new RegExp(tick3 + '(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*' + tick3));
  if (!codeMatch) return null;
  try {
    const parsedData = JSON.parse(codeMatch[1]);
    if (parsedData.ui_type === 'product_carousel' && Array.isArray(parsedData.items)) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full border border-purple-500/40 overflow-hidden shrink-0">
              <img
                src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg"
                alt="Dealit AI"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] font-semibold text-purple-400 tracking-wide uppercase">
              Dealit AI · Recommended Items
            </span>
          </div>
          <ProductCarousel items={parsedData.items} navigate={navigate} />
        </motion.div>
      );
    }
    if (parsedData.ui_type === 'action_button' && parsedData.label && parsedData.action) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full"
        >
          <button
            onClick={() => navigate(parsedData.action)}
            className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {parsedData.label}
          </button>
        </motion.div>
      );
    }
  } catch {
    return null;
  }
  return null;
};

const SUGGESTIONS = [
  'What is my Aura Score?',
  'How do I earn more Credits?',
  'Explain OTP delivery verification',
  'Tell me my account details',
];

const AiChatPage = ({ user }) => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [viewportHeight, setViewportHeight] = useState('100dvh');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isSmartContextEnabled, setIsSmartContextEnabled] = useState(() => {
    const saved = localStorage.getItem('dealit_ai_context');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [chatMode, setChatMode] = useState(
    () => localStorage.getItem('dealit_ai_mode') || 'dealit',
  );
  const [voiceState, setVoiceState] = useState('idle');
  const [voicePref, setVoicePref] = useState(
    () => localStorage.getItem('dealit_ai_voice_pref') || 'female',
  );
  const [isPremiumVoiceLimited, setIsPremiumVoiceLimited] = useState(false);
  
  const [isChatLimited, setIsChatLimited] = useState(false);
  const [isPurchasingReset, setIsPurchasingReset] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      localStorage.setItem(`dealit_ai_history_${currentSessionId}`, JSON.stringify(messages));
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    const handleNativeAppEvent = (e) => {
      if (e.detail?.type === 'SPEECH_FINISHED') setVoiceState('idle');
    };
    window.addEventListener('NATIVE_APP_EVENT', handleNativeAppEvent);
    return () => window.removeEventListener('NATIVE_APP_EVENT', handleNativeAppEvent);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) setViewportHeight(`${window.visualViewport.height}px`);
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
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const syncMode = () => setChatMode(localStorage.getItem('dealit_ai_mode') || 'dealit');
    window.addEventListener('storage', syncMode);
    return () => window.removeEventListener('storage', syncMode);
  }, []);

  useEffect(() => {
    const handleResizeSidebar = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener('resize', handleResizeSidebar);
    return () => window.removeEventListener('resize', handleResizeSidebar);
  }, []);

  const handleToggleContext = () => {
    const newVal = !isSmartContextEnabled;
    setIsSmartContextEnabled(newVal);
    localStorage.setItem('dealit_ai_context', JSON.stringify(newVal));
  };

  const handleModeChange = (mode) => {
    setChatMode(mode);
    localStorage.setItem('dealit_ai_mode', mode);
    setIsModeDropdownOpen(false);
  };

  const handleToggleVoicePref = () => {
    const newPref = voicePref === 'female' ? 'male' : 'female';
    setVoicePref(newPref);
    localStorage.setItem('dealit_ai_voice_pref', newPref);
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
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
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
      const cachedHistory = localStorage.getItem(`dealit_ai_history_${routeSessionId}`);
      if (cachedHistory) {
        setMessages(JSON.parse(cachedHistory));
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
          const formattedHistory = res.data.history.map((msg, index) => ({
            id: msg._id || `hist_${index}`,
            role: msg.role === 'assistant' ? 'bot' : 'user',
            content: msg.content,
            animated: false,
            timestamp: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }));
          setMessages(formattedHistory);
          setHasStartedChat(true);
          setCurrentSessionId(res.data.sessionId);
          localStorage.setItem(`dealit_ai_history_${routeSessionId}`, JSON.stringify(formattedHistory));
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
  }, [routeSessionId, user, navigate]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setIsLoading(false);
    setHasStartedChat(false);
    setMessages([]);
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
        withCredentials: true,
      });
      setSessions((prev) => prev.filter((s) => s._id !== id));
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
        withCredentials: true,
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
    if (window.ReactNativeWebView) {
      setVoiceState('speaking');
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'START_NATIVE_SPEECH', text, pref }));
      return;
    }
    if (!window.speechSynthesis) { setVoiceState('idle'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice = voices.find((v) =>
        pref === 'female' ? v.name.toLowerCase().includes('female') : v.name.toLowerCase().includes('male'),
      );
      if (preferredVoice) utterance.voice = preferredVoice;
    }
    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = () => setVoiceState('idle');
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text) => {
    if (!text) return;
    if (audioRef.current) audioRef.current.pause();
    const textToSpeak = text.replace(/[*_#`]/g, '');
    const currentVoicePref = voicePref || localStorage.getItem('dealit_ai_voice_pref') || 'female';
    setVoiceState('generating_audio');
    try {
      const token = localStorage.getItem('dealit_token');
      const response = await fetch(`${API_URL}/ai/synthesize-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: textToSpeak, voicePref: currentVoicePref }),
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
    } catch {
      fallbackToNativeSpeech(textToSpeak, currentVoicePref);
    }
  };

  const processVoiceMessage = async (userMessage) => {
    if (!userMessage.trim()) { setVoiceState('idle'); return; }
    if (!navigator.onLine) { setIsOffline(true); setTimeout(() => setIsOffline(false), 4000); return; }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setVoiceState('thinking');
    isStreamingRef.current = true;
    setHasStartedChat(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const smartContextStr = localStorage.getItem('dealit_ai_context');
      const smartContext = smartContextStr !== null ? JSON.parse(smartContextStr) : true;
      const response = await fetch(`${API_URL}/ai/chat`, {
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
        throw new Error(errData.reply || errData.message || 'Voice chat failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botReply = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);
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
          } catch { /* malformed chunk, skip */ }
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
    if (!SpeechRecognition) { alert('Your browser does not support voice input.'); return; }
    if (audioRef.current) audioRef.current.pause();
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.onstart = () => setVoiceState('listening');
    recognition.onresult = (event) => processVoiceMessage(event.results[0][0].transcript);
    recognition.onerror = (e) => {
      console.error('Microphone Error:', e.error);
      if (e.error === 'not-allowed') alert("⚠️ Microphone blocked! URL bar ke left icon par click karein aur mic ko 'Allow' karein.");
      else if (e.error !== 'no-speech') alert(`Mic Issue: ${e.error}`);
      setVoiceState((prev) => prev === 'listening' ? 'idle' : prev);
    };
    recognition.onend = () => setVoiceState((prev) => prev === 'listening' ? 'idle' : prev);
    recognition.start();
  };

  const cancelVoiceMode = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STOP_NATIVE_SPEECH' }));
    setVoiceState('idle');
  };

  const processMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    if (!navigator.onLine) { setIsOffline(true); setTimeout(() => setIsOffline(false), 4000); return; }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setHasStartedChat(true);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: userMessage, timestamp: currentTime }]);
    setInput('');
    setIsLoading(true);

    const botMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: botMessageId, role: 'bot', content: '', animated: false, timestamp: currentTime }]);
    isStreamingRef.current = true;

    try {
      const token = localStorage.getItem('dealit_token');
      const smartContextStr = localStorage.getItem('dealit_ai_context');
      const smartContext = smartContextStr !== null ? JSON.parse(smartContextStr) : true;
      const response = await fetch(`${API_URL}/ai/chat`, {
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
           setMessages((prev) => prev.filter((msg) => msg.id !== botMessageId));
           return;
        }
        throw new Error(errData.reply || errData.message || 'Server connection failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botReply = '';
      setIsLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6);

          if (dataStr === '[DONE]') {
            setTimeout(() => {
              const parts = extractCarouselFromReply(botReply);

              if (parts.length === 1) {
                setMessages((prev) =>
                  prev.map((msg) => msg.id === botMessageId ? { ...msg, content: botReply } : msg),
                );
              } else {
                setMessages((prev) => {
                  const withoutPlaceholder = prev.filter((msg) => msg.id !== botMessageId);
                  const newMsgs = parts
                    .filter((p) => p.content.trim())
                    .map((p, idx) => ({
                      id: botMessageId + idx,
                      role: p.type === 'ui' ? 'bot_ui' : 'bot',
                      content: p.content,
                      animated: false,
                      timestamp: currentTime,
                    }));
                  return [...withoutPlaceholder, ...newMsgs];
                });
              }
              isStreamingRef.current = false;
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
              prev.map((msg) => msg.id === botMessageId ? { ...msg, content: botReply } : msg),
            );
          } catch { /* malformed chunk, skip */ }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      setIsLoading(false);
      isStreamingRef.current = false;
      setMessages((prev) =>
        prev.map((msg) => msg.id === botMessageId ? { ...msg, content: `⚠️ ${error.message}` } : msg),
      );
    }
  };

  const handleMinimize = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    localStorage.setItem('dealit_open_floating_ai', 'true');
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (window.history.state?.idx > 0) navigate(-1);
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
    setIsInputFocused(false);
  };

  const getLightfallConfig = (state) => {
    switch (state) {
      case 'listening': return { colors: ['#f87171', '#ef4444', '#b91c1c'], speed: 1.5, zoom: 4 };
      case 'speaking': return { colors: ['#c084fc', '#a855f7', '#7e22ce'], speed: 1.2, zoom: 3 };
      default: return { colors: ['#60a5fa', '#3b82f6', '#1d4ed8'], speed: 0.8, zoom: 3 };
    }
  };

  const handleUnlockAI = async () => {
    setIsPurchasingReset(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const response = await fetch(`${API_URL}/ai/reset-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to unlock limits');
        setIsPurchasingReset(false);
        return;
      }

      setIsChatLimited(false);
      setIsPremiumVoiceLimited(false);
      setIsPurchasingReset(false);
      
      setShowSuccessAnim(true);
      setTimeout(() => setShowSuccessAnim(false), 3500);

    } catch (error) {
      alert('Network error. Please try again.');
      setIsPurchasingReset(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 flex bg-gray-900 z-50 overflow-hidden overscroll-none"
      style={{ height: viewportHeight }}
    >
      <MagicButtonStyles />

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[55] md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      {isModeDropdownOpen && (
        <div className="fixed inset-0 z-[45]" onClick={() => setIsModeDropdownOpen(false)} />
      )}

      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-none"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: -20 }}
                transition={{ type: "spring", duration: 0.7, bounce: 0.4 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-emerald-500/30 p-10 rounded-3xl flex flex-col items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/20 blur-3xl rounded-full" />
                
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                  className="relative z-10 w-24 h-24 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/40"
                >
                  <Check className="w-12 h-12 text-white" strokeWidth={3} />
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="relative z-10 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 mb-2"
                >
                  Payment Successful!
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="relative z-10 text-gray-300 font-medium text-center"
                >
                  Your daily limits have been fully restored.
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed md:relative z-[60] flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:w-0 md:hidden absolute'}`}>
        <div className="p-4 pb-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-purple-500/40 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(163,136,225,0.15)]">
            <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">Dealit AI</span>
        </div>

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

        <div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar">
          <div className="text-xs font-bold tracking-wider text-gray-500 mb-3 px-2 uppercase">Recent Chats</div>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session._id}
                onClick={() => selectSession(session._id)}
                className={`group flex items-center justify-between w-full p-2.5 rounded-lg cursor-pointer transition-colors border ${routeSessionId === session._id || currentSessionId === session._id ? 'bg-gray-800/80 text-gray-200 border-gray-700/50' : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 border-transparent'}`}
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
                        if (window.confirm('Are you sure you want to clear all your chat history? This action cannot be undone.')) {
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

          <button
            onClick={() => navigate('/help-support')}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help & FAQ</span>
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-[#1A1A1A]">
        {/* Header */}
        <div className="bg-[#1A1A1A] p-4 flex items-center justify-between shadow-sm z-50 shrink-0">
          <div className="flex items-center gap-2 md:gap-4 relative">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-300 hover:text-white transition-colors p-1"
              title="Toggle Sidebar"
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
                {chatMode === 'dealit' ? 'Dealit Strict' : 'General AI'}
                <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5" />
              </button>
              <AnimatePresence>
                {isModeDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-3 w-48 bg-[#2A2A2A] border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <button onClick={() => handleModeChange('dealit')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${chatMode === 'dealit' ? 'bg-purple-500/20 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>Dealit Strict</button>
                    <button onClick={() => handleModeChange('general')} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${chatMode === 'general' ? 'bg-purple-500/20 text-white' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>General AI</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <button onClick={handleMinimize} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white" title="Minimize to Widget">
              <Minimize2 className="w-5 h-5" />
            </button>
            <button onClick={handleClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-red-400" title="Close Full Chat">
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

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 container mx-auto max-w-3xl no-scrollbar relative ${!hasStartedChat && 'flex flex-col items-center justify-center'}`}>
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
                  className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-purple-600/20 to-emerald-500/20 flex items-center justify-center border border-purple-500/40 shadow-[0_0_40px_rgba(163,136,225,0.15)] relative"
                >
                  <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-[spin_10s_linear_infinite]" />
                  <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-16 h-16 rounded-full object-cover relative z-10" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-emerald-400 to-purple-400 mb-3"
                >
                  Welcome to Dealit AI{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-gray-400 text-sm md:text-base mb-8 max-w-md"
                >
                  Your personal assistant for trades, credits, and navigating the Dealit marketplace. How can I help you today?
                </motion.p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {SUGGESTIONS.map((text, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                      onClick={() => processMessage(text)}
                      className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 text-gray-300 text-sm font-medium p-4 rounded-xl hover:bg-purple-500/10 hover:text-white hover:border-purple-500/40 transition-all text-left shadow-sm group"
                    >
                      <div className="p-2 rounded-lg bg-gray-900 group-hover:bg-purple-500/20 transition-colors">
                        <Sparkles className="w-4 h-4 text-purple-400" />
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
                      <BotUIBlock content={msg.content} navigate={navigate} />
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={msg.animated ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-5 py-3.5 text-sm overflow-hidden flex flex-col ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-tr-sm shadow-lg shadow-purple-500/20' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-sm shadow-md'}`}>
                        <div className="whitespace-pre-wrap w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {msg.role === 'bot' ? (
                            msg.content ? (
                              <BotMessage content={msg.content} animated={msg.animated} onComplete={() => markAsAnimated(msg.id)} navigate={navigate} />
                            ) : (
                              <TypingLoader />
                            )
                          ) : (
                            msg.content
                          )}
                        </div>

                        {msg.role === 'bot' && (
                          <div className="flex items-center mt-2.5 pt-2 border-t text-[10px] select-none border-gray-700/60 text-gray-400 justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-300">Dealit AI</span>
                              <span className="w-1 h-1 rounded-full bg-gray-500" />
                              <span>{msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {msg.content && <CopyButton text={msg.content} />}
                              <button className="text-gray-500 hover:text-emerald-400 transition-colors cursor-pointer" title="Good response">
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer" title="Bad response">
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
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
                          <p className="text-xs text-gray-400 mt-0.5">Use credits to continue chatting without limits today.</p>
                        </div>
                      </div>
                      <button
                        onClick={handleUnlockAI}
                        disabled={isPurchasingReset}
                        className="w-full sm:w-auto whitespace-nowrap bg-white text-black hover:bg-gray-200 font-bold py-2.5 px-5 rounded-xl text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isPurchasingReset ? (
                           <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        Unlock for 50 Credits
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="relative z-10 flex items-center gap-2">
                <div className="relative flex-1 flex items-center group">
                  <div
                    className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-emerald-400 to-blue-500 rounded-full blur transition-all duration-500 z-0 ${isInputFocused ? 'opacity-70' : 'opacity-0'}`}
                    style={{ backgroundSize: '200% 200%', animation: isInputFocused ? 'gradient-xy 3s ease infinite' : 'none' }}
                  />
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="Ask Dealit AI..."
                    className="relative z-10 w-full bg-gray-900 border border-gray-700 rounded-full py-4 pl-5 pr-12 text-base md:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleMicClick}
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
                  <div className="magic-points_wrapper">
                    {[...Array(10)].map((_, i) => <i key={i} className="point" />)}
                  </div>
                  <span className="magic-inner">
                    <Send className="w-5 h-5 icon" fill="none" strokeWidth="2.5" />
                  </span>
                </button>
              </form>
            </div>
          </div>

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
                    mouseInteraction={true}
                  />
                </div>
                <div className="z-10 flex flex-col items-center w-full max-w-md px-6 text-center">
                  <div className="relative flex items-center justify-center w-32 h-32 mb-8">
                    {voiceState === 'listening' && <div className="absolute inset-0 rounded-full bg-red-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />}
                    {voiceState === 'speaking' && <div className="absolute inset-0 rounded-full bg-purple-500/30 animate-pulse" />}
                    {voiceState === 'generating_audio' && <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-pulse" />}
                    <div className="z-10 w-24 h-24 bg-gray-950/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner border border-gray-700 overflow-hidden">
                      {voiceState === 'listening' ? <Mic className="w-10 h-10 text-red-400 animate-pulse" /> : <img src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg" alt="Dealit AI" className="w-full h-full object-cover" />}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-md">
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
                  <div className="h-12 flex items-center justify-center w-full mb-10 text-white drop-shadow-md">
                    {voiceState === 'listening' && (
                      <div className="flex gap-2.5">
                        <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-bounce" />
                        <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2.5 h-2.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    )}
                    {(voiceState === 'thinking' || voiceState === 'generating_audio') && <TypingLoader />}
                    {voiceState === 'speaking' && <SoundWave />}
                  </div>
                  <button
                    type="button"
                    onClick={cancelVoiceMode}
                    className="magic-btn text-sm w-48 mx-auto shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    <div className="magic-points_wrapper">
                      {[...Array(10)].map((_, i) => <i key={i} className="point" />)}
                    </div>
                    <span className="magic-inner">
                      <X className="w-5 h-5 icon" fill="none" strokeWidth="2.5" /> Stop Listening
                    </span>
                  </button>
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