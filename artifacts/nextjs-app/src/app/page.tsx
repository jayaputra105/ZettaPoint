"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import CoinClicker from "@/components/CoinClicker";
import AdModal from "@/components/AdModal";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), {
  ssr: false,
});

const MAX_ADS = 15;
const COOLDOWN_MS = 60 * 60 * 1000;

const mockUser = {
  name: "Zetta Hunter",
  username: "@zettahunter",
  avatar: "https://api.dicebear.com/9.x/pixel-art/svg?seed=zettahunter&backgroundColor=b6e3f4",
  rank: 42,
  zettaCoins: 128450,
  zettaPoints: 98200,
};

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
  const [coins, setCoins] = useState(mockUser.zettaCoins);
  const [points, setPoints] = useState(mockUser.zettaPoints);

  const [lastFreeClick, setLastFreeClick] = useState<number | null>(null);
  const [adsUsed, setAdsUsed] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [now, setNow] = useState(Date.now());

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

  const giveCoins = useCallback((amount: number) => {
    setCoins((c) => c + amount);
    setPoints((p) => p + amount);
  }, []);

  const handleCoinClick = useCallback(() => {
    if (isFreeAvailable) {
      const ts = Date.now();
      setLastFreeClick(ts);
      setAdsUsed(0);
      localStorage.setItem("zetta_last_free", String(ts));
      localStorage.setItem("zetta_ads_used", "0");
      giveCoins(10);
    } else if (adsRemaining > 0) {
      setShowAd(true);
    }
  }, [isFreeAvailable, adsRemaining, giveCoins]);

  const handleAdComplete = useCallback(() => {
    const newAds = currentAdsUsed + 1;
    setAdsUsed(newAds);
    localStorage.setItem("zetta_ads_used", String(newAds));
    setShowAd(false);
    giveCoins(10);
  }, [currentAdsUsed, giveCoins]);

  let statusLabel: React.ReactNode;
  let statusColor: string;
  if (isFreeAvailable) {
    statusLabel = "✅ Klik gratis tersedia!";
    statusColor = "#4ade80";
  } else if (isLocked) {
    statusLabel = (
      <>
        🔒 Terkunci — reset dalam{" "}
        <span style={{ color: "#FFD700", fontWeight: 900 }}>
          {formatCountdown(timeUntilReset)}
        </span>
      </>
    );
    statusColor = "rgba(255,100,100,0.85)";
  } else {
    statusLabel = (
      <>
        🎬 Iklan tersedia:{" "}
        <span style={{ color: "#FFD700", fontWeight: 900 }}>
          {adsRemaining}/{MAX_ADS}
        </span>{" "}
        | reset{" "}
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

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4">
        <header className="pt-5 pb-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-between rounded-2xl px-4 py-3"
            style={{
              background: "rgba(10,8,2,0.75)",
              border: "1.5px solid rgba(255,215,0,0.45)",
              boxShadow:
                "0 0 18px rgba(255,215,0,0.15), 0 0 40px rgba(255,215,0,0.06), inset 0 1px 0 rgba(255,255,180,0.12)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="relative w-12 h-12 rounded-full overflow-hidden"
                style={{
                  border: "2px solid rgba(255,215,0,0.7)",
                  boxShadow: "0 0 10px rgba(255,215,0,0.4)",
                }}
              >
                <img
                  src={mockUser.avatar}
                  alt={mockUser.name}
                  className="w-full h-full object-cover"
                  style={{ background: "#1a1a2e" }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:900;font-size:1.25rem;color:#FFD700;background:radial-gradient(circle,#1a1040,#0a0520)">ZH</span>`;
                    }
                  }}
                />
              </div>
              <div>
                <p
                  className="font-bold text-sm leading-tight"
                  style={{ color: "#FFD700", textShadow: "0 0 8px rgba(255,215,0,0.5)" }}
                >
                  {mockUser.name}
                </p>
                <p className="text-xs" style={{ color: "rgba(255,215,0,0.5)" }}>
                  {mockUser.username}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🪙</span>
                <span
                  className="font-black text-base tabular-nums"
                  style={{ color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.7)" }}
                >
                  {formatNumber(coins)}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
                style={{
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid rgba(255,215,0,0.3)",
                }}
              >
                <span className="text-xs">🏆</span>
                <span className="text-xs font-bold" style={{ color: "rgba(255,215,0,0.85)" }}>
                  Rank #{mockUser.rank}
                </span>
              </div>
            </div>
          </motion.div>
        </header>

        <div className="flex items-center justify-between px-1 mt-1 mb-2">
          {[
            { label: "Zetta Points", value: formatNumber(points), icon: "⚡" },
            { label: "Iklan Tersisa", value: isFreeAvailable ? "–" : `${adsRemaining}/${MAX_ADS}`, icon: "🎬" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(10,10,15,0.7)",
                border: "1px solid rgba(255,215,0,0.18)",
                flex: 1,
                marginInline: 4,
              }}
            >
              <span className="text-base">{stat.icon}</span>
              <div>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {stat.label}
                </p>
                <p className="text-sm font-black tabular-nums" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {stat.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-5 py-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p
              className="text-sm font-semibold tracking-widest uppercase"
              style={{
                color: "rgba(255,215,0,0.55)",
                letterSpacing: "0.2em",
                textShadow: "0 0 12px rgba(255,215,0,0.3)",
              }}
            >
              Tap to Earn
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 18 }}
          >
            <CoinClicker
              onCoin={handleCoinClick}
              pointsPerClick={10}
              locked={isLocked}
              needsAd={!isFreeAvailable && !isLocked}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl px-4 py-2.5 text-center"
            style={{
              background: "rgba(10,10,15,0.7)",
              border: `1px solid ${isLocked ? "rgba(255,80,80,0.25)" : isFreeAvailable ? "rgba(74,222,128,0.25)" : "rgba(255,215,0,0.2)"}`,
              maxWidth: 280,
            }}
          >
            <p className="text-xs font-medium" style={{ color: statusColor }}>
              {statusLabel}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs font-medium"
            style={{ color: "rgba(255,215,0,0.5)" }}
          >
            +10 Zetta Coin per klik
          </motion.p>
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
