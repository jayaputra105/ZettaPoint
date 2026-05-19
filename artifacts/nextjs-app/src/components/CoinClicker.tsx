"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
  onAdClick?: () => void; // 📺 Fungsi pemicu nonton iklan dari parent lu
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
  speed: number;
  orbitRadius: number;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
  onAdClick,
}: CoinClickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMatrixSpinning, setIsMatrixSpinning] = useState(false);
  const [isCoreShaking, setIsCoreShaking] = useState(false);
  const particlesRef = useRef<GoldParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const spawnParticles = useCallback((cx: number, cy: number) => {
    const pCount = 45;
    const arr: GoldParticle[] = [];
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;
      arr.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        alpha: 1,
        phase: 'burst',
        angle: angle,
        speed: speed,
        orbitRadius: 90 + Math.random() * 50
      });
    }
    particlesRef.current = arr;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localTime = 0;

    const renderLoop = () => {
      localTime += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      if (isMatrixSpinning) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((localTime * 45 * Math.PI) / 180);

        const stripCount = 60;
        const outerLimit = 180;
        
        for (let i = 0; i < stripCount; i++) {
          const angle = (i * Math.PI * 2) / stripCount;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 60, Math.sin(angle) * 60);
          ctx.lineTo(Math.cos(angle) * outerLimit, Math.sin(angle) * outerLimit);
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 210, 74, 0.75)' : 'rgba(232, 154, 18, 0.4)';
          ctx.lineWidth = 2 + Math.random() * 2;
          ctx.stroke();
        }
        ctx.restore();
      }

      if (!locked && !needsAd) {
        ctx.save();
        const glowGrad = ctx.createRadialGradient(cx, cy, 35, cx, cy, 75);
        glowGrad.addColorStop(0, 'rgba(160, 0, 255, 0.8)');
        glowGrad.addColorStop(0.5, 'rgba(230, 150, 255, 0.4)');
        glowGrad.addColorStop(1, 'rgba(160, 0, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(230, 180, 255, 0.95)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 10;

        const renderLightningArc = (radius: number, segments: number) => {
          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const angle = (i * Math.PI * 2) / segments;
            const offset = (Math.random() - 0.5) * 12; 
            const r = radius + offset;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        };

        renderLightningArc(46, 16);
        renderLightningArc(54, 12);
        ctx.restore();
      }

      if (isMatrixSpinning) {
        particlesRef.current.forEach((p) => {
          if (p.phase === 'burst') {
            p.x += p.vx;
            p.y += p.vy;
            const dist = Math.hypot(p.x - cx, p.y - cy);
            if (dist >= p.orbitRadius) {
              p.phase = 'suck';
            }
          } else {
            p.angle += 0.15;
            const currentDist = Math.hypot(p.x - cx, p.y - cy) - 4.5;
            
            p.x = cx + Math.cos(p.angle) * currentDist;
            p.y = cy + Math.sin(p.angle) * currentDist;

            if (currentDist <= 10) {
              p.alpha = 0;
            }
          }

          if (p.alpha > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 220, 80, ${p.alpha})`;
            ctx.shadowColor = '#ffd24a';
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isMatrixSpinning, locked, needsAd]);

  const handleCoinClick = useCallback(() => {
    // 📺 KUNCI: Kalau koin butuh iklan dan user nge-klik, panggil fungsi iklan parent!
    if (needsAd && !locked && !isMatrixSpinning) {
      if (onAdClick) onAdClick();
      return;
    }

    if (locked || isMatrixSpinning) return;

    setIsMatrixSpinning(true);
    const canvas = canvasRef.current;
    if (canvas) {
      spawnParticles(canvas.width / 2, canvas.height / 2);
    }

    const shakeTimer = setTimeout(() => {
      setIsCoreShaking(true);
    }, 6000);

    const finalTimer = setTimeout(() => {
      onCoin(pointsPerClick);
      setIsMatrixSpinning(false);
      setIsCoreShaking(false);
      particlesRef.current = [];
    }, 6200);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(finalTimer);
    };
  }, [locked, needsAd, isMatrixSpinning, pointsPerClick, onCoin, onAdClick, spawnParticles]);

  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[420px] max-w-[420px] select-none">
      
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <canvas ref={canvasRef} width={400} height={400} className="w-[400px] h-[400px]" />
      </div>

      <div className="absolute inset-0 pointer-events-none z-10">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute left-6 top-16 text-4xl">🧩</motion.div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute right-6 top-24 text-4xl">🎲</motion.div>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="absolute right-8 bottom-24 text-4xl">💸</motion.div>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }} className="absolute left-10 bottom-20 text-3xl">🪙</motion.div>
      </div>

      <motion.button
        onClick={handleCoinClick}
        animate={isCoreShaking ? { x: [-8, 8, -6, 6, -3, 3, 0], y: [-5, 5, -3, 3, 0] } : {}}
        transition={{ duration: 0.2, ease: "linear" }}
        className={`relative w-[210px] h-[210px] flex items-center justify-center outline-none z-30 ${
          locked ? "opacity-60 grayscale" : "opacity-100"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <motion.div
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: locked
              ? "radial-gradient(circle at 35% 30%, #444 0%, #222 60%, #111 100%)"
              : needsAd
              ? "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #D4D4D8 25%, #71717A 60%, #27272A 100%)" 
              : "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 25%, #E89A12 60%, #7A4A08 100%)",
            boxShadow: "0 12px 35px rgba(0,0,0,0.65), inset 0 -8px 16px rgba(0,0,0,0.4), inset 0 6px 14px rgba(255,255,255,0.4)"
          }}
          animate={isMatrixSpinning && !isCoreShaking ? { rotate: 2160 } : { rotate: 0 }}
          transition={{ duration: 6, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="absolute inset-2 rounded-full" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.4) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.4) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 14px), #000 calc(100% - 12px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          <div
            className="relative w-[146px] h-[146px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: locked ? "#333" : needsAd ? "#3f3f46" : "#1a1204",
              boxShadow: "inset 0 6px 12px rgba(0,0,0,0.8)"
            }}
          >
            {!locked && !needsAd ? (
              <>
                <div
                  className="absolute w-[130px] h-[130px]"
                  style={{
                    transform: "rotate(90deg)",
                    clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
                    background: "linear-gradient(145deg, #fff0a8, #f7c53b, #a85c00)",
                  }}
                >
                  <div className="absolute inset-[6px]" style={{ clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)", background: "#1a1204" }} />
                </div>

                <div 
                  className="absolute w-[64px] h-[64px] rounded-full flex items-center justify-center z-10"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 40%, #7A4A08 100%)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px #fff"
                  }}
                >
                  <span className="font-black text-[38px] leading-none select-none text-[#2a1805]" style={{ textShadow: "0 1.5px 0 rgba(255,255,255,0.4)" }}>
                    Z
                  </span>
                </div>
              </>
            ) : needsAd && !locked ? (
              <Timer size={48} className="text-zinc-300 animate-pulse" />
            ) : (
              <span className="text-4xl">🔒</span>
            )}
          </div>
        </motion.div>
      </motion.button>
    </div>
  );
}