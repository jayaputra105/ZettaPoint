"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import CoinClicker from "@/components/CoinClicker";
import AdModal from "@/components/AdModal";
import { useApp } from "@/context/AppProvider"; // Pastikan path & case-sensitive benar

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), {
  ssr: false,
});

const MAX_ADS = 15;
const COOLDOWN_MS = 60 * 60 * 1000;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Home() {
  // AMBIL DATA DARI BRANKAS PUSAT (AppProvider)
  const { coins, setCoins, zp, setZp, usdt, currentRoom } = useApp();
  
  // Ambil ZP spesifik untuk room saat ini (default: bronze)
  const currentZp = zp[currentRoom] || 0;

  const [userProfile, setUserProfile] = useState({
    name: "Loading...",
    username: "...",
    avatar: "",
    rank: 0
  });

  const [lastFreeClick, setLastFreeClick] = useState<number | null>(null);
  const [adsUsed, setAdsUsed] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [now, setNow] = useState(Date.now());

  // 1. Sinkronisasi Data dari Database ke Brankas Pusat
  useEffect(() => {
    const syncData = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const user = tg?.initDataUnsafe?.user;

      if (user) {
        try {
          const params = new URLSearchParams({
            telegramId: user.id.toString(),
            firstName: user.first_name,
            username: user.username || "",
            photoUrl: user.photo_url || ""
          });

          const res = await fetch(`/api/user?${params.toString()}`);
          const data = await res.json();
          
          if (data) {
            setCoins(Number(data.coins));
            // Set ZP ke room yang sedang aktif
            setZp(currentRoom, Number(data.zp_score || 0)); 
            
            setUserProfile({
              name: data.name,
              username: data.username ? `@${data.username}` : "User",
              avatar: data.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${data.id}`,
              rank: data.rank || 0
            });
          }
        } catch (err) {
          console.error("Database connection failed:", err);
        }
      }
    };

    syncData();
  }, [currentRoom, setCoins, setZp]);

  useEffect(() => {
    const stored = localStorage.getItem("zetta_last_free");
    const storedAds = localStorage.getItem("zetta_ads_used");
    if (stored) setLastFreeClick(Number(stored));
    if (storedAds) setAdsUsed(Number(storedAds));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const sinceLastFree = lastFreeClick ? now - lastFreeClick : COOLDOWN_MS;
  const isFreeAvailable = sinceLastFree >= COOLDOWN_MS;
  const currentAdsUsed = isFreeAvailable ? 0 : adsUsed;
  const adsRemaining = MAX_ADS - currentAdsUsed;
  const isLocked = !isFreeAvailable && adsRemaining <= 0;
  const timeUntilReset = lastFreeClick ? COOLDOWN_MS - sinceLastFree : 0;

  // 2. Fungsi Update Koin & ZP (Global)
  const giveRewards = useCallback(async (amount: number) => {
    // Update di Frontend (Global State)
    const newZp = currentZp + amount;
    setZp(currentRoom, newZp);

    const tg = (window as any).Telegram?.WebApp;
    const telegramId = tg?.initDataUnsafe?.user?.id;

    if (telegramId) {
      try {
        await fetch('/api/user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegramId: telegramId.toString(),
            addZp: amount // Asumsi backend lu terima addZp
          })
        });
      } catch (err) {
        console.error("Failed to sync rewards to DB:", err);
      }
    }
  }, [currentRoom, currentZp, setZp]);

  const handleCoinClick = useCallback(() => {
    if (isFreeAvailable) {
      const ts = Date.now();
      setLastFreeClick(ts);
      setAdsUsed(0);
      localStorage.setItem("zetta_last_free", String(ts));
      localStorage.setItem("zetta_ads_used", "0");
      giveRewards(100); // Sesuai teks lu +100 per klik
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

  // UI Status Labels (English)
  let statusLabel: React.ReactNode;
  let statusColor: string;
  if (isFreeAvailable) {
    statusLabel = "✅ Free click available!";
    statusColor = "#4ade80";
  } else if (isLocked) {
    statusLabel = (
      <>
        🔒 Locked — reset in{" "}
        <span style={{ color: "#FFD700", fontWeight: 900 }}>
          {formatCountdown(timeUntilReset)}
        </span>
      </>
    );
    statusColor = "rgba(255,100,100,0.85)";
  } else {
    statusLabel = (
      <>
        🎬 Ads available:{" "}
        <span style={{ color: "#FFD700", fontWeight: 900 }}>
          {adsRemaining}/{MAX_ADS}
        </span>{" "}
        | reset in{" "}
        <span style={{ color: "rgba(255,215,0,0.7)", fontWeight: 700 }}>
          {formatCountdown(timeUntilReset)}
        </span>
      </>
    );
    statusColor = "rgba(255,215,0,0.75)";
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000000 100%)",
      }}
    >
      <ShootingStars />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4">
        <header className="pt-5 pb-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: "rgba(10,8,2,0.75)",
              border: "1.5px solid rgba(255,215,0,0.45)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden" style={{ border: "2px solid rgba(255,215,0,0.7)" }}>
                <img src={userProfile?.avatar} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#FFD700" }}>{userProfile?.name}</p>
                <p className="text-xs" style={{ color: "rgba(255,215,0,0.5)" }}>{userProfile?.username}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🪙</span>
                <span className="font-black text-base tabular-nums" style={{ color: "#FFD700" }}>
                  {formatNumber(coins)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}>
                <span className="text-xs">🏆</span>
                <span className="text-xs font-bold" style={{ color: "rgba(255,215,0,0.85)" }}>
                  Rank #{userProfile.rank}
                </span>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="flex items-center justify-between px-1 mt-1 mb-2">
          {[
            { label: "Zetta Points", value: formatNumber(currentZp), icon: "⚡" },
            { label: "Ads Remaining", value: isFreeAvailable ? "–" : `${adsRemaining}/${MAX_ADS}`, icon: "🎬" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(10,10,15,0.7)", border: "1px solid rgba(255,215,0,0.18)", flex: 1, marginInline: 4 }}>
              <span className="text-base">{stat.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{stat.label}</p>
                <p className="text-sm font-black" style={{ color: "rgba(255,255,255,0.9)" }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-4">
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: "rgba(255,215,0,0.55)" }}>
            Tap to Earn
          </p>

          <CoinClicker
            onCoin={handleCoinClick}
            pointsPerClick={100}
            locked={isLocked}
            needsAd={!isFreeAvailable && !isLocked}
          />

          <div className="rounded-2xl px-4 py-2.5 text-center" style={{ background: "rgba(10,10,15,0.7)", border: `1px solid ${isLocked ? "rgba(255,80,80,0.25)" : "rgba(255,215,0,0.2)"}`, maxWidth: 280 }}>
            <p className="text-xs font-medium" style={{ color: statusColor }}>{statusLabel}</p>
          </div>

          <p className="text-xs font-medium" style={{ color: "rgba(255,215,0,0.5)" }}>
            +100 Zetta Points per click
          </p>
        </div>

        <div className="pb-24" />
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