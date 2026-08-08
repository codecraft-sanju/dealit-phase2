import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Search, ShieldAlert, Trash2, Power, PowerOff, Loader2, Bot, LayoutTemplate,
  ChevronLeft, ChevronRight, Eye, X, FileText
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_BACKEND_API;

const AdminAIAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null); // State for Context Viewer Modal
  
  // Pagination States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAgents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, page]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.get(`${API_BASE}/api/admin/personal-ais?page=${page}&limit=10&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAgents(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotalRecords(res.data.totalRecords);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch AI agents');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'BLOCK' : 'UNBLOCK'} this agent?`)) return;

    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.put(`${API_BASE}/api/admin/personal-ais/${id}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success(res.data.message);
        setAgents(agents.map(agent => 
          agent._id === id ? { ...agent, isActive: !currentStatus } : agent
        ));
      }
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("WARNING: This will permanently delete the AI Agent and ALL its chat history. Proceed?")) return;

    try {
      const token = localStorage.getItem('dealit_token');
      const res = await axios.delete(`${API_BASE}/api/admin/personal-ais/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        toast.success('Agent deleted successfully');
        fetchAgents(); 
      }
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans relative overflow-hidden">
      
      {/* Global Style for hiding scrollbars in modals */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F12] p-6 rounded-3xl border border-white/10 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
              Manage AI Agents
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              View, block, delete, and inspect the brain of user-generated AI clones. Total: {totalRecords}
            </p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by username, idea, or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-[#0F0F12] rounded-3xl border border-white/10 shadow-lg overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm">Fetching agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-50">
              <Bot className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-lg font-medium">No agents found.</p>
              <p className="text-sm">Try a different search term.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10 text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="p-4 pl-6 font-semibold">Creator</th>
                    <th className="p-4 font-semibold">AI Handle</th>
                    <th className="p-4 font-semibold">Base Idea</th>
                    <th className="p-4 font-semibold">Stats</th>
                    <th className="p-4 font-semibold text-center">Status</th>
                    <th className="p-4 pr-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {agents.map((agent) => (
                    <tr key={agent._id} className="hover:bg-white/[0.02] transition-colors group">
                      
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <img 
                            src={agent.user?.profilePic || "https://res.cloudinary.com/dia3qhc0x/image/upload/v1781289017/ijblexdk51vluv7ku6g9.jpg"} 
                            alt="avatar" 
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">{agent.user?.full_name || 'Unknown'}</span>
                            <span className="text-xs text-gray-500 font-mono">{agent.user?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <a 
                          href={`/ai/${agent.username}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          @{agent.username}
                        </a>
                        <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <LayoutTemplate className="w-3 h-3" /> {agent.theme}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-sm text-gray-300 line-clamp-2 max-w-xs" title={agent.baseIdea}>
                          {agent.baseIdea}
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium bg-white/5 px-2 py-1 rounded w-fit border border-white/10">
                            {agent.totalChats} Chats
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          agent.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {agent.isActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedAgent(agent)}
                            className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all active:scale-95"
                            title="Inspect AI Brain (Prompts & Data)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(agent._id, agent.isActive)}
                            className={`p-2 rounded-lg transition-all active:scale-95 border ${
                              agent.isActive 
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                            }`}
                            title={agent.isActive ? "Block Agent" : "Unblock Agent"}
                          >
                            {agent.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(agent._id)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all active:scale-95"
                            title="Permanently Delete Agent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center gap-1 border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm disabled:opacity-50 transition-colors flex items-center gap-1 border border-white/10"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTEXT VIEWER MODAL */}
      <AnimatePresence>
        {selectedAgent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0F0F12] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
            >
              <div className="flex justify-between items-center p-5 md:p-6 border-b border-white/10 shrink-0 bg-black/40">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    @{selectedAgent.username}'s Brain
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Inspect the underlying context and rules powering this agent.</p>
                </div>
                <button onClick={() => setSelectedAgent(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors active:scale-95">
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 no-scrollbar">
                
                {/* Base Idea */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-purple-400" /> Base Idea Provided by User
                  </h3>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm text-gray-300 shadow-inner">
                    {selectedAgent.baseIdea}
                  </div>
                </div>

                {/* Final System Prompt */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" /> Compiled Master System Prompt
                  </h3>
                  <div className="bg-black/60 border border-indigo-500/20 p-4 rounded-xl text-xs text-indigo-200 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                    {selectedAgent.finalSystemPrompt || "No system prompt compiled yet."}
                  </div>
                </div>

                {/* Knowledge Base */}
                {selectedAgent.knowledgeBaseText ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" /> Uploaded Knowledge Base Data (PDF Text)
                    </h3>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
                      {selectedAgent.knowledgeBaseText}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-500">
                    No extra PDF knowledge base uploaded by this user.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminAIAgents;