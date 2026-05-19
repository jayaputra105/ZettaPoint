"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
  randomSpeed: number;
  randomDelay: number; 
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
    if (locked || needsAd) {
      onClick(e);
      return;
    }

    if (stage !== "idle") return;

    const savedEvent = { ...e };

    // 1. STAGE IMPACT
    setStage("impact");

    // 2. STAGE FREEZE: Naikkan partikel ke 85, tapi render diperenteng via GPU
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 85 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 170 + 40; 
        return {
          id: i,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance - 40,
          randomSpeed: Math.random() * 1.5 + 2.2, // Seloroin rentang sedot (2.2s - 3.7s)
          randomDelay: Math.random() * 1.8,       // Delay sekuensial diperlebar biar mengular panjang
          randomRotateSpeed: Math.random() * 800 + 400,
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 1200); 

    // 3. STAGE SUCTION
    setTimeout(() => {
      setStage("suction");
    }, 2800); 

    // 4. STAGE OVERLOAD: Nahan energi total
    setTimeout(() => {
      setParticles([]); 
      setStage("overload");
    }, 8500); // Durasi nunggu antrean rampung dinaikkan

    // 5. STAGE REBIRTH
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 10300); 

    // 6. RESET TO IDLE
    setTimeout(() => {
      setStage("idle");
    }, 12500); 
  };

  // 🪙 KONTROL ANIMASI MAESTRO 3D (OPTIMIZED FOR GPU)
  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateX: 0, z: 0, transformPerspective: 1000 },
    impact: { 
      scale: [1, 0.85, 2.1],          
      z: [0, 80, 320],                
      opacity: [1, 1, 0],       
      rotateX: [0, -45, 1440],        
      transformPerspective: 1000,
      transition: { 
        times: [0, 0.15, 1],
        duration: 1.2,          
        ease: "easeInOut" as const 
      }
    },
    freeze: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    suction: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    overload: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    rebirth: { 
      scale: [0, 1.5, 1],       
      z: [-400, 160, 0],              
      opacity: [0, 1, 1],
      rotateX: [-1440, 0],            
      transformPerspective: 1000,
      transition: { 
        duration: 2.2,          
        ease: "easeOut" as const,
        rotateX: { type: "spring", stiffness: 30, damping: 10 } 
      }
    }
  };

  // 🌀 KONTROL ANIMASI BLACKHOLE
  const blackholeVariants: Variants = {
    hidden: { scale: 0, rotate: 0, opacity: 0, z: -100, transformPerspective: 1000 },
    visible: { 
      scale: [0, 1.1, 1], 
      rotate: [0, -1440],       
      opacity: 1,
      z: 0,
      transition: { duration: 0.9, ease: "backOut" as const }
    },
    shake: {
      scale: [1, 1, 1.2, 1.12, 1.2, 1], 
      x: [0, 0, -5, 5, -6, 6, -3, 3, 0],
      y: [0, 0, 4, -4, 5, -5, 2, -2, 0],
      transition: { 
        times: [0, 0.65, 0.72, 0.8, 0.9, 0.95, 1], 
        duration: 1.8, 
        ease: "linear" as const 
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]" style={{ perspective: "1000px" }}>
      
      {/* WRAPPER KOIN UTAMA LU */}
      <motion.button
        variants={coinVariants}
        animate={stage}
        initial="idle"
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{ 
          WebkitTapHighlightColor: "transparent", 
          transformStyle: "preserve-3d",
          willChange: "transform, opacity" // 🚀 GPU KRAMAT 1
        }}
        onClick={handleTriggerAnimasi}
        disabled={stage !== "idle" && !locked && !needsAd} 
      >
        <div style={{ animation: stage !== "idle" ? "none" : undefined }}>
          {children}
        </div>
      </motion.button>

      {/* 🌌 LAYER BADAI PARTIKEL (85 BIJI - ULTRA SMOOTH GPU SPIRAL RUNNING) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, z: 0 }}
          animate={
            stage === "suction" || stage === "overload"
              ? { 
                  // Meliuk spiral melambat secara linear murni di sumbu GPU translate3d
                  x: [p.targetX, p.targetX * 0.7, p.targetX * 0.3, 0], 
                  y: [p.targetY, p.targetY * 0.6, p.targetY * 0.2, 0], 
                  scale: [0.95, 0.75, 0.35, 0], 
                  opacity: [1, 0.9, 0.5, 0],
                  z: [0, -60, -180, -350], 
                  rotate: [0, p.randomRotateSpeed * 0.4, p.randomRotateSpeed * 0.8, p.randomRotateSpeed], 
                  transition: { 
                    duration: p.randomSpeed, 
                    delay: p.randomDelay, 
                    ease: "easeOut" as const // Diganti ke easeOut bawaan browser biar super enteng di HP
                  } 
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.5 + 0.5, 
                  transition: { type: "spring", stiffness: 60, damping: 10 } 
                }
          }
          className="absolute w-2.5 h-2.5 rounded-sm z-40 bg-gradient-to-br from-white via-yellow-400 to-amber-600"
          style={{
            // 🚀 GPU KRAMAT 2: Paksa rendering 3D hardware & ganti shadow berat dengan blur murah
            willChange: "transform, opacity",
            transform: "translateZ(0)",
            filter: "blur(0.2px) brightness(1.2)"
          }}
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE CYBERPUNK MULTI-TEXTURE (ANTI-POLOS) */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, z: -200, transition: { duration: 0.35 } }} 
            className="absolute w-[120px] h-[120px] rounded-full z-20 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, #000000 15%, #18012e 45%, #ffd700 75%, #ff1a00 92%, transparent 100%)",
              boxShadow: "0 0 45px 15px rgba(139, 92, 246, 0.5), inset 0 0 25px #000",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity"
            }}
          >
            {/* Tekstur Pola Nebula Plasma Luar */}
            <div className="absolute inset-0 rounded-full opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 via-transparent to-transparent animate-pulse" />

            {/* Cincin Plasma Dotted Pink */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-full opacity-40"
              style={{
                border: "2px dotted #ff0055",
              }}
            />

            {/* Cincin Debu Emas */}
            <div className="absolute inset-2 rounded-full animate-spin [animation-duration:0.5s]" style={{
              border: "1.5px dashed rgba(255, 215, 0, 0.3)",
            }} />

            {/* 🎛️ INTI BLACKHOLE TEKSTUR QUANTUM (ANTI POLOS) */}
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-9 h-9 rounded-full bg-black shadow-[0_0_20px_8px_#000] border border-purple-500/40 flex items-center justify-center overflow-hidden"
              style={{ willChange: "transform" }}
            >
              {/* Garis Event Horizon Internal Muter Super Kencang */}
              <div className="absolute inset-0.5 rounded-full opacity-80 animate-spin [animation-duration:0.25s]" style={{
                border: "2px dotted rgba(168, 85, 247, 0.9)",
                filter: "blur(0.3px)"
              }} />
              {/* Cincin Pusaran Tambahan Di Tengah Lubang */}
              <div className="absolute w-5 h-5 rounded-full border border-yellow-500/20 animate-ping opacity-30 [animation-duration:1s]" />
              {/* Titik Gravitasi Inti */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#020005] z-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}