import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ createdAt, hours, expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      let expireDate;
      if (expiresAt) {
        expireDate = new Date(expiresAt).getTime();
      } else if (createdAt && hours) {
        expireDate = new Date(createdAt).getTime() + hours * 60 * 60 * 1000;
      } else {
        return '00h 00m 00s';
      }
      
      const now = new Date().getTime();
      const diff = expireDate - now;

      if (diff <= 0) return '00h 00m 00s';

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      return `${h}h ${m}m ${s}s`;
    };

    setTimeLeft(calculateTime());
    const timer = setInterval(() => setTimeLeft(calculateTime()), 1000);
    
    return () => clearInterval(timer);
  }, [createdAt, hours, expiresAt]);

  return <span>{timeLeft}</span>;
};

export default CountdownTimer;