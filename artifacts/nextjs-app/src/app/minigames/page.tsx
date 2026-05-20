'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppProvider";
import CardGames from "@/components/cardGames";

// Import game asli lu
import SakuiGames from "@/minigames/sakuiGame/sakuiGames"; 
import MatrixHackGame from "@/minigames/sakuiGame/MatrixHack"; 
import GridTowerGame from "@/minigames/sakuiGame/GridTower"; 
import ColorShooterGame from "@/minigames/sakuiGame/ColorShooter"; 

export default function MiniGamesPage() {
  const { coins, playSFX } = useApp();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
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

  const handleSelectGame = (gameId: string) => {
    if (typeof playSFX === "function") playSFX("click");
    setActiveGame(gameId);
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0b14] text-slate-200 select-none p-4 pb-12 font-mono">
      <div className="max-w-md mx-auto flex flex-col gap-4">
        
        {/* CONDITION 1: SCREEN SAAT MAIN GAME */}
        {activeGame ? (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <div className="w-full flex justify-start mb-4">
              <button 
                onClick={() => {
                  if (typeof playSFX === "function") playSFX("click");
                  setActiveGame(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#1b1926] border border-slate-800 text-[10px] font-black text-slate-400 active:scale-95 transition-all tracking-wider uppercase"
              >
                ⬅ Exit to Hub
              </button>
            </div>

            <div className="w-full flex justify-center bg-slate-950/40 p-2 rounded-3xl border border-slate-900/60 shadow-inner">
              {activeGame === "suika" && <SakuiGames />}
              {activeGame === "matrix" && <MatrixHackGame />}
              {activeGame === "stack" && <GridTowerGame />}
              {activeGame === "shooter" && <ColorShooterGame />}
            </div>
          </div>
        ) : (

          /* CONDITION 2: MAIN MENU HUB (POLOS TANPA TIER) */
          <>
            {/* TOP BAR */}
            <div className="flex items-center justify-between w-full border-b border-slate-900/60 pb-3">
              <div>
                <h1 className="text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase">
                  Mini Games
                </h1>
                <p className="text-[8px] text-slate-600 tracking-wider">SELECT A PROTOCOL TO PLAY</p>
              </div>
              <Link href="/">
                <button 
                  onClick={() => { if (typeof playSFX === "function") playSFX("click"); }}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1b1926] border border-slate-800 text-slate-400 text-sm active:scale-90 transition-transform"
                >
                  ↩️
                </button>
              </Link>
            </div>

            {/* PROFILE BOX */}
            <div className="w-full flex items-center justify-between rounded-2xl p-4 bg-[#1b1926]/40 backdrop-blur-md border border-slate-900/50 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex-shrink-0">
                  {userProfile.avatar ? (
                    <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center text-xs font-black text-indigo-400">Z</div>
                  )}
                </div>
                <div>
                  <p className="font-black text-xs text-slate-100 tracking-tight">{userProfile.name}</p>
                  <p className="text-[8px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5">• ONLINE</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-wider">BALANCE</p>
                <p className="font-black text-sm text-yellow-400 tracking-tight mt-0.5">
                  🪙 {coins?.toLocaleString() ?? "0"} <span className="text-[8px] text-slate-500">ZP</span>
                </p>
              </div>
            </div>

            {/* ASYMMETRIC BENTO GRID (TANPA EMBLASEM TIER) */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              
              {/* Game Panjang / Row-Span-2 */}
              <CardGames
                title="MATRIX CYBER FALL"
                description="Bypass gerbang sirkuit biner kecepatan tinggi sebelum firewall jebol."
                imageSrc="/images/matrix.png"
                className="row-span-2 min-h-[220px]"
                onClick={() => handleSelectGame("matrix")}
              />

              <CardGames
                title="COSMIC SUIKA"
                description="Trigger fusi planet mini jadi matahari raksasa."
                imageSrc="/images/suika.png"
                onClick={() => handleSelectGame("suika")}
              />

              <CardGames
                title="NEON STACK"
                description="Tumpuk transmisi blok siber secara presisi."
                imageSrc="/images/stack.png"
                onClick={() => handleSelectGame("stack")}
              />

              {/* Game Lebar Penuh di Bawah */}
              <CardGames
                title="LASER COLOR MATCH"
                description="Sinkronisasikan tembakan core tepat saat warna laser selaras dengan inti."
                imageSrc="/images/shooter.png"
                className="col-span-2"
                onClick={() => handleSelectGame("shooter")}
              />

            </div>

            {/* FOOTER */}
            <div className="text-center mt-6 border-t border-slate-900/40 pt-4">
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">
                Zetta Core Engine v1.2.0 // System Secured
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}