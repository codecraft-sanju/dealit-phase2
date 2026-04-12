import { useEffect, useRef, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const ScrollReveal = ({
  children,
  containerClassName = '',
  textClassName = '',
  highlightWords = [] // Array of objects: { word: "text", class: "gradient-class" }
}) => {
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Split text into words and check against the highlight list
  const words = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    // Split by space
    return text.split(' ').filter(word => word.trim() !== '').map(word => {
      // Remove punctuation (like . or ,) just for matching purposes
      const cleanWord = word.replace(/[.,!]/g, '');
      
      // Find if this word exists in our highlight list (case insensitive)
      const highlight = highlightWords.find(h => h.word.toLowerCase() === cleanWord.toLowerCase());
      
      return {
        text: word, // The actual text to display (with punctuation)
        className: highlight ? highlight.class : '' // The gradient class if matched
      };
    });
  }, [children, highlightWords]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Select all word wrappers
    const wordElements = el.querySelectorAll('.word-wrapper');

    // 1. Reveal Animation (Blur -> Focus + Slide Up)
    gsap.fromTo(
      wordElements,
      { 
        y: 60, 
        opacity: 0, 
        filter: 'blur(12px)',
        transformOrigin: '50% 100%',
        rotateX: -40 // Stronger 3D tilt for impact
      },
      {
        y: 0,
        opacity: 1,
        rotateX: 0,
        filter: 'blur(0px)',
        stagger: 0.04, // Smooth domino effect
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%', // Starts when text enters viewport
          end: 'bottom 20%',
          toggleActions: 'play none none reverse'
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  // Track mouse relative to container for future proximity logic
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative cursor-default select-none ${containerClassName}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Flex container for words */}
      <div className={`flex flex-wrap justify-center gap-x-[0.35em] gap-y-[0.1em] leading-[1.15] ${textClassName}`}>
        {words.map((item, i) => (
          <ProximityWord 
            key={i} 
            word={item.text} 
            className={item.className}
            mousePosition={mousePosition} 
            isContainerHovered={isHovered} 
          />
        ))}
      </div>
    </div>
  );
};

// Sub-component for individual words
const ProximityWord = ({ word, className, mousePosition, isContainerHovered }) => {
  return (
    <motion.span
      className={`word-wrapper inline-block relative perspective-1000 ${className}`}
      // Framer Motion Hover Effect (Scale + Lift)
      whileHover={{ 
        scale: 1.15,
        y: -5,
        filter: 'brightness(1.2)', // Makes gradients pop more on hover
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
    >
      {word}
    </motion.span>
  );
};

export default ScrollReveal;