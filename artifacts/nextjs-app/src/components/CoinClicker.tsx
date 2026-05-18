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
  const [shake, setShake] = useState(false);

  // ⚡ STATE UTAMA PROSESI CORE EXTRACTION 5 DETIK
  const [isExtracting, setIsExtracting] = useState(false);
  const [triggerShake, setTriggerShake] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Gembok klik kalau animasi sedang berjalan
      if (isExtracting) return;

      // JIKA EMAS DAN BISA DI-KLAIM (canEarnPoints & isAdVerified)
      if (!needsAd && !locked) {
        setIsExtracting(true);

        // DETIK KE-5: Prosesi Selesai!
        setTimeout(() => {
          setIsExtracting(false);
          setTriggerShake(true);

          // Pemicu efek angka melayang pas meledak di detik ke-5
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

          // Hentikan shake setelah 200ms
          setTimeout(() => setTriggerShake(false), 200);

          // Eksekusi penambahan poin setelah 5 detik penahanan sah!
          onCoin(pointsPerClick);
        }, 5000);

        return;
      }

      // Jika koin mode butuh iklan, langsung tembak biar modal iklan keluar
      onCoin(pointsPerClick);
    },
    [locked, isExtracting, needsAd, pointsPerClick, onCoin]
  );

  return (
    <div 
      className={`relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none transition-transform duration-75 ${
        triggerShake ? "animate-[screenGoyang_0.2s_ease-in-out_infinite]" : ""
      }`}
    >
      {/* INJEKSI KEYFRAMES RING MELAR DAN PARTIKEL (ZERO-LAG GPU ACCELERATED) */}
      <style>{`
        @keyframes ringMelarMuter {
          0% { transform: scale(1) rotate(0deg); stroke-dasharray: 8 12; stroke-width: 3; }
          15% { transform: scale(1.22) rotate(180deg); stroke-dasharray: 100 0; stroke-width: 4; }
          100% { transform: scale(1.22) rotate(1800deg); stroke-dasharray: 100 0; stroke-width: 4; }
        }
        @keyframes partikelMasuk {
          0% { transform: translate(var(--pX, 0), var(--pY, 0)) scale(1); opacity: 0; }
          20% { opacity: 0.9; }
          100% { transform: translate(0, 0) scale(0.1); opacity: 0; }
        }
        @keyframes screenGoyang {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-4px, 3px); }
          50% { transform: translate(4px, -2px); }
          75% { transform: translate(-2px, -3px); }
        }
      `}</style>

      {/* 🌟 Efek Angka Melayang (+100) */}
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x, rotate: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 1.8,            
              y: f.y - 150,          
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

      {/* 🌌 EFREK PUSARAN PARTIKEL EMAS MASUK KE CORE (Detik 0-4) */}
      {isExtracting && (
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
          {[...Array(16)].map((_, i) => {
            const angle = (i * 360) / 16;
            const radius = 135; 
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#FFF]"
                style={{
                  "--pX": `${x}px`,
                  "--pY": `${y}px`,
                  animation: `partikelMasuk 0.9s linear infinite`,
                  animationDelay: `${(i % 4) * 0.22}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Button utama pembungkus koin */}
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
        className={`relative w-[280px] h-[280px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* ===== Ambient Glow Belakang ===== */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700"
          style={{
            background: locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : needsAd
              ? "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)"
              : isExtracting
              ? "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.5) 0%, rgba(234,179,8,0.3) 40%, transparent 70%)" // Glow Ungu Plasma Pas Diekstrak
              : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(10px)",
          }}
        />

        {/* ===== HIASAN LUAR MELAYANG (🧩 🎲 💸 🪙) - Murni hiasan luar, gak ikut kesedot ===== */}
        {!locked && (
          <>
            <motion.div animate={{ y: [0, -8, 0], rotate: [-10, 5, -10] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-4 top-8 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">🧩</motion.div>
            <motion.div animate={{ y: [0, 8, 0], rotate: [12, -6, 12] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-4 top-14 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">🎲</motion.div>
            <motion.div animate={{ y: [0, 6, 0], rotate: [-5, 12, -5] }} transition={{ duration: 4.0, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-2 bottom-12 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">💸</motion.div>
            <motion.div animate={{ y: [0, -6, 0], rotate: [8, -12, 8] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-2 bottom-10 text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">🪙</motion.div>
          </>
        )}

        {/* ===== 🟢 STRIP-STRIP GARIS LUAR (MELAR & MENYATU JADI BUNDERAN UTUH PAS ANIMASI) ===== */}
        <div className="absolute w-[220px] h-[220px] flex items-center justify-center pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={
                locked 
                  ? "rgba(255,0,0,0.4)" 
                  : needsAd 
                  ? "rgba(200,200,200,0.5)" 
                  : isExtracting 
                  ? "#a855f7" // Berubah jadi warna ungu plasma pas nyatu muter
                  : "#fbbf24"
              }
              style={{
                transformOrigin: "center",
                animation: isExtracting 
                  ? "ringMelarMuter 5s cubic-bezier(0.1, 0.8, 0.1, 1) infinite" 
                  : "ringMelarMuter 15s linear infinite",
                transition: "stroke 0.4s ease-in-out",
              }}
            />
          </svg>
        </div>

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
              : "0 12px 30px rgba(0,0,0,0.55), 0 0 45px rgba(255,190,40,0.75), inset 0 -8px 18px rgba(120,60,0,0.55), inset 0 6px 14px rgba(255,255,255,0.55)",
          }}
          animate={(!locked && !isExtracting) ? { y: [0, -6, 0] } : {}}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
        >
          {/* Inner Medallion (TEMPAT BUNDARAN UNGU PLASMA + SEGI 6 NESTING) */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: locked 
                ? "#333" 
                : needsAd 
                ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)"
                : isExtracting
                ? "radial-gradient(circle, #2e1065 0%, #0f172a 80%, #020617 100%)" // Plasma ungu fiksi ilmiah pas di-klik
                : "radial-gradient(circle at 35% 30%, #FFE680 0%, #E8A317 60%, #8A5A0E 100%)",
              boxShadow: needsAd
                ? "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)"
                : isExtracting
                ? "0 0 30px rgba(168,85,247,0.7), inset 0 0 20px rgba(234,179,8,0.4)"
                : "inset 0 4px 10px rgba(255,255,200,0.6), inset 0 -6px 12px rgba(80,40,0,0.6)",
              border: needsAd
                ? "2px solid rgba(113,113,122,0.55)"
                : isExtracting
                ? "2px solid #c084fc"
                : "2px solid rgba(120,70,10,0.55)",
            }}
          >
            {/* 🔴 LAPISAN BINGKAI SEGI 6 (HEXAGON COIN) */}
            {!locked && !needsAd && (
              <div 
                className={`absolute inset-2 transition-all duration-500 border-2 ${
                  isExtracting 
                    ? "border-purple-400 opacity-100 rotate-90 scale-105" 
                    : "border-amber-600/60 opacity-70 rotate-0"
                }`}
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
              />
            )}

            {needsAd && !locked ? (
              <Timer size={52} className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]" />
            ) : (
              // 🌟 LOGO GABUNGAN S/Z GAYA BARU YANG SUPER SANGAR PREMIUM
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg 
                  viewBox="0 0 24 24" 
                  className={`w-full h-full transition-all duration-500 ${
                    isExtracting ? "text-white drop-shadow-[0_0_12px_#eab308]" : "text-amber-950"
                  }`}
                  style={{
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.5",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }}
                >
                  {/* Struktur lekukan S/Z menyatu futuristik */}
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            )}
          </div>

          {/* Specular highlight */}
          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </motion.div>
      </motion.button>
    </div>
  );
}