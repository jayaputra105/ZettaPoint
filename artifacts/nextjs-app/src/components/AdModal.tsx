"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdModalProps {
  open: boolean;
  adNumber: number;
  maxAds: number;
  onComplete: () => void;
  onClose: () => void;
}

const AD_DURATION = 5;

export default function AdModal({ open, adNumber, maxAds, onComplete, onClose }: AdModalProps) {
  const [timeLeft, setTimeLeft] = useState(AD_DURATION);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setTimeLeft(AD_DURATION);
      setDone(false);
      return;
    }
    setTimeLeft(AD_DURATION);
    setDone(false);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [open]);

  const progress = ((AD_DURATION - timeLeft) / AD_DURATION) * 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="w-full max-w-md mx-auto rounded-t-3xl px-6 pt-6 pb-8"
            style={{
              background: "linear-gradient(180deg, #0d0d1a 0%, #080810 100%)",
              border: "1.5px solid rgba(255,215,0,0.3)",
              borderBottom: "none",
              boxShadow: "0 -8px 40px rgba(255,215,0,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,215,0,0.5)" }}
                >
                  Iklan Sponsor
                </p>
                <p
                  className="font-black text-lg"
                  style={{ color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.5)" }}
                >
                  Nonton & Klaim Koin
                </p>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(255,215,0,0.08)",
                  border: "1px solid rgba(255,215,0,0.25)",
                }}
              >
                <span className="text-xs font-bold" style={{ color: "rgba(255,215,0,0.7)" }}>
                  {adNumber}/{maxAds}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  iklan
                </span>
              </div>
            </div>

            <div
              className="rounded-2xl flex flex-col items-center justify-center gap-3 mb-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,215,0,0.1)",
                height: 140,
              }}
            >
              {!done ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 rounded-full"
                    style={{
                      border: "3px solid rgba(255,215,0,0.15)",
                      borderTop: "3px solid #FFD700",
                    }}
                  />
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Iklan berjalan...
                  </p>
                  <p
                    className="text-2xl font-black tabular-nums"
                    style={{ color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.6)" }}
                  >
                    {timeLeft}s
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-4xl">✅</span>
                  <p className="font-bold text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                    Iklan selesai!
                  </p>
                </motion.div>
              )}
            </div>

            <div className="mb-5">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #FFD700, #FF8C00)",
                    boxShadow: "0 0 8px rgba(255,215,0,0.5)",
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Batal
              </button>
              <motion.button
                onClick={done ? onComplete : undefined}
                disabled={!done}
                animate={done ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 0.5, repeat: done ? Infinity : 0 }}
                className="flex-[2] py-3 rounded-2xl font-black text-sm transition-all"
                style={{
                  background: done
                    ? "linear-gradient(135deg, #FFD700, #FF8C00)"
                    : "rgba(255,215,0,0.1)",
                  border: done
                    ? "1px solid rgba(255,240,100,0.5)"
                    : "1px solid rgba(255,215,0,0.15)",
                  color: done ? "#000" : "rgba(255,215,0,0.3)",
                  boxShadow: done ? "0 0 20px rgba(255,215,0,0.4)" : "none",
                  cursor: done ? "pointer" : "not-allowed",
                }}
              >
                {done ? "🪙 Klaim +10 Koin!" : `Tunggu ${timeLeft}s...`}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
