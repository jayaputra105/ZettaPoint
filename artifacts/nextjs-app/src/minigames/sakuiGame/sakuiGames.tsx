// PlanetMergeGame.tsx
// Dependencies: npm install matter-js
// Usage: <PlanetMergeGame />

"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────

const TIERS = [
  { radius: 15, color: "#ff6b6b", glow: "#ff6b6b66", points: 10,   label: "①" },
  { radius: 20, color: "#ff8e53", glow: "#ff8e5366", points: 20,   label: "②" },
  { radius: 27, color: "#ffd93d", glow: "#ffd93d66", points: 40,   label: "③" },
  { radius: 35, color: "#6bcb77", glow: "#6bcb7766", points: 80,   label: "④" },
  { radius: 44, color: "#4d96ff", glow: "#4d96ff66", points: 160,  label: "⑤" },
  { radius: 54, color: "#c77dff", glow: "#c77dff66", points: 320,  label: "⑥" },
  { radius: 65, color: "#ff6b9d", glow: "#ff6b9d66", points: 640,  label: "⑦" },
  { radius: 80, color: "#00b4d8", glow: "#00b4d866", points: 1280, label: "⑧" },
] as const;

type Tier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const BOX_W    = 320;
const BOX_H    = 480;
const WALL_T   = 40;
const DANGER_Y = 64;
const DROP_POOL: Tier[] = [0, 1, 2];

