"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";
import { Coins, Flame, Zap } from "lucide-react";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

// 12 SEKTOR DENGAN WARNA NEON TERANG GLOSSY (SESUAI GAMBAR REFERENSI)
const SEGMENTS = [
  { label: "50 COINS", color: "#ef4444", textColor: "#fff" },   // Merah Terang
  { label: "150 COINS", color: "#3b82f6", textColor: "#fff" },  // Biru Terang
  { label: "300 COINS", color: "#a855f7", textColor: "#fff" },  // Ungu Terang
  { label: "500 COINS", color: "#eab308", textColor: "#000" },  // Kuning Terang
  { label: "1000 COINS", color: "#f97316", textColor: "#fff" }, // Oranye Terang
  { label: "1 USDT", color: "#22c55e", textColor: "#fff" },     // Hijau Terang
  { label: "5 USDT", color: "#ec4899", textColor: "#fff" },     // Pink Terang
  { label: "25 USDT", color: "#ffd700", textColor: "#000" },    // Emas Terang (0%)
  { label: "1 USDT", color: "#22c55e", textColor: "#fff" },     // Hijau Terang
  { label: "1000 COINS", color: "#f97316", textColor: "#fff" }, // Oranye Terang
  { label: "500 COINS", color: "#eab308", textColor: "#000" },  // Kuning Terang
  { label: "300 COINS", color: "#a855f7", textColor: "#fff" },  // Ungu Terang
];

const NUM_SEG = SEGMENTS.length;
const SEG_ANGLE = 360 / NUM_SEG; // Pas 30 Derajat

