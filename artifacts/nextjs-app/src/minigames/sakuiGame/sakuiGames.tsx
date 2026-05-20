"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import MatterInstance from "matter-js"; 

// ─── Cyber Config ───
const TIERS = [
  { radius: 15, color: "#10b981", glow: "#10b98166", points: 10,   label: "①" }, // Neon Emerald
  { radius: 20, color: "#f59e0b", glow: "#f59e0b66", points: 20,   label: "②" }, // Cyber Gold/Amber
  { radius: 27, color: "#6366f1", glow: "#6366f166", points: 40,   label: "③" }, // Indigo Neon
  { radius: 35, color: "#ec4899", glow: "#ec489966", points: 80,   label: "④" }, // Fuchsia Laser
  { radius: 44, color: "#06b6d4", glow: "#06b6d466", points: 160,  label: "⑤" }, // Cyan Core
  { radius: 54, color: "#a855f7", glow: "#a855f766", points: 320,  label: "⑥" }, // Purple Electric
  { radius: 65, color: "#ef4444", glow: "#ef444466", points: 640,  label: "⑦" }, // Red Signal
  { radius: 80, color: "#3b82f6", glow: "#3b82f666", points: 1280, label: "⑧" }, // High Plasma Blue
] as const;

type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const BOX_W    = 320;
const BOX_H    = 480;
const WALL_T   = 40;
const DANGER_Y = 64;
const DROP_POOL: Tier[] = [0, 1, 2];

const randTier = (): Tier =>
  DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)];

