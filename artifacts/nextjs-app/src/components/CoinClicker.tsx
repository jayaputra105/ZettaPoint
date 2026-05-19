"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
  onAdRequired?: () => void;
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
  onAdRequired,
}: CoinClickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMatrixSpinning, setIsMatrixSpinning] = useState(false);
  const [isCoreShaking, setIsCoreShaking] = useState(false);
  const particlesRef = useRef<GoldParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // ⚡ GENERATOR PARTIKEL EMAS (BERAGAM & DINAMIS)
  const spawnParticles = useCallback((cx: number, cy: number) => {
    const pCount = 45;
    const arr: GoldParticle[] = [];
    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6; // Kecepatan ledakan keluar
      arr.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4, // Ukuran bervariasi
        alpha: 1,
        phase: 'burst',
        angle: angle,
        speed: speed,
        orbitRadius: 90 + Math.random() * 50 // Jarak melar terjauh sebelum kesedot
      });
    }
    particlesRef.current = arr;
  }, []);

  // 🎨 CORE ENGINE RENDERING: PLASMA PETIR & STRIP EMAS RADIAL
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

      // ----------------------------------------------------
      // EFEK 1: STRIP EMAS RADIAL (Muter Kencang & Melar Menjauh)
      // ----------------------------------------------------
      if (isMatrixSpinning) {
        ctx.save();
        ctx.translate(cx, cy);
        // Muter super kencang berdasarkan waktu berjalan
        ctx.rotate((localTime * 45 * Math.PI) / 180);

        const stripCount = 60;
        const outerLimit = 180; // Tetap kelihatan melar keluar koin
        
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

      // ----------------------------------------------------
      // EFEK 2: UNSTABLE PURPLE PLASMA (Badai Petir & Glowing Nebula)
      // ----------------------------------------------------
      if (!locked && !needsAd) {
        ctx.save();
        // Aura Glow Ungu di luar Hexagon
        const glowGrad = ctx.createRadialGradient(cx, cy, 35, cx, cy, 75);
        glowGrad.addColorStop(0, 'rgba(160, 0, 255, 0.8)');
        glowGrad.addColorStop(0.5, 'rgba(230, 150, 255, 0.4)');
        glowGrad.addColorStop(1, 'rgba(160, 0, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 75, 0, Math.PI * 2);
        ctx.fill();

        // Tekstur Inti Plasma Petir (Lightning Arcs)
        ctx.strokeStyle = 'rgba(230, 180, 255, 0.95)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 10;

        const renderLightningArc = (radius: number, segments: number) => {
          ctx.beginPath();
          for (let i = 0; i <= segments; i++) {
            const angle = (i * Math.PI * 2) / segments;
            // Distorsi acak konstan agar efek petirnya bergetar liar
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

        // Render 2 layer lingkaran badai petir melingkar
        renderLightningArc(46, 16);
        renderLightningArc(54, 12);
        ctx.restore();
      }

      // ----------------------------------------------------
      // EFEK 3: FISIKA PARTIKEL EMAS (Meledak -> Orbit -> Kesedot)
      // ----------------------------------------------------
      if (isMatrixSpinning) {
        particlesRef.current.forEach((p, idx) => {
          if (p.phase === 'burst') {
            p.x += p.vx;
            p.y += p.vy;
            const dist = Math.hypot(p.x - cx, p.y - cy);
            // Kalau sudah sampai batas orbit luar, ganti fase ke kesedot
            if (dist >= p.orbitRadius) {
              p.phase = 'suck';
            }
          } else {
            // Muter melingkar sambil ditarik masuk ke pusat (0,0)
            p.angle += 0.15; // Kecepatan orbit hisap
            const currentDist = Math.hypot(p.x - cx, p.y - cy) - 4.5; // Tarikan magnetik masuk
            
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
            ctx.shadowBlur = 0; // Reset
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

  // ⚡ SEQUENCE TIMELINE CLICK (TOTAL DURASI: 6.2 DETIK)
  const handleCoinClick = useCallback(() => {
    if (locked || needsAd || isMatrixSpinning) return;

    setIsMatrixSpinning(true);
    const canvas = canvasRef.current;
    if (canvas) {
      spawnParticles(canvas.width / 2, canvas.height / 2);
    }

    // Detik 6.0: Berhenti muter, pemicu efek guncangan koin (0.2 detik terakhir)
    const shakeTimer = setTimeout(() => {
      setIsCoreShaking(true);
    }, 6000);

    // Detik 6.2: Final reward & transisi mutlak ke mode Iklan (needsAd)
    const finalTimer = setTimeout(() => {
      onCoin(pointsPerClick);
      setIsMatrixSpinning(false);
      setIsCoreShaking(false);
      particlesRef.current = [];
      if (onAdRequired) {
        onAdRequired();
      }
    }, 6200);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(finalTimer);
    };
  }, [locked, needsAd, isMatrixSpinning, pointsPerClick, onCoin, onAdRequired, spawnParticles]);

  return (
    <div className="relative mx-auto flex flex-col items-center justify-center w-full h-[420px] max-w-[420px] select-none">
      
      {/* CANVAS KHUSUS RENDERING PLASMA & STRIP EMAS BADAI */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-[400px] h-[400px]"
        />
      </div>

      {/* PUZZLE & AKSESORIS LUAR (Ngambang Statis Diam Tanpa Efek) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="absolute left-6 top-16 text-4xl">🧩</motion.div>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="absolute right-6 top-24 text-4xl">🎲</motion.div>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} className="absolute right-8 bottom-24 text-4xl">💸</motion.div>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }} className="absolute left-10 bottom-20 text-3xl">🪙</motion.div>
      </div>

      {/* REVOLUSI TOMBOL KOIN */}
      <motion.button
        onClick={handleCoinClick}
        animate={
          isCoreShaking 
            ? { x: [-8, 8, -6, 6, -3, 3, 0], y: [-5, 5, -3, 3, 0] } 
            : {}
        }
        transition={{ duration: 0.2, ease: "linear" }}
        className={`relative w-[210px] h-[210px] flex items-center justify-center outline-none z-30 ${
          locked ? "opacity-60 grayscale" : "opacity-100"
        }`}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        {/* LAYER 1: BACKGROUND MEDALLION (OUTER GOLD DISC) */}
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
          {/* Alur Gerigi/Grooves Emas */}
          <div className="absolute inset-2 rounded-full" style={{ 
            background: needsAd 
              ? "repeating-conic-gradient(rgba(113,113,122,0.4) 0deg 4deg, transparent 4deg 10deg)"
              : "repeating-conic-gradient(rgba(120,70,10,0.4) 0deg 4deg, transparent 4deg 10deg)", 
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 10px), #000 calc(100% - 4px), transparent calc(100% - 2px))" 
          }} />

          {/* Bagian Dalam Koin Padat Cekung */}
          <div
            className="relative w-[146px] h-[146px] rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: locked ? "#333" : needsAd ? "#3f3f46" : "#1a1204",
              boxShadow: "inset 0 6px 12px rgba(0,0,0,0.8)"
            }}
          >
            {!locked && !needsAd ? (
              <>
                {/* LAYER 2: SHARP HEXAGON FRAME (Lancip Atas-Bawah 90deg) */}
                <div
                  className="absolute w-[130px] h-[130px]"
                  style={{
                    transform: "rotate(90deg)",
                    clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
                    background: "linear-gradient(145deg, #fff0a8, #f7c53b, #a85c00)",
                  }}
                >
                  {/* Penutup Lubang Hexagon Biar Gak Bolong */}
                  <div
                    className="absolute inset-[6px]"
                    style={{
                      clipPath: "polygon(25% 6%,75% 6%,100% 50%,75% 94%,25% 94%,0% 50%)",
                      background: "#1a1204",
                    }}
                  />
                </div>

                {/* LAYER 4: CENTER MEDALLION & LOGO Z (Duduk Manis Paling Atas Permukaan) */}
                <div 
                  className="absolute w-[64px] h-[64px] rounded-full flex items-center justify-center z-10"
                  style={{
                    background: "radial-gradient(circle at 35% 30%, #FFF6C2 0%, #FFD24A 40%, #7A4A08 100%)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.5), inset 0 2px 4px #fff"
                  }}
                >
                  <span
                    className="font-black text-[38px] leading-none select-none text-[#2a1805]"
                    style={{ textShadow: "0 1.5px 0 rgba(255,255,255,0.4)" }}
                  >
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