import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "idle" | "impact" | "vortex" | "absorption" | "critical" | "burst" | "fly";

interface CosmicCoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  locked: boolean;
  needsAd: boolean;
  children: React.ReactNode;
}

const ABSORB_COUNT = 34;
const BURST_COUNT  = 28;
const STREAK_OUTER = 10;
const STREAK_INNER = 7;

export default function CosmicCoin({ onClick, locked, needsAd, children }: CosmicCoinProps) {
  const [stage, setStage]       = useState<Stage>("idle");
  const [countdown, setCountdown] = useState(10);
  const pendingClick = useRef<React.MouseEvent<HTMLButtonElement> | null>(null);
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Pre-generated particle data ── */
  const absorbParticles = useMemo(() =>
    Array.from({ length: ABSORB_COUNT }).map((_, i) => {
      const angle = (i / ABSORB_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist  = 200 + Math.random() * 120;
      // Spiral arc: mid-point rotated 50° clockwise and halved distance
      const midAngle = angle + Math.PI * 0.28;
      const midDist  = dist * 0.45;
      return {
        id: i,
        startX: Math.cos(angle) * dist,
        startY: Math.sin(angle) * dist,
        midX:   Math.cos(midAngle) * midDist,
        midY:   Math.sin(midAngle) * midDist,
        size:         4 + Math.random() * 6,
        duration:     1.6 + Math.random() * 1.6,
        delay:        (i / ABSORB_COUNT) * 4,
        repeatDelay:  0.3 + Math.random() * 1.0,
        hue:          38 + Math.random() * 25,
      };
    }), []);

  const burstParticles = useMemo(() =>
    Array.from({ length: BURST_COUNT }).map((_, i) => {
      const angle = (i / BURST_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      return {
        id: i, angle,
        distance: 80 + Math.random() * 150,
        size:  5 + Math.random() * 10,
        hue:  33 + Math.random() * 32,
        delay: Math.random() * 0.12,
      };
    }), []);

  /* ── Timer helpers ── */
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const t = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  /* ── Main click handler ── */
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Locked = immediate reject (no animation)
    if (locked) { onClick(e); return; }
    // Already animating = ignore
    if (stage !== "idle") return;

    pendingClick.current = e;
    setStage("impact");
    setCountdown(10);

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
    t(10900, () => setStage("fly"));
    t(12800, () => { setStage("idle"); clearTimers(); });
  }, [stage, locked, onClick, t, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  /* ── Countdown tick ── */
  useEffect(() => {
    if (stage !== "vortex" && stage !== "absorption" && stage !== "critical") return;
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 960);
    return () => clearInterval(id);
  }, [stage]);

  /* ── Derived state ── */
  const isActive    = stage !== "idle";
  const isSpinning  = stage === "vortex" || stage === "absorption" || stage === "critical";
  const isAbsorbing = stage === "absorption" || stage === "critical";

  const outerVortexDur = stage === "critical" ? 0.3 : stage === "absorption" ? 0.55 : 1.1;
  const innerVortexDur = stage === "critical" ? 0.5 : stage === "absorption" ? 0.9 : 1.7;
  const coinSpinDur    = stage === "critical" ? 4.0 : stage === "vortex" ? 1.6 : 1.0;
  const coinBrightness = stage === "critical" ? 2.4 : stage === "absorption" ? 1.5 : 1;

  return (
    <>
      {/* ── BG OVERLAY ── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="vortex-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black pointer-events-none"
            style={{ zIndex: 45 }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative flex items-center justify-center w-[260px] h-[260px]"
        style={{ perspective: "900px", zIndex: isActive ? 50 : "auto" }}
      >
        {/* ── SHOCKWAVE (impact) ── */}
        <AnimatePresence>
          {stage === "impact" && (
            <>
              <motion.div
                key="shockwave-1"
                initial={{ scale: 0.6, opacity: 0.9 }}
                animate={{ scale: 3.0, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.65, ease: [0.2, 0, 0.8, 1] }}
                className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
                style={{ border: "2px solid rgba(255, 215, 0, 0.95)", zIndex: 51 }}
              />
              <motion.div
                key="shockwave-2"
                initial={{ scale: 0.6, opacity: 0.5 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{}}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
                style={{ border: "4px solid rgba(255, 180, 20, 0.6)", zIndex: 51 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── OUTER VORTEX STREAKS ── */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              key={`outer-streaks-${stage}`}
              initial={{ opacity: 0, rotate: 0, scale: 0.8 }}
              animate={{ opacity: 1, rotate: -360, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.35 } }}
              transition={{
                opacity: { duration: 0.5, repeat: 0 },
                scale:   { duration: 0.4, repeat: 0 },
                rotate:  { duration: outerVortexDur, repeat: Infinity, ease: "linear" },
              }}
              className="absolute w-[260px] h-[260px] pointer-events-none"
              style={{ zIndex: 51 }}
            >
              {Array.from({ length: STREAK_OUTER }).map((_, i) => {
                const len = 55 + (i % 5) * 18;
                const thick = 1.0 + (i % 3) * 0.7;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      width: `${len}px`,
                      height: `${thick}px`,
                      transform: `rotate(${(i * 360) / STREAK_OUTER}deg) translateY(-50%)`,
                      transformOrigin: "0 50%",
                      background: `linear-gradient(to right, rgba(255,${185 + (i % 4) * 17},30,${0.7 + (i % 3) * 0.1}), rgba(255,200,50,0.1), transparent)`,
                      borderRadius: "999px",
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── INNER VORTEX STREAKS (counter-rotating) ── */}
        <AnimatePresence>
          {isSpinning && (
            <motion.div
              key={`inner-streaks-${stage}`}
              initial={{ opacity: 0, rotate: 0, scale: 0.5 }}
              animate={{ opacity: 0.75, rotate: 360, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{
                opacity: { duration: 0.55, repeat: 0 },
                scale:   { duration: 0.45, repeat: 0 },
                rotate:  { duration: innerVortexDur, repeat: Infinity, ease: "linear" },
              }}
              className="absolute w-[170px] h-[170px] pointer-events-none"
              style={{ zIndex: 52 }}
            >
              {Array.from({ length: STREAK_INNER }).map((_, i) => {
                const len = 30 + (i % 3) * 14;
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      width: `${len}px`,
                      height: "1px",
                      transform: `rotate(${(i * 360) / STREAK_INNER + 18}deg) translateY(-50%)`,
                      transformOrigin: "0 50%",
                      background: `linear-gradient(to right, rgba(255,240,${100 + i * 10},0.9), transparent)`,
                      borderRadius: "999px",
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ABSORPTION PARTICLES (spiral arc) ── */}
        {isAbsorbing && absorbParticles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 1.2 }}
            animate={{
              x: [p.startX, p.midX, 0],
              y: [p.startY, p.midY, 0],
              opacity: [0, 1, 0.8, 0],
              scale:   [1.2, 0.9, 0.5, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatDelay: p.repeatDelay,
              ease: "easeIn",
              times: [0, 0.45, 0.75, 1],
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, #fff 0%, hsl(${p.hue}deg,100%,65%) 55%, hsl(${p.hue + 15}deg,100%,45%) 100%)`,
              boxShadow: `0 0 ${p.size + 3}px hsl(${p.hue}deg,100%,60%)`,
              zIndex: 53,
            }}
          />
        ))}

        {/* ── GLOW HALO (absorption → critical) ── */}
        <AnimatePresence>
          {isAbsorbing && (
            <motion.div
              key={`glow-${stage}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: stage === "critical" ? [0.5, 1.0, 0.5] : [0.2, 0.5, 0.2],
                scale:   stage === "critical" ? [1, 1.4, 1]      : [0.95, 1.15, 0.95],
              }}
              exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.4 } }}
              transition={{ duration: stage === "critical" ? 0.7 : 1.3, repeat: Infinity }}
              className="absolute w-[220px] h-[220px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,245,150,0.55) 0%, rgba(255,200,50,0.2) 45%, transparent 70%)",
                filter: "blur(14px)",
                zIndex: 48,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── CRITICAL WHITE-GOLD WASH ── */}
        <AnimatePresence>
          {stage === "critical" && (
            <motion.div
              key="whitewash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.35, 0.65, 0.45] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,235,80,0.5) 50%, transparent 100%)",
                zIndex: 53,
              }}
            />
          )}
        </AnimatePresence>

        {/* ── COUNTDOWN ── */}
        <AnimatePresence mode="wait">
          {isSpinning && countdown > 0 && (
            <motion.div
              key={countdown}
              initial={{ opacity: 0, scale: 0.4, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.6, y: -4 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute pointer-events-none font-black"
              style={{
                zIndex: 59,
                bottom: "-32px",
                fontSize: "14px",
                color: stage === "critical" ? "#fff" : "#ffd700",
                textShadow: stage === "critical"
                  ? "0 0 16px #fff, 0 0 30px rgba(255,215,0,0.9)"
                  : "0 0 12px rgba(255,215,0,0.95)",
                letterSpacing: "0.18em",
              }}
            >
              {countdown}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BURST FLASH ── */}
        <AnimatePresence>
          {stage === "burst" && (
            <>
              <motion.div
                key="flash-outer"
                initial={{ opacity: 0.85, scale: 0.8 }}
                animate={{ opacity: 0, scale: 4.0 }}
                exit={{}}
                transition={{ duration: 0.7, ease: [0.1, 0, 0.5, 1] }}
                className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,220,60,0.5) 50%, transparent 80%)",
                  zIndex: 56,
                }}
              />
              <motion.div
                key="flash-inner"
                initial={{ opacity: 1, scale: 0.4 }}
                animate={{ opacity: 0, scale: 2.0 }}
                exit={{}}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute w-[180px] h-[180px] rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, #fff 30%, rgba(255,240,100,0.8) 70%, transparent 100%)",
                  zIndex: 57,
                }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── BURST PARTICLES ── */}
        <AnimatePresence>
          {(stage === "burst" || stage === "fly") && burstParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1.5, opacity: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                scale: 0,
                opacity: 0,
              }}
              exit={{}}
              transition={{ duration: 0.9 + p.delay, ease: [0.2, 0.8, 0.4, 1], delay: p.delay }}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: p.size,
                height: p.size,
                background: `hsl(${p.hue}deg, 100%, 65%)`,
                boxShadow: `0 0 ${p.size + 4}px hsl(${p.hue}deg, 100%, 70%)`,
                zIndex: 58,
              }}
            />
          ))}
        </AnimatePresence>

        {/* ── COIN BUTTON ── */}
        <motion.button
          animate={
            stage === "impact"
              ? { scale: [1, 0.80, 1.22, 0.97, 1], y: [0, 2, -8, 2, 0] }
              : stage === "fly"
              ? { x: 105, y: -330, scale: 0, opacity: 0 }
              : {}
          }
          transition={
            stage === "impact"
              ? { duration: 0.72, ease: [0.25, 0.46, 0.45, 0.94] }
              : stage === "fly"
              ? { duration: 0.9, ease: [0.55, 0, 1, 0.45] }
              : {}
          }
          className="absolute outline-none select-none bg-transparent border-none p-0 cursor-pointer"
          style={{
            WebkitTapHighlightColor: "transparent",
            transformStyle: "preserve-3d",
            willChange: "transform, filter",
            filter: `brightness(${coinBrightness})`,
            transition: "filter 1.4s ease",
            zIndex: 54,
          }}
          onClick={handleClick}
          disabled={stage !== "idle" && !locked}
        >
          {/* 3D Y-spin — key change per stage to reset speed */}
          <motion.div
            key={`spin-${isSpinning ? stage : "idle"}`}
            animate={isSpinning ? { rotateY: -360 } : { rotateY: 0 }}
            transition={
              isSpinning
                ? { duration: coinSpinDur, repeat: Infinity, ease: "linear" }
                : { duration: 0.3 }
            }
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Rumble wrapper */}
            <motion.div
              animate={isAbsorbing ? {
                x: [0, -2.5, 2, -1.5, 2.5, -1, 1.5, 0],
                y: [0, 1.5, -2, 2.5, -1.5, 2, -1, 0],
              } : { x: 0, y: 0 }}
              transition={isAbsorbing
                ? { duration: 0.4, repeat: Infinity, ease: "linear" }
                : { duration: 0.15 }
              }
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
