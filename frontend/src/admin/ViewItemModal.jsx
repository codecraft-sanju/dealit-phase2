import React from 'react';
import { Eye, X, Package, Coins, User, CheckCircle } from 'lucide-react';

const ViewItemModal = ({
  isViewModalOpen,
  setIsViewModalOpen,
  viewingItem,
  handleRejectClick,
  handleApprove
}) => {
  if (!isViewModalOpen || !viewingItem) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 md:py-8 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-3xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 tracking-tight">
            <Eye className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> Item Analysis
          </h2>
          <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-1.5 md:p-2 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-full">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 admin-scroll space-y-5 md:space-y-6">
          {viewingItem.images && viewingItem.images.length > 0 ? (
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-2 md:mb-3 font-bold uppercase tracking-widest">Uploaded Media Gallery</p>
              <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 admin-scroll snap-x">
                {viewingItem.images.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="snap-start shrink-0 relative group">
                    <img src={img} alt={`view-${idx}`} className="w-28 h-28 md:w-40 md:h-40 object-cover rounded-xl md:rounded-2xl border border-white/10 group-hover:border-blue-500/50 transition-all shadow-lg bg-black/20" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Eye className="w-6 h-6 md:w-8 md:h-8 text-white drop-shadow-md" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.01] p-6 md:p-8 rounded-xl md:rounded-2xl border border-dashed border-white/10 text-center text-gray-500 flex flex-col items-center">
              <Package className="w-8 h-8 md:w-10 md:h-10 mb-2 md:mb-3 opacity-30" />
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400">No images uploaded</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 bg-white/[0.01] p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 shadow-inner">
            <div className="md:col-span-2">
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-1 md:mb-1.5 font-bold uppercase tracking-widest">Listing Title</p>
              <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">{viewingItem.title}</p>
            </div>
            
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-1 md:mb-1.5 font-bold uppercase tracking-widest">Estimated Value</p>
              <div className="inline-flex items-center gap-1.5 md:gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl shadow-sm">
                <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-400"/>
                <span className="text-lg md:text-xl font-black text-yellow-400 leading-none">{viewingItem.estimated_value || '0'}</span>
                <span className="text-[9px] md:text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest mt-0.5">Credits</span>
              </div>
            </div>

            <div>
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-1 md:mb-1.5 font-bold uppercase tracking-widest">Looking for in return</p>
              <p className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl inline-block text-xs md:text-sm shadow-sm">{viewingItem.preferred_item || 'Open to any offers'}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-1 md:mb-1.5 font-bold uppercase tracking-widest">Detailed Description</p>
              <p className="text-gray-300 bg-black/20 p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 leading-relaxed text-xs md:text-sm shadow-inner whitespace-pre-wrap">
                {viewingItem.description}
              </p>
            </div>

            <div>
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-1 md:mb-1.5 font-bold uppercase tracking-widest">Category</p>
              <p className="text-white font-bold text-sm md:text-base bg-white/[0.02] border border-white/5 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl inline-block shadow-inner">{viewingItem.category}</p>
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] text-gray-500 mb-1 md:mb-1.5 font-bold uppercase tracking-widest">Condition</p>
              <p className="text-white font-bold text-sm md:text-base bg-white/[0.02] border border-white/5 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl inline-block shadow-inner">{viewingItem.condition}</p>
            </div>

            <div className="md:col-span-2 pt-5 md:pt-6 mt-2 border-t border-white/5">
              <p className="text-[9px] md:text-[10px] text-blue-400 font-bold mb-3 md:mb-4 uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4" /> Posted By (Owner)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 bg-white/[0.02] p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5">
                <div>
                  <p className="text-[8px] md:text-[9px] text-gray-500 mb-0.5 md:mb-1 font-bold uppercase tracking-widest">Full Name</p>
                  <p className="text-xs md:text-sm text-gray-200 font-bold">{viewingItem.owner?.full_name || 'Unknown User'}</p>
                </div>
                <div>
                  <p className="text-[8px] md:text-[9px] text-gray-500 mb-0.5 md:mb-1 font-bold uppercase tracking-widest">Email Address</p>
                  <p className="text-xs md:text-sm text-gray-200 font-bold truncate" title={viewingItem.owner?.email}>{viewingItem.owner?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[8px] md:text-[9px] text-gray-500 mb-0.5 md:mb-1 font-bold uppercase tracking-widest">Phone Number</p>
                  <p className="text-xs md:text-sm text-gray-200 font-bold">{viewingItem.owner?.phone || <span className="text-gray-600 italic">Not set</span>}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3 flex-wrap shrink-0">
          <button onClick={() => setIsViewModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            Close
          </button>
          
          {viewingItem.status === 'pending' && (
            <>
              <button 
                onClick={() => { setIsViewModalOpen(false); handleRejectClick(viewingItem._id); }} 
                className="flex-1 sm:flex-none justify-center px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 md:gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" /> Reject
              </button>
              <button 
                onClick={() => { setIsViewModalOpen(false); handleApprove(viewingItem._id); }} 
                className="flex-1 sm:flex-none justify-center px-5 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50 transition-all flex items-center gap-1.5 md:gap-2"
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewItemModal;