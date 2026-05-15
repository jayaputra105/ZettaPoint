"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import CoinClicker from "@/components/CoinClicker";
import AdModal from "@/components/AdModal";
import RoomSelector from "@/components/RoomSelector";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const MAX_ADS = 15;
const COOLDOWN_MS = 60 * 60 * 1000;

export default function Home() {
  const { coins, setCoins, zp, setZp, currentRoom } = useApp();
  const currentZp = zp[currentRoom] || 0;
  
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
  
  useEffect(() => {
    const syncData = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const tid = tg?.initDataUnsafe?.user?.id?.toString() || "12345";
      
      try {
        const res = await fetch(`/api/user?telegramId=${tid}`);
        const data = await res.json();
        
        if (data && !data.error) {
          setCoins(Number(data.coins || 0));
          
          // SINKRON SEMUA KOLOM ZP KE APPPROVIDER
          setZp("bronze", Number(data.zpBronze || 0));
          setZp("silver", Number(data.zpSilver || 0));
          setZp("gold", Number(data.zpGold || 0));
          setZp("diamond", Number(data.zpDiamond || 0));
          
          setUserProfile({
            name: data.name || "Zetta Hunter",
            username: data.username ? `@${data.username}` : "@player",
            avatar: data.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${tid}`,
            rank: data.rank || 0
          });
        }
      } catch (err) {
        console.error("Sync failed:", err);
      } finally {
        setLoading(false);
      }
    };
    syncData();
  }, [setCoins, setZp]);
  
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
  
  const giveRewards = useCallback(async (amount: number) => {
    setZp(currentRoom, currentZp + amount);
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString() || "12345";
    
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: tid,
          addZp: amount,
          room: currentRoom // Kirim ID room aktif
        })
      });
    } catch (err) {
      console.error("Save failed:", err);
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
  
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-6 pb-2">
           <div className="flex items-center justify-between rounded-3xl px-4 py-3 bg-zinc-900/80 border border-yellow-500/20 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <img src={userProfile.avatar} className="w-12 h-12 rounded-full border-2 border-yellow-500/50" />
              <div>
                <p className="font-black text-sm text-yellow-500">{userProfile.name}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase">{userProfile.username}</p>
              </div>
            </div>
            <div className="bg-yellow-500/10 px-3 py-2 rounded-2xl border border-yellow-500/20">
              <span className="font-black text-sm text-white">🪙 {coins.toLocaleString()}</span>
            </div>
          </div>
        </header>

        <RoomSelector />

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="bg-zinc-900/50 border border-white/5 px-4 py-1.5 rounded-full">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
               🎬 Iklan: <span className="text-yellow-500">{adsRemaining}/{MAX_ADS}</span>
             </p>
          </div>
          <CoinClicker onCoin={handleCoinClick} pointsPerClick={100} locked={isLocked} />
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">+100 ZP Per Click</p>
        </div>
      </div>
      <BottomNav />
      <AdModal open={showAd} onClose={() => setShowAd(false)} onComplete={handleAdComplete} />
    </div>
  );
}