export default function PlanetMergeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gunakan type typeof MatterInstance untuk menghindari type any liar
  const MRef    = useRef<typeof MatterInstance | null>(null);          
  const engRef  = useRef<MatterInstance.Engine | null>(null);          
  const cleanup = useRef<(() => void) | null>(null);

  const tiersMap    = useRef<Map<number, Tier>>(new Map());
  const merging     = useRef<Set<number>>(new Set());
  const dangerTimer = useRef<Map<number, number>>(new Map());
  const dead        = useRef(false);
  const scoreAcc    = useRef(0);
  const nextTierRef = useRef<Tier>(randTier());

  // React state
  const [score,    setScore]    = useState(0);
  const [best,     setBest]     = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [nextTier, setNextTier] = useState<Tier>(nextTierRef.current);

  // ── spawn helper ──
  const spawnCircle = useCallback(
    (engine: MatterInstance.Engine, Matter: typeof MatterInstance, x: number, y: number, tier: Tier) => {
      const { radius, color } = TIERS[tier];
      const cx = Math.max(radius + 2, Math.min(BOX_W - radius - 2, x));
      const body = Matter.Bodies.circle(cx, y, radius, {
        restitution: 0.25,
        friction: 0.5,
        frictionAir: 0.012,
        density: 0.002,
        label: `planet-${tier}`,
        render: {
          fillStyle: color,
          strokeStyle: "rgba(255,255,255,0.15)",
          lineWidth: 1.5,
        },
      });
      tiersMap.current.set(body.id, tier);
      Matter.Composite.add(engine.world, body);
      return body;
    },
    [],
  );

  // ── init / restart ──
  const initGame = useCallback(async () => {
    if (!canvasRef.current) return;

    cleanup.current?.();
    cleanup.current = null;

    // Aman untuk SSR dan compiler Vercel aman karena package sudah di-install
    const Matter = MRef.current ?? (await import("matter-js")).default;
    MRef.current = Matter;

    tiersMap.current.clear();
    merging.current.clear();
    dangerTimer.current.clear();
    dead.current  = false;
    scoreAcc.current = 0;
    setScore(0);
    setGameOver(false);

    const first = randTier();
    nextTierRef.current = first;
    setNextTier(first);

    const engine = Matter.Engine.create({ gravity: { y: 1.2 } });
    engRef.current = engine;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine,
      options: {
        width: BOX_W,
        height: BOX_H,
        wireframes: false,
        background: "#0d0b14", // Menyesuaikan background gelap utama halaman minigames lu
      },
    });

    const runner = Matter.Runner.create();

    const mkStatic = (x: number, y: number, w: number, h: number) =>
      Matter.Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        label: "wall",
        render: { fillStyle: "#1b1926" }, // Selaras dengan warna container card bento lu
      });

    Matter.Composite.add(engine.world, [
      mkStatic(BOX_W / 2, BOX_H + WALL_T / 2, BOX_W + WALL_T * 2, WALL_T),
      mkStatic(-WALL_T / 2, BOX_H / 2, WALL_T, BOX_H * 2),
      mkStatic(BOX_W + WALL_T / 2, BOX_H / 2, WALL_T, BOX_H * 2),
    ]);

    // ── collision → merge ──
    Matter.Events.on(engine, "collisionStart", (event: any) => {
      const batch: Array<{ bodyA: any; bodyB: any; tier: Tier }> = [];

      for (const { bodyA, bodyB } of event.pairs) {
        const ta = tiersMap.current.get(bodyA.id);
        const tb = tiersMap.current.get(bodyB.id);
        if (ta === undefined || tb === undefined || ta !== tb) continue;
        if (ta >= TIERS.length - 1) continue;
        if (merging.current.has(bodyA.id) || merging.current.has(bodyB.id)) continue;

        merging.current.add(bodyA.id);
        merging.current.add(bodyB.id);
        batch.push({ bodyA, bodyB, tier: ta as Tier });
      }

      if (!batch.length) return;

      setTimeout(() => {
        for (const { bodyA, bodyB, tier } of batch) {
          if (!tiersMap.current.has(bodyA.id) || !tiersMap.current.has(bodyB.id)) continue;

          const mx = (bodyA.position.x + bodyB.position.x) / 2;
          const my = (bodyA.position.y + bodyB.position.y) / 2;

          for (const b of [bodyA, bodyB]) {
            tiersMap.current.delete(b.id);
            dangerTimer.current.delete(b.id);
            merging.current.delete(b.id);
            Matter.Composite.remove(engine.world, b);
          }

          const next = (tier + 1) as Tier;
          spawnCircle(engine, Matter, mx, my, next);

          const pts = TIERS[next].points;
          scoreAcc.current += pts;
          setScore(scoreAcc.current);
        }
      }, 0);
    });

    // ── game-over logic ──
    Matter.Events.on(engine, "afterUpdate", () => {
      if (dead.current) return;
      const now = Date.now();

      for (const body of Matter.Composite.allBodies(engine.world)) {
        if (body.isStatic) continue;
        const tier = tiersMap.current.get(body.id);
        if (tier === undefined) continue;

        const topEdge = body.position.y - TIERS[tier].radius;

        if (topEdge < DANGER_Y) {
          if (!dangerTimer.current.has(body.id)) {
            dangerTimer.current.set(body.id, now);
          } else if (now - dangerTimer.current.get(body.id)! > 3000) {
            dead.current = true;
            setBest((prev) => Math.max(prev, scoreAcc.current));
            setGameOver(true);
            return;
          }
        } else {
          dangerTimer.current.delete(body.id);
        }
      }
    });

    // ── danger line overlay ──
    Matter.Events.on(render, "afterRender", () => {
      const ctx: CanvasRenderingContext2D = render.context;
      ctx.save();
      ctx.strokeStyle = "rgba(239,68,68,0.5)"; // Merah tailwind tebal tipis
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, DANGER_Y);
      ctx.lineTo(BOX_W, DANGER_Y);
      ctx.stroke();
      ctx.fillStyle = "rgba(239,68,68,0.8)";
      ctx.font = "bold 9px monospace";
      ctx.fillText("⚠️ OVERFLOW DANGER ZONE", 8, DANGER_Y - 6);
      ctx.restore();
    });

    Matter.Render.run(render);
    Matter.Runner.run(runner, engine);

    cleanup.current = () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Engine.clear(engine);
      engRef.current = null;
    };
  }, [spawnCircle]);

  useEffect(() => {
    initGame();
    return () => cleanup.current?.();
  }, [initGame]);

  // ── drop click ──
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const engine = engRef.current;
      const Matter = MRef.current;
      if (!engine || !Matter || dead.current) return;

      const rect = canvasRef.current!.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const tier = nextTierRef.current;

      spawnCircle(engine, Matter, x, DANGER_Y - TIERS[tier].radius - 2, tier);

      const next = randTier();
      nextTierRef.current = next;
      setNextTier(next);
    },
    [spawnCircle],
  );

  // ── active mechanisms ──
  const handleShake = useCallback(() => {
    const engine = engRef.current;
    const Matter = MRef.current;
    if (!engine || !Matter || dead.current) return;

    for (const body of Matter.Composite.allBodies(engine.world)) {
      if (body.isStatic || !tiersMap.current.has(body.id)) continue;
      Matter.Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.07,
        y: (Math.random() - 0.5) * 0.07,
      });
    }
  }, []);

  const handleBlackHole = useCallback(() => {
    const engine = engRef.current;
    const Matter = MRef.current;
    if (!engine || !Matter || dead.current) return;

    const candidates = Matter.Composite.allBodies(engine.world).filter(
      (b: any) => !b.isStatic && tiersMap.current.has(b.id),
    );
    if (!candidates.length) return;

    const target = candidates.reduce((a: any, b: any) =>
      (tiersMap.current.get(a.id) ?? 0) >= (tiersMap.current.get(b.id) ?? 0) ? a : b,
    );

    tiersMap.current.delete(target.id);
    dangerTimer.current.delete(target.id);
    merging.current.delete(target.id);
    Matter.Composite.remove(engine.world, target);
  }, []);

  const nt = TIERS[nextTier];

  return (
    <div className="inline-flex flex-col rounded-3xl overflow-hidden border border-slate-800 bg-[#0d0b14] shadow-2xl select-none font-mono max-w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1b1926]/80 border-b border-slate-900/60">
        <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">
          COSMIC SUIKA v1.0
        </span>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[7px] text-slate-500 uppercase tracking-wider">SCORE</div>
            <div className="text-xs font-black text-white tabular-nums leading-none">{score}</div>
          </div>
          <div className="text-right">
            <div className="text-[7px] text-slate-500 uppercase tracking-wider">BEST</div>
            <div className="text-xs font-black text-yellow-400 tabular-nums leading-none">{best}</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-[7px] text-slate-500 uppercase tracking-wider">NEXT</div>
            <div
              className="rounded-full transition-all duration-300 border border-white/10"
              style={{
                width:  Math.max(10, Math.round(nt.radius * 0.45)),
                height: Math.max(10, Math.round(nt.radius * 0.45)),
                background: nt.color,
                boxShadow: `0 0 10px ${nt.glow}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Canvas Box Area */}
      <div className="relative border-b border-slate-900/60">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block cursor-crosshair mx-auto max-w-full"
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <p className="text-xl font-black text-red-500 tracking-widest uppercase">CORE OVERFLOW</p>
            <p className="text-xs text-slate-400 font-mono">
              FINAL SCORE: <span className="font-black text-yellow-400">{score}</span>
            </p>
            {score >= best && score > 0 && (
              <p className="text-[10px] text-emerald-400 font-black tracking-wider uppercase animate-pulse">▲ NEW RECORD DETECTED</p>
            )}
            <button
              onClick={initGame}
              className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[10px] font-black tracking-wider uppercase active:scale-95 transition-all shadow-lg shadow-cyan-500/20"
            >
              REBOOT CORE
            </button>
          </div>
        )}
      </div>

      {/* Footer System Control Skills */}
      <div className="flex gap-2 px-3 py-2 bg-[#1b1926]/60 backdrop-blur-md">
        <button
          onClick={handleShake}
          disabled={gameOver}
          className="flex-1 py-2 rounded-xl text-[9px] font-black tracking-wider uppercase
                     bg-slate-950/40 hover:bg-slate-900/40 active:scale-95 text-cyan-400 border border-cyan-500/20
                     disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          🌀 SHAKE SYS
        </button>
        <button
          onClick={handleBlackHole}
          disabled={gameOver}
          className="flex-1 py-2 rounded-xl text-[9px] font-black tracking-wider uppercase
                     bg-slate-950/40 hover:bg-slate-900/40 active:scale-95 text-purple-400 border border-purple-500/20
                     disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          🕳️ VOID PULSE
        </button>
      </div>
    </div>
  );
}