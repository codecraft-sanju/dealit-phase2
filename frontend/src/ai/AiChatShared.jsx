/**
 * AiChatShared.jsx
 * Shared primitives for AiChatPage and FloatingAIAssistant.
 * Single source of truth — edit here, not in both files.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Copy, Check, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// react-syntax-highlighter — light-weight Prism build with tree-shaking.
// Only the languages we actually need are registered to keep bundle size minimal.
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import AiChatProductCard from '../components/AiChatProductCard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SUGGESTIONS = [
  'What is my Aura Score?',
  'How do I earn more Credits?',
  'Explain OTP delivery verification',
  'Tell me my account details',
];

// ---------------------------------------------------------------------------
// Carousel extractor
// Splits a completed bot reply into alternating text / ui parts.
// Only call this on the FINAL reply — never on a partial stream.
// ---------------------------------------------------------------------------

export const extractCarouselFromReply = (replyText) => {
  const tick3 = '`'.repeat(3);
  // Match ```json { ... } ``` or ``` { ... } ```
  const jsonBlockRegex = new RegExp(
    `${tick3}(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*${tick3}`,
    'g',
  );

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
      if (
        parsed.ui_type === 'product_carousel' ||
        parsed.ui_type === 'action_button'
      ) {
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

// ---------------------------------------------------------------------------
// Shared CSS
// Single <style> block — rendered once per tree.
// ---------------------------------------------------------------------------

export const SharedStyles = () => (
  <style>{`
    .ai-no-scrollbar::-webkit-scrollbar { display: none; }
    .ai-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    /* Magic send button */
    .magic-btn {
      --round: 0.75rem;
      cursor: pointer;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: all 0.25s ease;
      background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(223,113,255,0.8) 0%, rgba(223,113,255,0) 100%),
                  linear-gradient(0deg, #7a5af8, #7a5af8);
      border-radius: var(--round);
      border: none;
      outline: none;
      padding: 12px 18px;
    }
    .magic-btn::before,
    .magic-btn::after {
      content: "";
      position: absolute;
      inset: var(--space);
      transition: all 0.5s ease-in-out;
      border-radius: calc(var(--round) - var(--space));
      z-index: 0;
    }
    .magic-btn::before {
      --space: 1px;
      background: linear-gradient(177.95deg, rgba(255,255,255,0.19) 0%, rgba(255,255,255,0) 100%);
    }
    .magic-btn::after {
      --space: 2px;
      background: radial-gradient(65.28% 65.28% at 50% 100%, rgba(223,113,255,0.8) 0%, rgba(223,113,255,0) 100%),
                  linear-gradient(0deg, #7a5af8, #7a5af8);
    }
    .magic-btn:active { transform: scale(0.95); }

    .magic-points_wrapper {
      overflow: hidden; width: 100%; height: 100%;
      pointer-events: none; position: absolute; z-index: 1;
    }
    .magic-points_wrapper .point {
      bottom: -10px; position: absolute;
      animation: floating-points infinite ease-in-out;
      pointer-events: none; width: 2px; height: 2px;
      background-color: #fff; border-radius: 9999px;
    }
    @keyframes floating-points {
      0%   { transform: translateY(0); }
      85%  { opacity: 0; }
      100% { transform: translateY(-55px); opacity: 0; }
    }
    .magic-points_wrapper .point:nth-child(1)  { left:10%; opacity:1;   animation-duration:2.35s; animation-delay:0.2s; }
    .magic-points_wrapper .point:nth-child(2)  { left:30%; opacity:0.7; animation-duration:2.5s;  animation-delay:0.5s; }
    .magic-points_wrapper .point:nth-child(3)  { left:25%; opacity:0.8; animation-duration:2.2s;  animation-delay:0.1s; }
    .magic-points_wrapper .point:nth-child(4)  { left:44%; opacity:0.6; animation-duration:2.05s; }
    .magic-points_wrapper .point:nth-child(5)  { left:50%; opacity:1;   animation-duration:1.9s;  }
    .magic-points_wrapper .point:nth-child(6)  { left:75%; opacity:0.5; animation-duration:1.5s;  animation-delay:1.5s; }
    .magic-points_wrapper .point:nth-child(7)  { left:88%; opacity:0.9; animation-duration:2.2s;  animation-delay:0.2s; }
    .magic-points_wrapper .point:nth-child(8)  { left:58%; opacity:0.8; animation-duration:2.25s; animation-delay:0.2s; }
    .magic-points_wrapper .point:nth-child(9)  { left:98%; opacity:0.6; animation-duration:2.6s;  animation-delay:0.1s; }
    .magic-points_wrapper .point:nth-child(10) { left:65%; opacity:1;   animation-duration:2.5s;  animation-delay:0.2s; }

    .magic-inner {
      z-index: 2; gap: 6px; position: relative; color: white;
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 500; width: 100%; height: 100%;
    }
    .magic-inner svg.icon { fill: transparent; animation: magic-auto-draw 2s linear infinite; }
    @keyframes magic-auto-draw {
      0%   { stroke-dasharray: 0 0 0 0;    fill: transparent; }
      25%  { stroke-dasharray: 68 68 0 0;  fill: transparent; }
      30%  { fill: white; }
      80%  { stroke-dasharray: 68 68 0 0;  fill: white; }
      100% { stroke-dasharray: 0 0 0 0;    fill: transparent; }
    }
    @keyframes gradient-xy {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Syntax highlighter overrides — match the app's dark bg exactly */
    .ai-code-block pre[class*="language-"],
    .ai-code-block code[class*="language-"] {
      background: transparent !important;
      margin: 0 !important;
      padding: 0 !important;
      font-size: 0.75rem !important;
      line-height: 1.6 !important;
      font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace !important;
    }
    /* Remove SyntaxHighlighter's own wrapper background so our container controls it */
    .ai-code-block > div {
      background: transparent !important;
    }
  `}</style>
);

// ---------------------------------------------------------------------------
// Magic button particle spray (10 floaters)
// ---------------------------------------------------------------------------
export const MagicPoints = () => (
  <div className="magic-points_wrapper">
    {Array.from({ length: 10 }, (_, i) => (
      <i key={i} className="point" />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

export const TypingLoader = () => (
  <div className="flex space-x-1.5 items-center h-5 px-1">
    {[0, 0.2, 0.4].map((delay, i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 bg-purple-400 rounded-full"
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay }}
      />
    ))}
  </div>
);

export const SoundWave = () => (
  <div className="flex items-center justify-center gap-1.5 h-12">
    {Array.from({ length: 5 }, (_, i) => (
      <motion.div
        key={i}
        className="w-2.5 bg-purple-400 rounded-full"
        animate={{ height: ['20%', '100%', '20%'] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

export const CopyButton = ({ text, iconSize = 'w-3.5 h-3.5' }) => {
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
      {copied
        ? <Check className={`${iconSize} text-emerald-400`} />
        : <Copy className={iconSize} />}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Message footer (timestamp + copy + thumbs)
// ---------------------------------------------------------------------------

export const MessageFooter = ({ msg, timestamp, compact = false }) => {
  const [feedback, setFeedback] = useState(null);
  const ts = msg.timestamp || timestamp
    || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const iconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = compact ? 'text-[9px]' : 'text-[10px]';
  const gap      = compact ? 'gap-2.5' : 'gap-3';
  const mt       = compact ? 'mt-2 pt-1.5' : 'mt-2.5 pt-2';

  return (
    <div className={`flex items-center ${mt} border-t ${textSize} select-none border-gray-700/60 text-gray-400 justify-between`}>
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-gray-300">Dealit AI</span>
        <span className="w-1 h-1 rounded-full bg-gray-500" />
        <span>{ts}</span>
      </div>
      <div className={`flex items-center ${gap}`}>
        {msg.content && <CopyButton text={msg.content} iconSize={iconSize} />}
        <button
          onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
          className={`transition-colors cursor-pointer ${feedback === 'up' ? 'text-emerald-400' : 'text-gray-500 hover:text-emerald-400'}`}
          title="Good response"
        >
          <ThumbsUp className={iconSize} />
        </button>
        <button
          onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
          className={`transition-colors cursor-pointer ${feedback === 'down' ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
          title="Bad response"
        >
          <ThumbsDown className={iconSize} />
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Language label map — maps fence identifiers to human-readable labels.
// Prism handles syntax; this is purely for the UI badge in the header.
// ---------------------------------------------------------------------------

const LANG_LABELS = {
  js:         'JavaScript',
  jsx:        'React JSX',
  ts:         'TypeScript',
  tsx:        'React TSX',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python:     'Python',
  py:         'Python',
  bash:       'Bash',
  sh:         'Shell',
  zsh:        'Zsh',
  css:        'CSS',
  html:       'HTML',
  json:       'JSON',
  sql:        'SQL',
  java:       'Java',
  cpp:        'C++',
  c:          'C',
  go:         'Go',
  rust:       'Rust',
  yaml:       'YAML',
  yml:        'YAML',
  md:         'Markdown',
  markdown:   'Markdown',
};

// ---------------------------------------------------------------------------
// Highlighted code block — self-contained so it can be tested in isolation.
//
// Design decisions:
//   • oneDark theme — closest to the app's #1A1A1A / gray-950 palette.
//   • Header bar shows language badge + copy button, mimicking VS Code style.
//   • `compact` mode (FloatingAI) hides the header to save vertical space.
//   • SyntaxHighlighter renders with `useInlineStyles` so Tailwind purge
//     won't accidentally strip Prism token classes that appear in CSS files.
//   • Scrollable horizontally on mobile; never wraps long lines.
// ---------------------------------------------------------------------------

const HighlightedCodeBlock = ({ language, codeString, compact }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Normalise aliases: 'js' → 'javascript', 'py' → 'python', etc.
  const normalisedLang = (() => {
    const alias = {
      js:  'javascript',
      ts:  'typescript',
      py:  'python',
      sh:  'bash',
      zsh: 'bash',
      yml: 'yaml',
      md:  'markdown',
    };
    return alias[language] || language || 'text';
  })();

  const label = LANG_LABELS[language] || LANG_LABELS[normalisedLang] || normalisedLang.toUpperCase();

  // Custom oneDark override — strip the default background so our container
  // controls the bg colour, keeping the palette consistent.
  const theme = {
    ...oneDark,
    'pre[class*="language-"]': {
      ...oneDark['pre[class*="language-"]'],
      background: 'transparent',
      margin: 0,
      padding: 0,
    },
    'code[class*="language-"]': {
      ...oneDark['code[class*="language-"]'],
      background: 'transparent',
    },
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-700/80 my-3 bg-gray-950 shadow-inner max-w-full ai-code-block">
      {/* Header bar — language badge + copy button */}
      {!compact && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-700/60">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-500 select-none">
            {label}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs font-medium transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-gray-700/60"
          >
            {copied
              ? <Check className="w-3 h-3 text-emerald-400" />
              : <Copy className="w-3 h-3" />}
            <span className="text-[11px]">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* Syntax-highlighted code */}
      <div className="overflow-x-auto ai-no-scrollbar">
        <SyntaxHighlighter
          language={normalisedLang}
          style={theme}
          customStyle={{
            background:  'transparent',
            margin:      0,
            padding:     '1rem',
            fontSize:    '0.75rem',
            lineHeight:  '1.65',
            fontFamily:  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace",
          }}
          codeTagProps={{
            style: {
              fontFamily: 'inherit',
              fontSize:   'inherit',
            },
          }}
          // showLineNumbers on blocks with more than 8 lines improves readability
          showLineNumbers={codeString.split('\n').length > 8}
          lineNumberStyle={{
            color:       '#4b5563',
            fontSize:    '0.7rem',
            paddingRight: '1.25rem',
            userSelect:  'none',
            minWidth:    '2.5rem',
          }}
          wrapLongLines={false}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// BotMessage — renders markdown from a COMPLETED content string.
//
// KEY FIX: this component no longer drives a typewriter effect internally.
// Streaming content is fed from the parent via `content` prop updates.
// The `animated` flag is kept for API compat but does nothing here —
// the parent controls what it passes, so there's no fighting with the stream.
// ---------------------------------------------------------------------------

export const BotMessage = ({ content, navigate, compact = false }) => {
  // Strip any raw ```json blocks that survived — they should have been parsed
  // by extractCarouselFromReply before reaching this component, but guard anyway.
  const safeContent = content.replace(
    /```(?:json)?\s*\{[\s\S]*?\}\s*```/g,
    '',
  ).trim();

  return (
    <div
      className="leading-relaxed text-sm w-full"
      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p:  ({ node, ...props }) => <p  className="mb-1.5 last:mb-0 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5" {...props} />,
          li: ({ node, ...props }) => <li className="mb-0 leading-relaxed" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4 text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-4 text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 text-white" {...props} />,
          a:  ({ node, ...props }) => (
            <a className="text-purple-400 hover:text-purple-300 underline transition-colors"
               target="_blank" rel="noopener noreferrer" {...props} />
          ),
          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-3 bg-gray-900/50 rounded-r-lg italic text-gray-400" {...props} />
          ),

          // ── CODE RENDERER ──────────────────────────────────────────────
          // Inline `code` → simple pill badge (unchanged).
          // Fenced blocks → HighlightedCodeBlock with Prism syntax colours.
          // JSON UI blocks are suppressed here — BotUIBlock handles them.
          // ───────────────────────────────────────────────────────────────
          code: ({ node, inline, className, children, ...props }) => {
            const codeString = String(children).replace(/\n$/, '');

            // Extract language from remark's className: "language-js" → "js"
            const language = className?.replace('language-', '') ?? '';

            // Suppress JSON UI blocks — rendered via BotUIBlock instead
            const isJsonUIBlock =
              !inline &&
              (language === 'json' && codeString.includes('"ui_type"'));

            if (isJsonUIBlock) return null;

            // Inline code — simple pill, no syntax highlighting needed
            if (inline) {
              return (
                <code
                  className="bg-gray-900 text-purple-300 px-1.5 py-0.5 rounded-md text-xs font-mono border border-gray-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Fenced code block — full syntax highlighting
            return (
              <HighlightedCodeBlock
                language={language}
                codeString={codeString}
                compact={compact}
              />
            );
          },

          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 border border-gray-700 rounded-xl shadow-sm max-w-full ai-no-scrollbar">
              <table className="min-w-full divide-y divide-gray-700 text-sm" {...props} />
            </div>
          ),
          thead:  ({ node, ...props }) => <thead className="bg-gray-900" {...props} />,
          th:     ({ node, ...props }) => <th    className="px-4 py-3 text-left font-semibold text-gray-300 uppercase tracking-wider text-xs" {...props} />,
          tbody:  ({ node, ...props }) => <tbody className="divide-y divide-gray-700 bg-gray-800/50" {...props} />,
          td:     ({ node, ...props }) => <td    className="px-4 py-3 text-gray-300" {...props} />,
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Product carousels / grids
// ---------------------------------------------------------------------------

export const ProductCarousel = ({ items, navigate }) => (
  <div className="w-full">
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 ai-no-scrollbar">
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

export const FloatingProductGrid = ({ items, navigate }) => (
  <div className="w-full">
    <div className="grid grid-cols-2 gap-2 w-full">
      {items.map((item, idx) => (
        <AiChatProductCard
          key={item._id || idx}
          item={item}
          onClick={(id) => navigate(`/item/${id}`)}
        />
      ))}
    </div>
    {items.length > 4 && (
      <p className="text-[10px] text-gray-600 mt-1.5 text-center">
        Showing {items.length} items
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// BotUIBlock — renders a parsed UI block.
// `variant` = 'full' (AiChatPage carousel) | 'compact' (FloatingAI grid)
// ---------------------------------------------------------------------------

export const BotUIBlock = ({ content, navigate, variant = 'full' }) => {
  const tick3 = '`'.repeat(3);
  const codeMatch = content.match(
    new RegExp(`${tick3}(?:json)?\\s*(\\{[\\s\\S]*?\\})\\s*${tick3}`),
  );
  if (!codeMatch) return null;

  let parsed;
  try {
    parsed = JSON.parse(codeMatch[1]);
  } catch {
    return null;
  }

  if (parsed.ui_type === 'product_carousel' && Array.isArray(parsed.items)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-purple-500/40">
            <img
              src="https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg"
              alt="Dealit AI"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-[9px] font-semibold text-purple-400 tracking-wide uppercase">
            Dealit AI · {parsed.items.length} Items Found
          </span>
        </div>

        {variant === 'compact'
          ? <FloatingProductGrid items={parsed.items} navigate={navigate} />
          : <ProductCarousel items={parsed.items} navigate={navigate} />}
      </motion.div>
    );
  }

  if (parsed.ui_type === 'action_button' && parsed.label && parsed.action) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full"
      >
        <button
          onClick={() => navigate(parsed.action)}
          className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {parsed.label}
        </button>
      </motion.div>
    );
  }

  return null;
};