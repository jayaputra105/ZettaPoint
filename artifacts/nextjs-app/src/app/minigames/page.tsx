"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gamepad2, ChevronLeft } from "lucide-react";
import { useApp } from "@/context/AppProvider";
import BottomNav from "@/components/BottomNav";

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
      color: "border-cyan-500/30 bg-cyan-950/20",
      glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)]"
    },
    {
      id: "coin-flip",
      title: "Coin Flip",
      img: "https://img.freepik.com/free-vector/golden-coins-falling-white-background_1017-26038.jpg",
      status: "🔒 TIER SILVER",
      color: "border-zinc-800 bg-zinc-950/50 opacity-50",
      glow: ""
    }
  ];

  return (
    // 🌟 BACKGROUND BARU: Murni Hitam dengan lingkaran pendaran Cyan/Biru Neon di tengah & atas
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      
      {/* Efek Pendaran Cahaya Neon Atas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Efek Pendaran Cahaya Neon Tengah Layar */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-6 pb-28">
        
        {/* HEADER MENU */}
        <header className="pt-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => { playSFX("click"); window.location.href = "/"; }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/80 border border-cyan-500/10 backdrop-blur-md"
            >
              <ChevronLeft className="text-cyan-400" size={20} />
            </button>
            <h1 className="text-xs font-black text-cyan-400 tracking-[0.5em] uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              Mini Games
            </h1>
            <div className="w-10" />
          </div>

          {/* BOX PROFIL SINKRON (TEMA BIRU) */}
          <div className="flex items-center justify-between rounded-2xl px-5 py-4 bg-zinc-950/60 border border-cyan-500/20 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-cyan-500/30">
                <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-sm text-white">{userProfile.name}</p>
                <p className="text-[9px] text-cyan-400/60 font-black uppercase tracking-wider">Arcade District</p>
              </div>
            </div>
            <div className="bg-cyan-950/30 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-right">
              <span className="font-black text-xs text-cyan-300">🪙 {coins.toLocaleString()}</span>
            </div>
          </div>
        </header>

        {/* LIST MENU GAME STYLE LAUNCHER */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {games.map((game) => (
            <motion.div
              key={game.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => { if(game.id === 'lucky-spin') playSFX("click"); }}
              className={`relative flex flex-col rounded-2xl border ${game.color} p-3 overflow-hidden transition-all duration-300 ${game.glow}`}
            >
              <div className="w-full h-24 rounded-xl overflow-hidden mb-3 bg-zinc-950 border border-white/5">
                <img src={game.img} alt={game.title} className="w-full h-full object-cover mix-blend-screen opacity-80" />
              </div>
              <h3 className="font-black text-xs text-white mb-0.5 uppercase tracking-tight">{game.title}</h3>
              <p className="text-[9px] font-black text-cyan-400 tracking-wide">{game.status}</p>
              
              <div className="absolute top-2 right-2 opacity-5 text-cyan-400">
                <Gamepad2 size={14} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-10 text-center">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">
            SYSTEM ONLINE // MORE ARCADE COMING
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}