'use client';

import { useState } from "react";
import { useApp } from "@/context/AppProvider";
import ShootingStars from "@/components/ShootingStars";
import ArcadePortal from "@/components/arcade/ArcadePortal";

const GAME_LIST = [
  { 
    id: 'g1', 
    title: 'Fruit Match', 
    url: 'https://html5.gamedistribution.com/4254dba037de4b798541d2c97eae5016/?gd_sdk_referrer_url=https://gamedistribution.com/games/fruit-match-1/',
    image: '/images/fruitmatch.jpg' 
  },
  { 
    id: 'g2', 
    title: 'Hexagon', 
    url: '"https://html5.gamedistribution.com/882e8405283041b7922818fa6ff892b6/?gd_sdk_referrer_url=https://gamedistribution.com/games/hexagon-3/',
    image: '/images/hexagon_image.zip' 
  },
   { 
    id: 'g3', 
    title: 'ninja survivor', 
    url: 'https://html5.gamedistribution.com/6ff158a48fed4f3aa40877422662a71a/?gd_sdk_referrer_url=https://gamedistribution.com/games/ninja-survivor/',
    image: '/images/ninjasurvivor.jpg' 
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
    // Tambahkan style font di sini
    <div 
      className="min-h-screen w-full bg-[#0d0b14] text-white p-4 relative overflow-hidden"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      {/* Tambahkan link font agar bisa diakses */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap" 
        rel="stylesheet" 
      />

      <ShootingStars />
      
      {activeUrl && (
        <ArcadePortal url={activeUrl} onClose={() => setActiveUrl(null)} />
      )}

      <div className="max-w-md mx-auto relative z-10">
        <header className="flex justify-between items-end border-b border-[#D4AF37]/40 pb-4 mb-8">
          <div>
            <h1 className="text-xl font-black text-[#D4AF37] tracking-tighter uppercase">Galaxi Minigames</h1>
            <p className="text-[10px] text-purple-300 tracking-widest">POWERED BY GANE DISTRIBUTION</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-slate-500 uppercase">Balance</p>
            <p className="text-sm font-bold text-white">🪙 {coins?.toLocaleString() ?? "0"} <span className="text-[#D4AF37]">ZP</span></p>
          </div>
        </header>

        <main className="grid grid-cols-2 gap-4">
          {GAME_LIST.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveUrl(game.url)}
              className="group relative h-32 rounded-2xl p-1 overflow-hidden active:scale-95 transition-all
                         bg-[url('/images/bordergame.jpg')] bg-cover bg-center shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              <div 
                className="w-full h-full rounded-xl bg-cover bg-center flex flex-col justify-end p-3 border border-[#D4AF37]/50 relative"
                style={{ backgroundImage: `url(${game.image})` }} 
              >
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors rounded-xl" />
                
                <span className="text-xs font-black text-white relative z-10 drop-shadow-md tracking-wider">
                  {game.title}
                </span>
                <span className="text-[9px] text-[#D4AF37] font-bold relative z-10 uppercase mt-1 tracking-widest">
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