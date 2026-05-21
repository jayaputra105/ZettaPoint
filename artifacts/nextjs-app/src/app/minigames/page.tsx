'use client';

import { useState } from "react";
import { useApp } from "@/context/AppProvider";
import ShootingStars from "@/components/ShootingStars";
import ArcadePortal from "@/components/arcade/ArcadePortal";

const GAME_LIST = [
  { 
    id: 'g1', 
    title: 'Ludo King', 
    url: 'https://zv1y2i8p.play.gamezop.com/g/SkhljT2fdgb',
    image: '/images/ludoking.png' 
  },
  { 
    id: 'g2', 
    title: 'Neon Stack', 
    url: 'https://link-game-lain.com',
    image: '/images/stack.png' 
  },
];

export default function MiniGamesPage() {
  const { coins } = useApp();
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full bg-[#0d0b14] text-white p-4 font-mono relative overflow-hidden">
      {/* Layer 1: Animasi Bintang */}
      <ShootingStars />
      
      {/* Layer 2: Portal Game (Jika aktif) */}
      {activeUrl && (
        <ArcadePortal url={activeUrl} onClose={() => setActiveUrl(null)} />
      )}

      {/* Layer 3: Konten Utama */}
      <div className="max-w-md mx-auto relative z-10">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-[#D4AF37]/40 pb-4 mb-8">
          <div>
            <h1 className="text-xl font-black text-[#D4AF37] tracking-tighter uppercase">Galaxi Minigames</h1>
            <p className="text-[10px] text-purple-300 tracking-widest">POWERED BY GAMEZOP</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-500 uppercase">Balance</p>
            <p className="text-sm font-bold text-white">🪙 {coins?.toLocaleString() ?? "0"} <span className="text-[#D4AF37]">ZP</span></p>
          </div>
        </header>

        {/* Grid Game */}
        <main className="grid grid-cols-2 gap-4">
          {GAME_LIST.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveUrl(game.url)}
              className="group relative h-32 rounded-2xl p-1 overflow-hidden active:scale-95 transition-all
                         bg-[url('/images/bordergame.jpg')] bg-cover bg-center shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              {/* Layer Gambar Game & Teks */}
              <div 
                className="w-full h-full rounded-xl bg-cover bg-center flex flex-col justify-end p-3 border border-[#D4AF37]/50 relative"
                style={{ backgroundImage: `url(${game.image})` }} 
              >
                {/* Overlay gelap */}
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors rounded-xl" />
                
                <span className="text-xs font-black text-white relative z-10 drop-shadow-md">
                  {game.title}
                </span>
                <span className="text-[9px] text-[#D4AF37] font-bold relative z-10 uppercase mt-1">
                  Tap to Play
                </span>
              </div>
            </button>
          ))}
        </main>
      </div>
    </div>
  );
}