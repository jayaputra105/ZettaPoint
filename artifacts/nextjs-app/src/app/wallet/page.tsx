"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const WITHDRAW_METHODS = [
  { id: "TON", label: "TON NETWORK", placeholder: "Enter TON address (EQ...)" },
  { id: "TRC20", label: "USDT TRC20", placeholder: "Enter TRC20 address (T...)" },
];

const MIN_WD_AMOUNT = 30;

export default function WalletPage() {
  const { coins, usdt } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [method, setMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  const handleProcessWithdraw = () => {
    const val = parseFloat(amount);
    
    if (!amount || isNaN(val)) return alert("Please enter a valid amount");
    if (val < MIN_WD_AMOUNT) return alert(`Minimum withdrawal is $${MIN_WD_AMOUNT}`);
    if (val > usdt) return alert("Insufficient USDT balance");
    if (!address) return alert("Please enter your wallet address");

    // Logic Integration
    alert("Withdrawal request has been submitted for review.");
    setIsModalOpen(false);
    setAmount("");
    setAddress("");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white flex flex-col overflow-hidden">
      <ShootingStars />
      
      <div className="relative z-10 flex-1 max-w-md mx-auto w-full px-6 pt-8 pb-32">
        {/* HEADER */}
        <header className="mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter text-[#FFD700] uppercase">Wallet</h1>
          <p className="text-[10px] opacity-30 uppercase tracking-[0.4em] font-bold">Financial Assets & Earnings</p>
        </header>

        {/* MAIN BALANCE CARD */}
        <div className="relative overflow-hidden p-8 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 shadow-2xl mb-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest">Available USDT</p>
            <div className="px-3 py-1 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20">
              <span className="text-[9px] font-bold text-[#4ade80]">SECURE</span>
            </div>
          </div>
          
          <h2 className="text-5xl font-black mb-10 tracking-tighter">${usdt.toFixed(2)}</h2>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-5 bg-[#4ade80] text-black font-black rounded-2xl text-xs uppercase shadow-[0_10px_30px_rgba(74,222,128,0.2)] active:scale-95 transition-transform"
          >
            Withdraw Now
          </button>
        </div>

        {/* COIN ASSET SECTION */}
        <div className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20">
              <span className="text-lg">🪙</span>
            </div>
            <div>
              <p className="text-[9px] font-bold opacity-30 uppercase">Total Coins</p>
              <p className="text-xl font-black tracking-tight">{coins.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-[#FFD700] bg-[#FFD700]/5 px-3 py-1 rounded-lg">ACTIVE</p>
        </div>

        {/* HISTORY SECTION */}
        <section className="mt-12">
          <h3 className="text-[10px] font-black opacity-20 uppercase tracking-[0.5em] mb-6 px-2">Recent Activity</h3>
          <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[40px]">
             <p className="text-[11px] font-bold opacity-10 uppercase tracking-widest text-white">No history available</p>
          </div>
        </section>
      </div>

      {/* WITHDRAWAL OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-md bg-[#0a0a0a] rounded-t-[50px] p-10 border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
              <h3 className="text-2xl font-black text-[#FFD700] italic mb-2">WITHDRAW</h3>
              <p className="text-[10px] opacity-40 uppercase tracking-widest mb-10">Minimum cashout: <span className="text-white">${MIN_WD_AMOUNT}.00</span></p>

              <div className="flex gap-3 mb-6">
                {WITHDRAW_METHODS.map((m) => (
                  <button 
                    key={m.id} 
                    onClick={() => setMethod(m.id)}
                    className={`flex-1 py-4 rounded-2xl border text-[10px] font-black tracking-tighter transition-all ${method === m.id ? 'bg-[#FFD700] text-black border-[#FFD700]' : 'bg-white/5 border-white/5 text-white/30'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {method && (
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <input 
                      type="number" placeholder="0.00" value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-[#4ade80]"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-[#4ade80]">USDT</span>
                  </div>
                  <input 
                    type="text" placeholder={WITHDRAW_METHODS.find(x => x.id === method)?.placeholder}
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#4ade80]"
                  />
                  <button 
                    onClick={handleProcessWithdraw}
                    className="w-full py-5 bg-[#FFD700] text-black font-black rounded-3xl uppercase text-xs tracking-widest mt-4"
                  >
                    Confirm & Cashout
                  </button>
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