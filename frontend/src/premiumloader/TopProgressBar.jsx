import React, { useEffect, useState } from 'react';

const TopProgressBar = () => {
  const [progress, setProgress] = useState(0);
  
  // Conditionally render loaders randomly
  const [loaderType] = useState(() => Math.random() > 0.5 ? 'honeycomb' : 'three-body');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * 15;
        return Math.min(oldProgress + diff, 90);
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    // CHANGED: Background ko frosted glass aur subtle gradient effect diya hai
    <div className="fixed inset-0 z-[9999] flex flex-col pointer-events-none backdrop-blur-[6px] bg-white/80 bg-gradient-to-br from-white via-white to-[#7954CB]/10">
      
      {/* Top progress bar track */}
      <div className="w-full h-[8px] bg-[#6E46C4]/20 relative overflow-hidden">
        {/* Animated Loading Bar */}
        <div
          className="absolute top-0 left-0 h-full bg-[#6E46C4] transition-all duration-200 ease-out shadow-[0_0_12px_#6E46C4]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        
        {/* Glow behind the loader for premium feel */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#7954CB]/20 blur-xl rounded-full scale-150 animate-pulse"></div>
          
          <div className="relative z-10 flex justify-center items-center h-16 w-16">
            {loaderType === 'honeycomb' ? (
              <div className="honeycomb">
                <div></div><div></div><div></div><div></div><div></div><div></div><div></div>
              </div>
            ) : (
              <div className="three-body">
                <div className="three-body__dot"></div>
                <div className="three-body__dot"></div>
                <div className="three-body__dot"></div>
              </div>
            )}
          </div>
        </div>

        {/* CHANGED: Added animated Loading text */}
        <div className="text-[#6E46C4] font-medium text-sm tracking-widest uppercase animate-pulse">
          Loading
          <span className="inline-flex w-4 animate-[ping_1.5s_infinite] ml-1">...</span>
        </div>

      </div>

      <style>{`
        /* Honeycomb CSS */
        @-webkit-keyframes honeycomb {
          0%, 20%, 80%, 100% { opacity: 0; -webkit-transform: scale(0); transform: scale(0); }
          30%, 70% { opacity: 1; -webkit-transform: scale(1); transform: scale(1); }
        }

        @keyframes honeycomb {
          0%, 20%, 80%, 100% { opacity: 0; -webkit-transform: scale(0); transform: scale(0); }
          30%, 70% { opacity: 1; -webkit-transform: scale(1); transform: scale(1); }
        }

        .honeycomb {
          height: 24px;
          position: relative;
          width: 24px;
        }

        .honeycomb div {
          -webkit-animation: honeycomb 2.1s infinite backwards;
          animation: honeycomb 2.1s infinite backwards;
          background: #6E46C4;
          height: 12px;
          margin-top: 6px;
          position: absolute;
          width: 24px;
        }

        .honeycomb div:after, .honeycomb div:before {
          content: '';
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          position: absolute;
          left: 0;
          right: 0;
        }

        .honeycomb div:after {
          top: -6px;
          border-bottom: 6px solid #6E46C4;
        }

        .honeycomb div:before {
          bottom: -6px;
          border-top: 6px solid #6E46C4;
        }

        .honeycomb div:nth-child(1) { -webkit-animation-delay: 0s; animation-delay: 0s; left: -28px; top: 0; }
        .honeycomb div:nth-child(2) { -webkit-animation-delay: 0.1s; animation-delay: 0.1s; left: -14px; top: 22px; }
        .honeycomb div:nth-child(3) { -webkit-animation-delay: 0.2s; animation-delay: 0.2s; left: 14px; top: 22px; }
        .honeycomb div:nth-child(4) { -webkit-animation-delay: 0.3s; animation-delay: 0.3s; left: 28px; top: 0; }
        .honeycomb div:nth-child(5) { -webkit-animation-delay: 0.4s; animation-delay: 0.4s; left: 14px; top: -22px; }
        .honeycomb div:nth-child(6) { -webkit-animation-delay: 0.5s; animation-delay: 0.5s; left: -14px; top: -22px; }
        .honeycomb div:nth-child(7) { -webkit-animation-delay: 0.6s; animation-delay: 0.6s; left: 0; top: 0; }

        /* Three-Body CSS */
        .three-body {
          --uib-size: 35px;
          --uib-speed: 0.8s;
          --uib-color: #6E46C4;
          position: relative;
          display: inline-block;
          height: var(--uib-size);
          width: var(--uib-size);
          animation: spin78236 calc(var(--uib-speed) * 2.5) infinite linear;
        }

        .three-body__dot {
          position: absolute;
          height: 100%;
          width: 30%;
        }

        .three-body__dot:after {
          content: '';
          position: absolute;
          height: 0%;
          width: 100%;
          padding-bottom: 100%;
          background-color: var(--uib-color);
          border-radius: 50%;
        }

        .three-body__dot:nth-child(1) {
          bottom: 5%;
          left: 0;
          transform: rotate(60deg);
          transform-origin: 50% 85%;
        }

        .three-body__dot:nth-child(1)::after {
          bottom: 0;
          left: 0;
          animation: wobble1 var(--uib-speed) infinite ease-in-out;
          animation-delay: calc(var(--uib-speed) * -0.3);
        }

        .three-body__dot:nth-child(2) {
          bottom: 5%;
          right: 0;
          transform: rotate(-60deg);
          transform-origin: 50% 85%;
        }

        .three-body__dot:nth-child(2)::after {
          bottom: 0;
          left: 0;
          animation: wobble1 var(--uib-speed) infinite calc(var(--uib-speed) * -0.15) ease-in-out;
        }

        .three-body__dot:nth-child(3) {
          bottom: -5%;
          left: 0;
          transform: translateX(116.666%);
        }

        .three-body__dot:nth-child(3)::after {
          top: 0;
          left: 0;
          animation: wobble2 var(--uib-speed) infinite ease-in-out;
        }

        @keyframes spin78236 {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes wobble1 {
          0%, 100% { transform: translateY(0%) scale(1); opacity: 1; }
          50% { transform: translateY(-66%) scale(0.65); opacity: 0.8; }
        }

        @keyframes wobble2 {
          0%, 100% { transform: translateY(0%) scale(1); opacity: 1; }
          50% { transform: translateY(66%) scale(0.65); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default TopProgressBar;