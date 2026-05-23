"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";

export default function CosmicCoin({ onClick, locked, needsAd, children }: any) {
  const [stage, setStage] = useState<string>("idle");

  const handleTrigger = (e: any) => {
    if (locked || needsAd) { onClick(e); return; }
    if (stage !== "idle") return;

    setStage("impact");
    setTimeout(() => setStage("suction"), 1200);
    setTimeout(() => setStage("overload"), 8000);
    setTimeout(() => {
      setStage("rebirth");
      onClick(e);
    }, 10500);
    setTimeout(() => setStage("idle"), 12500);
  };

  // REVISI: Z-index diperhalus biar gak terlalu "nabrak" mata
  const coinVariants: Variants = {
    idle: { scale: 1, rotateX: 0, z: 0 },
    impact: {
      scale: [1, 0.9, 1.8], // Diperkecil dari 2.2 ke 1.8 biar gak terlalu dekat
      z: [0, 50, 150],      // Z dikurangi biar gak "keluar" layar
      rotateX: [0, -20, 1080], 
      transition: { duration: 1.2, ease: "easeOut" }
    },
    suction: { scale: 0, opacity: 0 },
    rebirth: {
      scale: [0, 1.2, 1],
      z: [-200, 50, 0],
      rotateX: [-1080, 0],
      transition: { duration: 1.5, ease: "backOut" }
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center w-[260px] h-[260px]" 
      style={{ perspective: "1200px" }} // Perspective diperlebar biar gak gepeng
    >
      <motion.button
        variants={coinVariants}
        animate={stage}
        className="relative z-30 outline-none cursor-pointer"
        style={{
          transformStyle: "preserve-3d", // Penting buat 3D
          backfaceVisibility: "hidden", // Mencegah flicker pas muter
        }}
        onClick={handleTrigger}
      >
        {/* REVISI: Tambahkan border/shadow buat ngasih kesan tebal koin */}
        <div className="rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_-5px_10px_rgba(255,255,255,0.2)]">
          {children}
        </div>
      </motion.button>

      {/* Partikel tetap di sini, tapi kita kurangi jumlahnya jadi 40 (cukup buat visual) */}
      {stage === "suction" && (
        <ParticleSystem />
      )}
    </div>
  );
}

// Pisahkan Particle biar gak re-render koin utama
function ParticleSystem() {
  return (
    <>
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, (Math.random() - 0.5) * 300],
            y: [0, (Math.random() - 0.5) * 300],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full blur-[1px]"
        />
      ))}
    </>
  );
}