"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
  randomSpeed: number;
  randomDelay: number; // 🚀 KUNCI UTAMA: Jeda waktu sedot biar mengular satu-persatu
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

    // 1. STAGE IMPACT: Koin melompat 3D keluar layar sambil guling vertikal ekstrem
    setStage("impact");

    // 2. STAGE FREEZE: BOOM hancur di depan layar, pecahan padat membeku
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 80 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 160 + 50; 
        return {
          id: i,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance - 40,
          randomSpeed: Math.random() * 1.2 + 2.0, // Waktu sedot 2s sampai 3.2s
          randomDelay: Math.random() * 1.5,       // 🌟 Rentang delay 0 - 1.5 detik biar mengular antre masuk!
          randomRotateSpeed: Math.random() * 1000 + 500,
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 1200); 

    // 3. STAGE SUCTION: Blackhole mikro muncul, partikel mulai kesedot antre bergantian
    setTimeout(() => {
      setStage("suction");
    }, 2800); 

    // 4. STAGE OVERLOAD: Partikel terakhir habis ketelan, blackhole vakum total lalu gempa dahsyat
    setTimeout(() => {
      setParticles([]); 
      setStage("overload");
    }, 7800); // Durasi sedat-sedot total diperpanjang jadi 5 detik penuh biar antrean delay-nya habis natural!

    // 5. STAGE REBIRTH: BOOM! Muntah dari kedalaman sumbu Z mundur ke posisi awal sambil nge-flip 3D
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 9600); // Blackhole nahan energi vakum lebih lama (1.8 detik)

    // 6. RESET TO IDLE
    setTimeout(() => {
      setStage("idle");
    }, 11800); // Total durasi mahakarya teatrikal premium sekarang 11.8 detik!
  };

  // 🪙 KONTROL ANIMASI MAESTRO 3D KOIN EMAS (MANIPULASI SUMBU X + Z + PERSPECTIVE)
  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateX: 0, z: 0, transformPerspective: 1000 },
    impact: { 
      scale: [1, 0.85, 2.1],          // Meluncur membesar ekstrem
      z: [0, 80, 300],                // 🚀 EFEK 3D NYATA: Koin melompat keluar mendekati mata user beneran!
      opacity: [1, 1, 0],       
      rotateX: [0, -45, 1440],        // Guling vertikal bertenaga 4 putaran
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
      z: [-400, 150, 0],              // 🚀 EFEK 3D NYATA: Dimuntahin dari ruang hampa terdalam (Z: -400) melesat maju baru ngerem
      opacity: [0, 1, 1],
      rotateX: [-1440, 0],            // Guling vertikal balik arah 4 putaran penuh
      transformPerspective: 1000,
      transition: { 
        duration: 2.2,          
        ease: "easeOut" as const,
        rotateX: { type: "spring", stiffness: 30, damping: 10 } 
      }
    }
  };

  // 🌀 KONTROL ANIMASI BLACKHOLE MIKRO SANGAR
  const blackholeVariants: Variants = {
    hidden: { scale: 0, rotate: 0, opacity: 0, z: -100, transformPerspective: 1000 },
    visible: { 
      scale: [0, 1.1, 1], 
      rotate: [0, -1440],       
      opacity: 1,
      z: 0,
      transition: { duration: 0.8, ease: "backOut" as const }
    },
    shake: {
      scale: [1, 1, 1.2, 1.12, 1.2, 1], 
      x: [0, 0, -6, 6, -7, 7, -4, 4, 0],
      y: [0, 0, 4, -4, 6, -6, 3, -3, 0],
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
        onClick={handleTriggerAnimasi}
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent", transformStyle: "preserve-3d" }}
        disabled={stage !== "idle" && !locked && !needsAd} 
      >
        <div style={{ animation: stage !== "idle" ? "none" : undefined }}>
          {children}
        </div>
      </motion.button>

      {/* 🌌 LAYER BADAI PARTIKEL (80 BIJI - EFEK SEDOT MENGULAR BERTAHAP + GLOW SHADOW) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, z: 0 }}
          animate={
            stage === "suction" || stage === "overload"
              ? { 
                  x: [p.targetX, p.targetX * 0.6, p.targetX * 0.2, 0], 
                  y: [p.targetY, p.targetY * 0.5, p.targetY * 0.15, 0], 
                  scale: [0.9, 0.7, 0.3, 0], 
                  opacity: [1, 0.9, 0.6, 0],
                  z: [0, -50, -150, -300], // Partikel ambles masuk ke dalam dimensi Z lubang hitam
                  rotate: [0, p.randomRotateSpeed * 0.3, p.randomRotateSpeed * 0.7, p.randomRotateSpeed], 
                  transition: { 
                    duration: p.randomSpeed, 
                    delay: p.randomDelay, // 🌟 INI DIA: Bikin sedotan mengular mengantre!
                    ease: [0.25, 0.1, 0.25, 1] as any 
                  } 
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.5 + 0.4, 
                  transition: { type: "spring", stiffness: 55, damping: 9 } 
                }
          }
          className="absolute w-2.5 h-2.5 rounded-sm z-40 bg-gradient-to-br from-white via-amber-400 to-orange-600"
          style={{
            filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.7))", // Efek bayangan glow emas partikel
          }}
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE MIKRO SINGULARITAS (DIKECILKAN BIAR PADAT & BERTEXTURE PUSARAN QUANTUM) */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, z: -200, transition: { duration: 0.35 } }} 
            className="absolute w-[120px] h-[120px] rounded-full z-20 flex items-center justify-center" // 🌟 CIUTKAN UKURAN LUAR
            style={{
              background: "radial-gradient(circle, #000000 20%, #17012d 48%, #ffd700 78%, #ff1a00 94%, transparent 100%)",
              boxShadow: "0 0 50px 18px rgba(139, 92, 246, 0.5), inset 0 0 30px #000",
              transformStyle: "preserve-3d"
            }}
          >
            {/* Cincin Plasma Dotted Pink */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-full opacity-40"
              style={{
                border: "2px dotted #ff0055",
                filter: "drop-shadow(0 0 4px #ff0055)"
              }}
            />

            {/* Cincin Debu Emas */}
            <div className="absolute inset-2 rounded-full animate-spin [animation-duration:0.4s]" style={{
              border: "1.5px dashed rgba(255, 215, 0, 0.3)",
              filter: "blur(0.4px)"
            }} />

            {/* 🎛️ THE SINGULARITAS INTI: Padat, kecil, dalaman berputar gila */}
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-9 h-9 rounded-full bg-black shadow-[0_0_25px_10px_#000] border border-purple-500/40 flex items-center justify-center overflow-hidden"
            >
              {/* Event horizon internal tekstur pusaran kencang */}
              <div className="absolute inset-0.5 rounded-full opacity-70 animate-spin [animation-duration:0.3s]" style={{
                border: "2px dotted rgba(168, 85, 247, 0.8)",
              }} />
              {/* Titik gravitasi mutlak hitam legam */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#020005] z-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}