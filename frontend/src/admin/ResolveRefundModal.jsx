import React from 'react';
import { X, RefreshCcw } from 'lucide-react';

const ResolveRefundModal = ({
  isResolveModalOpen,
  setIsResolveModalOpen,
  resolvingOrder,
  handleResolveSubmit,
  resolveForm,
  setResolveForm,
  updating
}) => {
  if (!isResolveModalOpen || !resolvingOrder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-md rounded-2xl md:rounded-3xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-red-500/10 flex justify-between items-center bg-red-500/5">
          <h2 className="text-base md:text-lg font-black text-red-400 flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 md:w-5 md:h-5" /> Resolve Failed Refund
          </h2>
          <button onClick={() => setIsResolveModalOpen(false)} className="text-gray-400 hover:text-white transition-all bg-white/5 p-2 rounded-full hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 md:p-6">
          <p className="text-xs text-gray-400 mb-5 leading-relaxed">
            Confirming this will mark the <span className="text-red-400 font-bold">₹{resolvingOrder.shippingCost}</span> shipping refund as resolved. Ensure you have transferred the money to the buyer manually via UPI/Bank.
          </p>
          <form id="resolveForm" onSubmit={handleResolveSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Transaction ID (Optional)</label>
              <input 
                type="text" 
                value={resolveForm.transactionId} 
                onChange={(e) => setResolveForm({ ...resolveForm, transactionId: e.target.value })} 
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600 font-mono"
                placeholder="e.g. UPI Ref No. 123456789"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Admin Note / Reason</label>
              <textarea 
                value={resolveForm.adminNote} 
                onChange={(e) => setResolveForm({ ...resolveForm, adminNote: e.target.value })} 
                rows="3"
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-red-500/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600 resize-none"
                placeholder="e.g. Refunded manually to user's GPay account."
              ></textarea>
            </div>
          </form>
        </div>
        
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3">
          <button type="button" onClick={() => setIsResolveModalOpen(false)} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button 
            type="submit" 
            form="resolveForm" 
            disabled={updating} 
            className={`px-5 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${updating ? 'bg-red-600/30 text-white/50 cursor-not-allowed border-red-500/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] border border-red-500/50'}`}
          >
            {updating ? 'Resolving...' : 'Confirm Resolution'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolveRefundModal;