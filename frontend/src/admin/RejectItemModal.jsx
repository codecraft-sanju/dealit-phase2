import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const RejectItemModal = ({
  isRejectModalOpen,
  setIsRejectModalOpen,
  handleRejectSubmit,
  rejectionReason,
  setRejectionReason
}) => {
  if (!isRejectModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-md rounded-2xl md:rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
          <h2 className="text-base md:text-lg font-black text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" /> Reject Item
          </h2>
          <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-white transition-all bg-white/5 p-2 rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 md:p-6">
          <form id="rejectForm" onSubmit={handleRejectSubmit}>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Reason for rejection <span className="text-red-400 font-normal lowercase">*</span></label>
            <textarea 
              required
              rows="4" 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              className="w-full bg-white/[0.02] border border-white/10 rounded-xl md:rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] resize-none transition-all placeholder:text-gray-600 text-xs md:text-sm shadow-inner" 
              placeholder="E.g., Contains inappropriate imagery..."
            ></textarea>
          </form>
        </div>
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3">
          <button onClick={() => setIsRejectModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button type="submit" form="rejectForm" className="px-5 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] border border-red-500/50 transition-all">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default RejectItemModal;