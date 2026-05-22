'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import router untuk navigasi balik
import ShootingStars from "@/components/ShootingStars";
import ArcadePortal from "@/components/arcade/ArcadePortal";

export default function MiniGamesPage() {
  const router = useRouter(); // Inisialisasi fungsi navigasi balik
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Mengambil data game via Proxy gratisan agar tidak diblokir CORS oleh browser
  useEffect(() => {
    async function fetchGames() {
      try {
        const targetUrl = encodeURIComponent('https://feeds.gamepix.com/v2/json?sid=OO6AO&pagination=12&page=1');
        const res = await fetch(`https://allorigins.win{targetUrl}`);
        
        if (!res.ok) throw new Error('Gagal memuat katalog');
        
        const responseData = await res.json();
        const result = JSON.parse(responseData.contents); // Membongkar data asli dari proxy
        
        setGames(result.data || []);
      } catch (error) {
        console.error("Error fetching games:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

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
            <p className="text-[10px] text-purple-300 tracking-widest">POWERED BY GAMEPIX</p>
          </div>
          
          {/* Tombol kembali ke Halaman Home */}
          <button 
            onClick={() => router.push('/')} // Ganti '/' dengan path home Anda jika berbeda (misal: '/home')
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1a0b2e] border border-[#D4AF37]/60 rounded-xl text-[10px] font-black uppercase tracking-wider text-[#D4AF37] active:scale-95 transition-transform shadow-[0_0_10px_rgba(212,175,55,0.1)]"
          >
            Home ➡️
          </button>
        </header>

        {loading ? (
          <div className="text-center text-xs text-purple-300 animate-pulse mt-20 tracking-widest">
            LOADING GALAXY FEED...
          </div>
        ) : games.length === 0 ? (
          <div className="text-center text-xs text-red-400 mt-20 tracking-widest">
            FEED EMPTY OR BLOCKED.
          </div>
        ) : (
          <main className="grid grid-cols-2 gap-4 pb-10">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setActiveUrl(game.url)}
                className="group relative h-32 rounded-2xl p-1 overflow-hidden active:scale-95 transition-all
                           bg-[url('/images/bordergame.jpg')] bg-cover bg-center shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                <div 
                  className="w-full h-full rounded-xl bg-cover bg-center flex flex-col justify-end p-3 border border-[#D4AF37]/50 relative"
                  style={{ backgroundImage: `url(${game.thumbnailUrl})` }} 
                >
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors rounded-xl" />
                  
                  <span className="text-[11px] font-black text-white relative z-10 drop-shadow-md tracking-wider text-left line-clamp-1">
                    {game.title}
                  </span>
                  <span className="text-[8px] text-[#D4AF37] font-bold relative z-10 uppercase mt-1 text-left tracking-widest">
                    {game.category || "Casual"}
                  </span>
                </div>
              </button>
            ))}
          </main>
        )}
      </div>
    </div>
  );
}
