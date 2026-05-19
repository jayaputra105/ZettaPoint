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

interface MatrixParticle {
  id: number;
  angle: number;     // Sudut awal partikel
  distance: number;  // Jarak lontaran terjauh saat melar keluar
  size: number;
}

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
  onAdRequired?: () => void; // Callback opsional buat ngasih tahu parent kalau butuh iklan
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
  onAdRequired,
}: CoinClickerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const [shake, setShake] = useState(false);

  // 🧪 STATE KHUSUS SPIN MATRIX (ANTI-TABRAK)
  const [isMatrixSpinning, setIsMatrixSpinning] = useState(false);
  const [shouldTriggerCoreShake, setShouldTriggerCoreShake] = useState(false);
  const [matrixParticles, setMatrixParticles] = useState<MatrixParticle[]>([]);

  // Generator partikel untuk efek Matrix Absorption
  const generateMatrixAbsorptionParticles = useCallback(() => {
    const pCount = 30; // Jumlah partikel energi
    const temporaryParticles: MatrixParticle[] = [];
    for (let i = 0; i < pCount; i++) {
      temporaryParticles.push({
        id: Date.now() + i + Math.random(),
        angle: Math.random() * Math.PI * 2, // Sudut acak 360 derajat
        distance: Math.random() * 60 + 90,   // Jarak jangkauan melar keluar (90px - 150px)
        size: Math.random() * 4 + 3,         // Ukuran partikel acak
      });
    }
    setMatrixParticles(temporaryParticles);
  }, []);

  // Fungsi Utama Pengendali Timeline Animasi 5 Detik
  const executeMatrixChargeSequence = useCallback(() => {
    setIsMatrixSpinning(true);
    generateMatrixAbsorptionParticles();

    // Detik 4.8: Hentikan putaran & mulai guncangan dahsyat koin (0.2 detik terakhir)
    const shakeTimeout = setTimeout(() => {
      setShouldTriggerCoreShake(true);
    }, 4800);

    // Detik 5.0: Selesai, tambah ZP, bersihkan state, paksa ke mode iklan
    const finalTimeout = setTimeout(() => {
      onCoin(pointsPerClick);
      setIsMatrixSpinning(false);
      setShouldTriggerCoreShake(false);
      setMatrixParticles([]);
      
      // Pemicu otomatis agar koin masuk status needsAd ke parent component
      if (onAdRequired) {
        onAdRequired();
      }
    }, 5000);

    return () => {
      clearTimeout(shakeTimeout);
      clearTimeout(finalTimeout);
    };
  }, [pointsPerClick, onCoin, generateMatrixAbsorptionParticles, onAdRequired]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Kalau locked, atau needsAd, atau LAGI ANIMASI, klik di-block!
      if (locked || isMatrixSpinning || needsAd) {
        if (locked && !isMatrixSpinning) {
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
        return;
      }

      // Efek angka melayang bawaan lu
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

      // Jalankan ritual spin matrix 5 detik tanpa timer gantung
      executeMatrixChargeSequence();
    },
    [locked, needsAd, isMatrixSpinning, executeMatrixChargeSequence]
  );

  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      {/* ANGKA MELAYANG */}
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

      {/* PARTIKEL MATRIX ABSORPTION */}
      {isMatrixSpinning && matrixParticles.map((p) => {
        // Hitung koordinat polar menjauh
        const targetX = Math.cos(p.angle) * p.distance;
        const targetY = Math.sin(p.angle) * p.distance;

        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-purple-400 z-30 drop-shadow-[0_0_8px_rgba(192,132,252,1)]"
            style={{
              width: p.size,
              height: p.size,
              top: "50%",
              left: "50%",
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              // TIMELINE: 1. Melar menjauh -> 2. Muter & Menyusut kesedot ke pusat (0,0)
              x: [0, targetX, targetX * 0.5, 0],
              y: [0, targetY, targetY * 0.5, 0],
              scale: [0, 2.5, 1.2, 0], 
              opacity: [0, 1, 0.9, 0],
              rotate: [0, 120, 360, 720],
            }}
            transition={{
              duration: 4.8, // Habis tepat sebelum fase shake core koin
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* TOMBOL UTAMA KOIN */}
      <motion.button
        onMouseDown={() => !locked && !needsAd && !isMatrixSpinning && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && !needsAd && !isMatrixSpinning && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={
          shouldTriggerCoreShake 
            ? { x: [-10, 10, -8, 8, -5, 5, 0], y: [-6, 6, -4, 4, 0] } // Guncangan brutal 0.2s terakhir
            : shake 
            ? { x: [-6, 6, -6, 6, 0] } 
            : isPressed 
            ? { scale: 0.94 } 
            : { scale: 1 }
        }
        whileTap={{ scale: (locked || needsAd || isMatrixSpinning) ? 1 : 0.94 }}
        transition={
          shouldTriggerCoreShake 
            ? { duration: 0.2, ease: "linear" } 
            : { type: "spring", stiffness: 400, damping: 15 }
        }
        className={`relative w-[280px] h-[280px] flex items-center justify-center outline-none ${
          locked ? "opacity-60 grayscale" : "opacity-100"
        } ${isMatrixSpinning ? "cursor-wait" : ""}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* Aura Cahaya Belakang */}
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

        {/* Aksesoris Puzzle Kiri-Kanan */}
        {!locked && !needsAd && (
          <>
            <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-2 top-10 text-3xl">🧩</motion.div>
            <motion.div animate={{ y: [0, 6, 0], rotate: [10, -4, 10] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-2 top-16 text-3xl">🧩</motion.div>
          </>
        )}

        {/* BINGKAI LUAR EMAS BULAT */}
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
          animate={!locked && !needsAd && !isMatrixSpinning ? { y: [0, -6, 0] } : {}}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
        >
          <div className="absolute inset-2 rounded-full" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          {/* INNER MEDALLION (LAYER 1) */}
          <motion.div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: locked
                ? "#333"
                : needsAd
                ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)"
                : "radial-gradient(circle at 35% 30%, #2a1805 0%, #1a1204 100%)",

              boxShadow: needsAd
                ? "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)"
                : "inset 0 4px 10px rgba(255,220,120,.15), inset 0 -6px 12px rgba(0,0,0,.55)",

              border: needsAd
                ? "2px solid rgba(113,113,122,0.55)"
                : "2px solid rgba(120,70,10,0.55)",
            }}
            // LAYER 1 MUTER CEPAT SAAT MATRIX SPINNING (0 -> 4.8 Detik)
            animate={isMatrixSpinning && !shouldTriggerCoreShake ? { rotate: 2160 } : { rotate: 0 }}
            transition={{ duration: 4.8, ease: "cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            {/* MODE NORMAL SAJA */}
            {!locked && !needsAd ? (
              <>
                {/* 🟢 LAYER 2. HEXAGON FRAME (Diputer 90deg - Lancip Atas Bawah) */}
                <div
                  className="absolute w-[110px] h-[110px]"
                  style={{
                    zIndex: 10,
                    transform: "rotate(90deg)",
                    clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
                    background: "linear-gradient(145deg,#fff0a8,#f7c53b,#a85c00)",
                    boxShadow: "0 0 12px rgba(255,190,50,.6), inset 0 0 10px rgba(255,255,255,.4)"
                  }}
                >
                  <div
                    className="absolute inset-[8px]"
                    style={{
                      clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
                      background: "radial-gradient(circle, #2a1805 0%, #1a1204 100%)",
                      boxShadow: "inset 0 0 10px rgba(0,0,0,.8)"
                    }}
                  />
                </div>

                {/* 🟣 LAYER 3. PURPLE PLASMA (BULAT TEXTURE - DI ATAS HEXAGON) */}
                <motion.div
                  animate={{
                    rotate: isMatrixSpinning ? -1440 : 360,
                    scale: isMatrixSpinning ? [1, 1.15, 0.95, 1] : [1, 1.06, 1],
                    opacity: [0.9, 1, 0.9]
                  }}
                  transition={{
                    rotate: { duration: isMatrixSpinning ? 4.8 : 15, repeat: isMatrixSpinning ? 0 : Infinity, ease: "linear" },
                    scale: { duration: isMatrixSpinning ? 4.8 : 3, repeat: isMatrixSpinning ? 0 : Infinity, ease: "easeInOut" },
                    opacity: { duration: 2, repeat: Infinity }
                  }}
                  className="absolute w-[86px] h-[86px] rounded-full"
                  style={{
                    zIndex: 20,
                    background: `
                      radial-gradient(circle at 30% 30%, rgba(230,150,255,1) 0%, rgba(160,0,255,0.85) 30%, transparent 70%),
                      radial-gradient(circle at 70% 60%, rgba(100,0,255,0.9) 0%, rgba(40,0,120,0.95) 50%, rgba(10,0,20,1) 100%)
                    `,
                    backgroundBlendMode: "screen",
                    filter: "blur(3px)",
                    boxShadow: "0 0 20px rgba(180,60,255,0.85), inset 0 0 15px rgba(255,255,255,0.4)"
                  }}
                />

                {/* 🟡 LAYER 5. LOGO Z (Paling Permukaan) */}
                <span
                  className="absolute font-black text-[68px] leading-none select-none"
                  style={{
                    zIndex: 40,
                    color: "#7A4A08",
                    textShadow: "0 2px 0 rgba(255,240,180,.7)"
                  }}
                >
                  Z
                </span>
              </>
            ) : needsAd && !locked ? (
              <Timer
                size={52}
                className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]"
              />
            ) : (
              <span
                className="font-black text-[68px]"
                style={{ color: "#555" }}
              >
                🔒
              </span>
            )}
          </motion.div>

          {/* Efek Kilau Glossy */}
          {!locked && !needsAd && (
            <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}