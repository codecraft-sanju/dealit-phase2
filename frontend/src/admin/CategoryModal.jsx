import React from 'react';
import { Layers, X } from 'lucide-react';

const CategoryModal = ({
  setIsCategoryModalOpen,
  editingCategoryId,
  categoryForm,
  setCategoryForm,
  handleCategorySubmit,
  updating,
  AVAILABLE_ICONS
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-md rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 md:w-5 md:h-5 text-blue-400" /> 
            {editingCategoryId ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 md:p-6">
          <form id="categoryForm" onSubmit={handleCategorySubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Category Name</label>
              <input 
                type="text" 
                required
                value={categoryForm.name} 
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white text-xs md:text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all shadow-inner placeholder:text-gray-600"
                placeholder="e.g. Electronics, Vehicles..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Select Icon</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto admin-scroll p-1">
                {AVAILABLE_ICONS.map((iconObj) => {
                  const IconComp = iconObj.icon;
                  const isSelected = categoryForm.icon === iconObj.name;
                  return (
                    <button
                      key={iconObj.name}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, icon: iconObj.name })}
                      className={`p-2.5 rounded-lg md:rounded-xl flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)] border border-blue-400' 
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent'
                      }`}
                      title={iconObj.name}
                    >
                      <IconComp className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
              <label className="text-xs md:text-sm font-bold text-gray-300">Active Status</label>
              <button
                type="button"
                onClick={() => setCategoryForm({ ...categoryForm, isActive: !categoryForm.isActive })}
                className={`w-10 h-5 md:w-12 md:h-6 rounded-full relative transition-colors duration-300 ${categoryForm.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`}
              >
                <span className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full transition-transform duration-300 ${categoryForm.isActive ? 'translate-x-[22px] md:translate-x-[26px]' : 'translate-x-[4px]'}`} />
              </button>
            </div>
          </form>
        </div>
        
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3">
          <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button 
            type="submit" 
            form="categoryForm" 
            disabled={updating} 
            className={`px-5 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${updating ? 'bg-blue-600/30 text-white/50 cursor-not-allowed border-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] border border-blue-500/50'}`}
          >
            {updating ? 'Saving...' : (editingCategoryId ? 'Update Category' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;