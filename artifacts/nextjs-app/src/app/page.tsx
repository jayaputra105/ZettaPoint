"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import CoinClicker from "@/components/CoinClicker";
import AdModal from "@/components/AdModal";
import RoomSelector from "@/components/RoomSelector";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), {
  ssr: false,
});

const MAX_ADS = 15;
const COOLDOWN_MS = 60 * 60 * 1000;

// --- UTILS ---
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toString() ?? "0";
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  // --- GLOBAL STATE (AppProvider) ---
  const { coins, setCoins, zp, setZp, currentRoom } = useApp();
  
  // ZP spesifik untuk room yang sedang dipilih di selector
  const currentZp = zp[currentRoom] || 0;
  
  // --- LOCAL STATE ---
  const [userProfile, setUserProfile] = useState({
    name: "Zetta Hunter",
    username: "@zetta",
    avatar: "",
    rank: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [lastFreeClick, setLastFreeClick] = useState < number | null > (null);
  const [adsUsed, setAdsUsed] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [now, setNow] = useState(Date.now());
  
  // 1. SINKRONISASI DATABASE (Biar nama gak loading & ZP gak reset)
  useEffect(() => {
    const syncData = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;
      const tid = user?.id?.toString() || "12345"; // fallback buat dev
      
      try {
        const res = await fetch(`/api/user?telegramId=${tid}`);
        const data = await res.json();
        
        if (data && !data.error) {
          setCoins(Number(data.coins || 0));
          
          // Masukin ZP dari DB ke room perunggu sebagai awal
          setZp("bronze", Number(data.zp || 0));
          
          setUserProfile({
            name: data.name || user?.first_name || "Zetta Hunter",
            username: data.username ? `@${data.username}` : (user?.username ? `@${user.username}` : "@player"),
            avatar: data.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${tid}`,
            rank: data.rank || 0
          });
        }
      } catch (err) {
        console.error("Database connection failed:", err);
      } finally {
        setLoading(false);
      }
    };
    
    syncData();
  }, [setCoins, setZp]);
  
  // 2. TIMER & LOCAL STORAGE LOGIC
  useEffect(() => {
    const stored = localStorage.getItem("zetta_last_free");
    const storedAds = localStorage.getItem("zetta_ads_used");
    if (stored) setLastFreeClick(Number(stored));
    if (storedAds) setAdsUsed(Number(storedAds));
    
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  
  const sinceLastFree = lastFreeClick ? now - lastFreeClick : COOLDOWN_MS;
  const isFreeAvailable = sinceLastFree >= COOLDOWN_MS;
  const currentAdsUsed = isFreeAvailable ? 0 : adsUsed;
  const adsRemaining = MAX_ADS - currentAdsUsed;
  const isLocked = !isFreeAvailable && adsRemaining <= 0;
  const timeUntilReset = lastFreeClick ? COOLDOWN_MS - sinceLastFree : 0;
  
  // 3. FUNGSI UPDATE GLOBAL (Frontend + Backend)
  const giveRewards = useCallback(async (amount: number) => {
    // Update State Global (Biar ZP nambah di UI seketika)
    const newTotalZp = currentZp + amount;
    setZp(currentRoom, newTotalZp);
    
    // Kirim ke Neon Database (Biar gak reset pas refresh)
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString() || "12345";
    
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tid,
          addZp: amount,
          room: currentRoom
        })
      });
    } catch (err) {
      console.error("Gagal sinkron reward ke DB:", err);
    }
  }, [currentRoom, currentZp, setZp]);
  
  const handleCoinClick = useCallback(() => {
    if (isFreeAvailable) {
      const ts = Date.now();
      setLastFreeClick(ts);
      setAdsUsed(0);
      localStorage.setItem("zetta_last_free", String(ts));
      localStorage.setItem("zetta_ads_used", "0");
      giveRewards(100);
    } else if (adsRemaining > 0) {
      setShowAd(true);
    }
  }, [isFreeAvailable, adsRemaining, giveRewards]);
  
  const handleAdComplete = useCallback(() => {
    const newAds = currentAdsUsed + 1;
    setAdsUsed(newAds);
    localStorage.setItem("zetta_ads_used", String(newAds));
    setShowAd(false);
    giveRewards(100);
  }, [currentAdsUsed, giveRewards]);
  
  // --- UI LABELS ---
  let statusLabel: React.ReactNode;
  let statusColor: string;
  if (isFreeAvailable) {
    statusLabel = "✅ Free click available!";
    statusColor = "#4ade80";
  } else if (isLocked) {
    statusLabel = (
      <>🔒 Locked — reset in <span className="font-black" style={{ color: "#FFD700" }}>{formatCountdown(timeUntilReset)}</span></>
    );
    statusColor = "rgba(255,100,100,0.85)";
  } else {
    statusLabel = (
      <>🎬 Ads: <span className="font-black" style={{ color: "#FFD700" }}>{adsRemaining}/{MAX_ADS}</span> | reset: {formatCountdown(timeUntilReset)}</>
    );
    statusColor = "rgba(255,215,0,0.75)";
  }
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col bg-black">
      <ShootingStars />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4">
        
        {/* HEADER: USER INFO & COINS */}
        <header className="pt-6 pb-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-3xl px-4 py-3 bg-zinc-900/80 border border-yellow-500/20 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500/50">
                <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-sm text-yellow-500">{userProfile.name}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">{userProfile.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-2xl border border-yellow-500/20">
              <span className="text-base">🪙</span>
              <span className="font-black text-sm text-white tabular-nums">
                {formatNumber(coins)}
              </span>
            </div>
          </motion.div>
        </header>

        {/* ROOM SELECTOR (Sesuai IMG_20260514_235047.jpg) */}
        <RoomSelector />

        {/* CLICKER SECTION */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-4">
          
          <div className="bg-zinc-900/50 border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-sm">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
               🎬 Iklan tersedia: <span className="text-yellow-500 font-black">{adsRemaining}/{MAX_ADS}</span>
             </p>
          </div>

          <CoinClicker
            onCoin={handleCoinClick}
            pointsPerClick={100}
            locked={isLocked}
          />

          <div className="rounded-2xl px-5 py-3 text-center bg-zinc-900/80 border border-white/10">
            <p className="text-xs font-bold" style={{ color: statusColor }}>{statusLabel}</p>
          </div>

          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
            +100 Zetta Points Per Click
          </p>
        </div>

        <div className="pb-28" />
      </div>

      <BottomNav />

      <AdModal
        open={showAd}
        adNumber={currentAdsUsed + 1}
        maxAds={MAX_ADS}
        onComplete={handleAdComplete}
        onClose={() => setShowAd(false)}
      />
    </div>
  );
}