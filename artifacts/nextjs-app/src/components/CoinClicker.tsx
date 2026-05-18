"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  rotate: number;
  translateX: number;
}

interface CoinClickerProps {
  onCoin: () => void;
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
  const [shake, setShake] = useState(false);

  // STATE MEKANIK EXTRACTION CORE 5 DETIK
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Kunci klik jika animasi ekstraksi data 5 detik sedang berjalan
      if (isExtracting) return;
      
      // JIKA YANG DI-TAP ADALAH KOIN EMAS (Bukan mode butuh iklan & canEarnPoints aktif)
      if (!needsAd && !locked) {
        setIsExtracting(true);

        // MASUK DETIK KE-5: Hentikan putaran + Hantaman Screen Shake + Cairkan Poin!
        setTimeout(() => {
          setIsExtracting(false);
          setIsScreenShaking(true);

          // Pemicu angka melayang jackpot (+100 ZP) tepat di tengah koin setelah 5 detik ditahan
          const rect = e.currentTarget.getBoundingClientRect();
          const x = rect.width / 2;
          const y = rect.height / 2;
          const id = Date.now();

          setFloaters((prev) => [
            ...prev,
            { id, x, y, rotate: Math.random() * 40 - 20, translateX: Math.random() * 60 - 30 }
          ]);
          
          setTimeout(() => {
            setFloaters((prev) => prev.filter((f) => f.id !== id));
          }, 800);

          // Efek guncangan layar hantaman terakhir berjalan selama 0.3 detik (300ms) baru stop total
          setTimeout(() => setIsScreenShaking(false), 300);

          // CAIRCAN REWARD MUTLAK KE DATABASE KITA COK!
          onCoin();
        }, 5000);

        return;
      }
      
