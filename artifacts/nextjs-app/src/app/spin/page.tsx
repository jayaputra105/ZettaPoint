"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/context/AppProvider";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const SEGMENTS = [
  { label: "50 COINS", color: "rgba(255, 215, 0, 0.8)", textColor: "#000" },
  { label: "100 COINS", color: "rgba(255, 140, 0, 0.8)", textColor: "#000" },
  { label: "200 COINS", color: "rgba(65, 105, 225, 0.8)", textColor: "#fff" },
  { label: "500 COINS", color: "rgba(155, 89, 182, 0.8)", textColor: "#fff" },
  { label: "1000 COINS", color: "rgba(231, 76, 60, 0.8)", textColor: "#fff" },
  { label: "10 USDT", color: "rgba(39, 174, 96, 0.8)", textColor: "#fff" },
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
  const { coins, setCoins, usdt, setUsdt } = useApp();
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
    return tg?.initDataUnsafe?.user?.id?.toString();
  };

  useEffect(() => {
    fetchSpinState();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchSpinState = () => {
    const tid = getTelegramId();
    if (!tid) return;
    fetch(`/api/spin?telegramId=${tid}`)
      .then((r) => r.json())
      .then(setSpinState);
  };

  const doSpin = async (type: "free" | "ads" | "paid") => {
    const tid = getTelegramId();
    if (isSpinning || !tid) return;

    if (type === "paid" && coins < 300) {
      alert("Insufficient coins!");
      return;
    }

    setIsSpinning(true);
    setShowResult(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, telegramId: tid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Sinkronisasi koin jika berbayar
      if (type === "paid") setCoins(coins - 300);

      const landingAngle = (360 - (data.prizeIndex * SEG_ANGLE + SEG_ANGLE / 2)) % 360;
      const newRotation = totalRotation + (360 * 8) + landingAngle;
      setTotalRotation(newRotation);
      setLastPrize(data.prize);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        // Update global state berdasarkan hadiah
        if (data.prize.type === "coin") setCoins(coins + data.prize.value);
        if (data.prize.type === "usdt") setUsdt(usdt + data.prize.value);
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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col" style={{ background: "#050508" }}>
      <ShootingStars />
      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-6 pb-2 text-center">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-[#FFD700]">LUCKY WHEEL</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">Test your luck daily</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <div className="relative p-4 rounded-full border border-white/5 bg-white/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-t-[#FFD700]" />
            <motion.div 
              style={{ width: 300, height: 300, rotate: totalRotation, transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0, 0.15, 1)" : "none" }}
              className="relative rounded-full border-[6px] border-[#1a1a1a] overflow-hidden"
            >
              <div className="absolute inset-0" style={{ background: `conic-gradient(${conicGradient})` }} />
              {SEGMENTS.map((seg, i) => (
                <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full py-4 flex justify-start items-center" style={{ transform: `rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg)`, width: "2px" }}>
                   <span className="font-black text-[10px] uppercase" style={{ color: seg.textColor, transform: "rotate(-90deg)" }}>{seg.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => doSpin("free")}
              disabled={!spinState?.isFreeAvailable || isSpinning}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-30 bg-[#FFD700] text-black"
            >
              {spinState?.isFreeAvailable ? "🎰 Play Free Spin" : `Next: ${formatCountdown(spinState?.nextFreeIn - (Date.now() - now))}`}
            </button>

            <button
              onClick={handleAdSpin}
              disabled={spinState?.adsRemaining <= 0 || isSpinning}
              className="w-full py-4 rounded-2xl border border-[#FFD700]/20 text-[#FFD700] font-bold text-[11px] uppercase"
            >
              🎬 Watch Ad ({spinState?.adsRemaining}/{spinState?.maxAds})
            </button>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-xs p-8 rounded-[32px] text-center border border-[#FFD700]/30 bg-[#0d0d1a]">
              <h2 className="text-2xl font-black text-white mb-2">YOU WON!</h2>
              <p className="text-[#FFD700] text-3xl font-black mb-6">{lastPrize.label}</p>
              <button onClick={() => setShowResult(false)} className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase text-xs">COLLECT</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95">
             <div className="text-center">
                <div className="w-20 h-20 mb-6 mx-auto relative flex items-center justify-center border-4 border-[#FFD700] rounded-full">
                   <span className="text-2xl font-black text-[#FFD700]">{adTimer}</span>
                </div>
                {adDone && (
                  <button onClick={() => { setShowAdModal(false); doSpin("ads"); }} className="px-10 py-4 rounded-full bg-[#FFD700] text-black font-black uppercase text-xs">Claim Spin</button>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}