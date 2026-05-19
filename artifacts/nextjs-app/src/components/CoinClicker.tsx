"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer } from "lucide-react";

interface FloatingText {
  id: number;
  x: number;
  y: number;
  rotate: number;
  translateX: number;
}

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick ? : number;
  locked ? : boolean;
  needsAd ? : boolean;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
}: CoinClickerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [floaters, setFloaters] = useState < FloatingText[] > ([]);
  const [shake, setShake] = useState(false);
  
  const handleClick = useCallback(
    (e: React.MouseEvent < HTMLButtonElement > ) => {
      if (locked) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      // Efek angka melayang bawaan lu
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.width / 2;
      const y = rect.height / 2;
      const id = Date.now();
      
      setFloaters((prev) => [
        ...prev,
        { id, x, y, rotate: Math.random() * 40 - 20, translateX: Math.random() * 60 - 30 }
      ]);
      
      setTimeout(() => {
        setFloaters((prev) => prev.filter((f) => f.id !== id));
      }, 800);
      
      // Pemicu fungsi klik utama tanpa timer gantung
      onCoin(pointsPerClick);
    },
    [locked, pointsPerClick, onCoin]
  );
  
  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      <AnimatePresence>
        {floaters.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 1, scale: 1, y: f.y - 20, x: f.x, rotate: 0 }}
            animate={{ 
              opacity: 0, 
              scale: 1.8,            
              y: f.y - 160,          
              x: f.x + f.translateX, 
              rotate: f.rotate       
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute pointer-events-none font-black text-4xl text-yellow-400 z-50 drop-shadow-[0_0_15px_rgba(255,215,0,1)]"
          >
            +{pointsPerClick}
          </motion.span>
        ))}
      </AnimatePresence>

      <motion.button
        onMouseDown={() => !locked && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => !locked && setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onClick={handleClick}
        animate={shake ? { x: [-6, 6, -6, 6, 0] } : isPressed ? { scale: 0.94 } : { scale: 1 }}
        whileTap={{ scale: locked ? 1 : 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`relative w-[280px] h-[280px] flex items-center justify-center outline-none ${locked ? 'opacity-60 grayscale' : 'opacity-100'}`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            background: locked 
              ? "radial-gradient(circle, rgba(255,0,0,0.2) 0%, transparent 70%)"
              : needsAd
              ? "radial-gradient(circle at 50% 50%, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 40%, transparent 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(255,200,60,0.55) 0%, rgba(255,170,30,0.25) 35%, rgba(255,150,0,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        {!locked && (
          <>
            <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 4, -8] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-2 top-10 text-3xl">🧩</motion.div>
            <motion.div animate={{ y: [0, 6, 0], rotate: [10, -4, 10] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-2 top-16 text-3xl">🧩</motion.div>
          </>
        )}

        <motion.div
          className="relative w-[180px] h-[180px] rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : needsAd
              ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)" 
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: locked
              ? "0 12px 30px rgba(0,0,0,0.55)"
              : needsAd
              ? "0 12px 30px rgba(0,0,0,0.55), 0 0 35px rgba(255,255,255,0.25), inset 0 -8px 18px rgba(39,39,42,0.6), inset 0 6px 14px rgba(255,255,255,0.4)" 
              : "0 12px 30px rgba(0,0,0,0.55), 0 0 40px rgba(255,190,40,0.7), inset 0 -8px 18px rgba(120,60,0,0.55), inset 0 6px 14px rgba(255,255,255,0.55)",
          }}
          animate={!locked ? { y: [0, -6, 0] } : {}}
          transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
        >
          <div className="absolute inset-2 rounded-full" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.45) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.45) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          {/* Inner medallion */}
          <div
            className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: locked
                ? "#333"
                : needsAd
                ? "radial-gradient(circle at 35% 30%, #FAFAFA 0%, #A1A1AA 60%, #3F3F46 100%)"
                : "radial-gradient(circle at 35% 30%, #2a1805 0%, #1a1204 100%)",

              boxShadow: needsAd
                ? "inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(39,39,42,0.6)"
                : "inset 0 4px 10px rgba(255,220,120,.15), inset 0 -6px 12px rgba(0,0,0,.55)",

              border: needsAd
                ? "2px solid rgba(113,113,122,0.55)"
                : "2px solid rgba(120,70,10,0.55)",
            }}
          >
            {/* MODE NORMAL SAJA */}
            {!locked && !needsAd ? (
              <>
                {/* PURPLE PLASMA */}
                <motion.div
                  animate={{
                    rotate: 360,
                    scale: [1, 1.04, 1],
                    opacity: [0.9, 1, 0.9]
                  }}
                  transition={{
                    rotate: {
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear"
                    },
                    scale: {
                      duration: 4,
                      repeat: Infinity
                    },
                    opacity: {
                      duration: 3,
                      repeat: Infinity
                    }
                  }}
                  className="absolute w-[104px] h-[104px]"
                  style={{
                    clipPath:
                      "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",

                    background: `
                    radial-gradient(circle at 50% 50%,
                    rgba(190,80,255,.95) 0%,
                    rgba(120,0,255,.9) 35%,
                    rgba(60,0,120,.95) 65%,
                    rgba(10,0,20,1) 100%)
                    `,

                    filter: "blur(4px)",
                    boxShadow:
                      "0 0 18px rgba(180,60,255,.8)"
                  }}
                />

                {/* HEXAGON FRAME */}
                <div
                  className="absolute w-[100px] h-[100px]"
                  style={{
                    clipPath:
                      "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",

                    background:
                      "linear-gradient(145deg,#fff0a8,#f7c53b,#a85c00)",

                    boxShadow: `
                    0 0 12px rgba(255,190,50,.6),
                    inset 0 0 10px rgba(255,255,255,.4)
                    `
                  }}
                >
                  {/* lubang hexagon */}
                  <div
                    className="absolute inset-[8px]"
                    style={{
                      clipPath:
                        "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",

                      background:
                        "transparent",

                      backdropFilter: "blur(1px)",

                      boxShadow: `
                        inset 0 0 10px rgba(255,180,40,.35)
                      `
                    }}
                  />
                </div>

                {/* CENTER DISC */}
                <div
                  className="absolute w-[46px] h-[46px] rounded-full"
                  style={{
                    zIndex: 5,
                    background:
                      "radial-gradient(circle at 35% 30%,#FFE680,#E8A317,#8A5A0E)",

                    boxShadow: `
                    inset 0 3px 8px rgba(255,255,255,.5),
                    inset 0 -4px 8px rgba(80,40,0,.5),
                    0 0 10px rgba(255,180,40,.5)
                    `
                  }}
                />

                {/* Z PALING ATAS */}
                <span
                  className="absolute font-black text-[68px] leading-none select-none"
                  style={{
                    zIndex: 20,
                    color: "#7A4A08",
                    textShadow:
                      "0 2px 0 rgba(255,240,180,.7)"
                  }}
                >
                  Z
                </span>
              </>
            ) : needsAd && !locked ? (
              <Timer
                size={52}
                className="text-zinc-800 drop-shadow-[0_2px_0_rgba(255,255,255,0.6)]"
              />
            ) : (
              <span
                className="font-black text-[68px]"
                style={{ color: "#555" }}
              >
                🔒
              </span>
            )}
          </div>

          {!locked && <div className="absolute top-3 left-6 w-16 h-8 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85), rgba(255,255,255,0) 70%)" }} />}
        </motion.div>
      </motion.button>
    </div>
  );
}