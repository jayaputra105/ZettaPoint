"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';

interface CoinClickerProps {
  onCoin: (amount: number) => void;
  pointsPerClick?: number;
  locked?: boolean;
  needsAd?: boolean;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
}

export default function CoinClicker({
  onCoin,
  pointsPerClick = 100,
  locked = false,
  needsAd = false,
}: CoinClickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStage, setAnimationStage] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const [visualState, setVisualState] = useState({ locked, needsAd });

  const generateParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: 100,
        y: 100,
        radius: 2 + Math.random() * 5,
        speed: 2 + Math.random() * 5,
        angle: Math.random() * Math.PI * 2
      });
    }
    return particles;
  }, []);

  const drawPlasmaCore = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createRadialGradient(100, 100, 10, 100, 100, 50);
    gradient.addColorStop(0, 'rgba(128,0,255,0.9)');
    gradient.addColorStop(0.5, 'rgba(75,0,130,0.7)');
    gradient.addColorStop(1, 'rgba(48,0,96,0.5)');
    
    ctx.beginPath();
    ctx.arc(100, 100, 50, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,0,255,${0.5 - i * 0.05})`;
      ctx.lineWidth = 2;
      ctx.arc(100, 100, 50 - i * 4, 
        Math.random() * Math.PI, 
        Math.random() * Math.PI * 2
      );
      ctx.stroke();
    }
  }, []);

  const animateParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 200, 200);
    
    particlesRef.current.forEach((p, index) => {
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${1 - index * 0.02})`;
      ctx.fill();

      if (Math.hypot(p.x - 100, p.y - 100) < 30) {
        particlesRef.current.splice(index, 1);
      }
    });
  }, []);

  useEffect(() => {
    if (!isAnimating) {
      setVisualState({ locked, needsAd });
    }
  }, [locked, needsAd, isAnimating]);

  useEffect(() => {
    const plasmaCanvas = canvasRef.current;
    const particleCanvas = particleCanvasRef.current;
    
    if (plasmaCanvas && particleCanvas) {
      const plasmaCtx = plasmaCanvas.getContext('2d')!;
      const particleCtx = particleCanvas.getContext('2d')!;

      drawPlasmaCore(plasmaCtx);

      if (isAnimating) {
        particlesRef.current = generateParticles();
        
        const animationLoop = () => {
          animateParticles(particleCtx);
          if (particlesRef.current.length > 0) {
            requestAnimationFrame(animationLoop);
          }
        };
        animationLoop();
      }
    }
  }, [isAnimating, drawPlasmaCore, generateParticles, animateParticles]);

  const handleClick = useCallback(() => {
    if (locked || isAnimating) return;

    setIsAnimating(true);
    onCoin(pointsPerClick);

    setTimeout(() => {
      setIsAnimating(false);
      setAnimationStage(0);
    }, 6000);
  }, [locked, isAnimating, onCoin, pointsPerClick]);

  return (
    <div className="relative flex items-center justify-center w-full h-[400px] max-w-[400px] select-none">
      <motion.div 
        className="absolute -left-4 top-10 text-3xl"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        🧩
      </motion.div>

      <motion.div 
        className="absolute -right-4 top-16 text-3xl"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        🧩
      </motion.div>

      <motion.button
        onClick={handleClick}
        className={`relative w-[260px] h-[260px] rounded-full ${locked ? 'opacity-60 grayscale' : ''}`}
        animate={
          isAnimating 
            ? { 
                rotate: [0, 360, 720, 1080],
                scale: [1, 1.1, 0.9, 1.05, 1]
              }
            : {}
        }
        transition={{ 
          duration: isAnimating ? 6 : 0,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 bg-[#1a1204] rounded-full">
          <canvas 
            ref={canvasRef} 
            width="200" 
            height="200" 
            className="absolute inset-0 w-full h-full opacity-80"
          />
          <canvas 
            ref={particleCanvasRef} 
            width="200" 
            height="200" 
            className="absolute inset-0 w-full h-full"
          />
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,_#FFF6C2_0%,_#FFD24A_25%,_#E89A12_60%,_#7A4A08_100%)] rounded-full opacity-20"></div>

        <div className="absolute inset-0 rounded-full border-4 border-[#8A5A0E] opacity-50"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          {visualState.needsAd && !visualState.locked ? (
            <Timer size={52} className="text-zinc-800" />
          ) : (
            <span className="text-[68px] font-black text-[#7A4A08]">
              {visualState.locked ? "🔒" : "Z"}
            </span>
          )}
        </div>
      </motion.button>
    </div>
  );
}