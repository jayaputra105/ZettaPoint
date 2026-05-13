
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

// WARNA NEON GLOSSY RGBA
const SEGMENTS = [
  { label: "50 Koin", color: "rgba(255, 215, 0, 0.8)", glow: "rgba(255, 215, 0, 0.5)", textColor: "#000" },
  { label: "100 Koin", color: "rgba(255, 140, 0, 0.8)", glow: "rgba(255, 140, 0, 0.5)", textColor: "#000" },
  { label: "200 Koin", color: "rgba(65, 105, 225, 0.8)", glow: "rgba(65, 105, 225, 0.5)", textColor: "#fff" },
  { label: "500 Koin", color: "rgba(155, 89, 182, 0.8)", glow: "rgba(155, 89, 182, 0.5)", textColor: "#fff" },
  { label: "1000 Koin", color: "rgba(231, 76, 60, 0.8)", glow: "rgba(231, 76, 60, 0.5)", textColor: "#fff" },
  { label: "10 USDT", color: "rgba(39, 174, 96, 0.8)", glow: "rgba(39, 174, 96, 0.5)", textColor: "#fff" },
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
  const wheelRef = useRef<HTMLDivElement>(null);

  // HELPER AMBIL ID TELEGRAM ASLI
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
      .then(setSpinState)
      .catch(() => {});
  };

  const doSpin = async (useAd: boolean) => {
    const tid = getTelegramId();
    if (isSpinning || !tid) return;
    
    setIsSpinning(true);
    setShowResult(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAd, telegramId: tid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const landingAngle = (360 - (data.prizeIndex * SEG_ANGLE + SEG_ANGLE / 2)) % 360;
      const newRotation = totalRotation + (360 * 8) + landingAngle; // 8 putaran biar dramatis
      setTotalRotation(newRotation);
      setLastPrize(data.prize);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        fetchSpinState();
      }, 4500);
    } catch (e) {
      setIsSpinning(false);
      alert(e instanceof Error ? e.message : "Spin failed");
    }
  };

  const handleFreeSpin = () => {
    if (!spinState?.isFreeAvailable || isSpinning) return;
    doSpin(false);
  };

  const handleAdSpin = () => {
    if (!spinState || spinState.adsRemaining <= 0 || isSpinning) return;
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

  const conicGradient = SEGMENTS.map((seg, i) => {
    const start = i * SEG_ANGLE;
    const end = start + SEG_ANGLE;
    return `${seg.color} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col" style={{ background: "#050508" }}>
      <ShootingStars />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-6 pb-2 text-center">
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-black uppercase italic tracking-tighter" style={{ color: "#FFD700", textShadow: "0 0 15px rgba(255,215,0,0.4)" }}>
            Zetta Lucky Wheel
          </motion.h1>
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">Test your luck daily</p>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* WHEEL CONTAINER */}
          <div className="relative p-4 rounded-full" style={{ background: "rgba(255,215,0,0.03)", border: "1px solid rgba(255,215,0,0.1)", boxShadow: "0 0 50px rgba(0,0,0,0.5)" }}>
            
            {/* PIN POINTER */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30">
               <div style={{ width: 0, height: 0, borderLeft: "15px solid transparent", borderRight: "15px solid transparent", borderTop: "30px solid #FFD700", filter: "drop-shadow(0 0 10px rgba(255,215,0,0.8))" }} />
            </div>

            <motion.div 
              style={{ width: 300, height: 300, rotate: totalRotation, transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0, 0.15, 1)" : "none" }}
              className="relative rounded-full border-[6px] border-[#1a1a1a] shadow-[0_0_40px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${conicGradient})` }} />
              
              {/* SEGMENT GLOSS OVERLAY */}
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.4) 100%)" }} />

              {SEGMENTS.map((seg, i) => (
                <div key={i} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full py-4 flex justify-start items-center" style={{ transform: `rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg)`, width: "2px" }}>
                   <span className="font-black text-[10px] uppercase tracking-tighter" style={{ color: seg.textColor, transform: "rotate(-90deg)", whiteSpace: "nowrap" }}>
                     {seg.label}
                   </span>
                </div>
              ))}

              {/* CENTER HUB */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full z-40 shadow-[0_0_20px_rgba(0,0,0,0.8)] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #444, #000)", border: "2px solid #FFD700" }}>
                <div className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
              </div>
            </motion.div>
          </div>

          {/* BUTTONS */}
          {spinState && (
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleFreeSpin}
                disabled={!spinState.isFreeAvailable || isSpinning}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                style={{
                  background: spinState.isFreeAvailable && !isSpinning ? "linear-gradient(to right, #FFD700, #FFA500)" : "rgba(255,255,255,0.03)",
                  color: spinState.isFreeAvailable && !isSpinning ? "#000" : "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,215,0,0.2)",
                  boxShadow: spinState.isFreeAvailable && !isSpinning ? "0 10px 25px rgba(255,215,0,0.2)" : "none"
                }}
              >
                {spinState.isFreeAvailable ? (isSpinning ? "Spinning..." : "🎰 Play Free Spin") : `Next Free: ${formatCountdown(spinState.nextFreeIn - (Date.now() - now))}`}
              </button>

              <button
                onClick={handleAdSpin}
                disabled={spinState.adsRemaining <= 0 || isSpinning}
                className="w-full py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em]"
                style={{ background: "rgba(10,10,20,0.6)", border: "1px solid rgba(255,215,0,0.1)", color: "#FFD700" }}
              >
                🎬 Watch Ad to Spin ({spinState.adsRemaining}/{spinState.maxAds})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RESULT MODAL */}
      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-xs p-8 rounded-[32px] text-center border border-[#FFD700]/30" style={{ background: "#0d0d1a" }}>
              <div className="text-5xl mb-4">💎</div>
              <h2 className="text-2xl font-black text-white uppercase mb-1">You Won!</h2>
              <p className="text-[#FFD700] text-3xl font-black mb-6 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">{lastPrize.label}</p>
              <button onClick={() => setShowResult(false)} className="w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black uppercase text-xs tracking-widest">Great!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AD MODAL */}
      <AnimatePresence>
        {showAdModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95">
             <div className="text-center">
                <div className="w-20 h-20 mb-6 mx-auto relative">
                   <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-t-4 border-[#FFD700]" />
                   <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-[#FFD700]">{adTimer}</div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8">Video Reward Loading...</p>
                {adDone && (
                  <button onClick={() => { setShowAdModal(false); doSpin(true); }} className="px-10 py-4 rounded-full bg-[#FFD700] text-black font-black uppercase text-xs">Claim Spin Now</button>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}