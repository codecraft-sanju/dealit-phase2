import React from 'react';
import { X, User, Settings, MessageSquare, Bot } from 'lucide-react';

const ViewAILogModal = ({ isViewAILogModalOpen, setIsViewAILogModalOpen, viewingAILog }) => {
  if (!isViewAILogModalOpen || !viewingAILog) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-2xl max-h-[90vh] rounded-2xl md:rounded-3xl border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-cyan-500/10 flex justify-between items-center bg-cyan-500/5 shrink-0">
          <h2 className="text-base md:text-lg font-black text-cyan-400 flex items-center gap-2">
            <Bot className="w-4 h-4 md:w-5 md:h-5" /> AI Interaction Details
          </h2>
          <button onClick={() => setIsViewAILogModalOpen(false)} className="text-gray-400 hover:text-white transition-all bg-white/5 p-2 rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 md:p-6 overflow-y-auto admin-scroll space-y-6">
          
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3" /> Triggered By
            </p>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 md:p-4 text-xs md:text-sm text-gray-200">
              <span className="font-bold">{viewingAILog.user?.full_name || 'Unknown'}</span> ({viewingAILog.user?.email}) 
              <span className="text-gray-500 ml-2 text-[10px] md:text-xs">
                on {new Date(viewingAILog.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
              <Settings className="w-3 h-3" /> System Prompt Context
            </p>
            <div className="bg-gray-900/50 border border-white/10 rounded-xl p-3 md:p-4 text-xs text-gray-400 whitespace-pre-wrap font-mono">
              {viewingAILog.system_prompt}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-blue-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> User Prompt
            </p>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 md:p-4 text-sm text-blue-100 whitespace-pre-wrap">
              {viewingAILog.user_message}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-emerald-400 mb-1.5 uppercase tracking-widest flex items-center gap-1.5">
              <Bot className="w-3 h-3" /> AI Output / Generation
            </p>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 md:p-4 text-sm text-emerald-100 whitespace-pre-wrap">
              {viewingAILog.ai_response}
            </div>
          </div>

        </div>
        
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end shrink-0">
          <button 
            type="button" 
            onClick={() => setIsViewAILogModalOpen(false)} 
            className="px-4 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-white/10"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAILogModal;