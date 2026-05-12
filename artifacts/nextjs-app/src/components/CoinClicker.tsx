"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingText {
  id: number;
  x: number;
  y: number;
}

interface CoinClickerProps {
  onCoin: () => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 10,
  locked = false,
  needsAd = false,
}: CoinClickerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const [nextId, setNextId] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [shake, setShake] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = nextId;
      setNextId((n) => n + 1);

      if (!needsAd) {
        const offsetX = (Math.random() - 0.5) * 80;
        setFloaters((prev) => [...prev, { id, x: x + offsetX, y }]);
        setRipples((prev) => [...prev, { id, x, y }]);
        setTimeout(() => {
          setFloaters((prev) => prev.filter((f) => f.id !== id));
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 1000);
      }

      onCoin();
    },
    [nextId, onCoin, locked, needsAd]
  );

  const coinStyle = locked
    ? {
        background:
          "radial-gradient(circle at 35% 30%, #3a3a3a 0%, #222 28%, #1a1a1a 55%, #111 78%, #0a0a0a 100%)",
        boxShadow: "0 0 20px rgba(255,50,50,0.15), 0 10px 30px rgba(0,0,0,0.8)",
        border: "3px solid rgba(255,50,50,0.25)",
      }
    : needsAd
    ? {
        background:
          "radial-gradient(circle at 35% 30%, #FFFDE0 0%, #FFD700 28%, #E6A800 55%, #B8860B 78%, #7A5C00 100%)",
        boxShadow:
          "0 0 50px rgba(255,215,0,0.4), 0 0 100px rgba(255,215,0,0.15), 0 20px 60px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,220,0.4)",
        border: "3px solid rgba(255,165,0,0.5)",
        opacity: 0.85,
      }
    : {
        background:
          "radial-gradient(circle at 35% 30%, #FFFDE0 0%, #FFD700 28%, #E6A800 55%, #B8860B 78%, #7A5C00 100%)",
        boxShadow: isPressed
          ? "0 4px 20px rgba(255,215,0,0.4), inset 0 4px 16px rgba(0,0,0,0.4)"
          : "0 0 50px rgba(255,215,0,0.6), 0 0 100px rgba(255,215,0,0.25), 0 20px 60px rgba(0,0,0,0.7), inset 0 2px 8px rgba(255,255,220,0.4)",
        border: "3px solid rgba(255,240,100,0.6)",
      };

  return (
    <div className="relative flex items-center justify-center select-none">
      <motion.button
        onMouseDown={() => !locked && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={
          shake
            ? { x: [-6, 6, -6, 6, 0], transition: { duration: 0.35 } }
            : {
                scale: locked ? 0.92 : isPressed ? 0.88 : [1, 1.035, 1],
                rotateZ: isPressed ? -2 : 0,
              }
        }
        transition={
          isPressed
            ? { type: "spring", stiffness: 500, damping: 18 }
            : {
                scale: locked
                  ? {}
                  : {
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                rotateZ: { duration: 0.15 },
              }
        }
        className="relative w-52 h-52 rounded-full cursor-pointer outline-none focus:outline-none"
        style={{ ...coinStyle, overflow: "visible" }}
      >
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: locked
              ? "none"
              : "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.45) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)",
            pointerEvents: "none",
          }}
        />

        <span
          className="absolute inset-0 flex items-center justify-center font-black"
          style={{
            fontSize: locked ? "3.5rem" : "4.5rem",
            textShadow: locked
              ? "0 2px 8px rgba(0,0,0,0.8)"
              : "0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(255,220,0,0.8)",
            color: locked ? "rgba(255,80,80,0.6)" : needsAd ? "rgba(255,255,220,0.7)" : "rgba(255,255,220,0.95)",
            letterSpacing: "-2px",
          }}
        >
          {locked ? "🔒" : needsAd ? "🎬" : "₿"}
        </span>

        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className="absolute rounded-full pointer-events-none"
              initial={{ width: 0, height: 0, opacity: 0.7, x: r.x, y: r.y, translateX: "-50%", translateY: "-50%" }}
              animate={{ width: 220, height: 220, opacity: 0, x: r.x, y: r.y, translateX: "-50%", translateY: "-50%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ border: "2px solid rgba(255,215,0,0.5)", position: "absolute" }}
            />
          ))}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: f.y, x: f.x - 104, scale: 1.2 }}
            animate={{ opacity: 0, y: f.y - 110, scale: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-2xl"
            style={{
              color: "#FFD700",
              textShadow: "0 0 12px #FFD700, 0 0 24px rgba(255,215,0,0.6)",
              zIndex: 100,
              left: 0,
              top: 0,
            }}
          >
            +{pointsPerClick}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
