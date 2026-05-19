"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
  randomSpeed: number;
  randomRotateSpeed: number;
}

interface CosmicCoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  locked: boolean;
  needsAd: boolean;
  children: React.ReactNode;
}

type AnimationStage = "idle" | "impact" | "freeze" | "suction" | "overload" | "rebirth";

export default function CosmicCoin({ onClick, locked, needsAd, children }: CosmicCoinProps) {
  const [stage, setStage] = useState<AnimationStage>("idle");
  const [particles, setParticles] = useState<Particle[]>([]);

  const handleTriggerAnimasi = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Tetap bypass total jika mode ad atau locked aktif
    if (locked || needsAd) {
      onClick(e);
      return;
    }

    if (stage !== "idle") return;

    const savedEvent = { ...e };

    // 1. STAGE IMPACT: Guling vertikal 3D kedepan
    setStage("impact");

    // 2. STAGE FREEZE: Boom hancur, generate 75 partikel membeku di udara
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 75 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 150 + 60; // Sebaran badai pecahan emas
        return {
          id: i,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance - 40,
          // 🚀 PARTIKEL MERAYAP: Kecepatan sedot spiral diperlambat (2.5s sampai 3.5s)
          randomSpeed: Math.random() * 1.0 + 2.5, 
          randomRotateSpeed: Math.random() * 720 + 720,
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 1200); 

    // 3. STAGE SUCTION: Blackhole muncul, partikel kesedot spiral merayap lambat
    setTimeout(() => {
      setStage("suction");
    }, 2800); // Waktu koin membeku sengaja dibikin lama (1.6 detik)

    // 4. STAGE OVERLOAD: Partikel habis ketelan, blackhole diem nahan energi lalu bergetar gempa
    setTimeout(() => {
      setParticles([]); 
      setStage("overload");
    }, 6500); // Durasi sedotan disesuaikan menjadi 3.7 detik penuh agar partikel lambat selesai merayap

    // 5. STAGE REBIRTH: Muntah koin guling vertikal 3D balik posisi semula
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 8300); // Blackhole diem nahan energi + getar parah (1.8 detik)

    // 6. RESET TO IDLE
    setTimeout(() => {
      setStage("idle");
    }, 10300); // Total durasi bioskop premium sinematik kini mencapai 10.3 detik!
  };

  // 🪙 KONTROL ANIMASI 3D KOIN EMAS LU
  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateX: 0, transformPerspective: 1200 },
    impact: { 
      scale: [1, 0.82, 1.9],    
      opacity: [1, 1, 0],       
      rotateX: [0, -30, 1440],  
      transformPerspective: 1200,
      transition: { 
        times: [0, 0.15, 1],
        duration: 1.2,          
        ease: "easeInOut" as const 
      }
    },
    freeze: { scale: 0, opacity: 0, rotateX: 0 },
    suction: { scale: 0, opacity: 0, rotateX: 0 },
    overload: { scale: 0, opacity: 0, rotateX: 0 },
    rebirth: { 
      scale: [0, 1.45, 1],       
      opacity: [0, 1, 1],
      rotateX: [1440, 0],       
      transformPerspective: 1200,
      transition: { 
        duration: 2.0,          
        ease: "easeOut" as const,
        rotateX: { type: "spring", stiffness: 35, damping: 11 } 
      }
    }
  };

  // 🌀 KONTROL ANIMASI BLACKHOLE SANGAR
  const blackholeVariants: Variants = {
    hidden: { scale: 0, rotate: 0, opacity: 0 },
    visible: { 
      scale: [0, 1.08, 1], 
      rotate: [0, -1080],       
      opacity: 1,
      transition: { duration: 0.9, ease: "backOut" as const }
    },
    shake: {
      scale: [1, 1, 1.18, 1.12, 1.18, 1], 
      x: [0, 0, -5, 5, -6, 6, -3, 3, 0],
      y: [0, 0, 4, -4, 5, -5, 2, -2, 0],
      transition: { 
        times: [0, 0.7, 0.75, 0.82, 0.9, 0.95, 1], 
        duration: 1.8, 
        ease: "linear" as const 
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]">
      
      {/* WRAPPER KOIN UTAMA LU */}
      <motion.button
        variants={coinVariants}
        animate={stage}
        initial="idle"
        onClick={handleTriggerAnimasi}
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
        disabled={stage !== "idle" && !locked && !needsAd} 
      >
        <div style={{ animation: stage !== "idle" ? "none" : undefined }}>
          {children}
        </div>
      </motion.button>

      {/* 🌌 LAYER BADAI PARTIKEL PECAHAN EMAS (75 BIJI - SEDOTAN SPIRAL MERAYAP LAMBAT) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={
            stage === "suction" || stage === "overload"
              ? { 
                  // Lintasan meliuk spiral merayap lambat menuju titik pusat kecil (0,0)
                  x: [p.targetX, p.targetX * 0.55, p.targetX * 0.2, 0], 
                  y: [p.targetY, p.targetY * 0.45, p.targetY * 0.15, 0], 
                  scale: [0.9, 0.65, 0.3, 0], 
                  opacity: [1, 0.9, 0.6, 0],
                  rotate: [0, p.randomRotateSpeed * 0.3, p.randomRotateSpeed * 0.7, p.randomRotateSpeed], 
                  transition: { 
                    duration: p.randomSpeed, // Durasi acak 2.5s - 3.5s per partikel
                    ease: [0.25, 1, 0.5, 1] as any // Cubic-bezier pelambatan dramatis di ujung pusaran
                  } 
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.5 + 0.4, // Ukuran bervariasi acak biar natural
                  transition: { type: "spring", stiffness: 55, damping: 9 } 
                }
          }
          className="absolute w-2.5 h-2.5 rounded-sm z-40 bg-gradient-to-br from-yellow-100 via-amber-400 to-orange-600 shadow-[0_0_10px_#ffd700]"
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE CYBERPUNK (BOLONGAN INTI DIKECILKAN + BERTEXTURE PUSARAN) */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }} 
            className="absolute w-[170px] h-[170px] rounded-full z-20 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, #000000 25%, #1b0233 50%, #ffd700 80%, #ff2600 95%, transparent 100%)",
              boxShadow: "0 0 65px 25px rgba(139, 92, 246, 0.55), inset 0 0 40px #000",
            }}
          >
            {/* Cincin Orbit Plasma Luar */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-full opacity-50"
              style={{
                border: "3px dotted #ff0066",
                filter: "drop-shadow(0 0 6px #ff0066)"
              }}
            />

            {/* Cincin Debu Kosmik Internal */}
            <div className="absolute inset-3 rounded-full animate-spin [animation-duration:0.5s]" style={{
              border: "2px dashed rgba(255, 215, 0, 0.35)",
              filter: "blur(0.5px)"
            }} />

            {/* 🎛️ SINGULARITAS KECIL ANTI-POLOS: Ukuran dikecilkan (w-11 h-11), dalaman dikasih garis pusaran quantum */}
            <motion.div 
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-11 h-11 rounded-full bg-black shadow-[0_0_30px_12px_#000] border border-purple-500/30 flex items-center justify-center overflow-hidden"
            >
              {/* Tekstur Garis Event Horizon di dalam lubang hitam kecil (Biar gak polos bulat hitam mati) */}
              <div className="absolute inset-1 rounded-full opacity-60 animate-spin [animation-duration:0.4s]" style={{
                border: "2px dotted rgba(139, 92, 246, 0.7)",
              }} />
              {/* Titik inti singularitas terdalam */}
              <div className="w-3 h-3 rounded-full bg-[#030007] z-10 shadow-[inset_0_0_5px_#000]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}