"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// ... (Interface tetap sama)

export default function CosmicCoin({ onClick, locked, needsAd, children }: any) {
  const [stage, setStage] = useState<string>("idle");

  // Generate partikel di luar biar smooth
  const particles = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    initialAngle: Math.random() * Math.PI * 2,
    initialDistance: Math.random() * 150 + 100,
    randomSpeed: Math.random() * 2 + 2.5,
  })), []);

  const handleTriggerAnimasi = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (locked || needsAd) { onClick(e); return; }
    if (stage !== "idle") return;

    setStage("impact");
    setTimeout(() => setStage("freeze"), 1200);
    setTimeout(() => setStage("suction"), 1800);
    setTimeout(() => setStage("overload"), 8800);
    setTimeout(() => { setStage("rebirth"); onClick(e); }, 10500);
    setTimeout(() => setStage("idle"), 12500);
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]" style={{ perspective: "1000px" }}>
      
      {/* 🪙 KOIN: Sekarang muncul di semua stage kecuali yang harus hilang */}
      <motion.button
        animate={stage === "idle" || stage === "impact" || stage === "rebirth" ? stage : "hidden"}
        variants={{
          idle: { scale: 1, rotateX: 0, opacity: 1 },
          impact: { scale: [1, 0.9, 1.6], rotateX: [0, 50, -1440], filter: "brightness(5)", opacity: [1, 1, 0] },
          rebirth: { scale: [0, 1.2, 1], rotateX: [1440, 0], opacity: 1 },
          hidden: { opacity: 0 }
        }}
        transition={{ duration: 1.2 }}
        className="relative z-30"
        onClick={handleTriggerAnimasi}
        disabled={stage !== "idle"}
      >
        {children}
      </motion.button>

      {/* 💥 SHOCKWAVE (Ledakan) */}
      <AnimatePresence>
        {stage === "freeze" && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            className="absolute z-20 w-[80px] h-[80px] rounded-full bg-white/40 blur-xl"
          />
        )}
      </AnimatePresence>

      {/* 🌀 BLACKHOLE & PARTIKEL */}
      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <>
            {/* BLACKHOLE: Dibalikin lagi! */}
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute w-[120px] h-[120px] rounded-full bg-black border border-purple-500 z-20"
            />
            
            {/* PARTIKEL SPIRAL */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0 }}
                animate={{
                  x: [0, Math.cos(p.initialAngle) * 200, 0],
                  y: [0, Math.sin(p.initialAngle) * 200, 0],
                }}
                transition={{ duration: p.randomSpeed, ease: "linear" }}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full z-40"
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}