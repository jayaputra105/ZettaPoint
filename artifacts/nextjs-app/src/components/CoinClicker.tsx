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
  onCoin: () => void; // Disesuaikan murni memicu fungsi trigger utama di page.tsx
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
  const [shake, setShake] = useState(false);
  
  // ⚡ MEKANIK UTAMA REAKTOR OVERCLOCK 5 DETIK
  const [isExtracting, setIsExtracting] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  
  const handleClick = useCallback(
    (e: React.MouseEvent < HTMLButtonElement > ) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      // Jika reaktor lagi muter mengekstrak energi, kunci klik biar gak spamming
      if (isExtracting) return;
      
      // JIKA KOIN EMAS (Bisa klaim poin / canEarnPoints)
      if (!needsAd && !locked) {
        setIsExtracting(true);
        
        // PROSES PENAHANAN REAKTOR ROTASI 5 DETIK
        setTimeout(() => {
          // Matikan status ekstraksi BIAR STATE LOCK/AD SELANJUTNYA BISA JALAN LANGSUNG!
          setIsExtracting(false);
          setIsScreenShaking(true);
          
          // Efek angka melayang jackpot (+100) pas meledak di detik ke-5
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
          
          // Guncangan layar hantaman terakhir jalan 0.3 detik lalu stop total
          setTimeout(() => setIsScreenShaking(false), 300);
          
          // PANGGIL REWARD LU COK! Saldo nambah, alur lanjut ke mode coin berikutnya!
          onCoin();
        }, 5000);
        
        return;
      }
      
      // JIKA KOIN SILVER (Butuh nonton iklan), langsung tembak instan tanpa animasi 5 detik
      onCoin();
    },
    [locked, isExtracting, needsAd, onCoin]
  );
  
  return (
    <div 
      className={`relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none ${
        isScreenShaking ? "animate-[hantamanShake_0.3s_ease-in-out_infinite]" : ""
      }`}
    >
      {/* 🌌 INJEKSI ENGINE CSS UNTUK ROTASI KELOMPOK BADAN KOIN (BUKAN LOGO) */}
      <style>{`
        @keyframes reaktorMelarMuter {
          0% { transform: scale(1) rotate(0deg); }
          10% { transform: scale(1.15) rotate(45deg); }
          100% { transform: scale(1.15) rotate(1800deg); }
        }
        @keyframes hantamanShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-6px, 4px) rotate(-1deg); }
          40% { transform: translate(5px, -4px) rotate(1deg); }
          60% { transform: translate(-4px, -2px) rotate(-0.5deg); }
          80% { transform: translate(4px, 3px) rotate(0.5deg); }
        }
      `}</style>
      
      {/* Efek Angka Melayang */}
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

      {/* BUTTON PEMBUNGKUS UTAMA */}
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
        
        {/* =============================================================== */}
        {/* 📦 GRUP REAKTOR (LAYER 1 - LAYER 4): MELAR & MUTER KENCENG PAS DIKLIK */}
        {/* =============================================================== */}
        <div 
          className="absolute inset-0 flex items-center justify-center w-full h-full"
          style={{
            animation: isExtracting ? "reaktorMelarMuter 5s cubic-bezier(0.1, 0.8, 0.2, 1) infinite" : "none"
          }}
        >
          {/* ===== LAYER 1: Ambient glow ===== */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background: locked 
                ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
                : needsAd
                ? "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)"
                : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
              filter: "blur(8px)",
            }}
          />

          {/* ===== LAYER 2: Rotating orbit ring bawaan ===== */}
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
            {/* ===== LAYER 4: Outer rim ticks / Strip Garis Edge ===== */}
            <div className="absolute inset-2 rounded-full" style={{ 
              background: needsAd 
                ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
                : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
              WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
            }} />

            {/* Cincang background Medallion Kosong sebagai alas */}
            <div
              className="w-[120px] h-[120px] rounded-full"
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
            />

            {/* Specular highlight koin */}
            {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
          </div>
        </div>

        {/* =============================================================== */}
        {/* 🟢 LAYER 5 (Paling Depan / Core): LOGO TETAP DIEM DI TENGAH (STATIS GAK IKUT MUTER) */}
        {/* =============================================================== */}
        <div className="absolute w-[120px] h-[120px] rounded-full flex items-center justify-center pointer-events-none z-20">
          {needsAd && !locked ? (
            <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)] animate-pulse" />
          ) : (
            <span
              className="font-black text-[68px] leading-none select-none transition-transform"
              style={{
                color: locked ? "#555" : "#7A4A08",
                textShadow: locked ? "none" : "0 2px 0 rgba(255,240,180,0.7)",
                transform: isPressed ? "scale(0.95)" : "scale(1)"
              }}
            >
              {locked ? "🔒" : "Z"}
            </span>
          )}
        </div>

        {/* Props Hiasan Melayang Sisi Luar Bawaan */}
        {!locked && (
          <>
            <div className="absolute -left-2 top-10 text-3xl animate-[bounce_3.2s_infinite]">🧩</div>
            <div className="absolute -right-2 top-16 text-3xl animate-[bounce_3.6s_infinite]">🧩</div>
          </>
        )}
      </motion.button>

      {/* Subtitle Status Pengisian Energi */}
      {isExtracting && (
        <div className="absolute bottom-4 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 rounded-xl animate-pulse">
          <p className="text-[9px] font-black tracking-[0.25em] text-yellow-500 uppercase">
            ⚡ CHARGING ENERGY CORES...
          </p>
        </div>
      )}
    </div>
  );
}