"use client";

import { useState } from "react";
import Image from "next/image";
import SakuiGames from "@/minigames/sakuiGame/sakuiGames"; 
import MatrixHackGame from "@/minigames/matrixGame/matrixGanes"; 
import GridTowerGame from "@/minigames/gridTower/gridTower"; 
import ColorShooterGame from "@/minigames/colorShooter/colorShooter"; 

type GameType = "matrix" | "suika" | "stack" | "shooter" | null;

export default function MinigamesHub() {
  const [activeGame, setActiveGame] = useState<GameType>(null);

  if (activeGame === "suika") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0b14] p-4">
        <button 
          onClick={() => setActiveGame(null)}
          className="mb-4 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all"
        >
          ← BACK TO HUB
        </button>
        <SakuiGames />
      </div>
    );
  }

  if (activeGame === "matrix") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0b14] p-4">
        <button onClick={() => setActiveGame(null)} className="mb-4 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-xl">← BACK</button>
        <MatrixHackGame />
      </div>
    );
  }

  if (activeGame === "stack") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0b14] p-4">
        <button onClick={() => setActiveGame(null)} className="mb-4 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-xl">← BACK</button>
        <GridTowerGame />
      </div>
    );
  }

  if (activeGame === "shooter") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0b14] p-4">
        <button onClick={() => setActiveGame(null)} className="mb-4 px-4 py-2 text-xs font-bold text-slate-400 border border-slate-800 rounded-xl">← BACK</button>
        <ColorShooterGame />
      </div>
    );
  }

  return (

      <div className="grid grid-cols-2 gap-3">
        
        {/* Game 1: MATRIX CYBER FALL */}
        <div 
          onClick={() => setActiveGame("matrix")}
          className="relative flex flex-col bg-[#1c1b24] border border-white/[0.04] rounded-2xl p-3 active:scale-95 transition-all cursor-pointer overflow-hidden group"
        >
          {/* Badge New ijo neon ala mockup */}
          <span className="absolute top-2 left-2 bg-[#10b981] text-[9px] font-black text-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90 z-10">
            New
          </span>
          <div className="w-full aspect-square relative flex items-center justify-center mb-2 rounded-xl bg-emerald-500/[0.03] group-hover:bg-emerald-500/[0.06] transition-colors">
            <Image 
              src="/image/matrix.png" 
              alt="Matrix Fall" 
              width={90} 
              height={90} 
              className="object-contain drop-shadow-[0_8px_16px_rgba(16,185,129,0.2)]"
            />
          </div>
          <h2 className="text-xs font-bold leading-tight mb-1">Matrix Fall</h2>
          <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">Bypass binary circuits speed.</p>
        </div>

        {/* Game 2: COSMIC SUIKA */}
        <div 
          onClick={() => setActiveGame("suika")}
          className="flex flex-col bg-[#1c1b24] border border-white/[0.04] rounded-2xl p-3 active:scale-95 transition-all cursor-pointer overflow-hidden group"
        >
          <div className="w-full aspect-square relative flex items-center justify-center mb-2 rounded-xl bg-fuchsia-500/[0.03] group-hover:bg-fuchsia-500/[0.06] transition-colors">
            <Image 
              src="/image/suika.png" 
              alt="Cosmic Suika" 
              width={90} 
              height={90} 
              className="object-contain drop-shadow-[0_8px_16px_rgba(236,72,153,0.2)]"
            />
          </div>
          <h2 className="text-xs font-bold leading-tight mb-1">Cosmic Suika</h2>
          <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">Trigger fusion mini planets.</p>
        </div>

        {/* Game 3: NEON STACK */}
        <div 
          onClick={() => setActiveGame("stack")}
          className="flex flex-col bg-[#1c1b24] border border-white/[0.04] rounded-2xl p-3 active:scale-95 transition-all cursor-pointer overflow-hidden group"
        >
          <div className="w-full aspect-square relative flex items-center justify-center mb-2 rounded-xl bg-indigo-500/[0.03] group-hover:bg-indigo-500/[0.06] transition-colors">
            <Image 
              src="/image/stack.png" 
              alt="Neon Stack" 
              width={90} 
              height={90} 
              className="object-contain drop-shadow-[0_8px_16px_rgba(99,102,241,0.2)]"
            />
          </div>
          <h2 className="text-xs font-bold leading-tight mb-1">Neon Stack</h2>
          <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">Stack precision cyber blocks.</p>
        </div>

        {/* Game 4: LASER COLOR MATCH */}
        <div 
          onClick={() => setActiveGame("shooter")}
          className="flex flex-col bg-[#1c1b24] border border-white/[0.04] rounded-2xl p-3 active:scale-95 transition-all cursor-pointer overflow-hidden group"
        >
          <div className="w-full aspect-square relative flex items-center justify-center mb-2 rounded-xl bg-cyan-500/[0.03] group-hover:bg-cyan-500/[0.06] transition-colors">
            <Image 
              src="/image/shooter.png" 
              alt="Laser Match" 
              width={90} 
              height={90} 
              className="object-contain drop-shadow-[0_8px_16px_rgba(6,182,212,0.2)]"
            />
          </div>
          <h2 className="text-xs font-bold leading-tight mb-1">Laser Match</h2>
          <p className="text-[10px] text-slate-400 font-medium leading-tight line-clamp-2">Sync core laser colors.</p>
        </div>

      </div>
    </div>
  );
}