const randTier = (): Tier =>
  DROP_POOL[Math.floor(Math.random() * DROP_POOL.length)];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanetMergeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Physics state — all kept in refs so closures stay fresh without re-renders
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MRef    = useRef<any>(null);          // matter-js module
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const engRef  = useRef<any>(null);          // Matter.Engine
  const cleanup = useRef<(() => void) | null>(null);

  const tiersMap    = useRef<Map<number, Tier>>(new Map());
  const merging     = useRef<Set<number>>(new Set());
  const dangerTimer = useRef<Map<number, number>>(new Map());
  const dead        = useRef(false);
  const scoreAcc    = useRef(0);
  const nextTierRef = useRef<Tier>(randTier());

  // React-visible state (minimal)
  const [score,    setScore]    = useState(0);
  const [best,     setBest]     = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [nextTier, setNextTier] = useState<Tier>(nextTierRef.current);

  // ── spawn helper ────────────────────────────────────────────────────────────
  const spawnCircle = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (engine: any, Matter: any, x: number, y: number, tier: Tier) => {
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
          strokeStyle: "rgba(255,255,255,0.12)",
          lineWidth: 1.5,
        },
      });
      tiersMap.current.set(body.id, tier);
      Matter.Composite.add(engine.world, body);
      return body;
    },
    [],
  );

  // ── init / restart ──────────────────────────────────────────────────────────
  const initGame = useCallback(async () => {
    if (!canvasRef.current) return;

    // Tear down previous session
    cleanup.current?.();
    cleanup.current = null;

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

    // Engine + renderer
    const engine = Matter.Engine.create({ gravity: { y: 1.2 } });
    engRef.current = engine;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine,
      options: {
        width: BOX_W,
        height: BOX_H,
        wireframes: false,
        background: "#12122a",
      },
    });

    const runner = Matter.Runner.create();

    // Walls (floor + left + right; no ceiling)
    const mkStatic = (x: number, y: number, w: number, h: number) =>
      Matter.Bodies.rectangle(x, y, w, h, {
        isStatic: true,
        label: "wall",
        render: { fillStyle: "#1a1a3a" },
      });

    Matter.Composite.add(engine.world, [
      mkStatic(BOX_W / 2, BOX_H + WALL_T / 2, BOX_W + WALL_T * 2, WALL_T),
      mkStatic(-WALL_T / 2, BOX_H / 2, WALL_T, BOX_H * 2),
      mkStatic(BOX_W + WALL_T / 2, BOX_H / 2, WALL_T, BOX_H * 2),
    ]);

    // ── collision → merge ─────────────────────────────────────────────────────
    Matter.Events.on(engine, "collisionStart", (event: { pairs: Array<{ bodyA: { id: number }, bodyB: { id: number } }> }) => {
      const batch: Array<{ bodyA: { id: number; position: { x: number; y: number } }; bodyB: { id: number; position: { x: number; y: number } }; tier: Tier }> = [];

      for (const { bodyA, bodyB } of event.pairs) {
        const ta = tiersMap.current.get(bodyA.id);
        const tb = tiersMap.current.get(bodyB.id);
        if (ta === undefined || tb === undefined || ta !== tb) continue;
        if (ta >= TIERS.length - 1) continue;
        if (merging.current.has(bodyA.id) || merging.current.has(bodyB.id)) continue;

        merging.current.add(bodyA.id);
        merging.current.add(bodyB.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        batch.push({ bodyA: bodyA as any, bodyB: bodyB as any, tier: ta as Tier });
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

    // ── afterUpdate → game-over timer ─────────────────────────────────────────
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

    // ── afterRender → danger line overlay ────────────────────────────────────
    Matter.Events.on(render, "afterRender", () => {
      const ctx: CanvasRenderingContext2D = render.context;
      ctx.save();
      ctx.strokeStyle = "rgba(255,70,70,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(0, DANGER_Y);
      ctx.lineTo(BOX_W, DANGER_Y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,70,70,0.35)";
      ctx.font = "10px system-ui";
      ctx.fillText("DANGER ZONE", 6, DANGER_Y - 4);
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

  // ── drop on click ───────────────────────────────────────────────────────────
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

  // ── shake ───────────────────────────────────────────────────────────────────
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

  // ── black hole → removes the highest-tier body ──────────────────────────────
  const handleBlackHole = useCallback(() => {
    const engine = engRef.current;
    const Matter = MRef.current;
    if (!engine || !Matter || dead.current) return;

    const candidates = Matter.Composite.allBodies(engine.world).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => !b.isStatic && tiersMap.current.has(b.id),
    );
    if (!candidates.length) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = candidates.reduce((a: any, b: any) =>
      (tiersMap.current.get(a.id) ?? 0) >= (tiersMap.current.get(b.id) ?? 0) ? a : b,
    );

    tiersMap.current.delete(target.id);
    dangerTimer.current.delete(target.id);
    merging.current.delete(target.id);
    Matter.Composite.remove(engine.world, target);
  }, []);

  // ── UI ──────────────────────────────────────────────────────────────────────
  const nt = TIERS[nextTier];

  return (
    <div className="inline-flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d1f] shadow-[0_0_40px_rgba(0,0,0,0.6)] select-none font-sans">

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16163a] border-b border-white/10">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
          Planet Merge
        </span>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Score</div>
            <div className="text-sm font-bold text-white tabular-nums leading-none">{score}</div>
          </div>

          {/* Best */}
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Best</div>
            <div className="text-sm font-bold text-amber-400 tabular-nums leading-none">{best}</div>
          </div>

          {/* Next piece */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Next</div>
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width:  Math.round(nt.radius * 0.65),
                height: Math.round(nt.radius * 0.65),
                background: nt.color,
                boxShadow: `0 0 8px ${nt.glow}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="block cursor-crosshair"
        />

        {/* Game-over overlay */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 backdrop-blur-[2px]">
            <p className="text-2xl font-extrabold text-white tracking-tight">Game Over</p>
            <p className="text-sm text-slate-300">
              Score:{" "}
              <span className="font-semibold text-amber-400">{score}</span>
            </p>
            {score >= best && score > 0 && (
              <p className="text-xs text-emerald-400 font-medium">New best!</p>
            )}
            <button
              onClick={initGame}
              className="mt-1 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold transition-all"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="flex gap-2 px-3 py-2 bg-[#16163a] border-t border-white/10">
        <button
          onClick={handleShake}
          disabled={gameOver}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold
                     bg-indigo-950/70 hover:bg-indigo-900/70 active:scale-95
                     text-indigo-300 border border-indigo-700/40
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all"
        >
          🌀 Shake
        </button>
        <button
          onClick={handleBlackHole}
          disabled={gameOver}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold
                     bg-purple-950/70 hover:bg-purple-900/70 active:scale-95
                     text-purple-300 border border-purple-700/40
                     disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all"
        >
          🕳️ Black Hole
        </button>
      </div>
    </div>
  );
}