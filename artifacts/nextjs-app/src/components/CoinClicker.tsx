"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
  onAdClick?: () => void;
}

interface GoldParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: 'burst' | 'suck';
  angle: number;
  orbitRadius: number;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
  onAdClick,
}: CoinClickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isMatrixSpinning, setIsMatrixSpinning] = useState(false);
  const [isCoreShaking, setIsCoreShaking] = useState(false);
  const particlesRef = useRef<GoldParticle[]>([]);

  const spawnParticles = useCallback((cx: number, cy: number) => {
    const pCount = 50;
    const arr: GoldParticle[] = [];
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      arr.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        alpha: 1,
        phase: 'burst',
        angle: angle,
        orbitRadius: 80 + Math.random() * 40
      });
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();

    let localTime = 0;
    let animationFrameId: number;

    const render = () => {
      localTime += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // 1. STRIP EMAS RADIAL
      if (isMatrixSpinning) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((localTime * 15 * Math.PI) / 180);

        const stripCount = 45;
        const outerLimit = cx * 0.95;

        for (let i = 0; i < stripCount; i++) {
          const angle = (i * Math.PI * 2) / stripCount;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
          ctx.lineTo(Math.cos(angle) * outerLimit, Math.sin(angle) * outerLimit);
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.85)' : 'rgba(232, 154, 18, 0.35)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. TEXTURE PLASMA UNGU
      if (!locked && !needsAd) {
        ctx.save();
        const glowGrad = ctx.createRadialGradient(cx, cy, 25, cx, cy, 65);
        glowGrad.addColorStop(0, 'rgba(147, 51, 234, 1)');
        glowGrad.addColorStop(0.4, 'rgba(192, 38, 211, 0.6)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 65, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 230, 255, 1)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 12;

        const drawLightning = (radius: number, segs: number) => {
          ctx.beginPath();
          for (let i = 0; i <= segs; i++) {
            const angle = (i * Math.PI * 2) / segs;
            const deviation = (Math.random() - 0.5) * 10;
            const r = radius + deviation;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        };

        drawLightning(42, 14);
        drawLightning(50, 10);
        ctx.restore();
      }

      // 3. MEKANISME PARTIKEL EMAS
      if (isMatrixSpinning) {
        particlesRef.current.forEach((p) => {
          if (p.phase === 'burst') {
            p.x += p.vx;
            p.y += p.vy;
            const dist = Math.hypot(p.x - cx, p.y - cy);
            if (dist >= p.orbitRadius) p.phase = 'suck';
          } else {
            p.angle += 0.12;
            const currentDist = Math.hypot(p.x - cx, p.y - cy) - 4;
            p.x = cx + Math.cos(p.angle) * currentDist;
            p.y = cy + Math.sin(p.angle) * currentDist;

            if (currentDist <= 8) p.alpha = 0;
          }

          if (p.alpha > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(252, 211, 77, ${p.alpha})`;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 4;
            ctx.fill();
            ctx.restore();
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isMatrixSpinning, locked, needsAd]);

  // 🛠️ LOGIC KLIK BARU: ANTI PLING-PLONG STATE
  const handleCoinClick = () => {
    if (locked || isMatrixSpinning) return;

    // Kalau butuh iklan, LANGSUNG tembak onAdClick dari parent tanpa ba-bi-bu
    if (needsAd) {
      if (onAdClick) onAdClick();
      return;
    }

    // Jalankan Animasi Clicker Utama koin emas biasa
    setIsMatrixSpinning(true);
    const canvas = canvasRef.current;
    if (canvas) {
      spawnParticles(canvas.width / 2, canvas.height / 2);
    }

    const shakeTimer = setTimeout(() => {
      setIsCoreShaking(true);
    }, 6000);

    const finalTimer = setTimeout(() => {
      onCoin(pointsPerClick); // Di dalam fungsi ini di parent lu, WAJIB set state needsAd jadi true!
      setIsMatrixSpinning(false);
      setIsCoreShaking(false);
      particlesRef.current = [];
    }, 6200);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative mx-auto flex items-center justify-center w-full h-[380px] max-w-[380px] select-none"
    >
      {/* AREA KLIK TAMENG UTAMA (z-40) */}
      <div 
        onClick={handleCoinClick}
        className="absolute w-[220px] h-[220px] rounded-full z-40 cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
      />

      {/* CANVAS RENDERING EFFECTS (z-20) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* FLOATING DECORATIONS */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute left-4 top-12 text-4xl">🧩</motion.div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute right-4 top-20 text-4xl">🎲</motion.div>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="absolute right-6 bottom-20 text-4xl">💸</motion.div>
      </div>

      {/* VISUAL BODY KOIN (z-30) */}
      <motion.div
        animate={isCoreShaking ? { x: [-6, 6, -5, 5, -2, 2, 0], y: [-4, 4, 0] } : {}}
        transition={{ duration: 0.2, ease: "linear" }}
        className={`relative w-[210px] h-[210px] flex items-center justify-center rounded-full overflow-hidden z-30 ${
          locked ? "opacity-60 grayscale" : "opacity-100"
        }`}
      >
        <motion.div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            background: locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : needsAd
              ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)" 
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.4), inset 0 5px 10px rgba(255,255,255,0.4)"
          }}
          animate={isMatrixSpinning && !isCoreShaking ? { rotate: 2160 } : { rotate: 0 }}
          transition={{ duration: 6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="absolute inset-2 rounded-full" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.4) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.4) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 10px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          <div
            className="relative w-[140px] h-[140px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: locked ? "#333" : needsAd ? "#3f3f46" : "#1a1204",
              boxShadow: "inset 0 5px 10px rgba(0,0,0,0.85)"
            }}
          >
            {!locked && !needsAd ? (
              <>
                <div
                  className="absolute w-[124px] h-[124px]"
                  style={{
                    transform: "rotate(90deg)",
                    clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
                    background: "linear-gradient(145deg, #fff0a8, #f7c53b, #a85c00)",
                  }}
                >
                  <div className="absolute inset-[5px]" style={{ clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)", background: "#1a1204" }} />
                </div>

                <div 
                  className="absolute w-[60px] h-[60px] rounded-full flex items-center justify-center z-10"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 40%, #7A4A08 100%)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.5), inset 0 1.5px 3px #fff"
                  }}
                >
                  <span className="font-black text-[34px] leading-none select-none text-[#2a1805]" style={{ textShadow: "0 1px 0 rgba(255,255,255,0.4)" }}>
                    Z
                  </span>
                </div>
              </>
            ) : needsAd && !locked ? (
              <Timer size={44} className="text-zinc-300 animate-pulse" />
            ) : (
              <span className="text-3xl">🔒</span>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}