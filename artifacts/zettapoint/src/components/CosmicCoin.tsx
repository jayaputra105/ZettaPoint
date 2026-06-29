import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CosmicCoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  locked: boolean;
  needsAd: boolean;
  children: React.ReactNode;
}

const PARTICLE_COUNT = 16;

export default function CosmicCoin({ onClick, locked, needsAd, children }: CosmicCoinProps) {
  const [animating, setAnimating] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      distance: 65 + Math.random() * 55,
      size: 5 + Math.random() * 7,
      hue: 38 + Math.random() * 28,
      lightness: 58 + Math.random() * 22,
    })),
  []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onClick(e);

    if (locked || needsAd || animating) return;

    setAnimating(true);
    setBurstKey((k) => k + 1);
    setTimeout(() => setAnimating(false), 700);
  }, [onClick, locked, needsAd, animating]);

  return (
    <div
      className="relative flex items-center justify-center w-[260px] h-[260px]"
      style={{ perspective: "900px" }}
    >
      <AnimatePresence>
        {animating && (
          <>
            {particles.map((p) => (
              <motion.div
                key={`p-${burstKey}-${p.id}`}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  scale: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.52, ease: "easeOut" }}
                className="absolute rounded-full pointer-events-none z-40"
                style={{
                  width: p.size,
                  height: p.size,
                  background: `hsl(${p.hue}deg, 100%, ${p.lightness}%)`,
                  boxShadow: `0 0 ${p.size + 2}px rgba(255, 200, 50, 0.85)`,
                }}
              />
            ))}

            <motion.div
              key={`ring-${burstKey}`}
              initial={{ scale: 0.55, opacity: 0.75 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{ duration: 0.48, ease: "easeOut" }}
              className="absolute w-[180px] h-[180px] rounded-full pointer-events-none z-30"
              style={{
                border: "2px solid rgba(255, 215, 0, 0.9)",
                boxShadow: "0 0 10px rgba(255, 200, 50, 0.5)",
              }}
            />
          </>
        )}
      </AnimatePresence>

      <motion.button
        animate={animating ? {
          rotateY: [0, 90, 180, 270, 360],
          scale: [1, 0.9, 1.08, 1],
        } : {}}
        transition={{
          duration: 0.62,
          ease: "easeInOut",
          scale: { times: [0, 0.3, 0.7, 1] },
        }}
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{
          WebkitTapHighlightColor: "transparent",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        onClick={handleClick}
      >
        <div style={{ transform: "translateZ(0)" }}>{children}</div>
      </motion.button>
    </div>
  );
}
