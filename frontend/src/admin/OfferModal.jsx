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
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="bg-gray-800 w-full max-w-2xl rounded-3xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-full animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-gray-900/80 backdrop-blur-md shrink-0">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            {editingOfferId ? <Edit className="w-6 h-6 text-[#A388E1]" /> : <ImageIcon className="w-6 h-6 text-[#A388E1]" />} 
            {editingOfferId ? 'Update Banner' : 'Upload New Banner'}
          </h2>
          <button onClick={() => setIsOfferModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-gray-800 hover:bg-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto admin-scroll">
          <form id="offerForm" onSubmit={handleOfferSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Desktop Image Area */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide">Desktop Banner</label>
                  <span className="text-[10px] text-gray-500 font-medium">Recommended: 1200x240 (Landscape 5:1)</span>
                </div>
                
                {offerForm.desktopImage ? (
                  <div className="relative w-full h-36 bg-gray-900 rounded-2xl border-2 border-gray-700 overflow-hidden group">
                    <img src={offerForm.desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all">
                        Crop & Change
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'desktop')} disabled={isUploadingDesktop || isProcessingCrop} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-36 border-2 border-dashed border-gray-600 hover:border-[#A388E1] bg-gray-900 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    {isUploadingDesktop ? (
                      <>
                        <div className="w-6 h-6 border-4 border-[#A388E1]/30 border-t-[#A388E1] rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-medium text-[#A388E1]">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-800 rounded-full group-hover:bg-[#A388E1]/20 transition-colors mb-2">
                          <Monitor className="w-6 h-6 text-gray-400 group-hover:text-[#A388E1] transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 group-hover:text-[#A388E1] transition-colors">Upload Desktop Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'desktop')} disabled={isUploadingDesktop || isProcessingCrop} />
                  </label>
                )}
              </div>

              {/* Mobile Image Area */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wide">Mobile Banner</label>
                  <span className="text-[10px] text-gray-500 font-medium">Recommended: 800x320 (Landscape 2.5:1)</span>
                </div>
                
                {offerForm.mobileImage ? (
                  <div className="relative w-full h-36 bg-gray-900 rounded-2xl border-2 border-gray-700 overflow-hidden group flex justify-center">
                    <img src={offerForm.mobileImage} alt="Mobile Preview" className="w-auto h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all">
                        Crop & Change
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'mobile')} disabled={isUploadingMobile || isProcessingCrop} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="w-full h-36 border-2 border-dashed border-gray-600 hover:border-[#A388E1] bg-gray-900 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group">
                    {isUploadingMobile ? (
                      <>
                        <div className="w-6 h-6 border-4 border-[#A388E1]/30 border-t-[#A388E1] rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-medium text-[#A388E1]">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="p-2 bg-gray-800 rounded-full group-hover:bg-[#A388E1]/20 transition-colors mb-2">
                          <Smartphone className="w-6 h-6 text-gray-400 group-hover:text-[#A388E1] transition-colors" />
                        </div>
                        <span className="text-xs font-medium text-gray-400 group-hover:text-[#A388E1] transition-colors">Upload Mobile Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'mobile')} disabled={isUploadingMobile || isProcessingCrop} />
                  </label>
                )}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 flex items-center justify-between cursor-pointer" onClick={() => setOfferForm({ ...offerForm, isActive: !offerForm.isActive })}>
              <div>
                <p className="font-bold text-white text-sm">Make Banner Active</p>
                <p className="text-xs text-gray-400 mt-0.5">Active banners are shown on the user homepage.</p>
              </div>
              {offerForm.isActive ? (
                <ToggleRight className="w-10 h-10 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-gray-500" />
              )}
            </div>

          </form>
        </div>
        
        <div className="p-5 border-t border-gray-700 bg-gray-900/80 backdrop-blur-md flex justify-end gap-3 shrink-0">
          <button type="button" onClick={() => setIsOfferModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:text-white transition-all">Cancel</button>
          <button 
            type="submit" 
            form="offerForm" 
            disabled={updating || isUploadingMobile || isUploadingDesktop || isProcessingCrop} 
            className={`px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${updating || isUploadingMobile || isUploadingDesktop || isProcessingCrop ? 'bg-[#A388E1]/50 text-white/50 cursor-not-allowed' : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.4)]'}`}
          >
            {updating ? 'Saving...' : editingOfferId ? 'Update Banner' : 'Publish Banner'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferModal;