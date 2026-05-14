"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface LeaderUser {
  id: number;
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
  { id: "bronze", name: "Bronze", icon: "♦️", color: "#CD7F32" },
  { id: "silver", name: "Silver", icon: "♦️", color: "#C0C0C0" },
  { id: "gold", name: "Gold", icon: "♦️", color: "#FFD700" },
  { id: "diamond", name: "Diamond", icon: "💎", color: "#00E5FF" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toString() ?? "0";
}

export default function LeaderboardPage() {
  const { currentRoom, setCurrentRoom } = useApp();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [myTgId, setMyTgId] = useState<string | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomData | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch User ID & Leaderboard Data
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString();
    if (tid) setMyTgId(tid);

    setLoading(true);
    fetch(`/api/leaderboard?room=${currentRoom}`)
      .then((r) => r.json())
      .then((data) => { 
        setUsers(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [currentRoom]);

  // 2. Fetch Room Information (Prize & Reset)
  useEffect(() => {
    fetch(`/api/rooms?id=${currentRoom}`)
      .then(res => res.json())
      .then(data => setRoomInfo(data))
      .catch(err => console.error("Room fetch error:", err));
  }, [currentRoom]);

  // 3. Countdown Logic (Standard 00:00 UTC)
  useEffect(() => {
    if (!roomInfo?.resetAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(roomInfo.resetAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Resetting...");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days >= 1) {
        setTimeLeft(`${days + 1} Days`);
      } else {
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roomInfo]);

  const activeRoomStatic = ROOMS.find(r => r.id === currentRoom) || ROOMS[0];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden flex flex-col" style={{ background: "#000" }}>
      <ShootingStars />
      
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full pb-28">
        
        <header className="pt-6 px-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeRoomStatic.icon}</span>
              <h1 className="text-2xl font-black italic tracking-tight" style={{ color: activeRoomStatic.color, textShadow: `0 0 15px ${activeRoomStatic.color}66` }}>
                {activeRoomStatic.name.toUpperCase()}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 text-white block">Reset In</span>
              <span className="text-sm font-black text-white">{timeLeft || "--:--:--"}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Prize Pool</p>
            <h2 className="text-3xl font-black text-[#4ade80]" style={{ textShadow: "0 0 20px rgba(74,222,128,0.4)" }}>
              ${roomInfo?.prizePool || "0"} <span className="text-sm">USDT</span>
            </h2>
            <p className="text-[9px] font-medium text-white/60 mt-1 italic">Distributed to Top 3 players</p>
          </div>

          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto no-scrollbar py-2"
          >
            {ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => setCurrentRoom(r.id)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl border transition-all duration-300 ${
                  currentRoom === r.id 
                  ? "bg-white/10 border-white/30 scale-105" 
                  : "bg-transparent border-white/5 opacity-40"
                }`}
              >
                <span className="text-sm font-bold" style={{ color: r.color }}>{r.icon} {r.name}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="px-4 mt-4 flex flex-col gap-2">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            users.map((user, i) => {
              const isMe = user.id.toString() === myTgId;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                  style={isMe ? { background: `${activeRoomStatic.color}15`, borderColor: `${activeRoomStatic.color}44` } : {}}
                >
                  <div className="w-8 font-black text-center text-sm opacity-40" style={isMe ? { color: activeRoomStatic.color, opacity: 1 } : {}}>
                    #{user.position}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/10">
                    <img src={user.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`} alt="avatar" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-white">
                      {user.name} {isMe && <span className="text-[10px] opacity-50 ml-1">(You)</span>}
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
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}