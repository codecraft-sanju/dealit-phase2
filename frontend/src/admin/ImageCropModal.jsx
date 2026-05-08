import React from 'react';
import Cropper from 'react-easy-crop';
import { X, Image as ImageIcon } from 'lucide-react';

const ImageCropModal = ({
  cropModalOpen,
  setCropModalOpen,
  cropType,
  imageToCrop,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
  handleCropAndUpload,
  isProcessingCrop
}) => {
  if (!cropModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-2 py-4 md:px-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div className="bg-[#0B0F19]/95 backdrop-blur-3xl w-full max-w-3xl rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[70vh] md:h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="p-4 md:p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <h2 className="text-sm md:text-lg font-black text-white flex items-center gap-2 tracking-tight">
            <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-[#A388E1]" /> 
            Crop {cropType === 'desktop' ? 'Desktop (5:1)' : 'Mobile (2.5:1)'}
          </h2>
          <button onClick={() => setCropModalOpen(false)} className="text-gray-400 hover:text-white transition-all p-2 bg-white/5 hover:bg-white/10 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="relative flex-1 bg-black w-full h-full border-y border-white/5">
          {imageToCrop && (
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={cropType === 'desktop' ? 5 / 1 : 2.5 / 1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          )}
        </div>

        <div className="p-4 md:p-5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 w-full sm:w-1/2 bg-white/[0.02] p-2 md:p-3 rounded-xl border border-white/5">
            <span className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(e.target.value)}
              className="w-full accent-[#A388E1]"
            />
          </div>
          <div className="flex gap-2 md:gap-3 w-full sm:w-auto justify-end">
            <button type="button" onClick={() => setCropModalOpen(false)} className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
            <button
              onClick={handleCropAndUpload}
              disabled={isProcessingCrop}
              className={`px-5 md:px-8 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${isProcessingCrop ? 'bg-[#A388E1]/30 text-white/50 cursor-not-allowed border-[#A388E1]/20' : 'bg-[#A388E1] hover:bg-[#8b70ca] text-white shadow-[0_0_15px_rgba(163,136,225,0.3)] border border-[#A388E1]/50'}`}
            >
              {isProcessingCrop ? 'Processing...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;