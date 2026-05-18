"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";

export default function CoinClicker({ onCoin, pointsPerClick = 100, locked = false, needsAd = false }: any) {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      
      <style>{`
        @keyframes plasmaMengalir {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <button
        onClick={() => onCoin(pointsPerClick)}
        className="relative w-[260px] h-[260px] flex items-center justify-center outline-none"
      >
        {/* ===== Ambient glow ===== */}
        <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,200,60,0.55) 0%, transparent 70%)", filter: "blur(8px)" }} />

        {/* ===== Orbit Ring ===== */}
        <div className="absolute w-[210px] h-[210px] rounded-full animate-[spin_6s_linear_infinite]" style={{ background: "conic-gradient(from 0deg, transparent, rgba(255,215,0,0.9), transparent)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))" }} />

        {/* ===== BODY KOIN EMAS UTAMA ===== */}
        <div className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden" style={{ background: "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)", boxShadow: "0 12px 30px rgba(0,0,0,0.55)" }}>
          
          {/* Ticks Pinggiran */}
          <div className="absolute inset-2 rounded-full z-10" style={{ background: "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" }} />

          {/* 🛡️ A. HEXAGON FRAME EMAS TEBAL (Bypass Merdeka) */}
          <div 
            className="absolute w-[122px] h-[122px] bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-800 flex items-center justify-center z-20"
            style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
          >
            <div className="w-[114px] h-[114px] bg-gradient-to-br from-amber-300 to-amber-900" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
          </div>

          {/* 🌌 B. PURPLE PLASMA CORE (Bypass Merdeka) */}
          <div 
            className="absolute w-[106px] h-[106px] z-20"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              backgroundImage: "linear-gradient(135deg, #581c87, #ea580c, #7c3aed, #f97316)",
              backgroundSize: "200% 200%",
              animation: "plasmaMengalir 4s ease infinite",
            }}
          />

          {/* 🟡 C. CENTER DISC EMAS BULAT (Bypass Merdeka) */}
          <div className="absolute w-[58px] h-[58px] rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 border border-amber-600/50 shadow-[0_3px_6px_rgba(0,0,0,0.45)] z-20" />

          {/* 🎯 D. HURUF Z HITAM CORE (Paling Depan) */}
          <div className="relative w-[120px] h-[120px] flex items-center justify-center z-30">
            <span className="font-black text-[38px] text-black drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
              Z
            </span>
          </div>

        </div>
      </button>
    </div>
  );
}