      // Jika mode koin silver butuh iklan, bypass langsung ke page utama buat buka modal iklan
      onCoin();
    },
    [locked, isExtracting, needsAd, onCoin]
  );
  
  return (
    <div 
      className={`relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none transition-transform duration-75 ${
        isScreenShaking ? "animate-[hantamanShake_0.3s_ease-in-out_infinite]" : ""
      }`}
    >
      <style>{`
        @keyframes stripMelarMuter {
          0% { transform: scale(1) rotate(0deg); }
          8% { transform: scale(1.22) rotate(45deg); }
          100% { transform: scale(1.22) rotate(1800deg); }
        }
        @keyframes partikelSedot {
          0% { transform: translate(var(--sX, 0), var(--sY, 0)) scale(1); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(0, 0) scale(0.1); opacity: 0; }
        }
        @keyframes plasmaMengalir {
          0% { background-position: 0% 50%; transform: scale(1) rotate(0deg); }
          50% { background-position: 100% 50%; transform: scale(1.15) rotate(180deg); }
          100% { background-position: 0% 50%; transform: scale(1) rotate(360deg); }
        }
        @keyframes hantamanShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-5px, 3px) rotate(-1deg); }
          40% { transform: translate(4px, -3px) rotate(1deg); }
          60% { transform: translate(-3px, -2px) rotate(-0.5deg); }
          80% { transform: translate(3px, 2px) rotate(0.5deg); }
        }
      `}</style>
      
      {/* 🌟 Floating Points Effect */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x, rotate: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 1.8,            
              y: f.y - 140,          
              x: f.x + f.translateX, 
              rotate: f.rotate       
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-4xl text-yellow-400 z-50 drop-shadow-[0_0_15px_rgba(255,215,0,1)]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* 🌌 MAGNET PARTIKEL DIGITAL EMAS */}
      {isExtracting && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          {[...Array(16)].map((_, i) => {
            const angle = (i * 360) / 16;
            const distance = 135; 
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            return (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#FFF]"
                style={{
                  "--sX": `${x}px`,
                  "--sY": `${y}px`,
                  animation: `partikelSedot 0.8s linear infinite`,
                  animationDelay: `${(i % 4) * 0.2}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Button pembungkus utama */}
      <motion.button
        onMouseDown={() => !locked && !isExtracting && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && !isExtracting && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={shake ? { x: [-6, 6, -6, 6, 0] } : isPressed ? { scale: 0.94 } : { scale: 1 }}
        whileTap={{ scale: (locked || isExtracting) ? 1 : 0.94 }} 
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* ===== LAYER 1: Ambient glow ===== */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : needsAd
              ? "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)"
              : isExtracting
              ? "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.55) 0%, rgba(234,179,8,0.3) 45%, transparent 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        {!locked && (
          <>
            <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-5 top-8 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">🧩</motion.div>
            <motion.div animate={{ y: [0, 6, 0], rotate: [10, -4, 10] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-5 top-12 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">🎲</motion.div>
            <motion.div animate={{ y: [0, 5, 0], rotate: [-6, 10, -6] }} transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-3 bottom-10 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">💸</motion.div>
            <motion.div animate={{ y: [0, -5, 0], rotate: [6, -10, 6] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-3 bottom-8 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]">🪙</motion.div>
          </>
        )}

        {/* ===== LAYER 2: Rotating orbit ring ===== */}
        <motion.div
          animate={isExtracting ? { rotate: 2160 } : { rotate: 360 }}
          transition={isExtracting ? { duration: 5, ease: "easeInOut" } : { duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute w-[210px] h-[210px] rounded-full"
          style={{
            border: "2px solid transparent",
            background: locked 
              ? "conic-gradient(from 0deg, transparent, rgba(255,0,0,0.5), transparent)"
              : needsAd
              ? "conic-gradient(from 0deg, rgba(200,200,200,0) 0deg, rgba(255,255,255,0.6) 60deg, rgba(200,200,200,0) 120deg, rgba(255,255,255,0.4) 220deg, rgba(200,200,200,0) 360deg)"
              : "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />

        {/* ===== LAYER 3: THE MAIN COIN ===== */}
        <motion.div
          className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : needsAd
              ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)" 
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: locked
              ? "0 12px 30px rgba(0,0,0,0.55)"
              : needsAd
              ? "0 12px 30px rgba(0,0,0,0.55), 0 0 35px rgba(255,255,255,0.25), inset 0 -8px 18px rgba(39,39,42,0.6), inset 0 6px 14px rgba(255,255,255,0.4)" 
              : "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7), inset 0 -8px 18px rgba(120,60,0,0.55), inset 0 6px 14px rgba(255,255,255,0.55)",
          }}
          animate={(!locked && !isExtracting) ? { y: [0, -6, 0] } : {}}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
        >
          {/* ===== LAYER 4: Outer rim ticks ===== */}
          <div 
            className="absolute inset-2 rounded-full transition-transform" 
            style={{ 
              background: needsAd 
                ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
                : isExtracting
                ? "repeating-conic-gradient(#a855f7 0deg 4deg, transparent 4deg 10deg)" 
                : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))",
              animation: isExtracting ? "stripMelarMuter 5s cubic-bezier(0.1, 0.8, 0.2, 1) infinite" : "none"
            }} 
          />

          {/* ===== LAYER 5: Inner medallion ===== */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: locked 
                ? "#333" 
                : needsAd 
                ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)"
                : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              boxShadow: needsAd
                ? "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)"
                : "inset 0 4px 10px rgba(255,255,200,0.6), inset 0 -6px 12px rgba(80,40,0,0.6)",
              border: needsAd
                ? "2px solid rgba(113,113,122,0.55)"
                : "2px solid rgba(120,70,10,0.55)",
            }}
          >
            {!locked && !needsAd && (
              <div 
                className="absolute inset-2 transition-transform duration-500 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 shadow-inner"
                style={{ 
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  transform: isExtracting ? "rotate(180deg) scale(1.05)" : "rotate(0deg) scale(1)"
                }}
              />
            )}

            {!locked && !needsAd && (
              <div 
                className="absolute inset-2 opacity-80 mix-blend-color-dodge transition-opacity duration-300"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundImage: "linear-gradient(45deg, #7c3aed, #ea580c, #9333ea, #f97316)",
                  backgroundSize: "300% 300%",
                  animation: isExtracting ? "plasmaMengalir 2.5s ease infinite" : "plasmaMengalir 6s ease infinite"
                }}
              />
            )}

            {needsAd && !locked ? (
              <Timer size={52} className="text-zinc-800 relative z-10 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
            ) : (
              <div className="relative w-16 h-16 flex items-center justify-center z-10">
                <svg 
                  viewBox="0 0 24 24" 
                  className={`w-full h-full transition-all duration-500 ${
                    isExtracting ? "text-white drop-shadow-[0_0_15px_#FFF]" : "text-amber-950"
                  }`}
                  style={{
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.8",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }}
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            )}
          </div>

          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </motion.div>
      </motion.button>

      {needsAd && !locked && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase"
        >
          <span>OVERCLOCK TIME</span>
        </motion.div>
      )}

      {isExtracting && (
        <div className="absolute bottom-4 bg-purple-500/10 border border-purple-500/30 px-4 py-1.5 rounded-xl animate-pulse">
          <p className="text-[9px] font-black tracking-[0.22em] text-purple-400 uppercase">
            ⚡ CORE EXTRACTING: IN PROGRESS...
          </p>
        </div>
      )}
    </div>
  );
}