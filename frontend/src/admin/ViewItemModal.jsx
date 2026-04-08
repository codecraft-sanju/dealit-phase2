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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-gray-800 w-full max-w-3xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-500" /> Item Analysis
          </h2>
          <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2.5 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 admin-scroll space-y-8">
          {viewingItem.images && viewingItem.images.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 mb-3 font-bold uppercase tracking-widest">Uploaded Media Gallery</p>
              <div className="flex gap-4 overflow-x-auto pb-2 admin-scroll snap-x">
                {viewingItem.images.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="snap-start shrink-0 relative group">
                    <img src={img} alt={`view-${idx}`} className="w-48 h-48 object-cover rounded-2xl border-2 border-gray-700 group-hover:border-blue-500 transition-all shadow-lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/50 p-8 rounded-2xl border border-gray-700 border-dashed text-center text-gray-500 flex flex-col items-center">
              <Package className="w-10 h-10 mb-3 opacity-50" />
              <p className="font-medium">No images uploaded for this item.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900/30 p-6 rounded-2xl border border-gray-700/50">
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">Listing Title</p>
              <p className="text-2xl font-black text-white">{viewingItem.title}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">Estimated Value</p>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg">
                <Coins className="w-5 h-5 text-yellow-500"/>
                <span className="text-xl font-black text-yellow-500">{viewingItem.estimated_value || '0'}</span>
                <span className="text-xs font-bold text-yellow-500/80 uppercase">Credits</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">Looking for in return</p>
              <p className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg inline-block">{viewingItem.preferred_item || 'Open to any offers'}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">Detailed Description</p>
              <p className="text-gray-300 bg-gray-800 p-5 rounded-2xl border border-gray-700 leading-relaxed font-medium">
                {viewingItem.description}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">Category</p>
              <p className="text-white font-bold text-lg">{viewingItem.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-widest">Condition</p>
              <p className="text-white font-bold text-lg">{viewingItem.condition}</p>
            </div>

            <div className="md:col-span-2 pt-6 mt-2 border-t border-gray-700">
              <p className="text-xs text-blue-400 font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Posted By (Owner)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-800/80 p-5 rounded-2xl border border-gray-700">
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Full Name</p>
                  <p className="text-sm text-white font-bold">{viewingItem.owner?.full_name || 'Unknown User'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Email Address</p>
                  <p className="text-sm text-white font-bold truncate" title={viewingItem.owner?.email}>{viewingItem.owner?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Phone Number</p>
                  <p className="text-sm text-white font-bold">{viewingItem.owner?.phone || <span className="text-gray-600 italic">Not set</span>}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex justify-end gap-3 flex-wrap shrink-0">
          <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
            Close
          </button>
          
          {viewingItem.status === 'pending' && (
            <>
              <button 
                onClick={() => { setIsViewModalOpen(false); handleRejectClick(viewingItem._id); }} 
                className="px-6 py-2.5 rounded-xl font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-50 hover:text-white transition-all flex items-center gap-2 shadow-sm"
              >
                <X className="w-4 h-4" /> Reject Listing
              </button>
              <button 
                onClick={() => { setIsViewModalOpen(false); handleApprove(viewingItem._id); }} 
                className="px-8 py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Approve Listing
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewItemModal;