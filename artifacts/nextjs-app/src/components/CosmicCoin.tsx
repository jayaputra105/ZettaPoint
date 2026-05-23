"use client";

import { useState, useMemo, memo } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// 1. MEMOIZED PARTICLE: Mencegah re-render massal
const Particle = memo(({ p, stage }: { p: any; stage: string }) => {
  const spiralX = [
    Math.cos(p.initialAngle) * p.initialDistance,
    Math.cos(p.initialAngle + Math.PI * 1.5) * (p.initialDistance * 0.7),
    Math.cos(p.initialAngle + Math.PI * 3.5) * (p.initialDistance * 0.35),
    0
  ];
  const spiralY = [
    Math.sin(p.initialAngle) * p.initialDistance - 40,
    Math.sin(p.initialAngle + Math.PI * 1.5) * (p.initialDistance * 0.7) - 25,
    Math.sin(p.initialAngle + Math.PI * 3.5) * (p.initialDistance * 0.35) - 10,
    0
  ];

  return (
    <motion.div
      initial={{ x: Math.cos(p.initialAngle) * p.initialDistance, y: Math.sin(p.initialAngle) * p.initialDistance - 40 }}
      animate={stage === "suction" ? {
        x: spiralX,
        y: spiralY,
        scale: [1, 0],
        opacity: [1, 0],
      } : {}}
      transition={{ duration: p.randomSpeed, delay: p.randomDelay, ease: "linear" }}
      className="absolute w-2 h-2 rounded-sm bg-yellow-400 z-40"
    />
  );
});

export default function CosmicCoin({ onClick, locked, needsAd, children }: any) {
  const [stage, setStage] = useState("idle");
  const controls = useAnimation();
  
  const particles = useMemo(() => Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    initialAngle: Math.random() * Math.PI * 2,
    initialDistance: Math.random() * 150 + 100,
    randomSpeed: Math.random() * 2 + 2,
    randomDelay: Math.random() * 1.5,
  })), []);

  const startSequence = async () => {
    if (stage !== "idle") return;
    setStage("impact");
    await controls.start("impact");
    setStage("freeze");
    await new Promise(r => setTimeout(r, 500)); // Freeze durasi
    setStage("suction");
    await new Promise(r => setTimeout(r, 6000));
    setStage("overload");
    await new Promise(r => setTimeout(r, 1000));
    setStage("rebirth");
    await controls.start("rebirth");
    onClick();
    setStage("idle");
  };

  return (
    <div className="relative w-[260px] h-[260px]" style={{ perspective: "1000px" }}>
      <motion.button
        animate={controls}
        variants={{
          idle: { scale: 1, rotateX: 0, z: 0 },
          impact: { scale: [1, 0.8, 1.8], z: [0, 100, 150], rotateX: [0, -20, 1080] },
          rebirth: { scale: [0, 1.2, 1], z: [-200, 0], rotateX: [-1080, 0] }
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="relative z-30"
        onClick={startSequence}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.button>

      {stage === "suction" && particles.map((p) => <Particle key={p.id} p={p} stage={stage} />)}
    </div>
  );
}