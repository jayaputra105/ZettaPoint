import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Zap, Star } from "lucide-react";
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
  const {
    coins, setCoins,
    multiplierLevel, setMultiplierLevel,
    autoClickEnabled, setAutoClickEnabled,
    telegramId,
  } = useApp();

  const [multLoading, setMultLoading] = useState(false);
  const [starsLoading, setStarsLoading] = useState(false);
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
    setTimeout(() => setToast(null), 2800);
  };

  const nextLevel = multiplierLevel + 1;
  const nextTier = nextLevel <= 20 ? MULTIPLIER_TIERS[nextLevel - 1] : null;
  const currentMultiplier = multiplierLevel === 0 ? 1.0 : MULTIPLIER_TIERS[multiplierLevel - 1].multiplier;
  const canAfford = nextTier ? coins >= nextTier.cost : false;
  const isMaxed = multiplierLevel >= 20;

  const handleBuyMultiplier = async () => {
    if (!telegramId || multLoading || !nextTier || isMaxed) return;
    if (!canAfford) return showToast("Coins tidak cukup!", false);

    setMultLoading(true);
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
      showToast(`🚀 ${data.multiplierValue.toFixed(1)}× aktif!`);
    } catch (e: any) {
      showToast(e.message || "Gagal beli", false);
    } finally {
      setMultLoading(false);
    }
  };

  const handleBuyAutoClick = async () => {
    if (!telegramId || starsLoading || autoClickEnabled) return;
    setStarsLoading(true);

    try {
      const res = await fetch("/api/user/auto-click/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const tg = (window as any).Telegram?.WebApp;
      if (!tg?.openInvoice) throw new Error("Telegram WebApp not available");

      tg.openInvoice(data.invoiceUrl, async (status: string) => {
        if (status === "paid") {
          const activateRes = await fetch("/api/user/auto-click/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramId }),
          });
          const activateData = await activateRes.json();
          if (activateRes.ok) {
            setAutoClickEnabled(true);
            showToast("⚡ Auto-click aktif!");
          } else {
            showToast(activateData.error || "Gagal aktifkan", false);
          }
        } else if (status === "cancelled") {
          showToast("Dibatalkan", false);
        } else if (status === "failed") {
          showToast("Pembayaran gagal", false);
        }
        setStarsLoading(false);
      });
    } catch (e: any) {
      showToast(e.message || "Gagal buka invoice", false);
      setStarsLoading(false);
    }
  };

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
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-4" />

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-[#FFD700] uppercase tracking-tight">Power Upgrades</h2>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                  Multiplier resets · {timeUntilReset}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
              >
                <X size={16} className="text-white/40" />
              </button>
            </div>

            {/* Current Multiplier Display */}
            <div className="mx-6 mb-5 p-4 rounded-[20px] bg-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Multiplier Kamu</p>
                <p className="text-4xl font-black text-[#FFD700] tracking-tighter">{currentMultiplier.toFixed(1)}×</p>
                <p className="text-[10px] text-white/30 font-bold mt-0.5">Level {multiplierLevel} / 20</p>
              </div>
              <TrendingUp size={40} className="text-[#FFD700]/20" />
            </div>

            {/* Buttons */}
            <div className="px-6 pb-8 flex flex-col gap-4">

              {/* BUTTON 1 — Multiplier Upgrade */}
              <div className="rounded-[22px] border bg-white/[0.03] border-white/8 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
                    <Zap size={14} className="text-[#FFD700]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wide">
                      {isMaxed ? "Max Multiplier" : `Upgrade ke ${nextTier?.multiplier.toFixed(1)}×`}
                    </p>
                    <p className="text-[10px] text-white/30 font-bold">
                      {isMaxed ? "Level 20 / 20 — 3.0× tercapai 🏆" : `Level ${nextLevel} / 20`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleBuyMultiplier}
                  disabled={multLoading || isMaxed || !canAfford}
                  className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wide transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    isMaxed
                      ? "bg-white/5 text-white/30 border border-white/10"
                      : canAfford
                      ? "bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.25)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  {multLoading
                    ? "Memproses..."
                    : isMaxed
                    ? "🏆 Max Level Tercapai"
                    : canAfford
                    ? `🪙 Beli — ${formatCost(nextTier!.cost)} coins`
                    : `🪙 Butuh ${formatCost(nextTier!.cost)} coins`}
                </button>
              </div>

              {/* BUTTON 2 — Auto Click with Stars */}
              <div className={`rounded-[22px] border p-4 transition-all ${
                autoClickEnabled
                  ? "bg-cyan-500/5 border-cyan-500/20"
                  : "bg-white/[0.03] border-white/8"
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    autoClickEnabled ? "bg-cyan-500/15" : "bg-white/5"
                  }`}>
                    <Star size={14} className={autoClickEnabled ? "text-cyan-400" : "text-white/40"} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-wide">
                      Automatic free clicks every hour
                    </p>
                    <p className="text-[10px] text-white/30 font-bold">
                      {autoClickEnabled ? "✅ Aktif" : "150 ⭐ Telegram Stars · Permanen"}
                    </p>
                  </div>
                </div>

                {/* Deskripsi kosong — user akan isi sendiri */}
                <p className="text-[10px] text-white/20 mb-3 min-h-[16px]" />

                <button
                  onClick={handleBuyAutoClick}
                  disabled={starsLoading || autoClickEnabled}
                  className={`w-full py-3 rounded-2xl font-black text-sm uppercase tracking-wide transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                    autoClickEnabled
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "bg-[#229ED9] text-white shadow-[0_0_20px_rgba(34,158,217,0.2)] hover:shadow-[0_0_30px_rgba(34,158,217,0.35)]"
                  }`}
                >
                  {autoClickEnabled
                    ? "⚡ Sudah Aktif"
                    : starsLoading
                    ? "Membuka..."
                    : "⭐ Beli — 150 Stars"}
                </button>
              </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className={`absolute bottom-10 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border backdrop-blur-xl whitespace-nowrap ${
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
