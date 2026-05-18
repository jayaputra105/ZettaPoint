"use client";

import { useState, useCallback, useRef } from "react";
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

  // ⚡ STATE LOGIC BARU UNTUK PROSESI 5 DETIK (ANTI-LAG)
  const [isSpinning5s, setIsSpinning5s] = useState(false);
  const [isScreenShaking, setIsScreenShaking] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // KUNCI UTAMA: Jika koin sedang berputar memproses daya 5 detik, gembok klik!
      if (isSpinning5s) return;

      // JIKA YANG DI-KLIK ADALAH KOIN EMAS (Bukan mode butuh iklan & bukan locked)
      if (!needsAd && !locked) {
        setIsSpinning5s(true);

        // Detik ke-5: Hantaman ledakan core + guncangan layar + cairkan ZP!
        setTimeout(() => {
          setIsSpinning5s(false);
          setIsScreenShaking(true);

          // Pemicu efek angka melayang pas detik ke-5
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

          // Efek guncangan layar berhenti setelah 0.2 detik (200ms)
          setTimeout(() => setIsScreenShaking(false), 200);

          // EKSEKUSI MUTLAK: Cairkan koin ZP lu ke saldo atas!
          onCoin(pointsPerClick);
        }, 5000);

        return;
      }

      // Ini fallback behavior jika dipanggil di luar kondisi di atas (misal mode silver iklan)
      onCoin(pointsPerClick);
    },
    [locked, isSpinning5s, needsAd, pointsPerClick, onCoin]
  );

  return (
    <div 
      className={`relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none transition-transform duration-75 ${
        isScreenShaking ? "animate-[shake_0.2s_ease-in-out_infinite]" : ""
      }`}
    >
      {/* SUNTIKAN INJEKSI PURE CSS KEYFRAMES (RAHASIA ZERO-LAG HP AYANG COK!) */}
      <style>{`
        @keyframes spinFast {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1440deg); }
        }
        @keyframes suckIn {
          0% { transform: translate(var(--tw-x, 0), var(--tw-y, 0)) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate(0, 0) scale(0.2); opacity: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -1px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 1px); }
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
              y: f.y - 160,          
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

      {/* 🌌 EFREK PUSARAN KOMPONEN DI DETIK 0-4 (Hanya aktif pas koin emas diputar) */}
      {isSpinning5s && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          {[...Array(16)].map((_, i) => {
            const angle = (i * 360) / 16;
            const radius = 140; // jarak komponen mulai terbang menyedot
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-sm shadow-[0_0_8px_#FFD700]"
                style={{
                  "--tw-x": `${x}px`,
                  "--tw-y": `${y}px`,
                  animation: `suckIn 1s linear infinite`,
                  animationDelay: `${(i % 4) * 0.25}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Button pembungkus utama */}
      <motion.button
        onMouseDown={() => !locked && !isSpinning5s && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && !isSpinning5s && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={shake ? { x: [-6, 6, -6, 6, 0] } : isPressed ? { scale: 0.94 } : { scale: 1 }}
        whileTap={{ scale: (locked || isSpinning5s) ? 1 : 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[280px] h-[280px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* ===== Ambient glow ===== */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            background: locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : needsAd
              ? "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)"
              : isSpinning5s
              ? "radial-gradient(circle at 50% 50%, rgba(147,51,234,0.6) 0%, rgba(255,140,0,0.4) 40%, transparent 70%)" // Aura Ungu-Oranye pas kesedot
              : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        {/* ===== Floating side props 🧩 ===== */}
        {!locked && !isSpinning5s && (
          <>
            <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-2 top-10 text-3xl">🧩</motion.div>
            <motion.div animate={{ y: [0, 6, 0], rotate: [10, -4, 10] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-2 top-16 text-3xl">🧩</motion.div>
          </>
        )}

        {/* Rotating orbit ring (STRIP LUAR YANG MELAR PAS DIKLIK) */}
        <div
          className="absolute rounded-full transition-all"
          style={{
            // Pas diputar 5 detik, diameter strip melar dari 210px ke 250px!
            width: isSpinning5s ? "250px" : "210px",
            height: isSpinning5s ? "250px" : "210px",
            border: "2px solid transparent",
            background: locked 
              ? "conic-gradient(from 0deg, transparent, rgba(255,0,0,0.5), transparent)"
              : needsAd
              ? "conic-gradient(from 0deg, rgba(200,200,200,0) 0deg, rgba(255,255,255,0.6) 60deg, rgba(200,200,200,0) 120deg, rgba(255,255,255,0.4) 220deg, rgba(200,200,200,0) 360deg)"
              : "conic-gradient(from 0deg, rgba(255,215,0,0) 0deg, rgba(255,215,0,0.9) 60deg, rgba(255,215,0,0) 120deg, rgba(255,215,0,0.6) 220deg, rgba(255,215,0,0) 360deg)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))",
            animation: isSpinning5s ? "spinFast 5s cubic-bezier(0.25, 1, 0.20, 1) infinite" : "spinFast 12s linear infinite",
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
          animate={(!locked && !isSpinning5s) ? { y: [0, -6, 0] } : {}}
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

          {/* Inner medallion (TEMPAT BUNDARAN UNGU PLASMA + SEGI 6 NESTING) */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: locked 
                ? "#333" 
                : needsAd 
                ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)"
                : isSpinning5s
                ? "radial-gradient(circle, #3b0764 0%, #1e1b4b 70%, #030712 100%)" // Bundaran Ungu Plasma fiksi ilmiah pas di-klik
                : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              boxShadow: needsAd
                ? "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)"
                : isSpinning5s
                ? "0 0 25px rgba(168,85,247,0.6), inset 0 0 15px rgba(234,179,8,0.3)"
                : "inset 0 4px 10px rgba(255,255,200,0.6), inset 0 -6px 12px rgba(80,40,0,0.6)",
              border: needsAd
                ? "2px solid rgba(113,113,122,0.55)"
                : isSpinning5s
                ? "2px solid #a855f7" // Border ungu menyala pas spin
                : "2px solid rgba(120,70,10,0.55)",
            }}
          >
            {/* 🟢 LAPISAN BINGKAI SEGI 6 (HEXAGON OVERCLOCK) */}
            {!locked && !needsAd && (
              <div 
                className={`absolute inset-1 transition-all duration-500 opacity-40 border-2 border-yellow-500/40 ${isSpinning5s ? "scale-110 rotate-180 opacity-100 border-purple-400" : ""}`}
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              />
            )}

            {needsAd && !locked ? (
              <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
            ) : (
              // 🌟 LOGO Z PREMIUN GAYA DOLAR DIGITAL (SUNTIKAN GARIS VERTIKAL TENGAH)
              <div className="relative flex items-center justify-center">
                {/* Garis vertikal tengah ala lambang dolar premium */}
                {!locked && (
                  <div 
                    className="absolute w-[6px] h-[72px] rounded-sm transition-all duration-500" 
                    style={{
                      background: isSpinning5s 
                        ? "linear-gradient(to bottom, #c084fc, #eab308)" 
                        : "linear-gradient(to bottom, #8A5A0E, #7A4A08)",
                      boxShadow: isSpinning5s ? "0 0 12px #c084fc" : "none"
                    }}
                  />
                )}
                <span
                  className="font-black text-[68px] leading-none select-none z-10 transition-colors duration-500"
                  style={{
                    color: locked ? "#555" : isSpinning5s ? "#FFF" : "#7A4A08",
                    textShadow: locked ? "none" : isSpinning5s ? "0 0 15px #eab308" : "0 2px 0 rgba(255,240,180,0.7)",
                  }}
                >
                  {locked ? "🔒" : "Z"}
                </span>
              </div>
            )}
          </div>

          {/* Specular highlight */}
          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </motion.div>
      </motion.button>

      {/* 🌟 TEKS SUBTITLE DESIGN */}
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

      {/* INDIKATOR TEKS PAS DATA SPINNING ACTIVE */}
      {isSpinning5s && (
        <div className="absolute bottom-4 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1 rounded-xl animate-pulse">
          <p className="text-[9px] font-black tracking-[0.2em] text-yellow-400 uppercase">
            ⚡ EXTRACTING CORE MATRIX DATA...
          </p>
        </div>
      )}
    </div>
  );
}