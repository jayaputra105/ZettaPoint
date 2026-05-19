"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Particle {
  id: number;
  initialAngle: number;
  initialDistance: number;
  randomSpeed: number;
  randomDelay: number;
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
    // Mode needsAd & locked bypass total biar gak dieksploitasi user
    if (locked || needsAd) {
      onClick(e);
      return;
    }

    if (stage !== "idle") return;

    const savedEvent = { ...e };

    // 1. STAGE IMPACT: Koin melompat 3D maju tebal + guling vertikal ekstrem
    setStage("impact");

    // 2. STAGE FREEZE: Koin boom hancur, generate 85 partikel melayang diam
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 85 }).map((_, i) => {
        return {
          id: i,
          initialAngle: Math.random() * Math.PI * 2, // Sudut sebaran awal
          initialDistance: Math.random() * 110 + 60, // Jarak ledakan awal
          randomSpeed: Math.random() * 1.5 + 2.5,    // Waktu pusaran spiral (2.5s - 4.0s)
          randomDelay: Math.random() * 2.0,          // Delay mengular sekuensial panjang (0s - 2s)
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 1200);

    // 3. STAGE SUCTION: Blackhole & Angin Tornado muncul, partikel kesedot muter spiral
    setTimeout(() => {
      setStage("suction");
    }, 2800);

    // 4. STAGE OVERLOAD: Partikel habis, blackhole vakum total lalu getar gempa dahsyat
    setTimeout(() => {
      setParticles([]);
      setStage("overload");
    }, 8800); // Durasi sedat-sedot spiral dibikin 6 detik penuh biar puas!

    // 5. STAGE REBIRTH: Muntah dari dimensi Z terdalam guling vertikal balik posisi semula
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 10500);

    // 6. RESET TO IDLE
    setTimeout(() => {
      setStage("idle");
    }, 12500); // Total durasi maha sinematik premium 12.5 detik!
  };

  // 🪙 KONTROL ANIMASI KOIN REAL 3D (X + Z + SHADING PERSPECTIVE)
  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateX: 0, z: 0, filter: "brightness(1)", transformPerspective: 1000 },
    impact: {
      scale: [1, 0.85, 2.2],
      z: [0, 100, 350], // Melompat nabrak muka user
      opacity: [1, 1, 0],
      rotateX: [0, -50, 1440], // Guling vertikal bertenaga 4 putaran
      filter: ["brightness(1)", "brightness(1.4)", "brightness(0.6)"], // Efek shading cahaya pas muter
      transformPerspective: 1000,
      transition: {
        times: [0, 0.2, 1],
        duration: 1.2,
        ease: "easeInOut" as const
      }
    },
    freeze: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    suction: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    overload: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    rebirth: {
      scale: [0, 1.5, 1],
      z: [-400, 180, 0], // Melesat keluar dari lubang hampa terdalam
      opacity: [0, 1, 1],
      rotateX: [-1440, 0], // Muter balik guling vertikal
      filter: ["brightness(0.5)", "brightness(1.3)", "brightness(1)"],
      transformPerspective: 1000,
      transition: {
        duration: 2.2,
        ease: "easeOut" as const,
        rotateX: { type: "spring", stiffness: 30, damping: 9 }
      }
    }
  };

  // 🌀 KONTROL ANIMASI BLACKHOLE MIKRO SINGULARITAS
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
      scale: [1, 1, 1.22, 1.15, 1.22, 1],
      x: [0, 0, -6, 6, -7, 7, -4, 4, 0],
      y: [0, 0, 4, -4, 6, -6, 3, -3, 0],
      transition: {
        times: [0, 0.65, 0.72, 0.8, 0.9, 0.95, 1],
        duration: 1.7,
        ease: "linear" as const
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]" style={{ perspective: "1000px" }}>
      
      {/* 🪙 WRAPPER KOIN UTAMA LU (DIKASIH TEBAL PALSU FAUX-SHADOW 3D) */}
      <motion.button
        variants={coinVariants}
        animate={stage}
        initial="idle"
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{
          WebkitTapHighlightColor: "transparent",
          transformStyle: "preserve-3d",
          willChange: "transform, opacity",
        }}
        onClick={handleTriggerAnimasi}
        disabled={stage !== "idle" && !locked && !needsAd}
      >
        {/* Layer Bayangan Tebal Logam 3D biar gak kelihatan Gepeng pas muter */}
        <div 
          className="relative transition-all duration-300"
          style={{ 
            animation: stage !== "idle" ? "none" : undefined,
            filter: stage === "impact" ? "drop-shadow(-4px 8px 0px rgba(0,0,0,0.35))" : "none"
          }}
        >
          {children}
        </div>
      </motion.button>

      {/* 🌌 LAYER BADAI PARTIKEL (EFEK PUSARAN SPIRAL MENGULAR MATEMATIS) */}
      {particles.map((p) => {
        // Rumus Trigonometri dinamis untuk bikin lintasan memutar spiral melingkar makin mengecil menuju pusat (0,0)
        const spiralKeyframesX = [
          Math.cos(p.initialAngle) * p.initialDistance,                         // Awal ledakan
          Math.cos(p.initialAngle + Math.PI * 1.5) * (p.initialDistance * 0.7), // Muter spiral putaran 1
          Math.cos(p.initialAngle + Math.PI * 3.5) * (p.initialDistance * 0.35),// Muter spiral putaran 2 Rapat
          0                                                                     // Ambles ke Core
        ];

        const spiralKeyframesY = [
          Math.sin(p.initialAngle) * p.initialDistance - 40,
          Math.sin(p.initialAngle + Math.PI * 1.5) * (p.initialDistance * 0.7) - 25,
          Math.sin(p.initialAngle + Math.PI * 3.5) * (p.initialDistance * 0.35) - 10,
          0
        ];

        return (
          <motion.div
            key={p.id}
            initial={{ x: Math.cos(p.initialAngle) * p.initialDistance, y: Math.sin(p.initialAngle) * p.initialDistance - 40, scale: 1, opacity: 1, z: 0 }}
            animate={
              stage === "suction" || stage === "overload"
                ? {
                    x: spiralKeyframesX,
                    y: spiralKeyframesY,
                    scale: [0.95, 0.75, 0.4, 0],
                    opacity: [1, 0.95, 0.6, 0],
                    z: [0, -50, -180, -350], // Ambles masuk ke dimensi dalam lubang
                    transition: {
                      duration: p.randomSpeed,
                      delay: p.randomDelay, // Delay mengular sekuensial antre masuk
                      ease: "linear" as const // Wajib linear biar putaran spiral trigonometrinya smooth konstan
                    }
                  }
                : {
                    x: Math.cos(p.initialAngle) * p.initialDistance,
                    y: Math.sin(p.initialAngle) * p.initialDistance - 40,
                    scale: Math.random() * 0.5 + 0.5,
                    transition: { type: "spring", stiffness: 60, damping: 10 }
                  }
            }
            className="absolute w-2.5 h-2.5 rounded-sm z-40 bg-gradient-to-br from-white via-yellow-400 to-amber-600"
            style={{
              willChange: "transform, opacity",
              transform: "translateZ(0)",
              filter: "blur(0.2px) brightness(1.2)"
            }}
          />
        );
      })}

      {/* 🌀 LAYER BLACKHOLE CYBERPUNK + EFEK ANGIN TORNADO KOSMIK (ANTI POLOS) */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, z: -200, transition: { duration: 0.35 } }}
            className="absolute w-[120px] h-[120px] rounded-full z-20 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle, #000000 15%, #150129 42%, #ffd700 74%, #ff1a00 90%, transparent 100%)",
              boxShadow: "0 0 50px 18px rgba(139, 92, 246, 0.55), inset 0 0 25px #000",
              transformStyle: "preserve-3d",
              willChange: "transform, opacity"
            }}
          >
            {/* 🌪️ EFFECT 1: ANGIN NEBULA PLASMA (Cosmic Dust Vortex nyeret partikel) */}
            <motion.div 
              animate={{ rotate: -720 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute w-[180px] h-[180px] rounded-full opacity-30 pointer-events-none"
              style={{
                background: "conic-gradient(from 0deg, transparent, rgba(147, 51, 234, 0.4), transparent, rgba(255, 215, 0, 0.2), transparent)",
                filter: "blur(8px)"
              }}
            />

            {/* EFFECT 2: Cincin Orbit Plasma Pink Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-full opacity-40"
              style={{
                border: "2px dotted #ff0055",
              }}
            />

            {/* EFFECT 3: Cincin Debu Emas Internal */}
            <div className="absolute inset-2 rounded-full animate-spin [animation-duration:0.4s]" style={{
              border: "1.5px dashed rgba(255, 215, 0, 0.3)",
            }} />

            {/* 🎛️ INTI SINGLE BLACKHOLE SINGULARITAS MICRO */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-8.5 h-8.5 rounded-full bg-black shadow-[0_0_20px_8px_#000] border border-purple-500/40 flex items-center justify-center overflow-hidden"
              style={{ willChange: "transform" }}
            >
              {/* Event horizon internal muter kencang */}
              <div className="absolute inset-0.5 rounded-full opacity-80 animate-spin [animation-duration:0.25s]" style={{
                border: "2px dotted rgba(168, 85, 247, 0.9)",
                filter: "blur(0.3px)"
              }} />
              {/* Riak gelombang kuantum lubang */}
              <div className="absolute w-5 h-5 rounded-full border border-yellow-500/20 animate-ping opacity-20 [animation-duration:0.9s]" />
              {/* Inti gravitasi mati hitam pekat */}
              <div className="w-2.5 h-2.5 rounded-full bg-[#020005] z-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}