import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Position coordinates
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Spring settings for organic magnetic movement
  const springConfig = { damping: 30, stiffness: 280, mass: 0.6 };
  const followerX = useSpring(cursorX, springConfig);
  const followerY = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Hide custom cursor on mobile touch devices
    const checkDevice = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    const moveCursor = (e: PointerEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    // Track active class names representing interactable items
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA' ||
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.cursor-pointer') ||
        target.classList.contains('group');

      if (isInteractive) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('pointermove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseover', handleOver);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('pointermove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleOver);
    };
  }, [cursorX, cursorY]);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Dynamic Magnetic Outer Pulse Ring */}
      <motion.div
        style={{
          x: followerX,
          y: followerY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: clicked ? 0.8 : isHovered ? 1.8 : 1,
          backgroundColor: isHovered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(26, 107, 58, 0.05)',
          borderColor: isHovered ? 'rgba(16, 185, 129, 0.8)' : 'rgba(26, 107, 58, 0.3)',
          borderWidth: isHovered ? '1.5px' : '1px',
          boxShadow: isHovered 
            ? '0 0 14px rgba(16, 185, 129, 0.35)' 
            : '0 0 0px rgba(0,0,0,0)',
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.2 }}
        className="absolute w-8 h-8 rounded-full border pointer-events-none"
      />

      {/* Tiny Laser Focus Point */}
      <motion.div
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: clicked ? 1.4 : isHovered ? 0.5 : 1,
          backgroundColor: isHovered ? '#34d399' : '#1a6b3a',
          boxShadow: isHovered 
            ? '0 0 10px #34d399' 
            : '0 0 4px rgba(26, 107, 58, 0.4)',
        }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.1 }}
        className="absolute w-2 h-2 rounded-full pointer-events-none"
      />
    </div>
  );
}
