"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { Trophy, Medal, Award } from "lucide-react";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface LeaderUser {
  id: number;
  telegramId: string;
  name: string;
  username: string | null;
  avatar: string | null;
  zp: number; 
  position: number;
}

interface RoomData {
  id: string;
  prizePool: number;
  resetAt: string;
  remainingMs: number;
}

const ROOMS = [
  { id: "bronze", name: "Bronze", icon: "🔹", color: "#CD7F32" },
  { id: "silver", name: "Silver", icon: "🔹", color: "#C0C0C0" },
  { id: "gold", name: "Gold", icon: "🔹", color: "#FFD700" },
  { id: "diamond", name: "Diamond", icon: "💎", color: "#00E5FF" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString("id-ID") ?? "0";
}

export default function LeaderboardPage() {
  // =========================================================
  // 🛡️ ANTI-EXPLOIT ENGINE: GUNAKAN STATE LOKAL UNTUK INTIP ROOM
  // =========================================================
  // Kita ganti penggunaan currentRoom global menjadi local state 'activeTab'
  // secara default dia bakal nampilin 'bronze' atau room polosan dulu tanpa ngerusak home!
  const [activeTab, setActiveTab] = useState<string>("bronze");
  
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTgId, setMyTgId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomData | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString();
    if (tid) setMyTgId(tid);
  }, []);

  // Fetch data klasemen berdasarkan tab lokal yang sedang dilihat
  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?room=${activeTab}`)
      .then((r) => r.json())
      .then((data) => { 
        setUsers(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [activeTab]);

  // Fetch info sisa waktu berdasarkan tab lokal yang sedang dilihat
  useEffect(() => {
    fetch(`/api/rooms?id=${activeTab}`)
      .then(res => res.json())
      .then(data => {
        setRoomInfo(data);
        if (data && typeof data.remainingMs === "number") {
          setCountdown(data.remainingMs);
        }
      })
      .catch(err => console.error("Room fetch error:", err));
  }, [activeTab]);

  useEffect(() => {
    if (countdown <= 0) {
      setTimeLeft("Resetting...");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const nextValue = prev - 1000;
        
        if (nextValue <= 0) {
          setTimeLeft("Resetting...");
          return 0;
        }

        const d = Math.floor(nextValue / (1000 * 60 * 60 * 24));
        const h = Math.floor((nextValue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((nextValue % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((nextValue % (1000 * 60)) / 1000);
        
        if (d >= 1) {
          setTimeLeft(`${d}d ${h}j ${m}m`);
        } else {
          setTimeLeft(`${h}j ${m}m ${s}d`);
        }
        
        return nextValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const activeRoomStatic = ROOMS.find(r => r.id === activeTab) || ROOMS[0];

  const top1 = users.find(u => u.position === 1);
  const top2 = users.find(u => u.position === 2);
  const top3 = users.find(u => u.position === 3);
  const regularPlayers = users.filter(u => u.position > 3);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col bg-black">
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full pb-28">
        <header className="pt-6 px-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeRoomStatic.icon}</span>
              <h1 className="text-2xl font-black italic tracking-tight" style={{ color: activeRoomStatic.color }}>
                {activeRoomStatic.name.toUpperCase()} RANK
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase opacity-40 text-white block">Reset In</span>
              <span className="text-sm font-black text-white tabular-nums">{timeLeft || "--:--:--"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Room Prize Pool</p>
            <h2 className="text-3xl font-black text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.2)]">
              ${roomInfo?.prizePool || "0"} <span className="text-sm font-bold text-white/60">USDT</span>
            </h2>
            <p className="text-[9px] font-black text-zinc-500 mt-1 uppercase tracking-wider">Top 3 Shares: 50% | 30% | 20%</p>
          </div>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)} // FIX: Mengubah tab lokal, bukan room utama game!
                className={`flex-shrink-0 px-5 py-2 rounded-xl border transition-all duration-300 ${
                  activeTab === r.id 
                  ? "bg-zinc-900 border-white/20 scale-105 shadow-lg" 
                  : "bg-transparent border-white/5 opacity-30 grayscale"
                }`}
              >
                <span className="text-sm font-black uppercase tracking-tight" style={{ color: r.color }}>{r.icon} {r.name}</span>
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="py-40 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
        ) : (
          <>
            <div className="px-4 mt-6 flex justify-between items-end h-56 relative w-full mb-4">
              {/* JUARA 2 */}
              <div className="flex flex-col items-center flex-1 z-10">
                <AnimatePresence>
                  {top2 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <img src={top2.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${top2.id}`} alt="top2" className="w-14 h-14 rounded-full border-2 border-zinc-400 bg-zinc-900 object-cover shadow-[0_0_15px_rgba(192,192,192,0.2)]" />
                        <div className="absolute -top-2 -right-1 bg-zinc-400 rounded-full p-0.5 text-black"><Medal size={12} className="fill-black"/></div>
                      </div>
                      <p className="font-black text-[11px] truncate w-24 text-center text-white/80">{top2.name}</p>
                      <p className="text-[10px] font-black text-zinc-400 tabular-nums mb-1">{formatNumber(top2.zp)} ZP</p>
                    </motion.div>
                  ) : (
                    <div className="h-20 w-12 border border-dashed border-white/10 rounded-xl mb-1 flex items-center justify-center opacity-20"><span className="text-[9px]">Empty</span></div>
                  )}
                </AnimatePresence>
                <div className="w-full bg-gradient-to-t from-zinc-950 to-zinc-900/60 border border-zinc-800 rounded-t-2xl h-16 flex flex-col items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <span className="text-xl font-black text-zinc-400 italic tracking-tighter">#2</span>
                </div>
              </div>

              {/* JUARA 1 */}
              <div className="flex flex-col items-center flex-1 z-20 px-1">
                <AnimatePresence>
                  {top1 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[#FFD700] animate-bounce"><Trophy size={16} className="fill-[#FFD700]" /></div>
                        <img src={top1.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${top1.id}`} alt="top1" className="w-18 h-18 rounded-full border-4 border-[#FFD700] bg-zinc-900 object-cover shadow-[0_0_25px_rgba(255,215,0,0.3)]" />
                      </div>
                      <p className="font-black text-xs truncate w-24 text-center text-[#FFD700]">{top1.name}</p>
                      <p className="text-[11px] font-black text-[#FFD700] tabular-nums mb-1">{formatNumber(top1.zp)} ZP</p>
                    </motion.div>
                  ) : (
                    <div className="h-24 w-12 border border-dashed border-white/10 rounded-xl mb-1 flex items-center justify-center opacity-20"><span className="text-[9px]">Empty</span></div>
                  )}
                </AnimatePresence>
                <div className="w-full bg-gradient-to-t from-zinc-950 to-zinc-900 border border-[#FFD700]/20 rounded-t-2xl h-24 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.05)]">
                  <span className="text-2xl font-black text-[#FFD700] italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,215,0,0.3)]">#1</span>
                </div>
              </div>

              {/* JUARA 3 */}
              <div className="flex flex-col items-center flex-1 z-10">
                <AnimatePresence>
                  {top3 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                      <div className="relative mb-2">
                        <img src={top3.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${top3.id}`} alt="top3" className="w-13 h-13 rounded-full border-2 border-amber-600 bg-zinc-900 object-cover shadow-[0_0_15px_rgba(217,119,6,0.2)]" />
                        <div className="absolute -top-2 -right-1 bg-amber-600 rounded-full p-0.5 text-black"><Award size={12} /></div>
                      </div>
                      <p className="font-black text-[11px] truncate w-24 text-center text-white/70">{top3.name}</p>
                      <p className="text-[10px] font-black text-amber-600 tabular-nums mb-1">{formatNumber(top3.zp)} ZP</p>
                    </motion.div>
                  ) : (
                    <div className="h-20 w-12 border border-dashed border-white/10 rounded-xl mb-1 flex items-center justify-center opacity-20"><span className="text-[9px]">Empty</span></div>
                  )}
                </AnimatePresence>
                <div className="w-full bg-gradient-to-t from-zinc-950 to-zinc-900/60 border border-zinc-800 rounded-t-2xl h-12 flex flex-col items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <span className="text-lg font-black text-amber-600 italic tracking-tighter">#3</span>
                </div>
              </div>
            </div>

            <div className="px-4 mt-2 flex flex-col gap-2">
              {regularPlayers.length === 0 ? (
                <p className="text-center text-[10px] font-bold text-zinc-600 uppercase tracking-widest py-10">No Contenders Left</p>
              ) : (
                regularPlayers.map((user) => {
                  const isMe = user.telegramId === myTgId;
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-900/60 backdrop-blur-md"
                      style={isMe ? { background: `${activeRoomStatic.color}10`, borderColor: `${activeRoomStatic.color}33` } : {}}
                    >
                      <div className="w-8 font-black text-center text-xs opacity-30" style={isMe ? { color: activeRoomStatic.color, opacity: 1 } : {}}>
                        #{user.position}
                      </div>
                      <img src={user.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`} alt="avatar" className="w-9 h-9 rounded-full bg-white/5 border border-zinc-800 object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs truncate text-white">
                          {user.name} {isMe && <span className="text-[9px] font-black text-[#FFD700] uppercase tracking-wider ml-1 bg-white/5 px-1 py-0.5 rounded">You</span>}
                        </p>
                        <p className="text-[9px] font-medium opacity-30 truncate">@{user.username || 'player'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-white">{formatNumber(user.zp)}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-30" style={{ color: activeRoomStatic.color }}>ZP</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}