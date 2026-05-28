import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Spark {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  driftX: number;
  driftY: number;
}

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkIdCounter = useRef(0);
  const lastEmitTime = useRef(0);

  useEffect(() => {
    // Elegant custom animations following normal system cursor, hidden on touch mobile displays
    const checkDevice = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Frame throttling emission to avoid heavy rendering
      if (now - lastEmitTime.current > 16) {
        lastEmitTime.current = now;

        const colors = [
          '#10b981', // Emerald green
          '#34d399', // Mint green
          '#059669', // Safe Dark emerald
          '#6ee7b7', // Light green
          '#14b8a6', // Teal
        ];
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomSize = Math.floor(Math.random() * 5) + 3; // 3px to 8px size

        const newSpark: Spark = {
          id: sparkIdCounter.current++,
          x: e.clientX,
          y: e.clientY,
          size: randomSize,
          color: randomColor,
          driftX: (Math.random() * 40 - 20),
          driftY: (Math.random() * 30 - 15),
        };

        // Enforce maximum pool and add newest spark
        setSparks((prev) => [...prev.slice(-35), newSpark]);
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      const burstSparks: Spark[] = [];
      const colors = ['#10b981', '#059669', '#34d399', '#a7f3d0', '#60a5fa'];
      
      // Emit a fast explosion pattern on clicks
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        const radius = Math.random() * 35 + 15;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;

        burstSparks.push({
          id: sparkIdCounter.current++,
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 4 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          driftX: dx,
          driftY: dy,
        });
      }
      setSparks((prev) => [...prev.slice(-25), ...burstSparks]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
    };
  }, []);

  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {sparks.map((spark) => (
          <motion.div
            key={spark.id}
            initial={{ 
              opacity: 0.9, 
              scale: 1, 
              x: spark.x, 
              y: spark.y 
            }}
            animate={{ 
              opacity: 0, 
              scale: 0.1,
              x: spark.x + spark.driftX,
              y: spark.y + spark.driftY,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.65, 
              ease: [0.1, 0.8, 0.2, 1] 
            }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: spark.size,
              height: spark.size,
              borderRadius: '50%',
              backgroundColor: spark.color,
              boxShadow: `0 0 6px ${spark.color}50`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
