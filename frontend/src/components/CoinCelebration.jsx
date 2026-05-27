import React from 'react';
import { Sparkles } from 'lucide-react';

const coinGradients = [
  'radial-gradient(circle, #FFF099 20%, #FBBF24 80%, #D97706 100%)',
  'radial-gradient(circle, #FEF08A 20%, #F59E0B 80%, #B45309 100%)',
  'radial-gradient(circle, #FDE047 20%, #EAB308 80%, #92400E 100%)'
];

const CoinCelebration = ({ coinCount = 40 }) => {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {[...Array(coinCount)].map((_, i) => {
        const size = Math.random() * 16 + 12; 
        const isSparkle = i % 5 === 0; 

        if (isSparkle) {
          const style = {
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 2 + 1}s`,
            animationDelay: `${Math.random() * 0.5}s`,
            width: `${size}px`,
            height: `${size}px`,
            color: '#FDE047',
          };
          return (
            <div key={i} className="coin-piece flex items-center justify-center drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" style={style}>
              <Sparkles size={size} />
            </div>
          );
        }

        const style = {
          left: `${Math.random() * 100}%`,
          animationDuration: `${Math.random() * 2.5 + 2}s`, 
          animationDelay: `${Math.random() * 0.3}s`,
          background: coinGradients[Math.floor(Math.random() * coinGradients.length)],
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: '1px solid #D97706',
          boxShadow: 'inset 0 0 6px rgba(217, 119, 6, 0.8), 0 4px 8px rgba(0,0,0,0.3)',
        };
        return <div key={i} className="coin-piece" style={style} />;
      })}
      
      <style>{`
        @keyframes coinFall {
          0% { 
            transform: translateY(-10vh) rotateX(0deg) rotateY(0deg); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(110vh) rotateX(1080deg) rotateY(720deg); 
            opacity: 0; 
          }
        }
        .coin-piece {
          position: absolute;
          top: -10%;
          z-index: 50;
          animation: coinFall linear forwards;
        }
      `}</style>
    </div>
  );
};

export default CoinCelebration;