function formatCountdown(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SpinPage() {
  const { coins, setCoins, usdtBalance, setUsdtBalance } = useApp();
  
  const [spinState, setSpinState] = useState<any>(null);
  const [totalRotation, setTotalRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const [adDone, setAdDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const adIntervalRef = useRef<any>(null);

  const getTelegramId = () => {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id?.toString() || "12345";
  };

  useEffect(() => {
    fetchSpinState();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchSpinState = () => {
    const tid = getTelegramId();
    fetch(`/api/spin?telegramId=${tid}`)
      .then((r) => r.json())
      .then(setSpinState);
  };

  const doSpin = async (type: "premium" | "free" | "ads") => {
    const tid = getTelegramId();
    if (isSpinning || !tid) return;

    if (type === "premium" && coins < 200) {
      alert("Insufficient coins!");
      return;
    }

    setIsSpinning(true);
    setShowResult(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spinType: type, telegramId: tid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // =========================================================
      // RUMUS FIX KALIBRASI JARUM JAM 12 (ANTI-MELENCENG)
      // =========================================================
      // Karena rotasi roda CSS memutar ke kanan, urutan juring meluncur ke kiri.
      // Kita kurangi 360 dengan (index * 30 derajat) lalu kurangi lagi 15 derajat agar jarum pas di TENGAH juring target.
      const targetDegrees = (360 - (data.prizeIndex * SEG_ANGLE) - (SEG_ANGLE / 2)) % 360;
      
      // Tambah putaran minimal (360 * 5) biar muter cepat tapi dramatis
      const newRotation = totalRotation + (360 * 5) + targetDegrees;
      
      setTotalRotation(newRotation);
      setLastPrize(data.prize);
      // =========================================================

      // Putaran dipangkas jadi 2.5 detik biar gak kelamaan nunggu!
      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        
        if (type === "premium") {
          setCoins(coins - 200 + data.prize.coins);
        } else {
          if (data.prize.coins > 0) setCoins(coins + data.prize.coins);
        }
        if (data.prize.usdt > 0) setUsdtBalance(usdtBalance + data.prize.usdt);
        
        fetchSpinState();
      }, 2500); 
    } catch (e: any) {
      setIsSpinning(false);
      alert(e.message);
    }
  };

  const handleAdSpin = () => {
    if (spinState?.adsRemaining <= 0 || isSpinning) return;
    setAdTimer(5);
    setAdDone(false);
    setShowAdModal(true);
    adIntervalRef.current = setInterval(() => {
      setAdTimer((t) => {
        if (t <= 1) {
          clearInterval(adIntervalRef.current!);
          setAdDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const conicGradient = SEGMENTS.map((seg, i) => `${seg.color} ${i * SEG_ANGLE}deg ${(i + 1) * SEG_ANGLE}deg`).join(", ");

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#050505] text-white overflow-hidden">
      <ShootingStars />
      
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-32">
        <header className="pt-8 pb-3 text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">LUCKY WHEEL</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40 mt-1">Spin & Win Big Rewards</p>
        </header>

        {/* SINGLE COINS BALANCE DISPLAY */}
        <div className="w-full flex justify-center mb-6">
            <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <Coins size={16} className="text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]" />
                <span className="text-sm font-black tracking-tight tabular-nums text-white">
                    {coins.toLocaleString()}
                </span>
                <span className="text-[9px] font-black text-[#FFD700] uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">Coins</span>
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-start pt-2 gap-8">
          {/* PEMBUNGKUS EXTRA TERANG & GLOSSY (Pake border putih solid tipis + neon border glow) */}
          <div className="relative p-6 rounded-full border-[6px] border-zinc-900 bg-black shadow-[0_0_40px_rgba(255,215,0,0.25)]">
            
            {/* FULL LED LINE STRIP GRADIENT TERANG MUTER */}
            <div className="absolute inset-1 rounded-full animate-[spin_5s_linear_infinite]" 
                 style={{
                   border: "6px solid transparent",
                   borderImageSource: "conic-gradient(from 0deg, #FFD700, #00ffff, #ff007f, #39ff14, #FFD700)",
                   borderImageSlice: 1,
                   maskImage: "radial-gradient(black, transparent)",
                   WebkitMaskImage: "radial-gradient(black, transparent)"
                 }}/>

            {/* EFFECT OVERLAY 3D DEPTH (Bayangan gelap di pinggir lingkaran dalam) */}
            <div className="absolute inset-6 z-20 rounded-full pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.85)] border border-black/30" />
            
            {/* POINTER JARUM MEWAH AKURAT DI JAM 12 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 z-30 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-t-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,1)]" />
                <div className="w-5 h-5 rounded-full bg-zinc-900 border-4 border-[#FFD700] -mt-1 shadow-2xl flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-ping" />
                </div>
            </div>
            
            {/* BADAN RODA KINCLONG TERANG */}
            <motion.div 
              style={{ 
                width: 300, 
                height: 300, 
                rotate: totalRotation, 
                transition: isSpinning ? "transform 2.5s cubic-bezier(0.1, 0, 0.1, 1)" : "none" 
              }}
              className="relative rounded-full border-4 border-zinc-950 overflow-hidden"
            >
              <div className="absolute inset-0 scale-[1.02]" style={{ background: `conic-gradient(${conicGradient})` }} />
              
              {/* SEKAT HITAM TEGAS ANTAR JURING */}
              {SEGMENTS.map((_, i) => (
                <div key={`line-${i}`} className="absolute top-1/2 left-1/2 w-[2px] h-[150px] bg-black/80 origin-top -translate-x-1/2" 
                     style={{ transform: `rotate(${i * SEG_ANGLE}deg)` }} />
              ))}

              {/* TEKS SEKTOR MENYALA PUTIH TEBAL */}
              {SEGMENTS.map((seg, i) => {
                const currentRotation = i * SEG_ANGLE + SEG_ANGLE / 2;
                return (
                  <div 
                    key={i} 
                    className="absolute top-1/2 left-1/2 origin-center flex justify-end items-center" 
                    style={{ 
                      transform: `translate(-50%, -50%) rotate(${currentRotation}deg)`, 
                      width: "270px",
                      height: "20px"
                    }}
                  >
                    <span 
                      className="font-black text-[10px] uppercase tracking-tight pr-3 select-none drop-shadow-[0_3px_5px_rgba(0,0,0,1)] text-white" 
                      style={{ 
                        transform: "rotate(180deg)",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {seg.label}
                    </span>
                  </div>
                );
              })}
            </motion.div>

            {/* POROS TENGAH METALIK */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border-4 border-zinc-950 shadow-2xl flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-[#FFD700]/40 bg-black/80 shadow-inner" />
            </div>
          </div>

          {/* SIDE-BY-SIDE ARCADE CONTROLS GRID */}
          <div className="w-full flex flex-col gap-4 px-2 mt-4">
            <div className="grid grid-cols-2 gap-4 w-full px-1">
              {/* TOMBOL KIRI (PREMIUM SPIN) */}
              <button
                onClick={() => doSpin("premium")}
                disabled={isSpinning}
                className="relative flex flex-col items-center justify-center py-4 rounded-2xl border-b-4 border-amber-700 bg-zinc-900 border border-amber-500/20 text-[#FFD700] font-black uppercase text-[11px] tracking-widest active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-20 shadow-xl"
              >
                <div className="flex items-center gap-1.5">
                    <Flame size={12} />
                    <span>200 Coins</span>
                </div>
              </button>

              {/* TOMBOL KANAN (FREE / ADS BERGABUNG DINAMIS MURNI) */}
              {spinState?.isFreeAvailable ? (
                <button
                  onClick={() => doSpin("free")}
                  disabled={isSpinning}
                  className="flex flex-col items-center justify-center py-4 rounded-2xl border-b-4 border-amber-600 bg-[#FFD700] text-black font-black uppercase text-[11px] tracking-widest active:translate-y-0.5 active:border-b-0 transition-all shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                      <Zap size={12} />
                      <span>Free Spin</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleAdSpin}
                  disabled={spinState?.adsRemaining <= 0 || isSpinning}
                  className="flex flex-col items-center justify-center py-4 rounded-2xl border-b-4 border-zinc-800 bg-zinc-900 border border-white/5 text-[#FFD700] font-black uppercase text-[11px] tracking-widest active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-20 disabled:border-b-0 shadow-xl"
                >
                  <span>Ads {spinState ? spinState.adsRemaining : 5}/{spinState ? spinState.maxAds : 5}</span>
                </button>
              )}
            </div>

            {/* COUNTDOWN */}
            {!spinState?.isFreeAvailable && spinState?.nextFreeIn > 0 && (
              <p className="text-center text-[9px] font-black uppercase tracking-widest opacity-20 mt-1">
                Next Free Wheel In {formatCountdown(spinState?.nextFreeIn - (Date.now() - now))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
          >
            <div className="w-full max-w-xs p-10 rounded-[36px] text-center border border-white/10 bg-[#070707] shadow-[0_0_50px_rgba(255,215,0,0.2)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
              <p className="text-[10px] font-black text-white/20 mb-2 uppercase tracking-[0.4em]">Jackpot!</p>
              <h2 className="text-sm font-bold text-white/60 mb-1 uppercase">You Received</h2>
              <p className="text-[#FFD700] text-4xl font-black italic tracking-tighter mb-8 drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]">{lastPrize.label}</p>
              <button 
                onClick={() => setShowResult(false)} 
                className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest border-b-4 border-amber-600 active:translate-y-0.5 active:border-b-0 transition-all"
              >
                Claim to Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADS LOADER MODAL */}
      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-2xl">
             <div className="text-center">
                <div className="w-20 h-20 mb-8 mx-auto relative flex items-center justify-center border-4 border-[#FFD700] rounded-full shadow-[0_0_25px_rgba(255,215,0,0.25)]">
                   <span className="text-2xl font-black text-[#FFD700] tabular-nums animate-pulse">{adTimer}</span>
                </div>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.4em] mb-10">Loading Sponsor Video...</p>
                {adDone && (
                  <button 
                    onClick={() => { setShowAdModal(false); doSpin("ads"); }} 
                    className="px-10 py-4 rounded-xl bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest shadow-xl border-b-4 border-amber-600 active:translate-y-0.5 active:border-b-0 transition-all"
                  >
                    Claim Reward Spin
                  </button>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>
      
      <BottomNav />
    </div>
  );
}