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
  angle: number;
  distance: number;
  size: number;
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

  // 🌟 State Animasi Khusus 5 Detik
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [finalImpact, setFinalImpact] = useState(false);
  
  // Ref untuk menahan status visual agar tidak berubah mendadak
  const [visualMode, setVisualMode] = useState({ locked, needsAd });

  // Update visualMode hanya ketika animasi TIDAK sedang berjalan
  useEffect(() => {
    if (!isAnimating) {
      setVisualMode({ locked, needsAd });
    }
  }, [locked, needsAd, isAnimating]);

  const triggerEpicAnimation = () => {
    setIsAnimating(true);
    
    // Buat 30 partikel emas untuk efek blackhole
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      angle: Math.random() * 360,
      distance: 150 + Math.random() * 100,
      size: 2 + Math.random() * 4
    }));
    setParticles(newParticles);

    // Timeline 5 Detik
    setTimeout(() => {
      setFinalImpact(true); // Guncangan akhir (Heboh)
      setTimeout(() => {
        setFinalImpact(false);
        setIsAnimating(false);
        setParticles([]);
      }, 300); // Durasi hentakan akhir
    }, 4700);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      if (isAnimating) return; // Kunci klik saat sedang heboh

      triggerEpicAnimation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = nextId;
      setNextId((n) => n + 1);

      if (!needsAd) {
        setFloaters((prev) => [
          ...prev,
          { id, x, y, rotate: Math.random() * 40 - 20, translateX: Math.random() * 60 - 30 }
        ]);
        setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 800);
      }
      
      onCoin(pointsPerClick);
    },
    [nextId, onCoin, locked, pointsPerClick, needsAd, isAnimating]
  );

  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      
      {/* 🌌 GOLDEN BLACKHOLE PARTICLES (Tersedot ke tengah koin) */}
      <AnimatePresence>
        {isAnimating && particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              opacity: 0, 
              x: Math.cos(p.angle * (Math.PI / 180)) * p.distance, 
              y: Math.sin(p.angle * (Math.PI / 180)) * p.distance,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 1, 0], 
              x: 0, 
              y: 0, 
              scale: [0, 1.5, 0] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "circIn" 
            }}
            className="absolute rounded-full bg-yellow-400 z-50 shadow-[0_0_10px_#ffd700]"
            style={{ width: p.size, height: p.size }}
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
          finalImpact ? { scale: [1.2, 0.9, 1], rotate: [0, 5, -5, 0] } :
          shake ? { x: [-6, 6, -6, 6, 0] } : 
          isAnimating ? { scale: [1, 1.05, 1] } :
          isPressed ? { scale: 0.94 } : { scale: 1 }
        }
        transition={finalImpact ? { duration: 0.3 } : isAnimating ? { duration: 0.5, repeat: Infinity } : { type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${visualMode.locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
      >
        
        {/* ===== Ambient Aura (Luxury Glow) ===== */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={isAnimating ? { 
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.8, 0.3],
            boxShadow: ["0 0 20px #E89A12", "0 0 60px #FFD24A", "0 0 20px #E89A12"]
          } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            background: visualMode.locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : visualMode.needsAd
              ? "radial-gradient(circle, rgba(200,200,200,0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255,200,60,0.55) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* Orbit Ring (Spinning Luxury) */}
        <motion.div
          animate={{ rotate: isAnimating ? 3600 : 360 }}
          transition={{ duration: isAnimating ? 5 : 6, repeat: isAnimating ? 0 : Infinity, ease: isAnimating ? "easeIn" : "linear" }}
          className="absolute w-[210px] h-[210px] rounded-full"
          style={{
            border: "2px solid transparent",
            background: visualMode.locked 
              ? "conic-gradient(from 0deg, transparent, rgba(255,0,0,0.5), transparent)"
              : "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        {/* ===== MODEL KOIN ASLI (DIAM/VIBRATE) ===== */}
        <motion.div
          className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden"
          animate={isAnimating ? { x: [-1, 1, -1, 1, 0], y: [-1, 1, -1, 1, 0] } : !visualMode.locked ? { y: [0, -6, 0] } : {}}
          transition={isAnimating ? { duration: 0.1, repeat: Infinity } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: visualMode.locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : visualMode.needsAd
              ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)"
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: visualMode.locked
              ? "0 12px 30px rgba(0,0,0,0.55)"
              : visualMode.needsAd
              ? "0 12px 30px rgba(0,0,0,0.55), 0 0 35px rgba(255,255,255,0.25), inset 0 -8px 18px rgba(39,39,42,0.6), inset 0 6px 14px rgba(255,255,255,0.4)"
              : "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7), inset 0 -8px 18px rgba(120,60,0,0.55), inset 0 6px 14px rgba(255,255,255,0.55)",
          }}
        >
          {/* Rim ticks */}
          <div className="absolute inset-2 rounded-full opacity-50" style={{ 
            background: visualMode.needsAd ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)" : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          {/* Inner medallion */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center"
            style={{
              background: visualMode.locked ? "#333" : visualMode.needsAd ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)" : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              boxShadow: visualMode.needsAd ? "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)" : "inset 0 4px 10px rgba(255,255,200,0.6), inset 0 -6px 12px rgba(80,40,0,0.6)",
              border: visualMode.needsAd ? "2px solid rgba(113,113,122,0.55)" : "2px solid rgba(120,70,10,0.55)",
            }}
          >
            {visualMode.needsAd && !visualMode.locked ? (
              <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
            ) : (
              <span className="font-black text-[68px] leading-none select-none" style={{ color: visualMode.locked ? "#555" : "#7A4A08", textShadow: visualMode.locked ? "none" : "0 2px 0 rgba(255,240,180,0.7)" }}>
                {visualMode.locked ? "🔒" : "Z"}
              </span>
            )}
          </div>

          {/* Specular highlight */}
          {!visualMode.locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}

          {/* 🌟 Luxury Shimmer Effect saat Animasi */}
          {isAnimating && (
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
            />
          )}
        </motion.div>
      </motion.button>

      {/* 🌟 Footer Status */}
      {visualMode.needsAd && !visualMode.locked && (
        <motion.div 
          animate={isAnimating ? { opacity: [1, 0, 1], color: "#ffd700" } : { opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: isAnimating ? 0.2 : 2, repeat: Infinity }}
          className="absolute bottom-4 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black tracking-[0.3em] uppercase"
          style={{ color: isAnimating ? "#ffd700" : "#a1a1aa" }}
        >
          <span>{isAnimating ? "CONCENTRATING GOLD..." : "OVERCLOCK TIME"}</span>
        </motion.div>
      )}
    </div>
  );
}