"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";

const ShootingStars = dynamic(() => import("@/components/ShootingStars"), { ssr: false });

const SEGMENTS = [
  { label: "50 Koin", color: "#FFD700", dark: "#7A5C00", textColor: "#000" },
  { label: "100 Koin", color: "#FF8C00", dark: "#7A3F00", textColor: "#000" },
  { label: "200 Koin", color: "#4169E1", dark: "#1a2a7a", textColor: "#fff" },
  { label: "500 Koin", color: "#9B59B6", dark: "#4a1a6a", textColor: "#fff" },
  { label: "1000 Koin", color: "#E74C3C", dark: "#7a1a1a", textColor: "#fff" },
  { label: "0.1 USDT", color: "#27AE60", dark: "#0a5a28", textColor: "#fff" },
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

interface SpinState {
  isFreeAvailable: boolean;
  adsRemaining: number;
  maxAds: number;
  nextFreeIn: number;
}

interface Prize {
  label: string;
  coins: number;
  usdt: number;
  index: number;
}

interface SpinResult {
  prize: Prize;
  prizeIndex: number;
  newCoins: number;
}

export default function SpinPage() {
  const [spinState, setSpinState] = useState<SpinState | null>(null);
  const [totalRotation, setTotalRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTimer, setAdTimer] = useState(5);
  const [adDone, setAdDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const adIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSpinState();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchSpinState = () => {
    fetch("/api/spin")
      .then((r) => r.json())
      .then(setSpinState)
      .catch(() => {});
  };

  const doSpin = async (useAd: boolean) => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowResult(false);

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAd }),
      });
      const data: SpinResult & { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error);

      const prizeIndex = data.prizeIndex;
      const landingAngle = (360 - (prizeIndex * SEG_ANGLE + SEG_ANGLE / 2)) % 360;
      const newRotation = totalRotation + 5 * 360 + landingAngle;
      setTotalRotation(newRotation);
      setLastPrize(data.prize);

      setTimeout(() => {
        setIsSpinning(false);
        setShowResult(true);
        fetchSpinState();
      }, 4500);
    } catch (e: unknown) {
      setIsSpinning(false);
      console.error(e);
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

  const handleAdComplete = () => {
    setShowAdModal(false);
    doSpin(true);
  };

  const conicGradient = SEGMENTS.map((seg, i) => {
    const start = i * SEG_ANGLE;
    const end = start + SEG_ANGLE;
    return `${seg.color} ${start}deg ${end}deg`;
  }).join(", ");

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d0d1a 0%, #050508 60%, #000 100%)" }}
    >
      <ShootingStars />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-4 pb-28">
        <header className="pt-5 pb-2">
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-black text-2xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
              Spin & Menang
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Putar roda & raih hadiah!
            </p>
          </motion.div>
        </header>

        <div className="flex-1 flex flex-col items-center gap-5 pt-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 150 }}
            className="relative"
            style={{ width: 280, height: 280 }}
          >
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: "0 0 60px rgba(255,215,0,0.3), 0 0 120px rgba(255,215,0,0.1)",
                borderRadius: "50%",
                zIndex: 0,
              }}
            />

            <div
              className="absolute top-0 left-1/2 z-20 flex items-center justify-center"
              style={{ transform: "translate(-50%, -14px)" }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "12px solid transparent",
                  borderRight: "12px solid transparent",
                  borderTop: "28px solid #FFD700",
                  filter: "drop-shadow(0 0 8px rgba(255,215,0,0.8))",
                }}
              />
            </div>

            <div
              ref={wheelRef}
              className="w-full h-full rounded-full relative overflow-hidden z-10"
              style={{
                background: `conic-gradient(${conicGradient})`,
                border: "4px solid rgba(255,215,0,0.4)",
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
                transform: `rotate(${totalRotation}deg)`,
                transition: isSpinning ? "transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
              }}
            >
              {SEGMENTS.map((seg, i) => {
                const midAngle = (i * SEG_ANGLE + SEG_ANGLE / 2) * (Math.PI / 180);
                const radius = 85;
                const x = 140 + radius * Math.sin(midAngle);
                const y = 140 - radius * Math.cos(midAngle);
                return (
                  <div
                    key={i}
                    className="absolute text-[9px] font-black leading-tight text-center"
                    style={{
                      left: x,
                      top: y,
                      transform: `translate(-50%, -50%) rotate(${i * SEG_ANGLE + SEG_ANGLE / 2}deg)`,
                      color: seg.textColor,
                      width: 52,
                      textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                      pointerEvents: "none",
                    }}
                  >
                    {seg.label}
                  </div>
                );
              })}

              <div
                className="absolute rounded-full z-30"
                style={{
                  width: 36,
                  height: 36,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, #fff 0%, #FFD700 50%, #B8860B 100%)",
                  border: "3px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 0 16px rgba(255,215,0,0.8)",
                }}
              />
            </div>
          </motion.div>

          <div className="w-full grid grid-cols-3 gap-2">
            {SEGMENTS.map((seg, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-[10px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {seg.label}
                </span>
              </div>
            ))}
          </div>

          {spinState && (
            <motion.div className="w-full flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <button
                onClick={handleFreeSpin}
                disabled={!spinState.isFreeAvailable || isSpinning}
                className="w-full py-4 rounded-2xl font-black text-base relative overflow-hidden"
                style={{
                  background: spinState.isFreeAvailable && !isSpinning
                    ? "linear-gradient(135deg, #FFD700, #FF8C00)"
                    : "rgba(255,215,0,0.08)",
                  border: "1px solid rgba(255,215,0,0.3)",
                  color: spinState.isFreeAvailable && !isSpinning ? "#000" : "rgba(255,215,0,0.3)",
                  boxShadow: spinState.isFreeAvailable && !isSpinning ? "0 0 30px rgba(255,215,0,0.4)" : "none",
                }}
              >
                {spinState.isFreeAvailable ? (
                  isSpinning ? "Berputar..." : "🎰 Daily Free Spin"
                ) : (
                  <span>
                    ⏳ Free spin dalam:{" "}
                    <span style={{ color: "#FFD700" }}>
                      {formatCountdown(spinState.nextFreeIn - (Date.now() - now))}
                    </span>
                  </span>
                )}
              </button>

              <button
                onClick={handleAdSpin}
                disabled={spinState.adsRemaining <= 0 || isSpinning}
                className="w-full py-3.5 rounded-2xl font-bold text-sm"
                style={{
                  background: spinState.adsRemaining > 0 && !isSpinning
                    ? "rgba(255,215,0,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${spinState.adsRemaining > 0 && !isSpinning ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                  color: spinState.adsRemaining > 0 && !isSpinning ? "rgba(255,215,0,0.85)" : "rgba(255,255,255,0.25)",
                }}
              >
                🎬 Spin dengan Iklan ({spinState.adsRemaining}/{spinState.maxAds} tersisa)
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showResult && lastPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ y: 100, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-t-3xl p-6 pb-10 text-center"
              style={{
                background: "linear-gradient(180deg, #0d0d1a 0%, #080810 100%)",
                border: "1.5px solid rgba(255,215,0,0.3)",
                borderBottom: "none",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-3"
              >
                🎉
              </motion.div>
              <p className="font-black text-2xl mb-1" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.6)" }}>
                Selamat!
              </p>
              <p className="text-base mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                Kamu mendapatkan
              </p>
              <div
                className="rounded-2xl py-4 px-6 mb-5 inline-block"
                style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}
              >
                <p className="font-black text-3xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.8)" }}>
                  {lastPrize.label}
                </p>
              </div>
              <button
                onClick={() => setShowResult(false)}
                className="block w-full py-3.5 rounded-2xl font-black text-sm"
                style={{ background: "linear-gradient(135deg, #FFD700, #FF8C00)", color: "#000" }}
              >
                Klaim & Lanjutkan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-t-3xl px-6 pt-6 pb-8"
              style={{
                background: "linear-gradient(180deg, #0d0d1a 0%, #080810 100%)",
                border: "1.5px solid rgba(255,215,0,0.3)",
                borderBottom: "none",
              }}
            >
              <p className="font-black text-lg mb-4" style={{ color: "#FFD700" }}>Nonton Iklan Dulu</p>
              <div
                className="rounded-2xl h-28 flex flex-col items-center justify-center gap-2 mb-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.1)" }}
              >
                {!adDone ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 rounded-full"
                      style={{ border: "3px solid rgba(255,215,0,0.15)", borderTop: "3px solid #FFD700" }}
                    />
                    <p className="text-2xl font-black" style={{ color: "#FFD700" }}>{adTimer}s</p>
                  </>
                ) : (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <div className="text-3xl">✅</div>
                    <p className="text-sm font-bold mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Selesai!</p>
                  </motion.div>
                )}
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden mb-4"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #FFD700, #FF8C00)" }}
                  animate={{ width: `${((5 - adTimer) / 5) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { clearInterval(adIntervalRef.current!); setShowAdModal(false); }}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                >
                  Batal
                </button>
                <motion.button
                  onClick={adDone ? handleAdComplete : undefined}
                  disabled={!adDone}
                  animate={adDone ? { scale: [1, 1.04, 1] } : {}}
                  transition={{ duration: 0.5, repeat: adDone ? Infinity : 0 }}
                  className="flex-[2] py-3 rounded-2xl font-black text-sm"
                  style={{
                    background: adDone ? "linear-gradient(135deg, #FFD700, #FF8C00)" : "rgba(255,215,0,0.1)",
                    color: adDone ? "#000" : "rgba(255,215,0,0.3)",
                    cursor: adDone ? "pointer" : "not-allowed",
                  }}
                >
                  {adDone ? "🎰 Putar Sekarang!" : `Tunggu ${adTimer}s...`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
