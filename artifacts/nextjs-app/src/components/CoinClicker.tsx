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

// 🛡️ INTERFACE SUDAH DISINKRONKAN TOTAL DENGAN PAGE.TSX LU COK!
interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick ? : number;
  locked ? : boolean;
  needsAd ? : boolean;
  isAdVerified ? : boolean; // <--- TypeScript dijamin adem ayem ngeliat ini
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
  isAdVerified = false, // Default value aman
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
    [nextId, onCoin, locked, pointsPerClick, needsAd]
  );
  
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      
      <style>{`
        @keyframes plasmaMengalir {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Floating Points Effect */}
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

      {/* Button pembungkus utama */}
      <motion.button
        onMouseDown={() => !locked && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={shake ? { x: [-6, 6, -6, 6, 0] } : isPressed ? { scale: 0.94 } : { scale: 1 }}
        whileTap={{ scale: locked ? 1 : 0.94 }} 
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[260px] h-[260px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* ===== LAYER 1: Ambient glow ===== */}
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

        {/* Hiasan Luar Melayang */}
        {!locked && (
          <>
            <div className="absolute -left-4 top-8 text-3xl animate-[bounce_3.2s_infinite]">🧩</div>
            <div className="absolute -right-4 top-14 text-3xl animate-[bounce_3.6s_infinite]">🎲</div>
            <div className="absolute -left-2 bottom-12 text-3xl animate-[bounce_4.0s_infinite]">💸</div>
            <div className="absolute -right-2 bottom-10 text-3xl animate-[bounce_2.8s_infinite]">🪙</div>
          </>
        )}

        {/* ===== LAYER 2: Rotating orbit ring bawaan asli lu ===== */}
        <div
          className="absolute w-[210px] h-[210px] rounded-full animate-[spin_6s_linear_infinite]"
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

        {/* ===== LAYER 3: THE MAIN COIN BODY ===== */}
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
          animate={!locked ? { y: [0, -6, 0] } : {}}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
        >
          {/* ===== LAYER 4: Outer rim ticks asli bawaan lu ===== */}
          <div className="absolute inset-2 rounded-full z-10" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          {/* ===== LAYER 5: INNER MEDALLION CORE ASLI (DUDUK DI Z-INDEX 20) ===== */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center z-20"
            style={{
              background: locked 
                ? "#333" 
                : needsAd 
                ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)"
                : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)", 
              boxShadow: "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)",
              border: needsAd ? "2px solid rgba(113,113,122,0.55)" : "2px solid rgba(120,70,10,0.55)",
            }}
          >
            {needsAd && !locked ? (
              <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
            ) : locked ? (
              <span className="font-black text-[68px] leading-none select-none text-[#555]">🔒</span>
            ) : (
              "" // String kosong biar huruf Z emas polosan lama lu gak numpuk
            )}
          </div>

          {/* =============================================================== */}
          {/* 🔥 SEKSI UTAMA REAKTOR BARU LU (NUMPUK DI ATAS MEDALLION - Z-INDEX 40!) */}
          {/* =============================================================== */}
          {!locked && !needsAd && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
              
              {/* 🛡️ A. HEXAGON FRAME EMAS TEBAL */}
              <div 
                className="absolute w-[122px] h-[122px] bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-800 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.4)]"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              >
                <div 
                  className="w-[114px] h-[114px] bg-gradient-to-br from-amber-300 to-amber-900" 
                  style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                />
              </div>

              {/* 🌌 B. PURPLE PLASMA CORE MATRIX */}
              <div 
                className="absolute w-[106px] h-[106px]"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundImage: "linear-gradient(135deg, #581c87, #ea580c, #7c3aed, #f97316)",
                  backgroundSize: "200% 200%",
                  animation: "plasmaMengalir 4s ease infinite",
                  boxShadow: "inset 0 0 15px rgba(168,85,247,0.8)"
                }}
              />

              {/* 🟡 C. CENTER DISC EMAS BULAT */}
              <div 
                className="absolute w-[58px] h-[58px] rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 border border-amber-600/50 shadow-[0_3px_6px_rgba(0,0,0,0.45),_inset_0_2px_4px_rgba(255,255,255,0.6)]"
              />

              {/* 🎯 D. HURUF Z HITAM CORE SENTRAL */}
              <span className="absolute font-black text-[38px] leading-none select-none text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                Z
              </span>

            </div>
          )}

          {/* Specular highlight bawaan asli lu */}
          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none z-50" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </motion.div>
      </motion.button>
    </div>
  );
}