"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

interface WalletData {
  coins: number;
  usdtBalance: number;
  minWithdrawCoins: number;
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
  { id: "TON", label: "TON Wallet", icon: "💎", currency: "COINS", placeholder: "Masukkan alamat TON wallet" },
  { id: "USDT", label: "USDT (TRC20)", icon: "🟢", currency: "USDT", placeholder: "Masukkan alamat USDT TRC20" },
  { id: "DANA", label: "DANA", icon: "🔵", currency: "COINS", placeholder: "Masukkan nomor DANA (08xx)" },
  { id: "GOPAY", label: "GoPay", icon: "🟡", currency: "COINS", placeholder: "Masukkan nomor GoPay (08xx)" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatDate(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
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
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchWallet = () => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => { setWallet(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchWallet(); }, []);

  const selectedMethodData = METHODS.find((m) => m.id === selectedMethod);

  const handleWithdraw = async () => {
    if (!selectedMethod || !amount || !walletAddress) {
      showToast("Lengkapi semua kolom", "error"); return;
    }
    const amtNum = parseInt(amount);
    if (isNaN(amtNum) || amtNum <= 0) { showToast("Jumlah tidak valid", "error"); return; }
    if (wallet && amtNum < wallet.minWithdrawCoins && selectedMethodData?.currency === "COINS") {
      showToast(`Minimum ${wallet.minWithdrawCoins.toLocaleString("id-ID")} koin`, "error"); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          amount: amtNum,
          walletAddress,
          currency: selectedMethodData?.currency ?? "COINS",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Permintaan penarikan berhasil dikirim!");
      setShowWithdraw(false);
      setAmount("");
      setWalletAddress("");
      setSelectedMethod(null);
      fetchWallet();
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal withdraw", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000 100%)" }}
    >
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-5 pb-4">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-black text-2xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
              Dompet
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Kelola saldo & penarikan
            </p>
          </motion.div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-full"
              style={{ border: "3px solid rgba(255,215,0,0.15)", borderTop: "3px solid #FFD700" }} />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              {[
                { label: "Total Zetta Coin", value: `${formatNumber(wallet?.coins ?? 0)}`, icon: "🪙", color: "#FFD700", sub: "≈ Hadiah & Reward" },
                { label: "USDT Balance", value: `$${(wallet?.usdtBalance ?? 0).toFixed(2)}`, icon: "🟢", color: "#4ade80", sub: "Dari hadiah spin" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-3xl p-5 relative overflow-hidden"
                  style={{
                    background: "rgba(10,8,2,0.7)",
                    border: `1.5px solid ${item.color}33`,
                    boxShadow: `0 0 30px ${item.color}0a`,
                  }}
                >
                  <div className="absolute top-0 right-0 text-6xl opacity-[0.06] pointer-events-none pr-3 pt-1">
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: `${item.color}88` }}>
                    {item.label}
                  </p>
                  <p className="font-black text-3xl tabular-nums" style={{ color: item.color, textShadow: `0 0 20px ${item.color}50` }}>
                    {item.value}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{item.sub}</p>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              onClick={() => setShowWithdraw(true)}
              className="w-full py-4 rounded-2xl font-black text-base mb-5"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                color: "#000",
                boxShadow: "0 0 30px rgba(255,215,0,0.4)",
              }}
            >
              💸 Tarik Saldo
            </motion.button>

            {(wallet?.transactions?.length ?? 0) > 0 && (
              <section>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,215,0,0.5)" }}>
                  Riwayat Transaksi
                </p>
                <div className="flex flex-col gap-2">
                  {wallet!.transactions.map((tx, i) => {
                    const s = STATUS_STYLE[tx.status] ?? STATUS_STYLE.pending;
                    const isWithdraw = tx.type === "withdrawal";
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * Math.min(i, 8) }}
                        className="flex items-center gap-3 rounded-2xl px-3.5 py-2.5"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ background: isWithdraw ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.1)" }}
                        >
                          {isWithdraw ? "💸" : "🎰"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                            {isWithdraw ? `Withdraw via ${tx.method}` : "Hadiah Spin"}
                          </p>
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p
                            className="font-black text-sm tabular-nums"
                            style={{ color: isWithdraw ? "#f87171" : "#4ade80" }}
                          >
                            {isWithdraw ? "-" : "+"}{tx.amount} {tx.currency === "COINS" ? "🪙" : tx.currency}
                          </p>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {s.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showWithdraw && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowWithdraw(false)}
          >
            <motion.div
              initial={{ y: 120 }}
              animate={{ y: 0 }}
              exit={{ y: 120 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md rounded-t-3xl px-5 pt-5 pb-8 overflow-y-auto"
              style={{
                background: "linear-gradient(180deg, #0f0f1e 0%, #080810 100%)",
                border: "1.5px solid rgba(255,215,0,0.25)",
                borderBottom: "none",
                maxHeight: "90vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="font-black text-lg" style={{ color: "#FFD700" }}>Tarik Saldo</p>
                <button
                  onClick={() => setShowWithdraw(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
                >
                  ✕
                </button>
              </div>

              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,215,0,0.5)" }}>
                Pilih Metode
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMethod(m.id); setWalletAddress(""); setAmount(""); }}
                    className="flex items-center gap-2 rounded-xl px-3 py-3 transition-all"
                    style={{
                      background: selectedMethod === m.id ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1.5px solid ${selectedMethod === m.id ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span className="font-bold text-sm" style={{ color: selectedMethod === m.id ? "#FFD700" : "rgba(255,255,255,0.6)" }}>
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>

              {selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Jumlah {selectedMethodData?.currency === "COINS" ? "Koin" : selectedMethodData?.currency}
                    </p>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={
                        selectedMethodData?.currency === "COINS"
                          ? `Min. ${wallet?.minWithdrawCoins?.toLocaleString("id-ID") ?? "10.000"} koin`
                          : "Jumlah USDT"
                      }
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,215,0,0.2)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    />
                    {wallet && selectedMethodData?.currency === "COINS" && (
                      <div className="flex justify-between mt-1.5">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                          Saldo: {formatNumber(wallet.coins)} koin
                        </span>
                        <button
                          onClick={() => setAmount(String(wallet.coins))}
                          className="text-xs font-bold"
                          style={{ color: "#FFD700" }}
                        >
                          Semua
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {selectedMethodData?.placeholder?.split(" (")[0] ?? "Alamat Tujuan"}
                    </p>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder={selectedMethodData?.placeholder ?? ""}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,215,0,0.2)",
                        color: "rgba(255,255,255,0.85)",
                      }}
                    />
                  </div>

                  <div
                    className="rounded-xl px-3 py-2.5 text-xs"
                    style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", color: "rgba(251,191,36,0.75)" }}
                  >
                    ⚠️ Pastikan alamat tujuan benar. Transaksi yang sudah dikirim tidak bisa dibatalkan.
                  </div>

                  <button
                    onClick={handleWithdraw}
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl font-black text-sm mt-1"
                    style={{
                      background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                      color: "#000",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {submitting ? "Memproses..." : "💸 Konfirmasi Penarikan"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 z-50 rounded-2xl px-5 py-3 text-sm font-semibold"
            style={{
              transform: "translateX(-50%)",
              background: toast.type === "success" ? "rgba(74,222,128,0.15)" : "rgba(255,80,80,0.15)",
              border: `1px solid ${toast.type === "success" ? "rgba(74,222,128,0.4)" : "rgba(255,80,80,0.4)"}`,
              color: toast.type === "success" ? "#4ade80" : "#f87171",
              backdropFilter: "blur(12px)",
              whiteSpace: "nowrap",
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
