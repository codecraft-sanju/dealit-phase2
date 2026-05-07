import React from 'react';
import { Edit, X, Coins } from 'lucide-react';

const EditItemModal = ({
  isEditModalOpen,
  setIsEditModalOpen,
  editForm,
  handleEditChange,
  handleEditSubmit,
  dropdownCategories,
  updating
}) => {
  if (!isEditModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 md:py-8 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-2xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <Edit className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /> Edit Item
          </h2>
          <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1 admin-scroll">
          <form id="adminEditForm" onSubmit={handleEditSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Title</label>
                <input type="text" name="title" required value={editForm.title} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all shadow-inner" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Description</label>
                <textarea name="description" required rows="4" value={editForm.description} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] resize-none transition-all shadow-inner"></textarea>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Category</label>
                <select name="category" required value={editForm.category} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all appearance-none shadow-inner">
                  <option value="" disabled className="bg-[#0B0F19]">Select Category</option>
                  
                  {dropdownCategories.length > 0 ? (
                    dropdownCategories.map((cat) => (
                      <option key={cat._id} value={cat.name} className="bg-[#0B0F19]">{cat.name}</option>
                    ))
                  ) : (
                    <option value={editForm.category} className="bg-[#0B0F19]">{editForm.category || 'Loading...'}</option>
                  )}

                  {/* Display legacy/deleted category if the item currently has it */}
                  {editForm.category && dropdownCategories.length > 0 && !dropdownCategories.some(c => c.name === editForm.category) && (
                    <option value={editForm.category} className="bg-[#0B0F19]">{editForm.category} (Legacy)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Condition</label>
                <select name="condition" required value={editForm.condition} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all appearance-none shadow-inner">
                  <option value="New" className="bg-[#0B0F19]">Brand New</option>
                  <option value="Like New" className="bg-[#0B0F19]">Like New</option>
                  <option value="Used" className="bg-[#0B0F19]">Used - Good</option>
                  <option value="Fair" className="bg-[#0B0F19]">Fair</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Estimated Value</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Coins className="h-4 w-4 text-yellow-400" />
                  </div>
                  <input type="number" name="estimated_value" value={editForm.estimated_value} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-yellow-500/50 focus:bg-white/[0.05] transition-all shadow-inner" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Preferred Item</label>
                <input type="text" name="preferred_item" value={editForm.preferred_item} onChange={handleEditChange} className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-white text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all shadow-inner" />
              </div>
            </div>
          </form>
        </div>
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3 shrink-0">
          <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button type="submit" form="adminEditForm" disabled={updating} className={`px-5 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${updating ? 'bg-emerald-600/30 text-emerald-200/50 cursor-not-allowed border-emerald-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/50'}`}>
            {updating ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;