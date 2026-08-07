import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, Bot, Link as LinkIcon, CheckCircle2, Copy, 
  ArrowLeft, Loader2, Check, ExternalLink, Lightbulb, User, MessageSquareText, Globe
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BACKEND_API;

const PROMPT_IDEAS = [
  "An AI assistant for my freelance web design portfolio to share pricing and availability.",
  "A clone AI that answers questions about my startup product features, tech stack, and roadmap.",
  "A personal booking assistant that helps clients understand my services and contact details."
];

const CreateAIPage = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Form Data
  const [baseIdea, setBaseIdea] = useState('');
  const [username, setUsername] = useState(user?.username || '');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [finalLink, setFinalLink] = useState('');

  const handleInitAI = async (e) => {
    e.preventDefault();
    if (!baseIdea.trim() || !username.trim()) return toast.error("Please fill all fields");
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      return toast.error("Username can only contain lowercase letters, numbers, and underscores.");
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.post(`${API_BASE}/api/personal-ai/init`, 
        { baseIdea, username },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      
      if (res.data.success) {
        setQuestions(res.data.questions);
        setAnswers(new Array(res.data.questions.length).fill(''));
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initialize AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmitAnswers = async (e) => {
    e.preventDefault();
    if (answers.some(ans => !ans.trim())) {
      return toast.error("Please answer all questions so your AI learns properly.");
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.post(`${API_BASE}/api/personal-ai/submit-answers`, 
        { answers },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      
      if (res.data.success) {
        const currentDomain = window.location.origin;
        setFinalLink(`${currentDomain}/ai/${username}`);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to compile AI");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalLink);
    setIsCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  const filledAnswersCount = answers.filter(a => a.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans selection:bg-purple-500/30">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Glass Card Container */}
      <motion.div 
        layout
        className="w-full max-w-2xl bg-[#0F0F12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative z-10 my-auto"
      >
        {/* Navigation Back Button */}
        {step < 3 && (
          <button 
            onClick={() => step === 2 ? setStep(1) : navigate(-1)} 
            className="group absolute top-6 left-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-2 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{step === 2 ? "Back" : "Exit"}</span>
          </button>
        )}

        {/* Header Section */}
        <div className="text-center mb-8 mt-4">
          <div className="relative inline-flex mb-4">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-emerald-500 blur-md opacity-40 animate-pulse" />
            <div className="relative p-3.5 rounded-2xl bg-[#141419] border border-white/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Create Your Personal AI Agent
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Train a custom interactive AI agent for your bio link in minutes.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-center gap-3 mb-8 max-w-xs mx-auto">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all duration-300 ${
                step === s 
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105 ring-2 ring-purple-400/30' 
                  : step > s 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-white/5 text-gray-500 border border-white/5'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-[2px] rounded-full transition-all duration-300 ${
                  step > s ? 'bg-emerald-500/40' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Forms */}
        <div className="relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Idea & Username */}
            {step === 1 && (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                onSubmit={handleInitAI}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4 text-purple-400" />
                      What should your AI do?
                    </label>
                    <span className="text-xs text-gray-500">{baseIdea.length}/300</span>
                  </div>
                  <textarea 
                    value={baseIdea}
                    maxLength={300}
                    onChange={(e) => setBaseIdea(e.target.value)}
                    placeholder="Describe your AI's persona, role, or background..."
                    className="w-full bg-[#141419] border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all resize-none h-32 text-sm leading-relaxed"
                  />
                  
                  {/* Quick Starter Prompts */}
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 font-medium">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      Need inspiration? Tap a template:
                    </div>
                    <div className="space-y-2">
                      {PROMPT_IDEAS.map((idea, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBaseIdea(idea)}
                          className="w-full text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 p-2.5 rounded-xl text-gray-300 hover:text-white transition-all truncate"
                        >
                          "{idea}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    Custom Bio Handle
                  </label>
                  <div className="flex items-center bg-[#141419] border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500 transition-all">
                    <span className="pl-4 pr-1 text-gray-500 text-xs font-mono select-none flex items-center gap-1 bg-[#141419]">
                      <LinkIcon className="w-3.5 h-3.5" /> {window.location.host}/ai/
                    </span>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="username"
                      className="w-full bg-transparent p-3.5 pl-1 text-white text-sm font-mono outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1.5 pl-1">Only lowercase letters, numbers, and underscores allowed.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || !baseIdea.trim() || !username.trim()}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing & Generating Questions...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Next: Build Context Knowledge</>
                  )}
                </button>
              </motion.form>
            )}

            {/* STEP 2: Answering Generated Context Questions */}
            {step === 2 && (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                onSubmit={handleSubmitAnswers}
                className="space-y-6"
              >
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-purple-400 shrink-0" />
                    <p className="text-xs text-purple-300 leading-normal">
                      Answer these <span className="font-bold text-white">{questions.length} questions</span> to give your AI pinpoint accuracy.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-purple-300 px-2.5 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 shrink-0">
                    {filledAnswersCount}/{questions.length} Answered
                  </span>
                </div>
                
                <div className="max-h-[45vh] overflow-y-auto pr-2 space-y-5 ai-no-scrollbar">
                  {questions.map((q, idx) => (
                    <div key={idx} className="bg-[#141419] border border-white/5 rounded-2xl p-4 space-y-2.5 hover:border-white/10 transition-all">
                      <label className="block text-xs font-medium text-gray-200 leading-relaxed">
                        <span className="inline-block px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold mr-2 text-[10px]">
                          Q{idx + 1}
                        </span>
                        {q}
                      </label>
                      <textarea 
                        value={answers[idx]}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        placeholder="Provide details for this question..."
                        className="w-full bg-[#0A0A0C] border border-white/10 rounded-xl p-3 text-white text-xs placeholder-gray-600 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none min-h-[75px]"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading || filledAnswersCount < questions.length}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Training System Prompt...</>
                    ) : (
                      <>Compile & Deploy AI Agent <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: Success Screen */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/30 relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 relative z-10" />
                </div>
                
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Your AI Agent is Live!
                </h2>
                <p className="text-gray-400 text-xs md:text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                  Your custom assistant is ready to respond to visitors on your custom link.
                </p>

                {/* Link Bar Card */}
                <div className="bg-[#141419] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between gap-3 mb-6">
                  <span className="text-purple-300 truncate font-mono text-xs font-medium pl-1">
                    {finalLink}
                  </span>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button 
                    onClick={() => window.open(finalLink, '_blank')}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-xl"
                  >
                    <span>Test Your AI Agent</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-white/5 border border-white/10 text-gray-300 font-semibold py-3 rounded-2xl hover:bg-white/10 transition-all text-xs"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateAIPage;