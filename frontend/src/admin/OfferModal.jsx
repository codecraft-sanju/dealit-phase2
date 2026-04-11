import React from 'react';
import { Edit, Image as ImageIcon, X, Monitor, Smartphone, ToggleRight, ToggleLeft } from 'lucide-react';

const OfferModal = ({
  isOfferModalOpen,
  setIsOfferModalOpen,
  editingOfferId,
  offerForm,
  setOfferForm,
  handleOfferSubmit,
  handleImageSelect,
  isUploadingMobile,
  isUploadingDesktop,
  isProcessingCrop,
  updating
}) => {
  if (!isOfferModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 md:py-8 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-2xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2 tracking-tight">
            {editingOfferId ? <Edit className="w-5 h-5 text-[#A388E1]" /> : <ImageIcon className="w-5 h-5 text-[#A388E1]" />} 
            {editingOfferId ? 'Update Banner' : 'Upload New Banner'}
          </h2>
          <button onClick={() => setIsOfferModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-full">
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 admin-scroll">
          <form id="offerForm" onSubmit={handleOfferSubmit} className="space-y-6 md:space-y-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              {/* Desktop Image Area */}
              <div className="space-y-2 md:space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desktop Banner</label>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-medium">1200x240 (5:1)</span>
                </div>
                
                {offerForm.desktopImage ? (
                  <div className="relative w-full h-28 md:h-36 bg-black/20 rounded-xl md:rounded-2xl border border-white/10 overflow-hidden group shadow-inner">
                    <img src={offerForm.desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                      <label className="cursor-pointer bg-white text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs hover:bg-gray-200 transition-all shadow-lg">
                        Change
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'desktop')} disabled={isUploadingDesktop || isProcessingCrop} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-28 md:h-36 border border-dashed border-white/20 hover:border-[#A388E1]/50 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl md:rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group shadow-inner">
                    {isUploadingDesktop ? (
                      <>
                        <div className="w-5 h-5 md:w-6 md:h-6 border-4 border-[#A388E1]/30 border-t-[#A388E1] rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] md:text-[11px] font-bold text-[#A388E1] uppercase tracking-wider">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 md:p-2.5 bg-white/5 rounded-lg md:rounded-xl group-hover:bg-[#A388E1]/20 border border-white/5 group-hover:border-[#A388E1]/30 transition-all mb-2 shadow-sm">
                          <Monitor className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-[#A388E1] transition-colors" />
                        </div>
                        <span className="text-[9px] md:text-[11px] font-bold text-gray-400 group-hover:text-[#A388E1] transition-colors uppercase tracking-wider text-center px-2">Upload Desktop Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'desktop')} disabled={isUploadingDesktop || isProcessingCrop} />
                  </label>
                )}
              </div>

              {/* Mobile Image Area */}
              <div className="space-y-2 md:space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Banner</label>
                  <span className="text-[9px] md:text-[10px] text-gray-500 font-medium">800x320 (2.5:1)</span>
                </div>
                
                {offerForm.mobileImage ? (
                  <div className="relative w-full h-28 md:h-36 bg-black/20 rounded-xl md:rounded-2xl border border-white/10 overflow-hidden group flex justify-center shadow-inner">
                    <img src={offerForm.mobileImage} alt="Mobile Preview" className="w-auto h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                      <label className="cursor-pointer bg-white text-gray-900 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-xs hover:bg-gray-200 transition-all shadow-lg">
                        Change
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'mobile')} disabled={isUploadingMobile || isProcessingCrop} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-28 md:h-36 border border-dashed border-white/20 hover:border-[#A388E1]/50 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl md:rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group shadow-inner">
                    {isUploadingMobile ? (
                      <>
                        <div className="w-5 h-5 md:w-6 md:h-6 border-4 border-[#A388E1]/30 border-t-[#A388E1] rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] md:text-[11px] font-bold text-[#A388E1] uppercase tracking-wider">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 md:p-2.5 bg-white/5 rounded-lg md:rounded-xl group-hover:bg-[#A388E1]/20 border border-white/5 group-hover:border-[#A388E1]/30 transition-all mb-2 shadow-sm">
                          <Smartphone className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-[#A388E1] transition-colors" />
                        </div>
                        <span className="text-[9px] md:text-[11px] font-bold text-gray-400 group-hover:text-[#A388E1] transition-colors uppercase tracking-wider text-center px-2">Upload Mobile Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'mobile')} disabled={isUploadingMobile || isProcessingCrop} />
                  </label>
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="bg-white/[0.02] p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors" onClick={() => setOfferForm({ ...offerForm, isActive: !offerForm.isActive })}>
              <div className="pr-4">
                <p className="font-bold text-white text-xs md:text-sm tracking-tight">Make Banner Active</p>
                <p className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Active banners are shown on the user homepage.</p>
              </div>
              {offerForm.isActive ? (
                <ToggleRight className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
              ) : (
                <ToggleLeft className="w-8 h-8 md:w-10 md:h-10 text-gray-600 shrink-0" />
              )}
            </div>

          </form>
        </div>
        
        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.01] flex justify-end gap-2 md:gap-3 shrink-0">
          <button type="button" onClick={() => setIsOfferModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
          <button 
            type="submit" 
            form="offerForm" 
            disabled={updating || isUploadingMobile || isUploadingDesktop || isProcessingCrop} 
            className={`px-5 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${updating || isUploadingMobile || isUploadingDesktop || isProcessingCrop ? 'bg-[#A388E1]/30 text-white/50 cursor-not-allowed border border-[#A388E1]/20' : 'bg-gradient-to-r from-[#A388E1] to-purple-600 hover:from-purple-500 hover:to-indigo-600 text-white shadow-[0_0_20px_rgba(163,136,225,0.4)] border border-[#A388E1]/50'}`}
          >
            {updating ? 'Saving...' : editingOfferId ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferModal;