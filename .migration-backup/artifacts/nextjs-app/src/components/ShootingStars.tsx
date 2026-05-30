"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  color: string;
  opacity: number;
  trail: number;
  active: boolean;
  timer: number;
}

const COLORS = [
  "#FFD700",
  "#FF69B4",
  "#00FFFF",
  "#FF6B35",
  "#7B2FFF",
  "#00FF88",
  "#FF3CAC",
  "#FFFFFF",
];

export default function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const createStar = (): Star => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      length: Math.random() * 120 + 60,
      speed: Math.random() * 6 + 3,
      angle: Math.random() * 20 + 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0,
      trail: Math.random() * 0.4 + 0.6,
      active: false,
      timer: Math.random() * 200,
    });

    const stars: Star[] = Array.from({ length: 20 }, createStar);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star, i) => {
        star.timer--;
        if (star.timer <= 0 && !star.active) {
          star.active = true;
          star.x = Math.random() * canvas.width;
          star.y = Math.random() * canvas.height * 0.4;
          star.opacity = 1;
          star.color = COLORS[Math.floor(Math.random() * COLORS.length)];
          star.length = Math.random() * 140 + 60;
          star.speed = Math.random() * 7 + 3;
          star.angle = Math.random() * 25 + 15;
        }

        if (!star.active) return;

        const rad = (star.angle * Math.PI) / 180;
        const dx = Math.cos(rad) * star.speed;
        const dy = Math.sin(rad) * star.speed;

        const tailX = star.x - Math.cos(rad) * star.length;
        const tailY = star.y - Math.sin(rad) * star.length;

        const grad = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.7, `${star.color}55`);
        grad.addColorStop(1, star.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(star.x, star.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = star.opacity;
        ctx.shadowBlur = 12;
        ctx.shadowColor = star.color;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        star.x += dx;
        star.y += dy;
        star.opacity -= 0.016;

        if (
          star.opacity <= 0 ||
          star.x > canvas.width + 100 ||
          star.y > canvas.height + 100
        ) {
          star.active = false;
          star.timer = Math.random() * 180 + 60;
          stars[i] = { ...createStar(), active: false, timer: Math.random() * 180 + 60 };
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
