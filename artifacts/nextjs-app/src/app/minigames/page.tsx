'use client';

import { useState } from "react";
import { useApp } from "@/context/AppProvider";

export default function MiniGamesPage() {
  const { coins } = useApp();
  const [activeUrl, setActiveUrl] = useState < string | null > (null);
  
  // Daftar Game (Tinggal ganti link dari Gamezop)
  const games = [
    { title: "Cosmic Blast", url: "https://www.gamezop.com/g/xxxxxx" },
    { title: "Orbit Jump", url: "https://www.gamezop.com/g/yyyyyy" },
  ];
  
  return (
    <div className="min-h-screen w-full bg-[#0d0b14] text-white p-4 font-sans">
      {activeUrl ? (
        /* SCREEN MAIN GAME */
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-3 flex justify-between items-center bg-[#1a0b2e] border-b border-[#D4AF37]/30">
            <span className="text-xs font-bold text-[#D4AF37]">PLAYING ARCADE</span>
            <button onClick={() => setActiveUrl(null)} className="px-4 py-1 rounded-full bg-[#D4AF37] text-black text-xs font-black">CLOSE</button>
          </div>
          <iframe src={activeUrl} className="w-full flex-1" title="Game" />
        </div>
      ) : (
        /* SCREEN MENU */
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-end border-b border-[#D4AF37]/20 pb-4 mb-6">
            <h1 className="text-xl font-black text-[#D4AF37] tracking-tighter">COSMIC ARCADE</h1>
            <p className="text-sm font-bold text-white">🪙 {coins?.toLocaleString()} <span className="text-[#D4AF37]">ZP</span></p>
          </div>

          {/* Grid Games */}
          <div className="grid grid-cols-2 gap-4">
            {games.map((game, i) => (
              <button
                key={i}
                onClick={() => setActiveUrl(game.url)}
                className="group relative h-32 rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-br from-[#2D0B40] to-[#0d0b14] p-4 flex flex-col justify-end overflow-hidden active:scale-95 transition-all"
              >
                <div className="absolute inset-0 bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10 transition-colors" />
                <span className="text-sm font-black text-white relative z-10">{game.title}</span>
                <span className="text-[10px] text-[#D4AF37] font-bold">TAP TO PLAY</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}