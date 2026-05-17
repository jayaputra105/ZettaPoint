"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";
import { Wallet, ArrowUpRight, History, Coins, Zap } from "lucide-react";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const WITHDRAW_METHODS = [
  { id: "TON", label: "TON NETWORK", placeholder: "Enter TON address (EQ...)" },
  { id: "TRC20", label: "USDT TRC20", placeholder: "Enter TRC20 address (T...)" },
];

const MIN_WD_AMOUNT = 30;

export default function WalletPage() {
  const { coins, usdtBalance, zp } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Hitung total ZP dari semua room
  const totalZp = Object.values(zp).reduce((a, b) => a + b, 0);
  
  const handleProcessWithdraw = async () => {
    const val = parseFloat(amount);
    const tg = (window as any).Telegram?.WebApp;
    const tid = tg?.initDataUnsafe?.user?.id?.toString() || "12345";
    
    if (!amount || isNaN(val)) return alert("Please enter a valid amount");
    if (val < MIN_WD_AMOUNT) return alert(`Minimum withdrawal is $${MIN_WD_AMOUNT}`);
    if (val > usdtBalance) return alert("Insufficient USDT balance");
    if (!address) return alert("Please enter your wallet address");
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId: tid,
          method,
          amount: val,
          walletAddress: address,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert("Withdrawal request submitted! It will be reviewed within 24h.");
      setIsModalOpen(false);
      setAmount("");
      setAddress("");

      // 🌟 JALUR NINJA SINKRONISASI: Paksa browser WebApp reload data terbaru dari DB
      if (typeof window !== "undefined") {
        window.location.reload();
      }

    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col overflow-hidden">
      <ShootingStars />
      
      <div className="relative z-10 flex-1 max-w-md mx-auto w-full px-6 pt-8 pb-32">
        {/* HEADER */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-yellow-500 uppercase">Wallet</h1>
            <p className="text-[10px] opacity-30 uppercase tracking-[0.4em] font-bold">Assets & Earnings</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <Wallet className="text-yellow-500" size={20} />
          </div>
        </header>

        {/* MAIN USDT CARD */}
        <div className="relative overflow-hidden p-8 rounded-[40px] bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-white/10 shadow-2xl mb-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-black opacity-40 uppercase tracking-widest text-white">Available USDT</p>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 uppercase">Withdrawal Active</span>
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mb-10">
            <span className="text-2xl font-black text-white/30">$</span>
            <h2 className="text-6xl font-black tracking-tighter text-white tabular-nums">
              {usdtBalance.toFixed(2)}
            </h2>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="group w-full py-5 bg-yellow-500 text-black font-black rounded-2xl text-xs uppercase shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Request Withdrawal
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* OTHER ASSETS GRID */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2 opacity-30">
              <Coins size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Total Coins</p>
            </div>
            <p className="text-xl font-black tracking-tight text-white">{coins.toLocaleString()}</p>
          </div>
          
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2 opacity-30">
              <Zap size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Total Points</p>
            </div>
            <p className="text-xl font-black tracking-tight text-white">{totalZp.toLocaleString()}</p>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <section>
          <div className="flex items-center gap-2 mb-6 px-2 opacity-20">
            <History size={14} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Recent Activity</h3>
          </div>
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
             <p className="text-[11px] font-bold opacity-10 uppercase tracking-widest text-white">No history yet</p>
          </div>
        </section>
      </div>

      {/* WITHDRAWAL OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/95 backdrop-blur-xl p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-zinc-900 rounded-t-[50px] p-10 border-t border-white/10 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
              <h3 className="text-2xl font-black text-yellow-500 italic mb-2 uppercase">Payout USDT</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-10">
                Min withdrawal: <span className="text-white font-black">${MIN_WD_AMOUNT}</span>
              </p>

              <div className="flex gap-3 mb-6">
                {WITHDRAW_METHODS.map((m) => (
                  <button 
                    key={m.id} 
                    onClick={() => setMethod(m.id)}
                    className={`flex-1 py-4 rounded-2xl border text-[10px] font-black tracking-tighter transition-all ${
                      method === m.id ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 border-white/5 text-white/30'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {method && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                  <div className="relative">
                    <input 
                      type="number" placeholder="0.00" value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white font-bold outline-none focus:border-yellow-500 transition-colors"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-yellow-500">USDT</span>
                  </div>
                  <input 
                    type="text" placeholder={WITHDRAW_METHODS.find(x => x.id === method)?.placeholder}
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-5 rounded-2xl bg-black border border-white/10 text-white text-xs outline-none focus:border-yellow-500 transition-colors"
                  />
                  <button 
                    onClick={handleProcessWithdraw}
                    disabled={submitting}
                    className="w-full py-5 bg-yellow-500 text-black font-black rounded-3xl uppercase text-xs tracking-widest mt-4 shadow-xl disabled:opacity-30"
                  >
                    {submitting ? "Processing..." : "Confirm Payout"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}