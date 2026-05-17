"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppProvider";

export default function MiniGamesPage() {
  const { coins, playSFX } = useApp();
  
  const [userProfile, setUserProfile] = useState({
    name: "Zetta Player",
    avatar: ""
  });
  
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      setUserProfile({
        name: user.first_name || "Zetta Player",
        avatar: user.photo_url || ""
      });
    }
  }, []);
  
  const mainGames = [
    { id: "lucky-spin", title: "Lucky Spin", emoji: "🎡", status: "READY" },
    { id: "coin-flip", title: "Coin Flip", emoji: "🪙", status: "READY" },
    { id: "dice-roll", title: "Dice Roll", emoji: "🎲", status: "READY" },
  ];
  
  const arcadeGames = [
    { id: "cyber-race", title: "Cyber Race", emoji: "🏎️", status: "ARCADE" },
    { id: "space-miner", title: "Space Miner", emoji: "🚀", status: "ACTION" },
  ];
  
  return (
    <div className="min-h-screen w-full bg-[#030712] text-white select-none p-5 pb-10">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        
        {/* ================= BARIS: JUDUL & RETURN (FIXED LINK) ================= */}
        <div className="flex items-center justify-between w-full">
          <h1 className="text-xl font-black text-cyan-400 tracking-wider uppercase">
            Mini Games
          </h1>
          <Link href="/">
            <button 
              onClick={() => { if (typeof playSFX === "function") playSFX("click"); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#070b14] border-2 border-cyan-400 active:scale-90 transition-transform text-cyan-400 font-bold text-lg"
            >
              ↩️
            </button>
          </Link>
        </div>

        {/* ================= BOX PROFIL & COIN ================= */}
        <div className="w-full flex items-center justify-between rounded-xl p-4 bg-[#070b14] border-2 border-cyan-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-400/50 bg-zinc-900">
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-cyan-950 flex items-center justify-center text-xs font-bold text-cyan-400">Z</div>
              )}
            </div>
            <div>
              <p className="font-black text-sm text-white tracking-tight">{userProfile.name}</p>
              <p className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">Verified Player</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-zinc-500 uppercase">Your Balance</p>
            <p className="font-black text-base text-yellow-400">🪙 {coins?.toLocaleString() ?? "0"}</p>
          </div>
        </div>

        {/* ================= WADAH GAME PERTAMA (GRID 3 CARDS - FIXED) ================= */}
        <div className="w-full rounded-2xl p-4 bg-[#070b14] border-2 border-cyan-400">
          <p className="text-[10px] font-black text-cyan-400/70 tracking-widest uppercase mb-3">
            🎮 Main Arcade Hub
          </p>
          
          <div className="grid grid-cols-3 gap-3">
            {mainGames.map((game) => (
              <div
                key={game.id}
                onClick={() => { if (typeof playSFX === "function") playSFX("click"); }}
                className="flex flex-col items-center justify-center text-center bg-[#0d1527] border border-cyan-400 p-3 rounded-xl active:scale-95 transition-transform cursor-pointer"
              >
                <span className="text-3xl mb-2">{game.emoji}</span>
                <h3 className="font-black text-[10px] text-white uppercase tracking-tighter leading-tight mb-1">
                  {game.title}
                </h3>
                <span className="text-[8px] font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-400/20">
                  {game.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= WADAH GAME KEDUA ================= */}
        <div className="w-full rounded-2xl p-4 bg-[#070b14] border-2 border-cyan-400">
          <p className="text-[10px] font-black text-cyan-400/70 tracking-widest uppercase mb-3">
            🏎️ Speed & Strategy Section
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {arcadeGames.map((game) => (
              <div
                key={game.id}
                onClick={() => { if (typeof playSFX === "function") playSFX("click"); }}
                className="flex items-center gap-3 bg-[#0d1527] border border-cyan-400 p-3 rounded-xl active:scale-95 transition-transform cursor-pointer"
              >
                <span className="text-3xl">{game.emoji}</span>
                <div>
                  <h3 className="font-black text-xs text-white uppercase tracking-tight">
                    {game.title}
                  </h3>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider">
                    {game.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM FOOTER */}
        <div className="text-center mt-4">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em]">
            Zetta Core Engine v1.2.0 // Zero Lag Protocol
          </p>
        </div>

      </div>
    </div>
  );
}