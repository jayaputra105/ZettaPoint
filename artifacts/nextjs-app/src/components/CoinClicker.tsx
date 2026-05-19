"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
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

  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visualState, setVisualState] = useState({ locked, needsAd });
  const [animationStage, setAnimationStage] = useState(0);

  useEffect(() => {
    if (!isAnimating) {
      setVisualState({ locked, needsAd });
    }
  }, [locked, needsAd, isAnimating]);

  const generateParticles = () => {
    const colors = ['#FFD700', '#800080', '#4B0082', '#E6E6FA'];
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
      speed: 1 + Math.random() * 3
    }));
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (visualState.locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (isAnimating) return;

      setIsAnimating(true);
      setAnimationStage(1);
      setParticles(generateParticles());
      onCoin(pointsPerClick);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = nextId;
      setNextId((n) => n + 1);

      if (!visualState.needsAd) {
        setFloaters((prev) => [
          ...prev,
          { id, x, y, rotate: Math.random() * 40 - 20, translateX: Math.random() * 60 - 30 }
        ]);
        setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 800);
      }

      setTimeout(() => setAnimationStage(2), 3000);
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationStage(0);
        setParticles([]);
      }, 6000);
    },
    [nextId, onCoin, visualState, isAnimating, pointsPerClick]
  );

  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 1, 
              x: p.x, 
              y: p.y, 
              scale: 0,
              backgroundColor: p.color
            }}
            animate={{ 
              x: 0, 
              y: 0, 
              scale: [0, 1, 0],
              opacity: [1, 0.7, 0],
              rotate: 360
            }}
            transition={{ 
              duration: 3, 
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "circIn"
            }}
            style={{ 
              width: p.size, 
              height: p.size, 
              borderRadius: '50%',
              position: 'absolute'
            }}
            className="absolute z-50"
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x }}
            animate={{ opacity: 0, scale: 1.5, y: f.y - 140, x: f.x + f.translateX, rotate: f.rotate }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-3xl text-yellow-400 z-50 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        animate={
          shake ? { x: [-6, 6, -6, 6, 0] } : 
          isAnimating ? {
            scale: animationStage === 1 ? [1, 1.2, 0.9, 1.1, 1] : 
                   animationStage === 2 ? [1, 1.3, 0.7, 1] : 1,
            rotateX: isAnimating ? [0, 20, -20, 0] : 0,
            rotateY: isAnimating ? [0, 30, -30, 0] : 0
          } :
          isPressed ? { scale: 0.94 } : { scale: 1 }
        }
        transition={{ 
          type: isAnimating ? "tween" : "spring", 
          duration: isAnimating ? 6 : undefined,
          stiffness: 400, 
          damping: 15 
        }}
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${visualState.locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={isAnimating ? { 
            scale: [1, 1.5, 1],
            background: [
              "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(128,0,128,0.4) 0%, transparent 70%)",
              "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)"
            ]
          } : {}}
          transition={{ duration: 6, repeat: isAnimating ? 1 : 0 }}
          style={{
            background: visualState.locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : visualState.needsAd
              ? "radial-gradient(circle, rgba(200,200,200,0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,200,60,0.55) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        <motion.div
          animate={{ rotate: isAnimating ? 3600 : 360 }}
          transition={{ duration: isAnimating ? 6 : 8, repeat: isAnimating ? 0 : Infinity, ease: "linear" }}
          className="absolute w-[210px] h-[210px] rounded-full"
          style={{
            border: "2px solid transparent",
            background: visualState.locked 
              ? "conic-gradient(from 0deg, transparent, rgba(255,0,0,0.5), transparent)"
              : "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        <motion.div
          className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden"
          animate={isAnimating ? {
            scale: [1, 1.2, 0.9, 1],
            background: [
              `radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)`,
              `radial-gradient(circle at 35% 30%, #E0B0FF 0%, #800080 60%, #4B0082 100%)`,
              `radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)`
            ]
          } : !visualState.locked ? { y: [0, -6, 0] } : {}}
          transition={{ duration: 6 }}
          style={{
            background: visualState.locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : visualState.needsAd
              ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)"
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: isAnimating 
              ? "0 0 50px rgba(128,0,128,0.7)" 
              : visualState.locked
              ? "0 12px 30px rgba(0,0,0,0.55)"
              : visualState.needsAd
              ? "0 12px 30px rgba(0,0,0,0.55), 0 0 35px rgba(255,255,255,0.25)"
              : "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7)",
          }}
        >
          <div className="absolute inset-2 rounded-full" style={{ 
            background: visualState.needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center"
            style={{
              background: visualState.locked ? "#333" : visualState.needsAd ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)" : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              boxShadow: "inset 0 4px 10px rgba(0,0,0,0.2)",
            }}
          >
            {visualState.needsAd && !visualState.locked ? (
              <Timer size={52} className="text-zinc-800" />
            ) : (
              <span
                className="font-black text-[68px] leading-none select-none"
                style={{
                  color: visualState.locked ? "#555" : "#7A4A08",
                  textShadow: visualState.locked ? "none" : "0 2px 0 rgba(255,240,180,0.7)",
                }}
              >
                {visualState.locked ? "🔒" : "Z"}
              </span>
            )}
          </div>

          {!visualState.locked && (
            <div 
              className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" 
              style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} 
            />
          )}
        </motion.div>
      </motion.button>

      {isAnimating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-4 text-[10px] font-mono text-purple-500 tracking-widest"
        >
          COSMIC ENERGY EXTRACTION...
        </motion.div>
      )}
    </div>
  );
}