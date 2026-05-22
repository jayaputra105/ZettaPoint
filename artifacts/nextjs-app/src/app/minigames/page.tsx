'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import ShootingStars from "@/components/ShootingStars";
import ArcadePortal from "@/components/arcade/ArcadePortal";

// ISI FEED GAMEPIX ANDA SUDAH SAYA PASTE LANGSUNG DI SINI AGAR 100% PASTI MUNCUL
const GAMES_DATA = [
  { id: 40003, title: "Bubble Shooter", url: "https://gamepix.com", image: "https://gamepix.com", category: "Puzzle" },
  { id: 40101, title: "Table Tennis Pro", url: "https://gamepix.com", image: "https://gamepix.com", category: "Sports" },
  { id: 40156, title: "Classic Bowling", url: "https://gamepix.com", image: "https://gamepix.com", category: "Sports" },
  { id: 40250, title: "Merge Jewels", url: "https://gamepix.com", image: "https://gamepix.com", category: "Casual" },
  { id: 40321, title: "Geometry Jump", url: "https://gamepix.com", image: "https://gamepix.com", category: "Arcade" },
  { id: 40402, title: "Knife Rain", url: "https://gamepix.com", image: "https://gamepix.com", category: "Arcade" },
  { id: 40510, title: "Block Puzzle", url: "https://gamepix.com", image: "https://gamepix.com", category: "Puzzle" },
  { id: 40660, title: "Drift King", url: "https://gamepix.com", image: "https://gamepix.com", category: "Racing" },
  { id: 40711, title: "Color Pixel Art", url: "https://gamepix.com", image: "https://gamepix.com", category: "Casual" },
  { id: 40850, title: "Word Search", url: "https://gamepix.com", image: "https://gamepix.com", category: "Puzzle" },
  { id: 40991, title: "Sudoku Classic", url: "https://gamepix.com", image: "https://gamepix.com", category: "Puzzle" },
  { id: 41012, title: "Moto X3M", url: "https://gamepix.com", image: "https://gamepix.com", category: "Racing" }
];

export default function MiniGamesPage() {
  const router = useRouter();
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  return (
    <div 
      className="min-h-screen w-full bg-[#0d0b14] text-white p-4 relative overflow-hidden"
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      <link 
        href="https://googleapis.com" 
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
            <p className="text-[10px] text-purple-300 tracking-widest">ARCADE ZONE</p>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1a0b2e] border border-[#D4AF37]/60 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#D4AF37] active:scale-95 transition-transform"
          >
            Home ➡️
          </button>
        </header>

        {/* Daftar 12 game langsung dirender otomatis tanpa nunggu loading web */}
        <main className="grid grid-cols-2 gap-4 pb-10">
          {GAMES_DATA.map((game) => (
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
                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors rounded-xl" />
                
                <span className="text-[11px] font-black text-white relative z-10 drop-shadow-md tracking-wider text-left line-clamp-1">
                  {game.title}
                </span>
                <span className="text-[8px] text-[#D4AF37] font-bold relative z-10 uppercase mt-1 text-left tracking-widest">
                  {game.category}
                </span>
              </div>
            </button>
          ))}
        </main>
      </div>
    </div>
  );
}
