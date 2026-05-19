"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";

interface FloatingText {
  id: number;
  x: number;
  y: number;
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
  
  // State Animasi & Buffer Logic
  const [isAnimating, setIsAnimating] = useState(false);
  const [internalState, setInternalState] = useState({ locked, needsAd });
  const [shake, setShake] = useState(false);

  // Monitor perubahan props dari luar, tapi jangan langsung diupdate jika sedang animasi
  useEffect(() => {
    if (!isAnimating) {
      setInternalState({ locked, needsAd });
    }
  }, [locked, needsAd, isAnimating]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Jika koin terkunci (state internal), hanya goyang
      if (internalState.locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Jika sedang animasi, abaikan klik tambahan atau biarkan hanya onCoin saja
      if (isAnimating) return;

      // 1. MULAI ANIMASI 5 DETIK
      setIsAnimating(true);
      onCoin(pointsPerClick);

      // Munculin floater +100
      const rect = e.currentTarget.getBoundingClientRect();
      const id = nextId;
      setNextId(n => n + 1);
      setFloaters(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 800);

      // 2. SELESAI ANIMASI (5 Detik)
      setTimeout(() => {
        setIsAnimating(false);
        // Sinkronisasi dengan props terbaru dari parent setelah animasi selesai
        setInternalState({ locked, needsAd });
      }, 5000);
    },
    [internalState, isAnimating, nextId, onCoin, pointsPerClick, locked, needsAd]
  );

  return (
    <div className="relative mx-auto flex items-center justify-center w-full h-[450px] max-w-[400px] select-none" style={{ perspective: "1000px" }}>
      
      {/* 🌟 MATRIX DATA RAIN (Spin Up Effect) */}
      <AnimatePresence>
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 400, opacity: 0 }}
                animate={{ y: -100, opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1, ease: "linear" }}
                className="absolute text-[#00ff41] font-mono text-xs font-bold"
                style={{ left: `${(i * 7)}%` }}
              >
                {Math.random() > 0.5 ? "1" : "0"}<br/>{Math.random() > 0.5 ? "0" : "1"}<br/>1
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Text */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, y: f.y, x: f.x }}
            animate={{ opacity: 0, y: f.y - 150, scale: 2 }}
            className="absolute z-[60] font-black text-3xl text-yellow-400 drop-shadow-[0_0_10px_#ffd700]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseDown={() => !internalState.locked && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        animate={
          shake ? { x: [-10, 10, -10, 10, 0] } :
          isAnimating ? { 
            rotateX: [0, -25, 0], // Efek Spin Up ke arah belakang/atas
            scale: [1, 1.1, 1],
            y: [0, -20, 0] 
          } : 
          isPressed ? { scale: 0.94 } : { scale: 1 }
        }
        transition={isAnimating ? { duration: 0.5, repeat: 10 } : { type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[280px] h-[280px] flex items-center justify-center outline-none transition-all duration-500 ${internalState.locked ? 'grayscale opacity-50' : ''}`}
      >
        
        {/* BG GLOW (Makin terang saat animasi) */}
        <motion.div
          animate={isAnimating ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{
            background: internalState.locked ? "radial-gradient(circle, red, transparent)" : "radial-gradient(circle, rgba(0,255,65,0.4) 0%, transparent 70%)",
            filter: "blur(20px)"
          }}
        />

        {/* OUTER RING (Muter gila-gilaan) */}
        <motion.div
          animate={{ rotate: isAnimating ? 3600 : 360 }}
          transition={{ duration: isAnimating ? 5 : 10, ease: "linear", repeat: isAnimating ? 0 : Infinity }}
          className="absolute w-full h-full rounded-full border-[3px] border-dashed border-[#00ff41]/30"
          style={{ WebkitMask: "radial-gradient(circle, transparent 65%, black 66%)" }}
        />

        {/* THE COIN */}
        <motion.div
          className="relative w-[200px] h-[200px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: internalState.locked 
              ? "radial-gradient(circle at 30% 30%, #444, #111)" 
              : internalState.needsAd 
              ? "radial-gradient(circle at 30% 30%, #fff, #71717a, #27272a)" 
              : "radial-gradient(circle at 30% 30%, #FFF6C2, #E89A12, #7A4A08)",
            boxShadow: isAnimating ? "0 0 50px #00ff41" : "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {/* Inner Medallion */}
          <motion.div
            animate={isAnimating ? { 
              backgroundColor: ["rgba(232,163,23,1)", "rgba(0,255,65,1)", "rgba(168,85,247,1)"],
              scale: [1, 0.8, 1] 
            } : {}}
            transition={{ duration: 0.5, repeat: 10 }}
            className="w-[130px] h-[130px] rounded-full flex items-center justify-center border-2 border-black/20"
            style={{
              background: internalState.locked ? "#222" : internalState.needsAd ? "#FAFAFA" : "#FFE680",
              boxShadow: "inset 0 4px 10px rgba(0,0,0,0.3)"
            }}
          >
            {internalState.needsAd && !internalState.locked ? (
              <Timer size={60} className={isAnimating ? "text-white" : "text-zinc-800"} />
            ) : (
              <span className={`font-black text-7xl ${isAnimating ? 'text-white' : 'text-yellow-950/70'}`}>
                {internalState.locked ? "🔒" : "Z"}
              </span>
            )}
          </motion.div>

          {/* Shine effect yang muter pas animasi */}
          <motion.div 
            animate={isAnimating ? { rotate: 720 } : { rotate: 0 }}
            transition={{ duration: 5 }}
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none" 
          />
        </motion.div>

        {/* Side Props 🧩 */}
        {!internalState.locked && (
          <>
            <motion.div animate={isAnimating ? { y: -200, opacity: 0, rotate: 720 } : { y: [0, -10, 0] }} transition={{ duration: isAnimating ? 1 : 2, repeat: isAnimating ? 0 : Infinity }} className="absolute -left-4 top-0 text-4xl">🧩</motion.div>
            <motion.div animate={isAnimating ? { y: -200, opacity: 0, rotate: -720 } : { y: [0, 10, 0] }} transition={{ duration: isAnimating ? 1.2 : 2.5, repeat: isAnimating ? 0 : Infinity }} className="absolute -right-4 bottom-0 text-4xl">🧩</motion.div>
          </>
        )}
      </motion.button>

      {/* Overclock Label */}
      {isAnimating && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-2 font-mono text-[#00ff41] text-[10px] tracking-widest font-bold"
        >
          MATRIX_OVERCLOCKING_v2.0...
        </motion.div>
      )}
    </div>
  );
}