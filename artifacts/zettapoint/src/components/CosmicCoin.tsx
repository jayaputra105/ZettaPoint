import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "idle" | "impact" | "vortex" | "absorption" | "critical" | "burst" | "fly";

interface CosmicCoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  locked: boolean;
  needsAd: boolean;
  children: React.ReactNode;
}

const ABSORB_COUNT = 20;
const BURST_COUNT = 20;
const STREAK_COUNT = 8;

export default function CosmicCoin({ onClick, locked, needsAd, children }: CosmicCoinProps) {
  const [stage, setStage] = useState<Stage>("idle");
  const [countdown, setCountdown] = useState(10);
  const pendingClick = useRef<React.MouseEvent<HTMLButtonElement> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const absorbParticles = useMemo(() =>
    Array.from({ length: ABSORB_COUNT }).map((_, i) => {
      const angle = (i / ABSORB_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const dist = 230 + Math.random() * 100;
      return {
        id: i,
        startX: Math.cos(angle) * dist,
        startY: Math.sin(angle) * dist,
        size: 4 + Math.random() * 5,
        duration: 1.8 + Math.random() * 1.4,
        delay: (i / ABSORB_COUNT) * 3.5,
        repeatDelay: 0.4 + Math.random() * 1.2,
      };
    }), []);

  const burstParticles = useMemo(() =>
    Array.from({ length: BURST_COUNT }).map((_, i) => {
      const angle = (i / BURST_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      return {
        id: i,
        angle,
        distance: 90 + Math.random() * 130,
        size: 5 + Math.random() * 9,
        hue: 35 + Math.random() * 30,
      };
    }), []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (locked || needsAd) { onClick(e); return; }
    if (stage !== "idle") return;

    pendingClick.current = e;
    setStage("impact");
    setCountdown(10);

    const t = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      timers.current.push(id);
    };

    t(700,   () => setStage("vortex"));
    t(3500,  () => setStage("absorption"));
    t(8500,  () => setStage("critical"));
    t(10500, () => {
      setStage("burst");
      if (pendingClick.current) {
        onClick(pendingClick.current as React.MouseEvent<HTMLButtonElement>);
        pendingClick.current = null;
      }
    });
    t(10800, () => setStage("fly"));
    t(12500, () => { setStage("idle"); clearTimers(); });
  }, [stage, locked, needsAd, onClick, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (stage !== "vortex" && stage !== "absorption" && stage !== "critical") return;
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 970);
    return () => clearInterval(id);
  }, [stage]);

  const isActive    = stage !== "idle";
  const isSpinning  = stage === "vortex" || stage === "absorption" || stage === "critical";
  const isAbsorbing = stage === "absorption" || stage === "critical";

  const vortexDuration = stage === "critical" ? 0.35 : stage === "absorption" ? 0.7 : 1.4;
  const coinSpinDuration = stage === "critical" ? 3.5 : stage === "vortex" ? 1.8 : 1.2;
  const coinBrightness = stage === "critical" ? 2.2 : stage === "absorption" ? 1.45 : 1;

  return (
    <>
      {/* ── BG OVERLAY ── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="vortex-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.52 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 bg-black pointer-events-none"
            style={{ zIndex: 45 }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative flex items-center justify-center w-[260px] h-[260px]"
        style={{ perspective: "900px", zIndex: isActive ? 50 : "auto", position: "relative" }}
      >
        {/* ── SHOCKWAVE (impact) ── */}
        <AnimatePresence>
          {stage === "impact" && (
            <motion.div
              key="shockwave"
              initial={{ scale: 0.7, opacity: 0.85 }}
              animate={{ scale: 2.8, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.65, ease: "easeOut" }}
              className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{
                border: "2.5px solid rgba(255, 215, 0, 0.9)",
                boxShadow: "0 0 18px rgba(255, 200, 50, 0.55)",
                zIndex: 51,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── VORTEX WIND STREAKS ── */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              key={`streaks-${stage}`}
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: -360 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{
                opacity: { duration: 0.4, repeat: 0 },
                rotate: { duration: vortexDuration, repeat: Infinity, ease: "linear" },
              }}
              className="absolute w-[250px] h-[250px] pointer-events-none"
              style={{ zIndex: 51 }}
            >
              {Array.from({ length: STREAK_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: `${60 + (i % 4) * 22}px`,
                    height: `${1.2 + (i % 3) * 0.6}px`,
                    transform: `rotate(${(i * 360) / STREAK_COUNT}deg) translateY(-50%)`,
                    transformOrigin: "0 50%",
                    background: `linear-gradient(to right, rgba(255,${190 + (i % 3) * 20},40,${0.55 + (i % 3) * 0.15}), transparent)`,
                    borderRadius: "999px",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ABSORPTION PARTICLES ── */}
        {isAbsorbing && absorbParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 1, scale: 1 }}
            animate={{ x: 0, y: 0, opacity: [1, 0.9, 0], scale: [1, 0.7, 0] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatDelay: p.repeatDelay,
              ease: "easeIn",
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              background: "radial-gradient(circle, #fff 0%, #ffd700 55%, #ff8c00 100%)",
              boxShadow: "0 0 7px rgba(255, 200, 50, 0.9)",
              zIndex: 52,
            }}
          />
        ))}

        {/* ── GLOW INTENSIFIER (absorption → critical) ── */}
        <AnimatePresence>
          {isAbsorbing && (
            <motion.div
              key="glow-ring"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: stage === "critical" ? [0.4, 0.85, 0.4] : [0.2, 0.45, 0.2],
                scale:   stage === "critical" ? [1, 1.35, 1]      : [1, 1.1, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: stage === "critical" ? 0.8 : 1.4, repeat: Infinity }}
              className="absolute w-[210px] h-[210px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,240,140,0.5) 0%, rgba(255,200,50,0.2) 50%, transparent 72%)",
                filter: "blur(12px)",
                zIndex: 48,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── WHITE-GOLD WASH (critical) ── */}
        <AnimatePresence>
          {stage === "critical" && (
            <motion.div
              key="whitewash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.65, 0.4, 0.7] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,230,80,0.45) 55%, transparent 100%)",
                zIndex: 53,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── COUNTDOWN ── */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.25 }}
              className="absolute pointer-events-none font-black"
              style={{
                zIndex: 58,
                bottom: "-28px",
                fontSize: "13px",
                color: "#ffd700",
                textShadow: "0 0 12px rgba(255,215,0,0.95)",
                letterSpacing: "0.15em",
              }}
            >
              {countdown}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BURST FLASH ── */}
        <AnimatePresence>
          {stage === "burst" && (
            <motion.div
              key="burst-flash"
              initial={{ opacity: 1, scale: 0.9 }}
              animate={{ opacity: 0, scale: 3.5 }}
              exit={{}}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,230,80,0.7) 45%, transparent 80%)",
                zIndex: 56,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── BURST PARTICLES ── */}
        <AnimatePresence>
          {(stage === "burst" || stage === "fly") && burstParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1.3, opacity: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                scale: 0,
                opacity: 0,
              }}
              exit={{}}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: `hsl(${p.hue}deg, 100%, 65%)`,
                boxShadow: `0 0 ${p.size + 3}px rgba(255, 200, 50, 0.9)`,
                zIndex: 57,
              }}
            />
          ))}
        </AnimatePresence>

        {/* ── COIN BUTTON ── */}
        <motion.button
          animate={
            stage === "impact" ? { scale: [1, 0.83, 1.18, 1] } :
            stage === "fly"    ? { x: 110, y: -340, scale: 0, opacity: 0 } :
            {}
          }
          transition={
            stage === "impact" ? { duration: 0.68, ease: "easeOut" } :
            stage === "fly"    ? { duration: 0.85, ease: "easeIn" } :
            {}
          }
          className="absolute outline-none select-none bg-transparent border-none p-0 cursor-pointer"
          style={{
            WebkitTapHighlightColor: "transparent",
            transformStyle: "preserve-3d",
            willChange: "transform, filter",
            filter: `brightness(${coinBrightness})`,
            transition: "filter 1.2s ease",
            zIndex: 54,
          }}
          onClick={handleClick}
          disabled={stage !== "idle" && !locked && !needsAd}
        >
          {/* 3D spin wrapper — key remounts to update speed per stage */}
          <motion.div
            key={`spin-${isSpinning ? stage : "idle"}`}
            animate={isSpinning ? { rotateY: -360 } : { rotateY: 0 }}
            transition={isSpinning
              ? { duration: coinSpinDuration, repeat: Infinity, ease: "linear" }
              : { duration: 0.3 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Rumble wrapper */}
            <motion.div
              animate={isAbsorbing ? {
                x: [0, -2, 2, -1.5, 1.5, -1, 1, 0],
                y: [0, 1, -1, 2, -2, 1, -1, 0],
              } : { x: 0, y: 0 }}
              transition={isAbsorbing
                ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }}
              style={{ transform: "translateZ(0)" }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
