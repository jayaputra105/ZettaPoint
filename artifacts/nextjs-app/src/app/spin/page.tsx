"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import AdModal from "@/components/AdModal";
import { useApp } from "@/context/AppProvider";
import { Coins, Flame, Zap } from "lucide-react";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

// 12 SEKTOR FIX SINKRON DENGAN BACKEND
const SEGMENTS = [
  { label: "50 COINS", color: "#ef4444", textColor: "#fff" },   // Index 0
  { label: "150 COINS", color: "#3b82f6", textColor: "#fff" },  // Index 1
  { label: "300 COINS", color: "#a855f7", textColor: "#fff" },  // Index 2
  { label: "500 COINS", color: "#eab308", textColor: "#000" },  // Index 3
  { label: "1000 COINS", color: "#f97316", textColor: "#fff" }, // Index 4
  { label: "1 USDT", color: "#22c55e", textColor: "#fff" },     // Index 5
  { label: "5 USDT", color: "#ec4899", textColor: "#fff" },     // Index 6
  { label: "25 USDT", color: "#ffd700", textColor: "#000" },    // Index 7 (Jimat 0%)
  { label: "1 USDT", color: "#22c55e", textColor: "#fff" },     // Index 8
  { label: "1000 COINS", color: "#f97316", textColor: "#fff" }, // Index 9
  { label: "500 COINS", color: "#eab308", textColor: "#000" },  // Index 10
  { label: "300 COINS", color: "#a855f7", textColor: "#fff" },  // Index 11
];

