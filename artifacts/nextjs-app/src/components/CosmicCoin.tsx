"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

    // Simpan event click biar bisa dieksekusi di akhir timeline
    const savedEvent = { ...e };

    // STAGE 1: IMPACT & LAUNCH (Mundur dikit langsung melesat membesar lalu ilang)
    setStage("impact");

    // STAGE 2: THE GOLDEN BOOM & FREEZE (Pecah jadi partikel diam membeku)
    setTimeout(() => {
      const generatedParticles = Array.from({ length: 22 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 40;
        return {
          id: i,
          targetX: Math.cos(angle) * distance,
          targetY: Math.sin(angle) * distance - 30,
        };
      });
      setParticles(generatedParticles);
      setStage("freeze");
    }, 300); // Durasi koin melesat maju (300ms)

    // STAGE 3: BLACKHOLE RISING & SUCTION (Blackhole muncul melintir nyedot partikel)
    setTimeout(() => {
      setStage("suction");
    }, 800); // Waktu partikel diem membeku (500ms)

    // STAGE 4: OVERLOAD (Partikel habis, blackhole diem terus getar dahsyat)
    setTimeout(() => {
      setParticles([]); // Bersihkan partikel karena udah kesedot habis
      setStage("overload");
    }, 1600); // Durasi proses penyedotan (800ms)

    // STAGE 5: RE-BIRTH FLIP (Boom! Koin keluar dari blackhole, nge-flip 3D balik tempat semula)
    setTimeout(() => {
      setStage("rebirth");
      
      // PENTING: Eksekusi fungsi ZP asli lu pas koin mulai lahir kembali
      onClick(savedEvent as any);
    }, 2100); // Waktu blackhole nahan energi & getar (500ms)

    // RESET TO IDLE (Koin udah mantap di tempatnya, lock dibuka kembali)
    setTimeout(() => {
      setStage("idle");
    }, 2900); // Durasi koin nge-flip 3D sampai ngerem stabil (800ms)
  };

  // VARIANTS UNTUK KOIN EMAS UTAMA LU
  const coinVariants = {
    idle: { scale: 1, opacity: 1, rotateY: 0 },
    impact: { 
      scale: [1, 0.82, 1.65], 
      opacity: [1, 1, 0],
      transition: { 
        times: [0, 0.2, 1],
        duration: 0.3, 
        ease: "easeInOut" 
      }
    },
    freeze: { scale: 0, opacity: 0 },
    suction: { scale: 0, opacity: 0 },
    overload: { scale: 0, opacity: 0 },
    rebirth: { 
      scale: [1.5, 1], 
      opacity: [0, 1, 1],
      rotateY: [0, 720], // Efek Coin Flip 3D horizontal sumbu Y bertenaga
      transition: { 
        duration: 0.8, 
        ease: "circOut",
        rotateY: { type: "spring", stiffness: 150, damping: 14 }
      }
    }
  };

  // VARIANTS UNTUK BLACKHOLE KOSMIK
  const blackholeVariants = {
    hidden: { scale: 0, rotate: 0, opacity: 0 },
    visible: { 
      scale: [0, 1.1, 1], 
      rotate: [0, -720],
      opacity: 1,
      transition: { duration: 0.5, ease: "anticipate" }
    },
    shake: {
      scale: 1.15,
      x: [-3, 3, -4, 4, -2, 2, 0],
      y: [2, -2, 3, -3, 1, -1, 0],
      transition: { duration: 0.4, ease: "linear" }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]">
      
      {/* WRAPPER KOIN UTAMA LU */}
      <motion.button
        variants={coinVariants}
        animate={stage === "idle" ? "idle" : stage}
        onClick={handleTriggerAnimasi}
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
        disabled={stage !== "idle" && !locked} // Kunci total klik selama rentetan animasi kosmik berjalan
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
                  scale: 0, 
                  opacity: 0,
                  rotate: 360,
                  transition: { duration: 0.6, ease: "anticipate" } 
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.5 + 0.5,
                  transition: { type: "spring", stiffness: 100, damping: 8 } 
                }
          }
          className="absolute w-3 h-3 rounded-md z-40 bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600 shadow-[0_0_8px_#ffd700]"
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE COSMIC */}
      {(stage === "suction" || stage === "overload") && (
        <motion.div
          variants={blackholeVariants}
          animate={stage === "overload" ? "shake" : "visible"}
          initial="hidden"
          className="absolute w-[140px] h-[140px] rounded-full z-20 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, #000000 40%, #1e0b36 70%, #ffd700 95%, transparent 100%)",
            boxShadow: "0 0 45px 10px rgba(147, 51, 234, 0.45), inset 0 0 25px #000",
          }}
        >
          {/* Garis orbit internal blackhole */}
          <div className="absolute inset-2 rounded-full animate-spin [animation-duration:1.2s]" style={{
            border: "2px dashed rgba(255, 215, 0, 0.25)",
            filter: "blur(0.5px)"
          }} />
          <div className="w-10 h-10 rounded-full bg-black shadow-[0_0_20px_#000]" />
        </motion.div>
      )}

    </div>
  );
}