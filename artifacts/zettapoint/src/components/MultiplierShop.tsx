import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Zap, Lock } from "lucide-react";
import { useApp } from "@/context/AppProvider";

const MULTIPLIER_TIERS = [
  { level: 1, multiplier: 1.1, cost: 300 },
  { level: 2, multiplier: 1.2, cost: 600 },
  { level: 3, multiplier: 1.3, cost: 1000 },
  { level: 4, multiplier: 1.4, cost: 1500 },
  { level: 5, multiplier: 1.5, cost: 2500 },
  { level: 6, multiplier: 1.6, cost: 4000 },
  { level: 7, multiplier: 1.7, cost: 6000 },
  { level: 8, multiplier: 1.8, cost: 9000 },
  { level: 9, multiplier: 1.9, cost: 13000 },
  { level: 10, multiplier: 2.0, cost: 18000 },
  { level: 11, multiplier: 2.1, cost: 25000 },
  { level: 12, multiplier: 2.2, cost: 35000 },
  { level: 13, multiplier: 2.3, cost: 48000 },
  { level: 14, multiplier: 2.4, cost: 65000 },
  { level: 15, multiplier: 2.5, cost: 85000 },
  { level: 16, multiplier: 2.6, cost: 110000 },
  { level: 17, multiplier: 2.7, cost: 140000 },
  { level: 18, multiplier: 2.8, cost: 175000 },
  { level: 19, multiplier: 2.9, cost: 215000 },
  { level: 20, multiplier: 3.0, cost: 260000 },
];

function formatCost(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MultiplierShop({ open, onClose }: Props) {
  const { coins, setCoins, multiplierLevel, setMultiplierLevel, telegramId } = useApp();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const ms = tomorrow.getTime() - now.getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeUntilReset(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleBuy = async () => {
    if (!telegramId || loading) return;
    const nextLevel = multiplierLevel + 1;
    if (nextLevel > 20) return showToast("Max multiplier reached!", false);
    const tier = MULTIPLIER_TIERS[nextLevel - 1];
    if (coins < tier.cost) return showToast("Not enough coins!", false);

    setLoading(true);
    try {
      const res = await fetch("/api/user/multiplier", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, targetLevel: nextLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCoins(Number(data.coins));
      setMultiplierLevel(data.multiplierLevel);
      showToast(`🚀 ${data.multiplierValue.toFixed(1)}x active!`);
    } catch (e: any) {
      showToast(e.message || "Purchase failed", false);
    } finally {
      setLoading(false);
    }
  };

  const nextLevel = multiplierLevel + 1;
  const nextTier = nextLevel <= 20 ? MULTIPLIER_TIERS[nextLevel - 1] : null;
  const currentMultiplier = multiplierLevel === 0 ? 1.0 : MULTIPLIER_TIERS[multiplierLevel - 1].multiplier;
  const canAfford = nextTier ? coins >= nextTier.cost : false;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-[#0a0a0a] border-t border-white/10 rounded-t-[32px] overflow-hidden"
            style={{ maxHeight: "70vh" }}
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-6 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#FFD700] uppercase tracking-tight">Multiplier Upgrade</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Resets at 00:00 UTC · {timeUntilReset}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                <X size={16} className="text-white/40" />
              </button>
            </div>

            <div className="mx-6 mb-5 p-4 rounded-[20px] bg-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Current Multiplier</p>
                <p className="text-3xl font-black text-[#FFD700] tracking-tighter">{currentMultiplier.toFixed(1)}×</p>
                <p className="text-[10px] text-white/30 font-bold">Level {multiplierLevel} / 20</p>
              </div>
              <TrendingUp size={36} className="text-[#FFD700]/30" />
            </div>

            <div className="px-6 pb-safe-or-6 overflow-y-auto" style={{ maxHeight: "calc(70vh - 200px)" }}>
              {multiplierLevel >= 20 ? (
                <div className="py-8 text-center">
                  <p className="text-2xl mb-2">🏆</p>
                  <p className="text-sm font-black text-[#FFD700]">Maximum Multiplier!</p>
                  <p className="text-[10px] text-white/30 mt-1">3.0× — resets tomorrow</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-8">
                  {MULTIPLIER_TIERS.map((tier) => {
                    const isOwned = tier.level <= multiplierLevel;
                    const isNext = tier.level === multiplierLevel + 1;
                    const isLocked = tier.level > multiplierLevel + 1;

                    return (
                      <div
                        key={tier.level}
                        className={`flex items-center justify-between p-4 rounded-[18px] border transition-all ${
                          isOwned
                            ? "bg-white/[0.03] border-white/5 opacity-40"
                            : isNext
                            ? "bg-[#FFD700]/5 border-[#FFD700]/30"
                            : "bg-white/[0.02] border-white/5 opacity-30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            isOwned ? "bg-green-500/10" : isNext ? "bg-[#FFD700]/10" : "bg-white/5"
                          }`}>
                            {isOwned ? (
                              <span className="text-green-400 text-sm">✓</span>
                            ) : isLocked ? (
                              <Lock size={14} className="text-white/20" />
                            ) : (
                              <Zap size={14} className="text-[#FFD700]" />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-black ${isOwned ? "text-green-400" : isNext ? "text-white" : "text-white/40"}`}>
                              {tier.multiplier.toFixed(1)}× Multiplier
                            </p>
                            <p className="text-[10px] text-white/30 font-bold">Level {tier.level}</p>
                          </div>
                        </div>
                        {!isOwned && isNext && (
                          <button
                            onClick={handleBuy}
                            disabled={loading || !canAfford}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                              canAfford
                                ? "bg-[#FFD700] text-black hover:shadow-[0_0_15px_rgba(255,215,0,0.4)]"
                                : "bg-white/5 text-white/30 border border-white/10"
                            } disabled:opacity-50`}
                          >
                            {loading ? "..." : `🪙 ${formatCost(tier.cost)}`}
                          </button>
                        )}
                        {!isOwned && !isNext && (
                          <span className="text-[10px] font-black text-white/20">🪙 {formatCost(tier.cost)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl whitespace-nowrap ${
                    toast.ok
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
