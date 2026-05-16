"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";

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
  const { currentRoom, setCurrentRoom } = useApp();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTgId, setMyTgId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomData | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Sinkron ID User dari Telegram
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString();
    if (tid) setMyTgId(tid);
  }, []);

  // 2. Fetch Leaderboard (Otomatis panggil tiap ganti room)
  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?room=${currentRoom}`)
      .then((r) => r.json())
      .then((data) => { 
        setUsers(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [currentRoom]);

  // 3. Fetch Info Room (Prize & Reset)
  useEffect(() => {
    fetch(`/api/rooms?id=${currentRoom}`)
      .then(res => res.json())
      .then(data => setRoomInfo(data))
      .catch(err => console.error("Room fetch error:", err));
  }, [currentRoom]);

  // 4. Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setUTCHours(24, 0, 0, 0); // Reset standar jam 00:00 UTC
      
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Resetting...");
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}j ${m}m ${s}d`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roomInfo]);

  const activeRoomStatic = ROOMS.find(r => r.id === currentRoom) || ROOMS[0];

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

          {/* Prize Display */}
          <div className="flex flex-col items-center justify-center py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Room Prize Pool</p>
            <h2 className="text-3xl font-black text-[#4ade80]">
              ${roomInfo?.prizePool || "0"} <span className="text-sm">USDT</span>
            </h2>
            <p className="text-[9px] font-medium text-white/60 mt-1 italic">Top 3 will share the rewards</p>
          </div>

          {/* Room Tabs */}
          <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar py-2">
            {ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentRoom(r.id)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl border transition-all duration-300 ${
                  currentRoom === r.id 
                  ? "bg-white/10 border-white/30 scale-105" 
                  : "bg-transparent border-white/5 opacity-40 grayscale"
                }`}
              >
                <span className="text-sm font-bold" style={{ color: r.color }}>{r.icon} {r.name}</span>
              </button>
            ))}
          </div>
        </header>

        {/* List Leaderboard */}
        <div className="px-4 mt-4 flex flex-col gap-2">
          {loading ? (
            <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
          ) : (
            users.map((user, i) => {
              const isMe = user.telegramId === myTgId;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                  style={isMe ? { background: `${activeRoomStatic.color}15`, borderColor: `${activeRoomStatic.color}44` } : {}}
                >
                  <div className="w-8 font-black text-center text-sm opacity-40" style={isMe ? { color: activeRoomStatic.color, opacity: 1 } : {}}>
                    #{user.position}
                  </div>
                  
                  <img src={user.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`} alt="avatar" className="w-10 h-10 rounded-full bg-white/10 border border-white/10 object-cover" />

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-white">
                      {user.name} {isMe && <span className="text-[10px] text-yellow-500 ml-1">(You)</span>}
                    </p>
                    <p className="text-[10px] opacity-40 truncate">@{user.username || 'player'}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-white">{formatNumber(user.zp)}</p>
                    <p className="text-[9px] font-bold uppercase opacity-40 tracking-tighter" style={{ color: activeRoomStatic.color }}>ZP Points</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}