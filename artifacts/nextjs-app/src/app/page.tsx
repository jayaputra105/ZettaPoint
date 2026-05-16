"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import CoinClicker from "@/components/CoinClicker";
import AdModal from "@/components/AdModal";
import RoomSelector from "@/components/RoomSelector";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const MAX_ADS = 15;
const COOLDOWN_MS = 60 * 60 * 1000;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString() ?? "0";
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  const { 
    coins, 
    zp, setZp, 
    currentRoom,
    loading: appLoading // Gunakan loading terpusat dari AppProvider
  } = useApp();
  
  const currentZp = zp[currentRoom] || 0;
  
  const [userProfile, setUserProfile] = useState({
    name: "Identifying...",
    username: "@...",
    avatar: ""
  });
  
  const [lastFreeClick, setLastFreeClick] = useState<number | null>(null);
  const [adsUsed, setAdsUsed] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [now, setNow] = useState(Date.now());

  // 1. AMBIL PROFILE LANGSUNG DARI TELEGRAM (TANPA TEMBAK API GET LAGI)
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    const user = tg?.initDataUnsafe?.user;
    if (user) {
      setUserProfile({
        name: user.first_name || "Zetta Player",
        username: user.username ? `@${user.username}` : "@player",
        avatar: user.photo_url || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`
      });
    }
  }, []);

  // 2. TIMER & LOCAL STORAGE
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
  const adsRemaining = MAX_ADS - (isFreeAvailable ? 0 : adsUsed);
  const isLocked = !isFreeAvailable && adsRemaining <= 0;
  const timeUntilReset = lastFreeClick ? COOLDOWN_MS - sinceLastFree : 0;
  
  // 3. FUNGSI REWARD (OPTIMISTIC UPDATE)
  const giveRewards = useCallback(async (amount: number) => {
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString();
    
    if (!tid) return;

    // Langkah 1: Kunci angka baru di state global (AppProvider)
    setZp(currentRoom, currentZp + amount);
    
    try {
      // Langkah 2: Kirim data ke DB lewat PATCH (biarkan berjalan di background)
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
      console.error("Save error:", err);
      // Rollback jika beneran gagal total koneksinya
      setZp(currentRoom, currentZp);
    }
  }, [currentRoom, currentZp, setZp]);
  
  const handleCoinClick = () => {
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
  };
  
  const handleAdComplete = () => {
    const newAds = adsUsed + 1;
    setAdsUsed(newAds);
    localStorage.setItem("zetta_ads_used", String(newAds));
    setShowAd(false);
    giveRewards(100);
  };
  
  let statusLabel: React.ReactNode;
  let statusColor: string;
  if (isFreeAvailable) {
    statusLabel = "✅ Free click available!";
    statusColor = "#4ade80";
  } else if (isLocked) {
    statusLabel = <>🔒 Reset in <span className="text-yellow-500 font-black">{formatCountdown(timeUntilReset)}</span></>;
    statusColor = "rgba(255,100,100,0.85)";
  } else {
    statusLabel = <>🎬 Ads: <span className="text-yellow-500 font-black">{adsRemaining}/{MAX_ADS}</span> | {formatCountdown(timeUntilReset)}</>;
    statusColor = "rgba(255,215,0,0.75)";
  }
  
  // Menggunakan loading terpusat dari AppProvider agar tidak flashing saat pindah page
  if (appLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-500 font-black animate-pulse tracking-[0.5em] uppercase text-xs">
          Identifying Player...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      <ShootingStars />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        
        <header className="pt-6 pb-2">
           <div className="flex items-center justify-between rounded-3xl px-4 py-3 bg-zinc-900/80 border border-yellow-500/20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500/50">
                <img src={userProfile.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=fallback`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-black text-sm text-yellow-500">{userProfile.name}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase">{userProfile.username}</p>
              </div>
            </div>

            <div className="bg-yellow-500/10 px-3 py-2 rounded-2xl border border-yellow-500/20">
              <span className="font-black text-sm text-white">🪙 {formatNumber(coins)}</span>
            </div>
          </div>
        </header>

        <RoomSelector />

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="bg-zinc-900/50 border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-sm">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
               🎬 ads: <span className="text-yellow-500 font-black">{adsRemaining}/{MAX_ADS}</span>
             </p>
          </div>

          <CoinClicker onCoin={giveRewards} pointsPerClick={100} locked={isLocked} />

          <div className="rounded-2xl px-5 py-3 text-center bg-zinc-900/80 border border-white/10">
            <p className="text-xs font-bold" style={{ color: statusColor }}>{statusLabel}</p>
          </div>

          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
            +100 ZP ({currentRoom.toUpperCase()})
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}