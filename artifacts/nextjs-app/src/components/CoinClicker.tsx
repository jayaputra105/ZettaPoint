"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  rotate: number;
  translateX: number;
}

interface Particle {
  id: number;
  angle: number;
  delay: number;
}

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
}: CoinClickerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const [nextId, setNextId] = useState(0);
  const [shake, setShake] = useState(false);
  
  // State untuk animasi khusus 5 detik
  const [isTransforming, setIsTransforming] = useState(false);
  const [showFinalShake, setShowFinalShake] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const startTransform = () => {
    setIsTransforming(true);
    // Generate particles
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      angle: Math.random() * 360,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);

    // End sequence after 5s
    setTimeout(() => {
      setShowFinalShake(true);
      setTimeout(() => {
        setShowFinalShake(false);
        setIsTransforming(false);
        setParticles([]);
      }, 200); // Shake 0.2s
    }, 4800);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      // Trigger transform jika koin diklik (Contoh trigger)
      if (!isTransforming) startTransform();

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const id = nextId;
      setNextId((n) => n + 1);
      
      const randomRotate = Math.random() * 40 - 20;
      const randomTranslateX = Math.random() * 60 - 30;
      
      if (!needsAd) {
        setFloaters((prev) => [
          ...prev,
          { id, x, y, rotate: randomRotate, translateX: randomTranslateX }
        ]);
        setTimeout(() => {
          setFloaters((prev) => prev.filter((f) => f.id !== id));
        }, 800);
      }
      
      onCoin(pointsPerClick);
    },
    [nextId, onCoin, locked, pointsPerClick, needsAd, isTransforming]
  );

  return (
    <div className={`relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none ${showFinalShake ? 'animate-bounce' : ''}`}>
      
      {/* Particle Golden Effect */}
      <AnimatePresence>
        {isTransforming && particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0, x: Math.cos(p.angle) * 200, y: Math.sin(p.angle) * 200 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.5, 0.5, 0],
              x: 0,
              y: 0,
              rotate: 360
            }}
            transition={{ duration: 3, delay: p.delay, repeat: Infinity }}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full z-50 shadow-[0_0_10px_#ffd700]"
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x, rotate: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,
              y: f.y - 140,
              x: f.x + f.translateX,
              rotate: f.rotate
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-3xl text-yellow-400 z-50 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        onMouseDown={() => !locked && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onClick={handleClick}
        animate={
          showFinalShake ? { x: [-10, 10, -10, 10, 0], y: [-5, 5, -5, 5, 0] } :
          shake ? { x: [-6, 6, -6, 6, 0] } : 
          isTransforming ? { scale: [1, 1.3, 1], rotate: 360 } :
          isPressed ? { scale: 0.94 } : { scale: 1 }
        }
        transition={isTransforming ? { duration: 5, ease: "easeInOut" } : { type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
      >
        {/* Ambient glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={isTransforming ? { scale: [1, 2, 1], opacity: [0.5, 0.8, 0.5] } : {}}
          style={{
            background: locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* Orbit Ring (Muter & Melar) */}
        <motion.div
          animate={{ rotate: isTransforming ? 1080 : 360, scale: isTransforming ? 1.5 : 1 }}
          transition={{ duration: isTransforming ? 5 : 6, repeat: isTransforming ? 0 : Infinity, ease: "linear" }}
          className="absolute w-[210px] h-[210px] rounded-full"
          style={{
            border: "2px solid transparent",
            background: "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        {/* THE MAIN COIN BODY (Melar) */}
        <motion.div
          animate={isTransforming ? { scale: 1.2, rotate: -360 } : !locked ? { y: [0, -6, 0] } : {}}
          transition={{ duration: 5 }}
          className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7)",
          }}
        >
          <div className="absolute inset-2 rounded-full" style={{ background: "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" }} />

          {/* INNER MEDALLION (Berubah Ungu) */}
          <motion.div
            animate={isTransforming ? { 
                background: "radial-gradient(circle at 35% 30%, #E0B0FF 0%, #800080 60%, #4B0082 100%)",
                boxShadow: "inset 0 4px 10px rgba(255,200,255,0.6), 0 0 20px rgba(128,0,128,0.8)"
            } : {}}
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-colors duration-[5000ms]"
            style={{
              background: locked ? "#333" : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              border: "2px solid rgba(120,70,10,0.55)",
            }}
          >
            <span
              className="font-black text-[68px] leading-none select-none transition-colors duration-[5000ms]"
              style={{ color: isTransforming ? "#E0B0FF" : locked ? "#555" : "#7A4A08" }}
            >
              {locked ? "🔒" : "Z"}
            </span>
          </motion.div>
        </motion.div>
      </motion.button>

      {needsAd && !locked && (
        <motion.div 
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-4 px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase"
        >
          <span>OVERCLOCK TIME</span>
        </motion.div>
      )}
    </div>
  );
}