const NUM_SEG = SEGMENTS.length;
const SEG_ANGLE = 360 / NUM_SEG; // Pas 30 Derajat
const SPIN_ANIMATION_DURATION_MS = 3000; // 3 detik animasi smooth

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
  const [resetAnimation, setResetAnimation] = useState(false); 
  const [lastPrize, setLastPrize] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const pendingAdSpinRef = useRef(false);
  const spinDataRef = useRef<any>(null); // Simpan data spin temporary

  const getTelegramId = () => {
    const tg = (window as any).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user?.id?.toString() || "12345";
  };

  useEffect(() => {
    fetchSpinState();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchSpinState = async () => {
    const tid = getTelegramId();
    try {
      const r = await fetch(`/api/spin?telegramId=${tid}`);
      const data = await r.json();
      setSpinState(data);
    } catch (err) {
      console.error("Gagal mengambil state spin", err);
    }
  };

  const doSpin = async (type: "premium" | "free" | "ads") => {
    const tid = getTelegramId();
    if (isSpinning || !tid) return;
    
    setIsSpinning(true);
    setShowResult(false);
    
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spinType: type,
          useAd: type === "ads",
          telegramId: tid
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // =========================================================
      // 🏎️ JALUR AKUMULASI SPIN (ANCANG-ANCANG KE NOL BARU LANJUT)
      // =========================================================
      const currentDegrees = totalRotation % 360;
      const degreesToReset = (360 - currentDegrees) % 360;
      
      const baseAngle = (NUM_SEG - data.prizeIndex) % NUM_SEG * SEG_ANGLE;
      const segmentCenter = baseAngle - (SEG_ANGLE / 2);
      const targetDegrees = (segmentCenter + 270 + 360) % 360;
      
      const finalAngle = totalRotation + degreesToReset + (360 * 5) + targetDegrees;
      
      setTotalRotation(finalAngle);
      setLastPrize(data.prize);
      spinDataRef.current = data; // Simpan untuk later use
      // =========================================================
      
      // UPDATE COINS SEBELUM SPIN (untuk premium deduct)
      if (type === "premium") {
        setCoins(Math.max(0, coins - 200));
      }
      
      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        
        // UPDATE COINS SETELAH SPIN (add prize)
        if (type === "premium") {
          if (data.prize.coins > 0) {
            setCoins(Math.max(0, coins - 200) + data.prize.coins);
          }
        } else {
          if (data.prize.coins > 0) {
            setCoins(coins + data.prize.coins);
          }
        }
        
        if (data.prize.usdt > 0) {
          setUsdtBalance(usdtBalance + data.prize.usdt);
        }
        
        fetchSpinState();
        spinDataRef.current = null;
      }, SPIN_ANIMATION_DURATION_MS + 500);
    } catch (e: any) {
      setIsSpinning(false);
      console.error("Spin error:", e.message);
      alert("❌ " + e.message);
      fetchSpinState();
      spinDataRef.current = null;
    }
  };

  const handleAdSpin = () => {
    if (spinState?.adsRemaining <= 0 || isSpinning) return;
    pendingAdSpinRef.current = true;
    setShowAdModal(true);
  };

  const handleAdComplete = () => {
    // Ad selesai ditonton, trigger spin
    if (pendingAdSpinRef.current) {
      pendingAdSpinRef.current = false;
      doSpin("ads");
    }
    setShowAdModal(false);
  };

  const handleAdClose = () => {
    pendingAdSpinRef.current = false;
    setShowAdModal(false);
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

        {/* DISPLAY SINGLE COINS BALANCE */}
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
          {/* CONTAINER CHROME NEON LIGHTS */}
          <div className="relative p-6 rounded-full border-[6px] border-zinc-900 bg-black shadow-[0_0_40px_rgba(255,215,0,0.25)]">
            
            <div className="absolute inset-1 rounded-full animate-[spin_5s_linear_infinite]" 
                 style={{
                   border: "6px solid transparent",
                   borderImageSource: "conic-gradient(from 0deg, #FFD700, #00ffff, #ff007f, #39ff14, #FFD700)",
                   borderImageSlice: 1,
                   maskImage: "radial-gradient(black, transparent)",
                   WebkitMaskImage: "radial-gradient(black, transparent)"
                 }}/>

            <div className="absolute inset-6 z-20 rounded-full pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.85)] border border-black/30" />
            
            {/* POINTER JARUM JAM 12 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-5 z-30 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-t-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,1)]" />
                <div className="w-5 h-5 rounded-full bg-zinc-900 border-4 border-[#FFD700] -mt-1 shadow-2xl flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-ping" />
                </div>
            </div>
            
            {/* BADAN RODA KINCLONG UTAMA */}
            <motion.div 
              style={{ 
                width: 300, 
                height: 300, 
                rotate: totalRotation, 
                transition: isSpinning 
                  ? `transform ${SPIN_ANIMATION_DURATION_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)` 
                  : "none" 
              }}
              className="relative rounded-full border-4 border-zinc-950 overflow-hidden"
            >
              <div className="absolute inset-0 scale-[1.02]" style={{ background: `conic-gradient(${conicGradient})` }} />
              
              {/* SEKAT HITAM ANTAR JURING */}
              {SEGMENTS.map((_, i) => (
                <div key={`line-${i}`} className="absolute top-1/2 left-1/2 w-[2px] h-[150px] bg-black/80 origin-top -translate-x-1/2" 
                     style={{ transform: `rotate(${i * SEG_ANGLE}deg)` }} />
              ))}

              {/* LABELS */}
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

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 border-4 border-zinc-950 shadow-2xl flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-[#FFD700]/40 bg-black/80 shadow-inner" />
            </div>
          </div>

          {/* SIDE-BY-SIDE ARCADE CONTROLS */}
          <div className="w-full flex flex-col gap-4 px-2 mt-4">
            <div className="grid grid-cols-2 gap-4 w-full px-1">
              {/* TOMBOL KIRI (PREMIUM 200 COIN) */}
              <button
                onClick={() => doSpin("premium")}
                disabled={isSpinning || coins < 200}
                className="relative flex flex-col items-center justify-center py-4 rounded-2xl border-b-4 border-amber-700 bg-zinc-900 border border-amber-500/20 text-[#FFD700] font-black uppercase text-[11px] tracking-widest active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-20 disabled:border-b-0 shadow-xl hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] disabled:hover:shadow-xl"
              >
                <div className="flex items-center gap-1.5">
                    <Flame size={12} />
                    <span>200 Coins</span>
                </div>
              </button>

              {/* TOMBOL KANAN (AUTOMATIC REVERSAL KE ADS KALO FREE HABIS) */}
              {spinState?.isFreeAvailable ? (
                <button
                  onClick={() => doSpin("free")}
                  disabled={isSpinning}
                  className="flex flex-col items-center justify-center py-4 rounded-2xl border-b-4 border-amber-600 bg-[#FFD700] text-black font-black uppercase text-[11px] tracking-widest active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-20 disabled:border-b-0 shadow-xl hover:shadow-[0_0_15px_rgba(255,215,0,0.4)]"
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
                  className="flex flex-col items-center justify-center py-4 rounded-2xl border-b-4 border-zinc-800 bg-zinc-900 border border-white/5 text-[#FFD700] font-black uppercase text-[11px] tracking-widest active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-20 disabled:border-b-0 shadow-xl hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] disabled:hover:shadow-xl"
                >
                  <span>Ads {spinState ? spinState.adsRemaining : 5}/{spinState ? spinState.maxAds : 5}</span>
                </button>
              )}
            </div>

            {/* TIMER */}
            {!spinState?.isFreeAvailable && spinState?.nextFreeIn > 0 && (
              <p className="text-center text-[9px] font-black uppercase tracking-widest opacity-20 mt-1">
                Next Free Wheel In {formatCountdown(spinState?.nextFreeIn - (Date.now() - now))}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* POPUP RESULT */}
      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
          >
            <motion.div 
              className="w-full max-w-xs p-10 rounded-[36px] text-center border border-white/10 bg-[#070707] shadow-[0_0_50px_rgba(255,215,0,0.2)] relative overflow-hidden"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
              <p className="text-[10px] font-black text-white/20 mb-2 uppercase tracking-[0.4em]">Jackpot!</p>
              <h2 className="text-sm font-bold text-white/60 mb-1 uppercase">You Received</h2>
              <motion.p 
                className="text-[#FFD700] text-4xl font-black italic tracking-tighter mb-8 drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
              >
                {lastPrize.label}
              </motion.p>
              <button 
                onClick={() => setShowResult(false)} 
                className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest border-b-4 border-amber-600 active:translate-y-0.5 active:border-b-0 transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] shadow-xl"
              >
                Claim to Wallet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AD MODAL - PAKAI COMPONENT YANG SUDAH ADA */}
      <AdModal 
        open={showAdModal}
        adNumber={spinState ? spinState.maxAds - spinState.adsRemaining + 1 : 1}
        maxAds={spinState ? spinState.maxAds : 5}
        onComplete={handleAdComplete}
        onClose={handleAdClose}
      />
      
      <BottomNav />
    </div>
  );
}
