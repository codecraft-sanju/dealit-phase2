import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Sparkles, Download, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_API;
const API_URL  = `${API_BASE}/api`;

const ImageGenerateAi = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false); // [NEW] Image render track karne ke liye
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setGeneratedImage(null);
    setIsImageLoading(true); // Image network load start

    try {
      const token = localStorage.getItem('dealit_token');
      const response = await axios.post(
        `${API_URL}/ai/generate-image`,
        { prompt },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setGeneratedImage(response.data.imageUrl);
        setLoading(false); // API done, but isImageLoading is still true until image loads
      } else {
        setError(response.data.message || 'Failed to generate image.');
        setLoading(false);
        setIsImageLoading(false);
      }
    } catch (err) {
      setError('Something went wrong while connecting to the server.');
      console.error(err);
      setLoading(false);
      setIsImageLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `Dealit_AI_Image_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-[#1A1A1A] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-800/80 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                <ImageIcon className="w-5 h-5 text-purple-400" />
               </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-wide">Image Generator</h2>
                <p className="text-xs text-gray-400">Powered by Dealit AI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 ai-no-scrollbar">
            
            {/* Image Display Area */}
            <div className="w-full aspect-square md:aspect-video bg-[#0A0A0A] border border-gray-800 rounded-2xl flex items-center justify-center overflow-hidden relative shadow-inner">
              
              {/* Loader tab tak dikhega jab tak dono loading or isImageLoading mein se koi bhi true hoga */}
              {loading || isImageLoading ? (
                <div className="flex flex-col items-center gap-6">
                  {/* --- CHANGED: Inserted cube loader instead of normal spinner --- */}
                  <style>{`
                    .custom_cube_loader {
                      width: 80px;
                      height: 80px;
                      position: relative;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    .custom_cube_loader_cube {
                      position: absolute;
                      width: 100%;
                      height: 100%;
                      border-radius: 16px;
                    }
                    .custom_cube_loader_cube--glowing {
                      z-index: 2;
                      background-color: rgba(255, 255, 255, 0.2);
                      border: 2px solid rgba(255, 255, 255, 0.3);
                    }
                    .custom_cube_loader_cube--color {
                      z-index: 1;
                      filter: blur(2px);
                      background: linear-gradient(135deg, #1afbf0, #da00ff);
                      animation: custom_cube_loadtwo 2.5s ease-in-out infinite;
                    }
                    @keyframes custom_cube_loadtwo {
                      50% { transform: rotate(-80deg); }
                    }
                  `}</style>
                  <div className="custom_cube_loader">
                    <div className="custom_cube_loader_cube custom_cube_loader_cube--color" />
                    <div className="custom_cube_loader_cube custom_cube_loader_cube--glowing" />
                  </div>
                  <p className="text-sm font-medium text-purple-400 animate-pulse mt-2">
                    {loading ? 'Generating your masterpiece...' : 'Downloading image...'}
                  </p>
                </div>
              ) : !generatedImage ? (
                <div className="flex flex-col items-center text-gray-600 gap-3">
                  <ImageIcon className="w-12 h-12 opacity-50" />
                  <p className="text-sm font-medium">Your generated image will appear here</p>
                </div>
              ) : null}

              {/* Yeh image DOM me rahegi taaki browser load kar le. onLoad fire hote hi loader hatega */}
              {generatedImage && (
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)} // Fail safe
                  className={`w-full h-full object-contain ${isImageLoading ? 'hidden' : 'block'}`} 
                />
              )}

              {/* Download Button Overlay */}
              {generatedImage && !isImageLoading && !loading && (
                <button
                  onClick={handleDownload}
                  className="absolute bottom-4 right-4 p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-semibold">Save</span>
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleGenerate} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-gray-300 ml-1">Describe what you want to see</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={loading}
                  placeholder="A futuristic cyberpunk city at night with neon lights..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageGenerateAi;