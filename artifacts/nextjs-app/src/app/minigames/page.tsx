"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useApp } from "@/context/AppProvider";
import BottomNav from "@/components/BottomNav";
import { Gamepad2, ChevronLeft } from "lucide-react";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

export default function MiniGamesPage() {
  const { coins, playSFX } = useApp();
  const [userProfile, setUserProfile] = useState({ name: "Player", avatar: "" });

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      setUserProfile({
        name: user.first_name || "Zetta Player",
        avatar: user.photo_url || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
      });
    }
  }, []);

  const games = [
    {
      id: "lucky-spin",
      title: "Lucky Spin",
      img: "https://img.freepik.com/free-vector/fortune-wheel-isolated-realistic-vector-illustration_1284-65181.jpg",
      status: "🟢 PLAY NOW",
      color: "border-cyan-500/50",
      glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]"
    },
    {
      id: "coin-flip",
      title: "Coin Flip",
      img: "https://img.freepik.com/free-vector/golden-coins-falling-white-background_1017-26038.jpg",
      status: "🔒 TIER SILVER",
      color: "border-zinc-800",
      glow: ""
    }
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      {/* 🌟 SUASANA BARU: Shooting Stars dengan pendaran Biru Neon */}
      <ShootingStars />
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-black to-black pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-6 pb-28">
        
        {/* HEADER MINI GAMES */}
        <header className="pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => { playSFX("click"); window.location.href = "/"; }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-white/5"
            >
              <ChevronLeft className="text-white" />
            </button>
            <h1 className="text-sm font-black text-white tracking-[0.4em] uppercase">Mini Games</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="flex items-center justify-between rounded-3xl px-5 py-4 bg-zinc-900/40 border border-cyan-500/20 backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/40">
                <img src={userProfile.avatar} alt="pp" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-sm text-cyan-400">{userProfile.name}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Active Player</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase mb-1">Balance</p>
              <span className="font-black text-sm text-white">🪙 {coins.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* GAME LAUNCHER GRID */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {games.map((game) => (
            <motion.div
              key={game.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => { if(game.id === 'lucky-spin') playSFX("click"); }}
              className={`relative flex flex-col rounded-3xl bg-zinc-900/60 border ${game.color} p-3 overflow-hidden ${game.glow}`}
            >
              <div className="w-full h-28 rounded-2xl overflow-hidden mb-3">
                <img src={game.img} alt={game.title} className="w-full h-full object-cover grayscale-[0.3]" />
              </div>
              <h3 className="font-black text-xs text-white mb-1 uppercase tracking-tighter">{game.title}</h3>
              <p className="text-[9px] font-bold text-cyan-500/80">{game.status}</p>
              
              {/* Dekorasi Grid */}
              <div className="absolute top-2 right-2 opacity-10">
                <Gamepad2 size={16} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
            More games coming soon
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}