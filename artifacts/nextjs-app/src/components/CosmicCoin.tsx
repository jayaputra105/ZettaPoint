"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
  randomSpeed: number;
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
    // 🚨 KUNCI RAHASIA: Jika locked atau lagi needsAd, BYPASS TOTAL ANIMASI KOSMIK!
    if (locked || needsAd) {
      onClick(e);
      return;
    }

    if (stage !== "idle") return;

    const savedEvent = { ...e };

    // 1. STAGE IMPACT: Koin mundur, melesat maju + NGE-FLIP VERTIKAL 3D (Guling ke atas)
    setStage("impact");

    // 2. STAGE FREEZE: Koin boom hancur, partikel diam membeku agak lama
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 32 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 140 + 70; 
        return {
          id: i,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance - 40,
          randomSpeed: Math.random() * 0.4 + 1.8, // Kecepatan sedot acak biar natural
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 1200); // Durasi 1.2 detik biar puas liat 4 kali putaran guling vertikal 3D-nya

    // 3. STAGE SUCTION: Blackhole gahar muncul, partikel kesedot spiral pelan-pelan banget
    setTimeout(() => {
      setStage("suction");
    }, 2800); // Partikel membeku 1.6 detik penuh di udara

    // 4. STAGE OVERLOAD: Partikel habis ketelan, Blackhole anteng total nahan energi, lalu gempa
    setTimeout(() => {
      setParticles([]); 
      setStage("overload");
    }, 5300); // Proses penyedotan meliuk spiral dibikin 2.5 detik penuh! Biar dramatis!

    // 5. STAGE REBIRTH: BOOM! Koin dimuntahin keluar dari inti, nge-flip vertikal 3D lagi balik ke rumah
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 7000); // Blackhole anteng 1.2 detik + getar hancur 0.5 detik (Total 1.7 detik)

    // 6. RESET TO IDLE: Koin ngerem empuk di posisi awal, lock klik dibuka kembali
    setTimeout(() => {
      setStage("idle");
    }, 9000); // Durasi muntahan koin 3D dibikin 2 detik penuh biar luar biasa smooth
  };

  // 🪙 KONTROL ANIMASI 3D KOIN EMAS LU (SEKARANG PAKE SUMBU X + PERSPECTIVE)
  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateX: 0, transformPerspective: 1200 },
    impact: { 
      scale: [1, 0.82, 1.9],    
      opacity: [1, 1, 0],       
      rotateX: [0, -30, 1440],  // NGE-FLIP VERTIKAL (Guling ke atas) 4 Putaran Penuh!
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
      rotateX: [1440, 0],       // DIMUNTAHIN SAMBIL GULING VERTIKAL BALIK 4 PUTARAN!
      transformPerspective: 1200,
      transition: { 
        duration: 2.0,          
        ease: "easeOut" as const,
        rotateX: { type: "spring", stiffness: 35, damping: 11 } // Spring berbobot
      }
    }
  };

  // 🌀 KONTROL ANIMASI BLACKHOLE GAHAR (ANTI-POLOS)
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
        duration: 1.7, 
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

      {/* 🌌 LAYER PARTIKEL PECAHAN EMAS (EFEK SEDOT SPIRAL MERAYAP LAMBAT) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={
            stage === "suction" || stage === "overload"
              ? { 
                  // Logic jalan meliuk memutar spiral pelan-pelan menuju koordinat pusat (0,0)
                  x: [p.targetX, p.targetX * 0.6, p.targetX * 0.25, 0], 
                  y: [p.targetY, p.targetY * 0.5, p.targetY * 0.2, 0], 
                  scale: [0.8, 0.6, 0.3, 0], 
                  opacity: [1, 0.9, 0.7, 0],
                  rotate: [0, 360, 720, 1080], 
                  transition: { 
                    duration: p.randomSpeed, // Pakai speed acak biar jalan sedotannya estetik gak barengan kaku
                    ease: "calc(0.42, 0, 0.58, 1)" as any
                  } 
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.6 + 0.5,
                  transition: { type: "spring", stiffness: 55, damping: 9 } 
                }
          }
          className="absolute w-3 h-3 rounded-md z-40 bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600 shadow-[0_0_12px_#ffd700]"
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE COSMIC CYBERPUNK (MAKIN SANGAR & MULTI-LAYER) */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.3 } }} 
            className="absolute w-[170px] h-[170px] rounded-full z-20 flex items-center justify-center"
            style={{
              // Layer 1: Aura Nebula Ungu Janda & Ring Akresi Emas Menyala
              background: "radial-gradient(circle, #000000 30%, #22033d 55%, #ffd700 82%, #ff3300 96%, transparent 100%)",
              boxShadow: "0 0 60px 22px rgba(147, 51, 234, 0.6), inset 0 0 40px #000",
            }}
          >
            {/* Layer 2: Cincin Orbit Energi Plasma Luar (Muter Kencang) */}
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-1 rounded-full opacity-60"
              style={{
                border: "3px dotted #ff0077",
                filter: "drop-shadow(0 0 8px #ff0077) blur(0.4px)"
              }}
            />

            {/* Layer 3: Cincin Dust Orbit Internal (Muter Kalem Balapan Arah) */}
            <div className="absolute inset-4 rounded-full animate-spin [animation-duration:0.6s]" style={{
              border: "2px dashed rgba(255, 215, 0, 0.4)",
              filter: "blur(0.5px)"
            }} />

            {/* Layer 4: THE DEEP BLACK CORE (Singularitas Inti Hitam Pekat Bermagnet) */}
            <motion.div 
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-full bg-black shadow-[0_0_35px_10px_#000] border border-purple-900/40 flex items-center justify-center"
            >
              {/* Inti terdalam */}
              <div className="w-6 h-6 rounded-full bg-[#05000a]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}