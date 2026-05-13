"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface LeaderUser {
  id: number;
  name: string;
  username: string | null;
  avatar: string | null;
  coins: number;
  position: number;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toString() ?? "0";
}

const PODIUM_CONFIG = [
  { pos: 1, color: "#FFD700", glow: "rgba(255,215,0,0.5)", height: 100, order: 1, crown: "👑" },
  { pos: 2, color: "#C0C0C0", glow: "rgba(192,192,192,0.4)", height: 75, order: 0, crown: "🥈" },
  { pos: 3, color: "#CD7F32", glow: "rgba(205,127,50,0.4)", height: 55, order: 2, crown: "🥉" },
];

function AvatarCircle({ user, size, style }: { user: LeaderUser; size: number; style?: React.CSSProperties }) {
  const initials = user.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center font-black"
      style={{ width: size, height: size, flexShrink: 0, fontSize: size * 0.35, ...style }}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const p = e.currentTarget.parentElement;
            if (p) p.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:900;color:#FFD700">${initials}</span>`;
          }}
        />
      ) : (
        <span style={{ color: "#FFD700" }}>{initials}</span>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTgId, setMyTgId] = useState<string | null>(null);

  useEffect(() => {
    // Ambil ID Telegram user asli dari WebApp
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString();
    if (tid) setMyTgId(tid);

    // Fetch data real dari backend lu
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => { 
        setUsers(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000 100%)" }}
    >
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-5 pb-4">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-black text-2xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
              Leaderboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Top 100 Pengguna Zetta Coin
            </p>
          </motion.div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full"
              style={{ border: "3px solid rgba(255,215,0,0.15)", borderTop: "3px solid #FFD700" }}
            />
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <div
                  className="rounded-3xl p-5 relative overflow-hidden"
                  style={{
                    background: "rgba(10,8,2,0.6)",
                    border: "1.5px solid rgba(255,215,0,0.25)",
                    boxShadow: "0 0 40px rgba(255,215,0,0.08)",
                  }}
                >
                  <div className="flex items-end justify-center gap-4 relative z-10">
                    {PODIUM_CONFIG.sort((a, b) => a.order - b.order).map((cfg) => {
                      const user = top3[cfg.pos - 1];
                      if (!user) return <div key={cfg.pos} className="flex-1" />;
                      const isFirst = cfg.pos === 1;
                      return (
                        <div key={cfg.pos} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xl">
                            {cfg.crown}
                          </motion.div>
                          <AvatarCircle
                            user={user}
                            size={isFirst ? 64 : 52}
                            style={{
                              border: `3px solid ${cfg.color}`,
                              boxShadow: `0 0 16px ${cfg.glow}`,
                              background: "rgba(20,15,5,0.8)",
                            }}
                          />
                          <p className="text-xs font-black text-center w-full truncate leading-tight mt-1" style={{ color: cfg.color }}>
                            {user.name?.split(" ")[0]}
                          </p>
                          <p className="text-[10px] font-semibold" style={{ color: cfg.color, opacity: 0.7 }}>
                            🪙 {formatNumber(user.coins)}
                          </p>
                          <div
                            className="w-full rounded-t-xl flex items-center justify-center"
                            style={{
                              height: cfg.height,
                              background: `linear-gradient(180deg, ${cfg.color}22 0%, ${cfg.color}0a 100%)`,
                              border: `1px solid ${cfg.color}44`,
                              borderBottom: "none",
                            }}
                          >
                            <span className="font-black" style={{ color: cfg.color, fontSize: isFirst ? "1.5rem" : "1.1rem", opacity: 0.6 }}>
                              #{cfg.pos}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              {rest.map((user, i) => {
                const isMe = user.id.toString() === myTgId;
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * Math.min(i, 10) }}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
                    style={{
                      background: isMe ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.02)",
                      border: isMe ? "1px solid rgba(255,215,0,0.35)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)", color: isMe ? "#FFD700" : "rgba(255,255,255,0.4)" }}>
                      {user.position}
                    </div>
                    <AvatarCircle user={user} size={36} style={{ border: `1.5px solid ${isMe ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.1)"}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: isMe ? "#FFD700" : "rgba(255,255,255,0.85)" }}>
                        {user.name}
                        {isMe && <span className="ml-1.5 text-[10px] font-normal opacity-60">(Kamu)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-sm">🪙</span>
                      <span className="text-sm font-black tabular-nums" style={{ color: isMe ? "#FFD700" : "rgba(255,255,255,0.7)" }}>
                        {formatNumber(user.coins)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}