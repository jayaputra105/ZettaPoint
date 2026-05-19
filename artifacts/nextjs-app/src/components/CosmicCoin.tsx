"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion"; // 🚀 SUNTIK IMPORT VARIANTS

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
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
    if (locked || stage !== "idle") return;

    const savedEvent = { ...e };

    // 1. STAGE IMPACT: Koin mundur dikit, langsung melesat maju + NGE-FLIP GAUL 4 PUTARAN (1440deg)
    setStage("impact");

    // 2. STAGE FREEZE: Koin BOOM ilang di puncak lemparan, pecahan muncul & DIAM MEMBEKU LAMA
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 28 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 130 + 60; 
        return {
          id: i,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance - 40,
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 900); 

    // 3. STAGE SUCTION: Blackhole muncul melintir, partikel kesedot pelan banget (Dramatis)
    setTimeout(() => {
      setStage("suction");
    }, 2400); 

    // 4. STAGE OVERLOAD: Partikel habis ketelan, Blackhole DIEM TOTAL 1 DETIK, baru GETAR DAHSYAT
    setTimeout(() => {
      setParticles([]); 
      setStage("overload");
    }, 4400); 

    // 5. STAGE REBIRTH: BOOM! Koin dimuntahin keluar, NGE-FLIP HORIZONTAL 4 PUTARAN (1440deg)
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 5900); 

    // 6. RESET TO IDLE: Koin selesai nge-flip, ngerem empuk di posisi awal, lock dibuka kembali
    setTimeout(() => {
      setStage("idle");
    }, 7700); 
  };

  // 🪙 KONTROL ANIMASI KOIN EMAS LU (Dikasih type data Variants agar Vercel Lolos Build)
  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateY: 0 },
    impact: { 
      scale: [1, 0.82, 1.8],    
      opacity: [1, 1, 0],       
      rotateY: [0, 0, 1440],    
      transition: { 
        times: [0, 0.15, 1],
        duration: 0.9,          
        ease: "easeInOut" as const // 🌟 SUNTIKAN KUNCI: Dipaksa sebagai konstanta literal
      }
    },
    freeze: { scale: 0, opacity: 0, rotateY: 0 },
    suction: { scale: 0, opacity: 0, rotateY: 0 },
    overload: { scale: 0, opacity: 0, rotateY: 0 },
    rebirth: { 
      scale: [0, 1.4, 1],       
      opacity: [0, 1, 1],
      rotateY: [0, 1440],       
      transition: { 
        duration: 1.8,          
        ease: "easeOut" as const, // 🌟 SUNTIKAN KUNCI
        rotateY: { type: "spring", stiffness: 45, damping: 13 } 
      }
    }
  };

  // 🌀 KONTROL ANIMASI BLACKHOLE (Dikasih type data Variants agar Vercel Lolos Build)
  const blackholeVariants: Variants = {
    hidden: { scale: 0, rotate: 0, opacity: 0 },
    visible: { 
      scale: [0, 1.1, 1], 
      rotate: [0, -1440],       
      opacity: 1,
      transition: { duration: 0.8, ease: "backOut" as const } // 🌟 SUNTIKAN KUNCI
    },
    shake: {
      scale: [1, 1, 1.15, 1.1, 1.15, 1], 
      x: [0, 0, -4, 4, -5, 5, -3, 3, 0],
      y: [0, 0, 3, -3, 4, -4, 2, -2, 0],
      transition: { 
        times: [0, 0.65, 0.7, 0.75, 0.85, 0.95, 1], 
        duration: 1.5, 
        ease: "linear" as const // 🌟 SUNTIKAN KUNCI
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
        disabled={stage !== "idle" && !locked} 
      >
        <div style={{ animation: stage !== "idle" ? "none" : undefined }}>
          {children}
        </div>
      </motion.button>

      {/* 🌌 LAYER PARTIKEL PECAHAN EMAS */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={
            stage === "suction" || stage === "overload"
              ? { 
                  x: 0, 
                  y: 0, 
                  scale: 0.05, 
                  opacity: 0,
                  rotate: 1080, 
                  transition: { duration: 1.8, ease: "circIn" as const } // 🌟 SUNTIKAN KUNCI
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.6 + 0.5,
                  transition: { type: "spring", stiffness: 60, damping: 9 } 
                }
          }
          className="absolute w-3 h-3 rounded-md z-40 bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600 shadow-[0_0_12px_#ffd700]"
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE COSMIC */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.25 } }} 
            className="absolute w-[160px] h-[160px] rounded-full z-20 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, #000000 35%, #15032a 65%, #ffb700 95%, transparent 100%)",
              boxShadow: "0 0 55px 18px rgba(139, 92, 246, 0.5), inset 0 0 30px #000",
            }}
          >
            <div className="absolute inset-2 rounded-full animate-spin [animation-duration:0.8s]" style={{
              border: "3px dashed rgba(255, 183, 0, 0.35)",
              filter: "blur(0.5px)"
            }} />
            <div className="w-14 h-14 rounded-full bg-black shadow-[0_0_30px_#000]" />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}