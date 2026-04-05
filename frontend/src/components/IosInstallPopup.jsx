import React, { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

const IosInstallPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Real Device Checks
    const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = () => ('standalone' in window.navigator) && window.navigator.standalone;
    const isSafari = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios');
    };

    // Show only on real iOS Safari if not installed
    if (isIos() && isSafari() && !isStandalone()) {
      const hasSeenPopup = localStorage.getItem('hasSeenMinimalBanner');
      if (!hasSeenPopup) {
        setShowPopup(true);
      }
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
    localStorage.setItem('hasSeenMinimalBanner', 'true');
  };

  if (!showPopup) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[9999] flex flex-col items-center px-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      
      {/* Sleek Single-Line Banner */}
      <div className="bg-gray-800/95 backdrop-blur-md border border-gray-600 shadow-2xl rounded-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm w-max max-w-[340px]">
        
        <div className="flex items-center gap-2 text-gray-300 whitespace-nowrap text-[13px]">
          <span>Tap</span>
          <Share className="w-4 h-4 text-blue-400 -mt-0.5" />
          <span>and select <strong className="text-white">Add to Home Screen</strong></span>
        </div>

        {/* Close Button */}
        <button 
          onClick={closePopup} 
          className="text-gray-400 hover:text-white ml-2 p-0.5 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tiny Arrow Pointing Down */}
      <div className="mt-1 animate-bounce">
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-600"></div>
      </div>
      
    </div>
  );
};

export default IosInstallPopup;