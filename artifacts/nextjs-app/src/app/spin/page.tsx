"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const SEGMENTS = [
  { label: "50 COINS", color: "rgba(255, 215, 0, 0.8)", textColor: "#000", type: "coin", value: 50 },
  { label: "100 COINS", color: "rgba(255, 140, 0, 0.8)", textColor: "#000", type: "coin", value: 100 },
  { label: "200 COINS", color: "rgba(65, 105, 225, 0.8)", textColor: "#fff", type: "coin", value: 200 },
  { label: "500 COINS", color: "rgba(155, 89, 182, 0.8)", textColor: "#fff", type: "coin", value: 500 },
  { label: "1000 COINS", color: "rgba(231, 76, 60, 0.8)", textColor: "#fff", type: "coin", value: 1000 },
  { label: "10 USDT", color: "rgba(39, 174, 96, 0.8)", textColor: "#fff", type: "usdt", value: 10 },
];

const NUM_SEG = SEGMENTS.length;
const SEG_ANGLE = 360 / NUM_SEG;

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

  const doSpin = async (type: "free" | "ads") => {
    const tid = getTelegramId();
    if (isSpinning || !tid) return;

    setIsSpinning(true);
    setShowResult(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAd: type === "ads", telegramId: tid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const landingAngle = (360 - (data.prizeIndex * SEG_ANGLE + SEG_ANGLE / 2)) % 360;
      const newRotation = totalRotation + (360 * 10) + landingAngle; // Tambah putaran biar lebih dramatis
      setTotalRotation(newRotation);
      setLastPrize(data.prize);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        
        // SINKRONISASI COIN & USDT KE STATE GLOBAL (Biar gak reset)
        if (data.prize.coins > 0) setCoins(coins + data.prize.coins);
        if (data.prize.usdt > 0) setUsdtBalance(usdtBalance + data.prize.usdt);
        
        fetchSpinState();
      }, 4500);
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
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-hidden">
      <ShootingStars />
      
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-32">
        {/* HEADER GAK NUMPUK */}
        <header className="pt-10 pb-6 text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">LUCKY WHEEL</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 mt-1 text-white">Win Coins or Real USDT</p>
        </header>

        {/* BAGIAN RODA: Pake justify-start biar gak numpuk di tengah */}
        <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-12">
          <div className="relative p-6 rounded-full border border-white/5 bg-zinc-900/10 shadow-[0_0_50px_rgba(255,255,255,0.02)]">
            {/* PIN POINTER */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-t-[#FFD700] drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]" />
            
            <motion.div 
              style={{ 
                width: 300, 
                height: 300, 
                rotate: totalRotation, 
                transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0, 0.15, 1)" : "none" 
              }}
              className="relative rounded-full border-[10px] border-zinc-800 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0" style={{ background: `conic-gradient(${conicGradient})` }} />
              {SEGMENTS.map((seg, i) => (
                <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full py-6 flex justify-start items-center" style={{ transform: `rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg)`, width: "2px" }}>
                   <span className="font-black text-[10px] uppercase tracking-tighter" style={{ color: seg.textColor, transform: "rotate(-90deg)" }}>{seg.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* BUTTON SECTION */}
          <div className="w-full flex flex-col gap-4 px-2">
            <div className="flex justify-between px-2 mb-1">
               <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Available Options</span>
               <span className="text-[10px] font-black text-[#FFD700] uppercase">1 Free Daily</span>
            </div>
            
            <button
              onClick={() => doSpin("free")}
              disabled={!spinState?.isFreeAvailable || isSpinning}
              className="w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest disabled:opacity-20 bg-[#FFD700] text-black shadow-[0_10px_25px_rgba(255,215,0,0.2)] active:scale-95 transition-all"
            >
              {spinState?.isFreeAvailable ? "🎰 Instant Free Spin" : `Next: ${formatCountdown(spinState?.nextFreeIn - (Date.now() - now))}`}
            </button>

            <button
              onClick={handleAdSpin}
              disabled={spinState?.adsRemaining <= 0 || isSpinning}
              className="w-full py-4 rounded-[20px] border border-white/10 bg-white/5 text-[#FFD700] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              🎬 Bonus Spin ({spinState?.adsRemaining}/{spinState?.maxAds})
            </button>
          </div>
        </div>
      </div>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
          >
            <div className="w-full max-w-xs p-10 rounded-[40px] text-center border border-white/10 bg-[#0a0a0a] shadow-[0_0_50px_rgba(255,215,0,0.1)]">
              <p className="text-[10px] font-black text-white/30 mb-2 uppercase tracking-[0.4em]">Jackpot!</p>
              <h2 className="text-xl font-black text-white mb-1 uppercase">You Won</h2>
              <p className="text-[#FFD700] text-4xl font-black italic tracking-tighter mb-8 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">{lastPrize.label}</p>
              <button 
                onClick={() => setShowResult(false)} 
                className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest active:scale-95 transition-transform"
              >
                Claim to Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AD MODAL */}
      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-2xl">
             <div className="text-center">
                <div className="w-24 h-24 mb-8 mx-auto relative flex items-center justify-center border-[6px] border-[#FFD700] rounded-full shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                   <span className="text-3xl font-black text-[#FFD700] tabular-nums">{adTimer}</span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] mb-10">Loading Sponsor Video...</p>
                {adDone && (
                  <button 
                    onClick={() => { setShowAdModal(false); doSpin("ads"); }} 
                    className="px-12 py-5 rounded-full bg-[#FFD700] text-black font-black uppercase text-xs tracking-widest shadow-xl animate-bounce"
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