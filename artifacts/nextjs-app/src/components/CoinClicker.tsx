"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingText {
  id: number;
  x: number;
  y: number;
}

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick ? : number;
  locked ? : boolean;
  needsAd ? : boolean;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
}: CoinClickerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [floaters, setFloaters] = useState < FloatingText[] > ([]);
  const [nextId, setNextId] = useState(0);
  const [shake, setShake] = useState(false);
  
  const handleClick = useCallback(
    (e: React.MouseEvent < HTMLButtonElement > ) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const id = nextId;
      setNextId((n) => n + 1);
      
      // Munculin angka melayang (+100)
      const offsetX = (Math.random() - 0.5) * 40;
      setFloaters((prev) => [...prev, { id, x: x + offsetX, y }]);
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 950);
      
      onCoin(pointsPerClick);
    },
    [nextId, onCoin, locked, pointsPerClick]
  );
  
  return (
    <div className="relative mx-auto flex items-center justify-center w-full h-[350px] max-w-[400px] select-none">
      
      {/* Floating Points Effect */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, y: f.y - 20, x: f.x }}
            animate={{ opacity: 0, y: f.y - 120 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none font-black text-3xl text-yellow-400 z-50 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        onMouseDown={() => !locked && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={
          shake
            ? { x: [-6, 6, -6, 6, 0] }
            : { scale: isPressed ? 0.92 : 1 }
        }
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none transition-all duration-150 ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* ===== Ambient glow ===== */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* ===== Floating side props 🧩 ===== */}
        {!locked && (
          <>
            <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }} transition={{ duration: 3.2, repeat: Infinity }} className="absolute -left-2 top-10 text-3xl">🧩</motion.div>
            <motion.div animate={{ y: [0, 6, 0], rotate: [10, -4, 10] }} transition={{ duration: 3.6, repeat: Infinity }} className="absolute -right-2 top-16 text-3xl">🧩</motion.div>
          </>
        )}

        {/* Rotating orbit ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute w-[210px] h-[210px] rounded-full"
          style={{
            border: "2px solid transparent",
            background: locked 
              ? "conic-gradient(from 0deg, transparent, rgba(255,0,0,0.5), transparent)"
              : "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        {/* ===== THE MAIN COIN ===== */}
        <motion.div
          className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7), inset 0 -8px 18px rgba(120,60,0,0.55), inset 0 6px 14px rgba(255,255,220,0.55)",
          }}
          animate={!locked ? { y: [0, -6, 0] } : {}}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Outer rim ticks */}
          <div className="absolute inset-2 rounded-full" style={{ background: "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" }} />

          {/* Inner medallion */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center"
            style={{
              background: locked ? "#333" : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              boxShadow: "inset 0 4px 10px rgba(255,255,200,0.6), inset 0 -6px 12px rgba(80,40,0,0.6)",
              border: "2px solid rgba(120,70,10,0.55)",
            }}
          >
            <span
              className="font-black text-[68px] leading-none select-none"
              style={{
                color: locked ? "#555" : "#7A4A08",
                textShadow: locked ? "none" : "0 2px 0 rgba(255,240,180,0.7)",
              }}
            >
              {locked ? "🔒" : needsAd ? "🎬" : "Z"}
            </span>
          </div>

          {/* Specular highlight */}
          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </motion.div>
      </motion.button>
    </div>
  );
}