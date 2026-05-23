"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface CosmicCoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  locked: boolean;
  needsAd: boolean;
  children: React.ReactNode;
}

type AnimationStage = "idle" | "impact" | "freeze" | "suction" | "overload" | "rebirth";

export default function CosmicCoin({ onClick, locked, needsAd, children }: CosmicCoinProps) {
  const [stage, setStage] = useState<AnimationStage>("idle");

  const particles = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    initialAngle: Math.random() * Math.PI * 2,
    initialDistance: Math.random() * 150 + 100,
    randomSpeed: Math.random() * 2 + 2.5,
    randomDelay: Math.random() * 0.5, // Partikel muncul lebih serentak setelah meledak
  })), []);

  const handleTriggerAnimasi = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (locked || needsAd) { onClick(e); return; }
    if (stage !== "idle") return;

    const savedEvent = { ...e };
    setStage("impact");

    // Timing 12.5s yang dipertahankan, tapi dipoles transisinya
    setTimeout(() => setStage("freeze"), 1200); 
    setTimeout(() => setStage("suction"), 1800); // Suction mulai lebih cepat setelah ledakan
    setTimeout(() => setStage("overload"), 8800);
    setTimeout(() => { setStage("rebirth"); onClick(savedEvent as any); }, 10500);
    setTimeout(() => setStage("idle"), 12500);
  };

  const coinVariants: Variants = {
    idle: { scale: 1, rotateX: 0, z: 0, filter: "brightness(1)" },
    impact: {
      scale: [1, 0.9, 1.6], // Dibatasi biar gak keluar layar
      z: [0, 50, 150],
      opacity: [1, 1, 0],
      rotateX: [0, 50, -1440], // Flip ke atas
      filter: ["brightness(1)", "brightness(5)", "brightness(1)"], // Efek flash ledakan
      transition: { times: [0, 0.4, 1], duration: 1.2, ease: "easeOut" }
    },
    rebirth: {
      scale: [0, 1.2, 1],
      z: [-200, 0],
      rotateX: [1440, 0],
      transition: { duration: 1.5, ease: "backOut" }
    }
  };

  return (
    <motion.div 
      className="relative flex items-center justify-center w-[260px] h-[260px]"
      style={{ perspective: "1000px" }}
      animate={stage === "freeze" ? { x: [-2, 2, -2, 2, 0], y: [-2, 2, -2, 2, 0] } : {}} // Screen Shake
      transition={{ duration: 0.3 }}
    >
      {/* 🪙 KOIN */}
      <motion.button
        variants={coinVariants}
        animate={stage === "idle" ? "idle" : stage === "impact" ? "impact" : stage === "rebirth" ? "rebirth" : { opacity: 0 }}
        className="relative z-30"
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
        onClick={handleTriggerAnimasi}
        disabled={stage !== "idle"}
      >
        <div style={{ transform: "translateZ(0)" }}>{children}</div>
      </motion.button>

      {/* 💥 SHOCKWAVE LEDAKAN */}
      <AnimatePresence>
        {stage === "freeze" && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute z-20 w-[80px] h-[80px] rounded-full bg-white/40 blur-xl"
          />
        )}
      </AnimatePresence>

      {/* 🌀 PARTIKEL */}
      {(stage === "suction" || stage === "overload") && particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0 }}
          animate={{
            x: [0, Math.cos(p.initialAngle) * 200, 0],
            y: [0, Math.sin(p.initialAngle) * 200, 0],
            scale: [0, 1, 0]
          }}
          transition={{ duration: p.randomSpeed, ease: "linear" }}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          style={{ transform: "translateZ(0)" }}
        />
      ))}
    </motion.div>
  );
}