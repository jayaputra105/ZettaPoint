"use client";

import { useState } from "react";
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
  
  const handleClick = (e: React.MouseEvent < HTMLButtonElement > ) => {
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
  };
  
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      
      <style>{`
        @keyframes plasmaStatis {
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

        {/* Hiasan Luar */}
        {!locked && (
          <>
            <div className="absolute -left-4 top-8 text-3xl animate-[bounce_3.2s_infinite]">🧩</div>
            <div className="absolute -right-4 top-14 text-3xl animate-[bounce_3.6s_infinite]">🎲</div>
            <div className="absolute -left-2 bottom-12 text-3xl animate-[bounce_4.0s_infinite]">💸</div>
            <div className="absolute -right-2 bottom-10 text-3xl animate-[bounce_2.8s_infinite]">🪙</div>
          </>
        )}

        {/* ===== LAYER 2: Rotating orbit ring ===== */}
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

        {/* ===== LAYER 3 & 4: THE MAIN COIN BODY WITH TICKS ===== */}
        <div
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
        >
          {/* Ticks Pinggiran Koin Bawaan */}
          <div className="absolute inset-2 rounded-full" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          {/* =============================================================== */}
          {/* 📦 JALUR PENYUSUNAN LAYER STATIS BARU (DI DALAM BODY 180PX) */}
          {/* =============================================================== */}
          
          {/* 🛑 1. HEXAGON EMAS DOMINAN (Lebar memotong area dalam koin) */}
          {!locked && !needsAd && (
            <div 
              className="absolute w-[140px] h-[140px] bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-800 shadow-md"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            />
          )}

          {/* 🛑 2. PLASMA CAIR UNGU + ORANYE ACAK (Nesting pas di atas Hexagon) */}
          {!locked && !needsAd && (
            <div 
              className="absolute w-[134px] h-[134px] opacity-90 mix-blend-color-dodge"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                backgroundImage: "linear-gradient(45deg, #7c3aed, #ea580c, #6b21a8, #f97316)",
                backgroundSize: "200% 200%",
                animation: "plasmaStatis 4s ease infinite"
              }}
            />
          )}

          {/* 🛑 3. CENTER DISC EMAS BULAT (Sempurna di Tengah-tengah Plasma) */}
          {!locked && !needsAd && (
            <div 
              className="absolute w-[86px] h-[86px] rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-[0_4px_8px_rgba(0,0,0,0.4),_inset_0_2px_4px_rgba(255,255,255,0.5)] border border-amber-600/30"
            />
          )}

          {/* 🛑 4. LOGO CORE CORE (Z HITAM + MANIPULASI GARIS DOLAR SENTRAL) */}
          <div className="absolute w-[120px] h-[120px] flex items-center justify-center">
            {needsAd && !locked ? (
              <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                
                {/* Garis Dolar Atas (Presisi Center) */}
                {!locked && !needsAd && (
                  <div className="absolute top-[26px] w-[5px] h-[12px] bg-black rounded-sm z-30" />
                )}

                <span
                  className="font-black text-[68px] leading-none select-none z-20"
                  style={{
                    color: locked ? "#555" : "#000000",
                    textShadow: locked ? "none" : "0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  {locked ? "🔒" : "Z"}
                </span>

                {/* Garis Dolar Bawah (Presisi Center) */}
                {!locked && !needsAd && (
                  <div className="absolute bottom-[26px] w-[5px] h-[12px] bg-black rounded-sm z-30" />
                )}
              </div>
            )}
          </div>

          {/* Specular highlight koin */}
          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </div>
      </motion.button>
    </div>
  );
}