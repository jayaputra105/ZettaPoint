import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import CoinClicker from "@/components/CoinClicker";
import AdModal from "@/components/AdModal";
import RoomSelector from "@/components/RoomSelector";
import MultiplierShop from "@/components/MultiplierShop";
import { useApp } from "@/context/AppProvider";
import { TrendingUp } from "lucide-react";

const ShootingStars = lazy(() => import("@/components/ShootingStars"));

const MAX_ADS = 10;
const COOLDOWN_MS = 60 * 60 * 1000;
const AUTO_CLICK_INTERVAL_MS = 60 * 60 * 1000;

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
    coins, setCoins,
    zp, setZp, 
    currentRoom,
    loading: appLoading,
    playSFX,
    multiplierLevel,
    autoClickEnabled,
  } = useApp();
  
  const [, navigate] = useLocation();
  const currentZp = zp[currentRoom] || 0;
  const currentMultiplierValue = multiplierLevel === 0 ? 1.0 : 1.0 + multiplierLevel * 0.1;
  
  const [userProfile, setUserProfile] = useState({
    name: "...",
    username: "@...",
    avatar: ""
  });
  
  const [lastFreeClick, setLastFreeClick] = useState<number | null>(null);
  const [adsUsed, setAdsUsed] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isAdVerified, setIsAdVerified] = useState(false);
  const [showMultiplierShop, setShowMultiplierShop] = useState(false);
  const [autoClickToast, setAutoClickToast] = useState<string | null>(null);

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

  useEffect(() => {
    const stored = localStorage.getItem("zetta_last_free");
    const storedAds = localStorage.getItem("zetta_ads_used");
    if (stored) setLastFreeClick(Number(stored));
    if (storedAds) setAdsUsed(Number(storedAds));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-click: fires every hour if enabled
  useEffect(() => {
    if (!autoClickEnabled) return;
    const checkAutoClick = () => {
      const lastAuto = Number(localStorage.getItem("zetta_last_auto") || "0");
      if (Date.now() - lastAuto >= AUTO_CLICK_INTERVAL_MS) {
        const zpEarned = Math.floor((Math.floor(Math.random() * 101) + 100) * currentMultiplierValue);
        localStorage.setItem("zetta_last_auto", String(Date.now()));
        const tg = (window as any).Telegram?.WebApp;
        const tid = tg?.initDataUnsafe?.user?.id?.toString();
        if (tid) {
          fetch("/api/user", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId: tid, addZp: zpEarned, room: currentRoom }),
          }).then(() => {
            setZp(currentRoom, (zp[currentRoom] || 0) + zpEarned);
            setAutoClickToast(`⚡ Auto-click: +${zpEarned} ZP`);
            setTimeout(() => setAutoClickToast(null), 3000);
          }).catch(() => {});
        }
      }
    };
    checkAutoClick();
    const id = setInterval(checkAutoClick, 60_000);
    return () => clearInterval(id);
  }, [autoClickEnabled, currentRoom, currentMultiplierValue]);

  const sinceLastFree = lastFreeClick ? now - lastFreeClick : COOLDOWN_MS;
  const isFreeAvailable = sinceLastFree >= COOLDOWN_MS;
  const canEarnPoints = isFreeAvailable || isAdVerified;
  const needsAd = !isFreeAvailable && !isAdVerified && adsUsed < MAX_ADS;
  const isLocked = !isFreeAvailable && !isAdVerified && adsUsed >= MAX_ADS;
  const adsRemaining = MAX_ADS - adsUsed;
  const timeUntilReset = lastFreeClick ? COOLDOWN_MS - sinceLastFree : 0;

  const giveRewards = useCallback(async (amount: number) => {
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString();
    if (!tid) return;
    setZp(currentRoom, currentZp + amount);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: tid, addZp: amount, room: currentRoom })
      });
    } catch (err) {
      console.error("Save error:", err);
      setZp(currentRoom, currentZp);
    }
  }, [currentRoom, currentZp, setZp]);
  
  const handleCoinClick = () => {
    if (isLocked) return;
    playSFX("click");
    if (canEarnPoints) {
      if (isFreeAvailable) {
        const ts = Date.now();
        setLastFreeClick(ts);
        setAdsUsed(0);
        localStorage.setItem("zetta_last_free", String(ts));
        localStorage.setItem("zetta_ads_used", "0");
      } else {
        setIsAdVerified(false);
      }
      const base = Math.floor(Math.random() * 101) + 100;
      const earned = Math.floor(base * currentMultiplierValue);
      giveRewards(earned);
    } else if (needsAd) {
      setShowAd(true);
    }
  };
  
  const handleAdComplete = () => {
    const newAds = adsUsed + 1;
    setAdsUsed(newAds);
    localStorage.setItem("zetta_ads_used", String(newAds));
    setShowAd(false);
    setIsAdVerified(true);
  };
  
  let statusLabel: React.ReactNode;
  let statusColor: string;
  if (isFreeAvailable) {
    statusLabel = "✅ click available!";
    statusColor = "#4ade80";
  } else if (isAdVerified) {
    statusLabel = "⚡ watch ads";
    statusColor = "#f59e0b";
  } else if (isLocked) {
    statusLabel = <>🔒 Overclock Limit! Reset in <span className="text-yellow-500 font-black">{formatCountdown(timeUntilReset)}</span></>;
    statusColor = "rgba(255,100,100,0.85)";
  } else {
    statusLabel = <>⏳ Overclock: <span className="text-zinc-300 font-black">{adsRemaining}/{MAX_ADS}</span> | Tap to unlock Coin</>;
    statusColor = "rgba(212,212,216,0.85)";
  }
  
  if (appLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-500 font-black animate-pulse tracking-[0.5em] uppercase text-xs">
          ✎﹏﹏﹏﹏﹏...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      <Suspense fallback={null}><ShootingStars /></Suspense>

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        
        <header className="pt-6 pb-2">
          <div className="flex items-center justify-between rounded-3xl px-4 py-3 bg-zinc-900/80 border border-yellow-500/20 backdrop-blur-xl">
            <button
              className="flex items-center gap-3 active:scale-95 transition-transform"
              onClick={() => navigate("/profile")}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500/50">
                <img src={userProfile.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=fallback`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-yellow-500">{userProfile.name}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase">{userProfile.username}</p>
              </div>
            </button>

            <div className="bg-yellow-500/10 px-3 py-2 rounded-2xl border border-yellow-500/20">
              <span className="font-black text-sm text-white">🪙 {formatNumber(coins)}</span>
            </div>
          </div>
        </header>

        <RoomSelector />

        <div className="w-full flex items-center justify-between mt-2 px-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMultiplierShop(true)}
            className="group relative flex items-center gap-2 bg-zinc-900/50 border border-purple-500/30 px-4 py-2 rounded-2xl backdrop-blur-md overflow-hidden"
          >
            <div className="absolute inset-0 bg-purple-500/5 animate-pulse" />
            <TrendingUp size={14} className="relative text-purple-400" />
            <span className="relative text-[10px] font-black text-purple-300 uppercase tracking-wider">
              {currentMultiplierValue.toFixed(1)}×
            </span>
          </motion.button>

          <Link href="/minigames">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { if (typeof playSFX === "function") playSFX("click"); }}
              className="group relative flex items-center gap-2 bg-zinc-900/50 border border-cyan-500/30 px-4 py-2 rounded-2xl backdrop-blur-md overflow-hidden"
            >
              <div className="absolute inset-0 bg-cyan-500/5 animate-pulse" />
              <div className="relative text-xl">👾</div>
            </motion.button>
          </Link>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="bg-zinc-900/50 border border-white/5 px-4 py-1.5 rounded-full backdrop-blur-sm">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              ⏳ Overclock Battery: <span className="text-zinc-300 font-black">{adsRemaining}/{MAX_ADS}</span>
            </p>
          </div>

          <CoinClicker 
            onCoin={handleCoinClick} 
            pointsPerClick={Math.floor(150 * currentMultiplierValue)}
            locked={isLocked} 
            needsAd={needsAd} 
          />

          <div className="rounded-2xl px-5 py-3 text-center bg-zinc-900/80 border border-white/10">
            <p className="text-xs font-bold" style={{ color: statusColor }}>{statusLabel}</p>
          </div>

          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
            +ZP ({currentRoom.toUpperCase()}) · {currentMultiplierValue.toFixed(1)}×
          </p>
        </div>
      </div>

      <BottomNav />
      
      <AdModal 
        open={showAd} 
        adNumber={adsUsed + 1} 
        maxAds={MAX_ADS} 
        onComplete={handleAdComplete} 
        onClose={() => setShowAd(false)} 
      />

      <MultiplierShop open={showMultiplierShop} onClose={() => setShowMultiplierShop(false)} />

      {autoClickToast && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl bg-cyan-500/10 border-cyan-500/30 text-cyan-400 whitespace-nowrap"
        >
          {autoClickToast}
        </motion.div>
      )}
    </div>
  );
}
