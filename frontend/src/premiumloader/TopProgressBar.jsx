import React, { useEffect, useState } from 'react';

const TopProgressBar = () => {
  const [progress, setProgress] = useState(0);

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
    // Pura page cover karne ke liye ek halka white background de diya hai
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col pointer-events-none">
      {/* Top progress bar track */}
      <div className="w-full h-[4px] bg-[#6E46C4]/20 relative overflow-hidden">
        {/* Animated Loading Bar */}
        <div
          className="absolute top-0 left-0 h-full bg-[#6E46C4] transition-all duration-200 ease-out shadow-[0_0_12px_#6E46C4]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Optional: Page ke center mein ek chota sa pulse effect */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6E46C4]/30 border-t-[#6E46C4] rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

export default TopProgressBar;