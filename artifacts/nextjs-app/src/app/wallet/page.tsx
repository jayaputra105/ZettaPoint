"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface WalletData {
  coins: number;
  zp: number; // Zetta Points untuk leaderboard
  usdtBalance: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  type: string;
  amount: string;
  currency: string;
  method: string | null;
  status: string;
  createdAt: string;
}

const METHODS = [
  { id: "TON", label: "TON Wallet", icon: "💎", currency: "USDT", placeholder: "Masukkan alamat TON wallet (EQ...)" },
  { id: "USDT", label: "USDT (TRC20)", icon: "🟢", currency: "USDT", placeholder: "Masukkan alamat USDT TRC20 (T...)" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString("id-ID") ?? "0";
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: "#fbbf24", bg: "rgba(251,191,36,0.12)", label: "Proses" },
  completed: { color: "#4ade80", bg: "rgba(74,222,128,0.12)", label: "Selesai" },
  rejected: { color: "#f87171", bg: "rgba(248,113,113,0.12)", label: "Ditolak" },
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getTelegramId = () => {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id?.toString();
  };

  const fetchWallet = () => {
    const tid = getTelegramId();
    if (!tid) return;
    fetch(`/api/wallet?telegramId=${tid}`)
      .then((r) => r.json())
      .then((d) => { setWallet(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchWallet(); }, []);

  const selectedMethodData = METHODS.find((m) => m.id === selectedMethod);

  const handleWithdraw = async () => {
    const tid = getTelegramId();
    if (!tid || !selectedMethod || !amount || !walletAddress) return;
    
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) return;
    if (wallet && amtNum > wallet.usdtBalance) {
        alert("Saldo USDT tidak mencukupi");
        return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tid,
          method: selectedMethod,
          amount: amtNum,
          walletAddress,
          currency: "USDT",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setShowWithdraw(false);
      setAmount("");
      setWalletAddress("");
      fetchWallet();
      alert("Withdrawal submitted!");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col" style={{ background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000 100%)" }}>
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-5 pb-4">
          <h1 className="font-black text-2xl text-[#FFD700]">Dompet Zetta</h1>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FFD700]/20 border-t-[#FFD700] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              {/* USDT CARD - MAIN WD */}
              <div className="rounded-3xl p-5 border border-[#4ade80]33 bg-black/40 shadow-[0_0_20px_rgba(74,222,128,0.05)]">
                <p className="text-[10px] font-bold uppercase text-[#4ade80] mb-1">Saldo USDT (Bisa WD)</p>
                <p className="font-black text-3xl text-[#4ade80]">${wallet?.usdtBalance?.toFixed(2)}</p>
                <button onClick={() => setShowWithdraw(true)} className="w-full mt-4 py-3 bg-[#4ade80] text-black font-black rounded-xl text-xs uppercase">Withdraw Sekarang</button>
              </div>

              {/* ZP CARD */}
              <div className="rounded-3xl p-5 border border-[#9B59B6]33 bg-black/40">
                <p className="text-[10px] font-bold uppercase text-[#9B59B6] mb-1">Zetta Points (Leaderboard)</p>
                <p className="font-black text-2xl text-white">{formatNumber(wallet?.zp ?? 0)} ZP</p>
              </div>

              {/* COINS CARD */}
              <div className="rounded-3xl p-5 border border-[#FFD700]33 bg-black/40">
                <p className="text-[10px] font-bold uppercase text-[#FFD700] mb-1">Zetta Coins (Belanja)</p>
                <p className="font-black text-2xl text-white">{formatNumber(wallet?.coins ?? 0)} 🪙</p>
              </div>
            </div>

            {/* TRANSACTIONS */}
            {(wallet?.transactions?.length ?? 0) > 0 && (
              <section className="flex-1 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase text-white/30 mb-3">Riwayat Transaksi</p>
                <div className="flex flex-col gap-2">
                  {wallet!.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div>
                        <p className="text-xs font-bold text-white/80">{tx.type === 'withdrawal' ? `WD via ${tx.method}` : 'Reward'}</p>
                        <p className="text-[10px] text-white/40">{new Date(tx.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-[#4ade80]'}`}>{tx.type === 'withdrawal' ? '-' : '+'}{tx.amount} {tx.currency}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: STATUS_STYLE[tx.status]?.bg, color: STATUS_STYLE[tx.status]?.color }}>{STATUS_STYLE[tx.status]?.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
        {showWithdraw && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/80" onClick={() => setShowWithdraw(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-md bg-[#0d0d1a] rounded-t-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-black text-[#FFD700] mb-4">Withdraw USDT</h3>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {METHODS.map((m) => (
                  <button key={m.id} onClick={() => setSelectedMethod(m.id)} className={`p-3 rounded-xl border ${selectedMethod === m.id ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/10 bg-white/5'}`}>
                    <span className="text-xs font-bold text-white">{m.label}</span>
                  </button>
                ))}
              </div>

              {selectedMethod && (
                <div className="flex flex-col gap-3">
                  <input type="number" placeholder="Jumlah USDT" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#FFD700]" />
                  <input type="text" placeholder={selectedMethodData?.placeholder} value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#FFD700]" />
                  <button onClick={handleWithdraw} disabled={submitting} className="w-full py-4 bg-[#FFD700] text-black font-black rounded-2xl uppercase mt-2">{submitting ? "Processing..." : "Konfirmasi Withdraw"}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}