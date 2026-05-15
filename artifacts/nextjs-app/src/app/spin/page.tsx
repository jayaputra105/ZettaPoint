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
  // SINKRONISASI NAMA VARIABEL BARU
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
      const newRotation = totalRotation + (360 * 8) + landingAngle;
      setTotalRotation(newRotation);
      setLastPrize(data.prize);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        
        // UPDATE GLOBAL STATE DENGAN NAMA BARU
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
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-8 pb-4 text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-[#FFD700]">LUCKY WHEEL</h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 mt-1">Spin to win assets</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-10">
          <div className="relative p-5 rounded-full border border-white/5 bg-zinc-900/20 shadow-2xl">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-30 w-0 h-0 border-l-[18px] border-r-[18px] border-t-[36px] border-t-[#FFD700] drop-shadow-lg" />
            <motion.div 
              style={{ width: 320, height: 320, rotate: totalRotation, transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0, 0.15, 1)" : "none" }}
              className="relative rounded-full border-[8px] border-zinc-800 overflow-hidden shadow-inner"
            >
              <div className="absolute inset-0" style={{ background: `conic-gradient(${conicGradient})` }} />
              {SEGMENTS.map((seg, i) => (
                <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full py-6 flex justify-start items-center" style={{ transform: `rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg)`, width: "2px" }}>
                   <span className="font-black text-[11px] uppercase tracking-tighter" style={{ color: seg.textColor, transform: "rotate(-90deg)" }}>{seg.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="w-full flex flex-col gap-4">
            <button
              onClick={() => doSpin("free")}
              disabled={!spinState?.isFreeAvailable || isSpinning}
              className="w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest disabled:opacity-20 bg-[#FFD700] text-black shadow-lg"
            >
              {spinState?.isFreeAvailable ? "🎰 Instant Free Spin" : `Next Free: ${formatCountdown(spinState?.nextFreeIn - (Date.now() - now))}`}
            </button>

            <button
              onClick={handleAdSpin}
              disabled={spinState?.adsRemaining <= 0 || isSpinning}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 text-[#FFD700] font-black text-[10px] uppercase tracking-widest"
            >
              🎬 Watch Video ({spinState?.adsRemaining}/{spinState?.maxAds})
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <div className="w-full max-w-xs p-10 rounded-[40px] text-center border border-[#FFD700]/20 bg-[#0d0d0d] shadow-2xl">
              <h2 className="text-xl font-black text-white/50 mb-1 uppercase tracking-widest">Congratulations!</h2>
              <p className="text-[#FFD700] text-4xl font-black italic tracking-tighter mb-8">{lastPrize.label}</p>
              <button onClick={() => setShowResult(false)} className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase text-[10px] tracking-widest">Collect Reward</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-3xl">
             <div className="text-center">
                <div className="w-24 h-24 mb-8 mx-auto relative flex items-center justify-center border-[6px] border-[#FFD700] rounded-full">
                   <span className="text-3xl font-black text-[#FFD700] tabular-nums">{adTimer}</span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] mb-10">Video is loading...</p>
                {adDone && (
                  <button onClick={() => { setShowAdModal(false); doSpin("ads"); }} className="px-12 py-5 rounded-full bg-[#FFD700] text-black font-black uppercase text-xs tracking-widest shadow-xl">Claim Your Spin</button>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}