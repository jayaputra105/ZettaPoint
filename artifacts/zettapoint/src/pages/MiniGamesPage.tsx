import { lazy, Suspense } from "react";
import { useLocation } from "wouter";

const ShootingStars = lazy(() => import("@/components/ShootingStars"));

const FEATURED_PLACEHOLDERS = [
  { id: 1, label: "Coming Soon", tag: "ACTION", color: "from-purple-900/60 to-purple-950", border: "border-purple-500/20", emoji: "🎯" },
  { id: 2, label: "Coming Soon", tag: "PUZZLE", color: "from-blue-900/60 to-blue-950", border: "border-blue-500/20", emoji: "🧩" },
  { id: 3, label: "Coming Soon", tag: "ARCADE", color: "from-pink-900/60 to-pink-950", border: "border-pink-500/20", emoji: "🕹️" },
  { id: 4, label: "Coming Soon", tag: "RACING", color: "from-amber-900/60 to-amber-950", border: "border-amber-500/20", emoji: "🏎️" },
];

const GRID_PLACEHOLDERS = [
  { id: 5, tag: "RPG", emoji: "⚔️", color: "from-red-900/40", border: "border-red-500/15" },
  { id: 6, tag: "CLICKER", emoji: "👆", color: "from-green-900/40", border: "border-green-500/15" },
  { id: 7, tag: "SHOOTER", emoji: "🔫", color: "from-cyan-900/40", border: "border-cyan-500/15" },
  { id: 8, tag: "TOWER", emoji: "🏰", color: "from-yellow-900/40", border: "border-yellow-500/15" },
  { id: 9, tag: "MATCH-3", emoji: "💎", color: "from-indigo-900/40", border: "border-indigo-500/15" },
  { id: 10, tag: "BATTLE", emoji: "🥊", color: "from-orange-900/40", border: "border-orange-500/15" },
  { id: 11, tag: "CARD", emoji: "🃏", color: "from-teal-900/40", border: "border-teal-500/15" },
  { id: 12, tag: "CASINO", emoji: "🎲", color: "from-rose-900/40", border: "border-rose-500/15" },
];

export default function MiniGamesPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full bg-[#0d0b14] text-white relative overflow-hidden">
      <Suspense fallback={null}><ShootingStars /></Suspense>

      <div className="max-w-md mx-auto relative z-10 pb-12">
        <header className="flex justify-between items-end border-b border-[#D4AF37]/40 pb-4 mb-6 px-4 pt-8">
          <div>
            <h1 className="text-xl font-black text-[#D4AF37] tracking-tighter uppercase">Galaxi Minigames</h1>
            <p className="text-[10px] text-purple-300 tracking-widest">ARCADE ZONE</p>
          </div>
          <button 
            onClick={() => navigate("/")}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1a0b2e] border border-[#D4AF37]/60 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#D4AF37] active:scale-95 transition-transform"
          >
            Home ➡️
          </button>
        </header>

        <section className="mb-8">
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">⭐ Featured</h2>
            <span className="text-[9px] text-purple-400/50 font-bold uppercase tracking-widest">New games soon</span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none snap-x snap-mandatory">
            {FEATURED_PLACEHOLDERS.map((item) => (
              <div
                key={item.id}
                className={`flex-shrink-0 w-44 h-56 rounded-[24px] bg-gradient-to-b ${item.color} border ${item.border} flex flex-col items-center justify-center gap-3 snap-start cursor-not-allowed relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="text-5xl relative z-10">{item.emoji}</span>
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">{item.tag}</p>
                  <p className="text-xs font-black text-white/50 mt-1">{item.label}</p>
                </div>
                <div className="absolute top-3 right-3 bg-white/10 border border-white/10 rounded-lg px-2 py-0.5">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">Soon</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">🎮 All Games</h2>
            <span className="text-[9px] text-[#D4AF37]/40 font-bold uppercase tracking-widest">{GRID_PLACEHOLDERS.length} slots</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {GRID_PLACEHOLDERS.map((item) => (
              <div
                key={item.id}
                className={`h-36 rounded-[20px] bg-gradient-to-br ${item.color} to-black border ${item.border} flex flex-col items-center justify-center gap-2 cursor-not-allowed relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="text-3xl relative z-10">{item.emoji}</span>
                <div className="relative z-10 text-center">
                  <p className="text-[9px] font-black text-white/25 uppercase tracking-widest">{item.tag}</p>
                  <p className="text-[8px] text-white/20 font-bold mt-0.5">Coming Soon</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-4">
          <div className="p-5 rounded-[24px] bg-[#D4AF37]/5 border border-[#D4AF37]/15 text-center">
            <p className="text-2xl mb-2">🚀</p>
            <p className="text-sm font-black text-[#D4AF37]">Launching Soon</p>
            <p className="text-[10px] text-white/30 mt-1 font-bold">Games will be added in upcoming updates. Stay tuned!</p>
          </div>
        </section>
      </div>
    </div>
  );
}
