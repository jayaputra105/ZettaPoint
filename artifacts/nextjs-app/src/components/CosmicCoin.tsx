"use client";

import { useState, useMemo } from "react";
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
  
  const particles = useMemo(() => Array.from({ length: 85 }).map((_, i) => ({
    id: i,
    initialAngle: Math.random() * Math.PI * 2,
    initialDistance: Math.random() * 150 + 100,
    randomSpeed: Math.random() * 2 + 3.5,
    randomDelay: Math.random() * 3.0,
  })), []);

  const handleTriggerAnimasi = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (locked || needsAd) { onClick(e); return; }
    if (stage !== "idle") return;

    const savedEvent = { ...e };
    setStage("impact");

    setTimeout(() => { setStage("freeze"); }, 1200);
    setTimeout(() => { setStage("suction"); }, 2800);
    setTimeout(() => { setStage("overload"); }, 8800);
    setTimeout(() => {
      setStage("rebirth");
      onClick(savedEvent as any);
    }, 10500);
    setTimeout(() => { setStage("idle"); }, 12500);
  };

  const coinVariants: Variants = {
    idle: { scale: 1, opacity: 1, rotateX: 0, z: 0, filter: "brightness(1)", transformPerspective: 1000 },
    impact: {
      scale: [1, 0.85, 1.6], 
      z: [0, 100, 250],
      opacity: [1, 1, 0],
      rotateX: [0, 50, -1440], 
      filter: ["brightness(1)", "brightness(1.4)", "brightness(0.6)"],
      transformPerspective: 1000,
      transition: { times: [0, 0.2, 1], duration: 1.2, ease: "easeOut" }
    },
    freeze: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    suction: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    overload: { scale: 0, opacity: 0, rotateX: 0, z: -300 },
    rebirth: {
      scale: [0, 1.5, 1],
      z: [-400, 180, 0],
      opacity: [0, 1, 1],
      rotateX: [-1440, 0],
      filter: ["brightness(0.5)", "brightness(1.3)", "brightness(1)"],
      transformPerspective: 1000,
      transition: { duration: 2.2, ease: "easeOut", rotateX: { type: "spring", stiffness: 30, damping: 9 } }
    }
  };

  const blackholeVariants: Variants = {
    hidden: { scale: 0, rotate: 0, opacity: 0, z: -100, transformPerspective: 1000 },
    visible: { scale: [0, 1.1, 1], rotate: [0, -1440], opacity: 1, z: 0, transition: { duration: 0.9, ease: "backOut" } },
    shake: {
      scale: [1, 1, 1.22, 1.15, 1.22, 1],
      x: [0, 0, -6, 6, -7, 7, -4, 4, 0],
      y: [0, 0, 4, -4, 6, -6, 3, -3, 0],
      transition: { times: [0, 0.65, 0.72, 0.8, 0.9, 0.95, 1], duration: 1.7, ease: "linear" }
    }
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]" style={{ perspective: "1000px" }}>
      <motion.button
        variants={coinVariants}
        animate={stage}
        initial="idle"
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{
          WebkitTapHighlightColor: "transparent",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden", 
          willChange: "transform, opacity",
        }}
        onClick={handleTriggerAnimasi}
        disabled={stage !== "idle" && !locked && !needsAd}
      >
        {/* POLES: translateZ(0) paksa hardware acceleration */}
        <div className="relative" style={{ transform: "translateZ(0)" }}>{children}</div>
      </motion.button>

      {particles.map((p) => {
        const spiralKeyframesX = [Math.cos(p.initialAngle) * p.initialDistance, Math.cos(p.initialAngle + Math.PI * 1.5) * (p.initialDistance * 0.7), Math.cos(p.initialAngle + Math.PI * 3.5) * (p.initialDistance * 0.35), 0];
        const spiralKeyframesY = [Math.sin(p.initialAngle) * p.initialDistance - 40, Math.sin(p.initialAngle + Math.PI * 1.5) * (p.initialDistance * 0.7) - 25, Math.sin(p.initialAngle + Math.PI * 3.5) * (p.initialDistance * 0.35) - 10, 0];

        return (
          <motion.div
            key={p.id}
            initial={{ x: Math.cos(p.initialAngle) * p.initialDistance, y: Math.sin(p.initialAngle) * p.initialDistance - 40 }}
            animate={ (stage === "suction" || stage === "overload") ? 
              { x: spiralKeyframesX, y: spiralKeyframesY, scale: [0.95, 0.75, 0.4, 0], opacity: [1, 0.95, 0.6, 0], z: [0, -50, -180, -350] } 
              : { x: Math.cos(p.initialAngle) * p.initialDistance, y: Math.sin(p.initialAngle) * p.initialDistance - 40 }
            }
            transition={{ duration: (stage === "suction" || stage === "overload") ? p.randomSpeed : 0.5, delay: p.randomDelay, ease: "linear" }}
            className="absolute w-2.5 h-2.5 rounded-sm z-40 bg-gradient-to-br from-white via-yellow-400 to-amber-600"
            style={{ willChange: "transform", transform: "translateZ(0)" }}
          />
        );
      })}

      <AnimatePresence>
        {(stage === "suction" || stage === "overload") && (
          <motion.div
            variants={blackholeVariants}
            animate={stage === "overload" ? "shake" : "visible"}
            initial="hidden"
            exit={{ scale: 0, opacity: 0, z: -200 }}
            className="absolute w-[120px] h-[120px] rounded-full z-20 flex items-center justify-center"
            style={{ 
                background: "radial-gradient(circle, #000000 15%, #150129 42%, #ffd700 74%, #ff1a00 90%, transparent 100%)", 
                boxShadow: "0 0 50px 18px rgba(139, 92, 246, 0.55), inset 0 0 25px #000", 
                transformStyle: "preserve-3d" 
            }}
          >
            
            <motion.div animate={{ rotate: -720 }} transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }} className="absolute w-[180px] h-[180px] rounded-full opacity-30" style={{ background: "conic-gradient(from 0deg, transparent, rgba(147, 51, 234, 0.4), transparent, rgba(255, 215, 0, 0.2), transparent)" }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} className="absolute inset-1 rounded-full opacity-40 border-2 border-dotted border-[#ff0055]" />
            <div className="absolute inset-2 rounded-full animate-spin [animation-duration:0.4s]" style={{ border: "1.5px dashed rgba(255, 215, 0, 0.3)" }} />
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="relative w-8.5 h-8.5 rounded-full bg-black border border-purple-500/40 flex items-center justify-center">
              <div className="absolute inset-0.5 rounded-full opacity-80 animate-spin [animation-duration:0.25s]" style={{ border: "2px dotted rgba(168, 85, 247, 0.9)" }} />
              <div className="absolute w-5 h-5 rounded-full border border-yellow-500/20 animate-ping opacity-20 [animation-duration:0.9s]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#020005] z-10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}