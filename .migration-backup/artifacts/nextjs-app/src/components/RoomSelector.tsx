"use client";

import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { useApp } from "@/context/AppProvider";

export type Room = {
  id: string;
  name: string;       
  short: string;      
  minCoins: number;
  prizeUsdt: number;
  accent: string;     
};

export const ROOMS: Room[] = [
  { id: "bronze",  name: "BRONZE",  short: "Bronze", minCoins: 0,       prizeUsdt: 20,   accent: "#C97A2B" },
  { id: "silver",  name: "SILVER",  short: "Silver", minCoins: 1000,    prizeUsdt: 100,  accent: "#B8B8C8" },
  { id: "gold",    name: "GOLD",    short: "Gold",   minCoins: 10000,   prizeUsdt: 500,  accent: "#FFD24A" },
  { id: "diamond", name: "DIAMOND", short: "Diamond",minCoins: 100000,  prizeUsdt: 1000, accent: "#7DE3FF" },
];

export default function RoomSelector() {
  const { 
    coins, 
    zp, 
    currentRoom, 
    setCurrentRoom, 
    qualifiedSilver, 
    qualifiedGold, 
    qualifiedDiamond 
  } = useApp();

  const qualificationMap: Record<string, boolean> = {
    bronze: true, 
    silver: qualifiedSilver,
    gold: qualifiedGold,
    diamond: qualifiedDiamond
  };


  useEffect(() => {
    const activeRoomData = ROOMS.find((r) => r.id === currentRoom) ?? ROOMS[0];
    const isUnlocked = coins >= activeRoomData.minCoins && qualificationMap[currentRoom];
    
    if (!isUnlocked && currentRoom !== "bronze") {
      console.warn(`[SECURITY] Player mencoba bypass ke room: ${currentRoom}. Akses ditolak, tendang ke bronze!`);
      setCurrentRoom("bronze"); // Paksa balik ke jalan yang benar!
    }
  }, [currentRoom, coins, qualifiedSilver, qualifiedGold, qualifiedDiamond]);

  const active = ROOMS.find((r) => r.id === currentRoom) ?? ROOMS[0];
  const [countdown, setCountdown] = useState<number>(0);
  useEffect(() => {
    fetch(`/api/rooms?id=${currentRoom}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.remainingMs === "number") {
          setCountdown(data.remainingMs);
        }
      })
      .catch((err) => console.error("Room selector fetch error:", err));
  }, [currentRoom]);

  useEffect(() => {
    if (countdown <= 0) return;

    // Ganti bagian di dalam setInterval kamu
const timer = setInterval(() => {
  setCountdown((prev) => {
    if (prev <= 1000) {
      // Kalau habis, fetch ulang ke API buat dapet resetAt terbaru
      fetch(`/api/rooms?id=${currentRoom}`)
        .then(res => res.json())
        .then(data => setCountdown(data.remainingMs));
      return 0;
    }
    return prev - 1000;
  });
}, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function fmtCountdown(ms: number) {
    if (ms <= 0) return "Resetting...";
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / (3600 * 24));
    const h = Math.floor((s % (3600 * 24)) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    if (d >= 1) return `${d} hari ${h} jam ${m} menit`;
    return `${h} jam ${m} menit ${sec} detik`;
  }

  return (
    <div
      className="mt-3 rounded-2xl px-4 py-4"
      style={{
        background: "rgba(10,8,2,0.85)",
        border: `1.5px solid ${active.accent}88`,
        boxShadow: `0 0 24px -4px ${active.accent}44, inset 0 0 18px -10px ${active.accent}aa`,
        backdropFilter: "blur(20px)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="font-black tracking-wider text-xl leading-none italic"
            style={{ color: active.accent, textShadow: `0 0 15px ${active.accent}aa` }}
          >
            {active.name}
          </h2>
          <p className="text-[10px] mt-1.5 text-emerald-400 font-black uppercase tracking-tighter tabular-nums">
            {fmtCountdown(countdown)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 font-black text-sm">
            <Zap size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white/50 text-[10px] uppercase">ZP:</span>
            <span className="text-white text-base">{(zp[currentRoom] || 0).toLocaleString("id-ID")}</span>
          </div>
          <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Prize: ${active.prizeUsdt} USDT</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {ROOMS.map((r) => {
          const isUnlocked = coins >= r.minCoins && qualificationMap[r.id];
          const isActive = r.id === currentRoom;

          return (
            <button
              key={r.id}
              disabled={!isUnlocked}
              onClick={() => setCurrentRoom(r.id)}
              className="flex-1 py-2 rounded-xl text-[10px] font-black transition-all duration-300 disabled:opacity-20 disabled:grayscale"
              style={{
                color: isActive ? "#000" : r.accent,
                background: isActive ? r.accent : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive ? r.accent : "rgba(255,255,255,0.08)"}`,
                boxShadow: isActive ? `0 0 20px ${r.accent}66` : "none",
              }}
            >
              {isActive ? "SELECTED" : r.short}
            </button>
          );
        })}
      </div>

      {!qualificationMap[currentRoom === 'bronze' ? 'silver' : currentRoom] && (
        <p className="text-[8px] text-white/30 text-center mt-3 font-bold uppercase tracking-widest">
          Locked: reach top 150 leaderboard to unlock next room
        </p>
      )}
    </div>
  );
      }
