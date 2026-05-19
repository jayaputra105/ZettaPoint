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
  
  // State Animasi Matrix Spin Up
  const [isTransforming, setIsTransforming] = useState(false);
  const [finalShake, setFinalShake] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const triggerTransform = () => {
    setIsTransforming(true);
    // Generate Partikel Emas
    const newParticles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      angle: Math.random() * 360,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);

    // Durasi 5 detik total
    setTimeout(() => {
      setFinalShake(true); // Efek shake keras di akhir
      setTimeout(() => {
        setFinalShake(false);
        setIsTransforming(false);
        setParticles([]);
      }, 200); // 0.2s shake
    }, 4800);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      // Trigger animasi matrix hanya jika tidak sedang loading/ads
      if (!isTransforming && !needsAd) {
        triggerTransform();
      }

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
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      
      {/* 🌟 GOLDEN PARTICLES - Tersedot ke tengah */}
      <AnimatePresence>
        {isTransforming && particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, scale: 0, x: Math.cos(p.angle) * 250, y: Math.sin(p.angle) * 250 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 0.8, 0],
              x: 0,
              y: 0,
            }}
            transition={{ duration: 2, delay: p.delay, repeat: Infinity, ease: "circIn" }}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full z-[60] shadow-[0_0_15px_#ffd700]"
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x, rotate: 0 }}
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
          finalShake ? { x: [-12, 12, -12, 12, 0], y: [-6, 6, -6, 6, 0] } :
          shake ? { x: [-6, 6, -6, 6, 0] } : 
          isPressed ? { scale: 0.94 } : { scale: 1 }
        }
        transition={finalShake ? { duration: 0.2 } : { type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
      >
        
        {/* ===== LAYER DI BAWAH (DIAM) ===== */}
        <div className="absolute inset-0 rounded-full" style={{
            background: locked ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)" : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(8px)",
        }} />

        {/* MAIN COIN BODY (DIAM) */}
        <div className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden" style={{
            background: locked ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)" : needsAd ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)" : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7)",
        }}>
            
            {/* INNER MEDALLION (DIAM, BERUBAH UNGU DI AKHIR) */}
            <motion.div
                className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center z-20"
                animate={isTransforming ? { 
                    background: "radial-gradient(circle at 35% 30%, #E0B0FF 0%, #800080 60%, #4B0082 100%)",
                    boxShadow: "inset 0 4px 10px rgba(255,200,255,0.6), 0 0 30px rgba(128,0,128,0.8)"
                } : {}}
                transition={{ duration: 5 }}
                style={{
                    background: locked ? "#333" : needsAd ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)" : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
                    border: "2px solid rgba(120,70,10,0.55)",
                }}
            >
                {needsAd && !locked ? (
                    <Timer size={52} className={isTransforming ? "text-purple-200" : "text-zinc-800"} />
                ) : (
                    <span className="font-black text-[68px]" style={{ color: isTransforming ? "#E0B0FF" : locked ? "#555" : "#7A4A08" }}>
                        {locked ? "🔒" : "Z"}
                    </span>
                )}
            </motion.div>

            {/* ===== LAYER DI ATAS INNER MEDALLION (MUTER KENCENG + MELAR) ===== */}
            
            {/* Outer Rim Ticks */}
            <motion.div 
                animate={isTransforming ? { rotate: 2160, scale: 1.5 } : {}}
                transition={{ duration: 5, ease: "easeInOut" }}
                className="absolute inset-2 rounded-full z-30"
                style={{ 
                    background: "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
                    WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
                }} 
            />

            {/* Specular Highlight */}
            {!locked && (
                <motion.div 
                    animate={isTransforming ? { rotate: -1080, scale: 2, x: [0, 50, 0] } : {}}
                    transition={{ duration: 5 }}
                    className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none z-40" 
                    style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} 
                />
            )}
        </div>

        {/* Orbit Ring (DI LUAR BODY, MUTER SUPER KENCENG) */}
        <motion.div
          animate={isTransforming ? { rotate: 3600, scale: 2 } : { rotate: 360 }}
          transition={isTransforming ? { duration: 5, ease: "circIn" } : { duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute w-[210px] h-[210px] rounded-full z-50"
          style={{
            border: "2px solid transparent",
            background: "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        {/* Floating side props */}
        {!locked && (
          <>
            <motion.div animate={isTransforming ? { rotate: 1080, scale: 3, x: -100 } : { y: [0, -6, 0] }} transition={{ duration: isTransforming ? 5 : 3.2 }} className="absolute -left-2 top-10 text-3xl z-50">🧩</motion.div>
            <motion.div animate={isTransforming ? { rotate: -1080, scale: 3, x: 100 } : { y: [0, 6, 0] }} transition={{ duration: isTransforming ? 5 : 3.6 }} className="absolute -right-2 top-16 text-3xl z-50">🧩</motion.div>
          </>
        )}
      </motion.button>

      {/* Indikator Status */}
      {needsAd && !locked && (
        <motion.div 
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-4 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase"
        >
          <span>OVERCLOCK TIME</span>
        </motion.div>
      )}
    </div>
  );
}