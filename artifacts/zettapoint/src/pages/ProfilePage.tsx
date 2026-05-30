import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, DollarSign, TrendingUp, Zap } from "lucide-react";
import { useApp } from "@/context/AppProvider";

const ShootingStars = lazy(() => import("@/components/ShootingStars"));

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString() ?? "0";
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { coins, usdtBalance, multiplierLevel, autoClickEnabled } = useApp();

  const [profile, setProfile] = useState({
    name: "Zetta Player",
    username: "@player",
    avatar: "",
    id: "",
  });

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      setProfile({
        name: user.first_name || "Zetta Player",
        username: user.username ? `@${user.username}` : "@player",
        avatar: user.photo_url || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.id}`,
        id: user.id?.toString() || "",
      });
    }
  }, []);

  const currentMultiplier = multiplierLevel === 0 ? 1.0 : (1.0 + multiplierLevel * 0.1);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black text-white overflow-hidden">
      <Suspense fallback={null}><ShootingStars /></Suspense>

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-12">
        <header className="pt-6 pb-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft size={18} className="text-white/60" />
          </button>
          <h1 className="text-xl font-black italic tracking-tighter text-[#FFD700] uppercase">Profile</h1>
        </header>

        <div className="flex-1 flex flex-col items-center gap-6 pt-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#FFD700]/60 shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                <img
                  src={profile.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=fallback`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#FFD700] border-2 border-black flex items-center justify-center text-xs">
                ⭐
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white tracking-tight">{profile.name}</p>
              <p className="text-sm text-white/40 font-bold mt-0.5">{profile.username}</p>
            </div>
          </motion.div>

          <div className="w-full grid grid-cols-2 gap-3">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="p-5 rounded-[24px] bg-zinc-900/60 border border-yellow-500/15 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Coins size={14} className="text-[#FFD700]" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Coins</span>
              </div>
              <p className="text-2xl font-black text-[#FFD700]">{formatNumber(coins)}</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="p-5 rounded-[24px] bg-zinc-900/60 border border-green-500/15 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-green-400" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">USDT</span>
              </div>
              <p className="text-2xl font-black text-green-400">{usdtBalance.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-5 rounded-[24px] bg-zinc-900/60 border border-purple-500/15 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-purple-400" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Multiplier</span>
              </div>
              <p className="text-2xl font-black text-purple-400">{currentMultiplier.toFixed(1)}×</p>
              <p className="text-[9px] text-white/20 font-bold mt-0.5">Level {multiplierLevel}/20</p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="p-5 rounded-[24px] bg-zinc-900/60 border border-cyan-500/15 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Auto-Click</span>
              </div>
              <p className={`text-sm font-black ${autoClickEnabled ? "text-cyan-400" : "text-white/30"}`}>
                {autoClickEnabled ? "Active ⚡" : "Inactive"}
              </p>
              <p className="text-[9px] text-white/20 font-bold mt-0.5">{autoClickEnabled ? "Every 1 hour" : "Buy with Stars"}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full p-5 rounded-[24px] bg-zinc-900/40 border border-white/5 backdrop-blur-xl"
          >
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Info</p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 font-bold">Telegram ID</span>
                <span className="text-xs font-black text-white/60">{profile.id || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 font-bold">Multiplier resets</span>
                <span className="text-xs font-black text-white/60">00:00 UTC daily</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
