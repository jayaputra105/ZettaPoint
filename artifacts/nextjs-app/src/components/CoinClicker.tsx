"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react"; 
import CosmicCoin from "./CosmicCoin"; // 🚀 Import komponen animasi kosmik baru

interface FloatingText {
  id: number;
  x: number;
  y: number;
  rotate: number;
  translateX: number;
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
  
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
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
      
      // 🌟 RACIKAN RAHASIA: Acak arah belokan (X) dan kemiringan putaran (Rotate)
      const randomRotate = Math.random() * 40 - 20; // Miring acak -20deg sampai 20deg
      const randomTranslateX = Math.random() * 60 - 30; // Melosor acak ke kiri/kanan -30px sampai 30px
      
      // Munculin angka melayang (+100) jika bukan mode nonton iklan
      if (!needsAd) {
        setFloaters((prev) => [
          ...prev,
          { id, x, y, rotate: randomRotate, translateX: randomTranslateX }
        ]);
        setTimeout(() => {
          setFloaters((prev) => prev.filter((f) => f.id !== id));
        }, 800);
      }
      
      // Mengirim data ZP ke database/state utama lu
      onCoin(pointsPerClick);
    },
    [nextId, onCoin, locked, pointsPerClick, needsAd]
  );
  
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      
      {/* 🌟 Floating Points Effect (Dinamis & Juicy) */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x, rotate: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,            // Membesar pas melayang biar puas liat koinnya
              y: f.y - 140,          // Terbang meluncur tinggi
              x: f.x + f.translateX, // Melosor acak ke samping kiri/kanan
              rotate: f.rotate       // Berputar miring acak
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-3xl text-yellow-400 z-50 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      {/* 🌌 SEKUENSIONAL WRAPPER: CosmicCoin memegang kontrol timeline sebelum fungsi handleClick dieksekusi */}
      <CosmicCoin onClick={handleClick} locked={locked} needsAd={needsAd}>
        
        {/* Material bodi koin ORI lu seutuhnya dipindahkan ke dalam div motion */}
        <motion.div
          onMouseDown={() => !locked && setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => !locked && setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          animate={shake ? { x: [-6, 6, -6, 6, 0] } : isPressed ? { scale: 0.94 } : { scale: 1 }}
          whileTap={{ scale: locked ? 1 : 0.94 }} // Efek membal empuk pas ditekan beneran
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* ===== Ambient glow ===== */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: locked 
                ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
                : needsAd
                ? "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)"
                : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
              filter: "blur(8px)",
            }}
          />

          {/* ===== Floating side props 🧩 ===== */}
          {!locked && (
            <>
              <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-2 top-10 text-3xl">🧩</motion.div>
              <motion.div animate={{ y: [0, 6, 0], rotate: [10, -4, 10] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-2 top-16 text-3xl">🧩</motion.div>
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
                : needsAd
                ? "conic-gradient(from 0deg, rgba(200,200,200,0) 0deg, rgba(255,255,255,0.6) 60deg, rgba(200,200,200,0) 120deg, rgba(255,255,255,0.4) 220deg, rgba(200,200,200,0) 360deg)"
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
                : needsAd
                ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)" 
                : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
              boxShadow: locked
                ? "0 12px 30px rgba(0,0,0,0.55)"
                : needsAd
                ? "0 12px 30px rgba(0,0,0,0.55), 0 0 35px rgba(255,255,255,0.25), inset 0 -8px 18px rgba(39,39,42,0.6), inset 0 6px 14px rgba(255,255,255,0.4)" 
                : "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7), inset 0 -8px 18px rgba(120,60,0,0.55), inset 0 6px 14px rgba(255,255,255,0.55)",
            }}
            animate={!locked && !isPressed ? { y: [0, -6, 0] } : {}}
            transition={{ 
              y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {/* Outer rim ticks */}
            <div className="absolute inset-2 rounded-full" style={{ 
              background: needsAd 
                ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
                : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
            }} />

            {/* Inner medallion */}
            <div
              className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center"
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
              {needsAd && !locked ? (
                <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
              ) : (
                <span
                  className="font-black text-[68px] leading-none select-none"
                  style={{
                    color: locked ? "#555" : "#7A4A08",
                    textShadow: locked ? "none" : "0 2px 0 rgba(255,240,180,0.7)",
                  }}
                >
                  {locked ? "🔒" : "Z"}
                </span>
              )}
            </div>

            {/* Specular highlight */}
            {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
          </motion.div>
        </motion.div>
      </CosmicCoin>

      {/* 🌟 TEKS SUBTITLE DESIGN: Indikator Status Tambahan di Bawah Koin */}
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
    </div>
  );
}