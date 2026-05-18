"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdModalProps {
  open: boolean;
  adNumber: number;
  maxAds: number;
  onComplete: () => void;
  onClose: () => void;
}

export default function AdModal({ open, adNumber, maxAds, onComplete, onClose }: AdModalProps) {
  const [adsgramController, setAdsgramController] = useState<any>(null);
  const [loadingAd, setLoadingAd] = useState(false);
  const [isError, setIsError] = useState(false);

  // 1. Suntik SDK Adsgram secara diam-diam tanpa merusak style HTML lu
  useEffect(() => {
    if (!open) return;

    setIsError(false);
    setLoadingAd(false);

    const existingScript = document.getElementById("adsgram-sdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "adsgram-sdk";
      script.src = "https://sad.adsgram.ai/js/sad.min.js";
      script.async = true;
      script.onload = () => initAdsgram();
      script.onerror = () => setIsError(true);
      document.body.appendChild(script);
    } else {
      initAdsgram();
    }

    function initAdsgram() {
      const windowObj = window as any;
      if (windowObj.Adsgram) {
        // Kunci Block ID Adsgram resmi milik lu
        const controller = windowObj.Adsgram.init({ blockId: "30467" });
        setAdsgramController(controller);
      } else {
        setIsError(true);
      }
    }
  }, [open]);

  // 2. Fungsi pemicu buat muter video iklan komersial asli
  const handleWatchAd = async () => {
    if (!adsgramController) {
      setIsError(true);
      return;
    }

    setLoadingAd(true);
    setIsError(false);

    try {
      const result = await adsgramController.show();
      
      // Validasi mutlak Adsgram: User sukses nonton iklan tanpa di-skip
      if (result && result.done === true) {
        setLoadingAd(false);
        onComplete(); // Buka gembok koin di kliker utama lu!
      } else {
        alert("⚠️ Overclock Sync Failed! You must watch the video until the end.");
        setLoadingAd(false);
      }
    } catch (err: any) {
      console.error("Adsgram error:", err);
      // Fallback aman jika iklan gak tersedia/jaringan lemot, biar user gak ngamuk game stuck
      if (err?.description === "No ads available") {
        alert("📡 Server Busy: No ads available right now. Emergency core unlocked!");
        onComplete();
      } else {
        setIsError(true);
        setLoadingAd(false);
      }
    }
  };

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
            {/* TAMPILAN ATAS: TOTAL EMAS TETEP UTUH */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,215,0,0.5)" }}
                >
                  Sponsored Content
                </p>
                <p
                  className="font-black text-lg"
                  style={{ color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.5)" }}
                >
                  Watch to Unlock Coin
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
                  ads
                </span>
              </div>
            </div>

            {/* STATUS BOX: Disederhanakan biar gak makan memori pas iklan streaming */}
            <div
              className="rounded-2xl flex flex-col items-center justify-center gap-2 mb-5 p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,215,0,0.1)",
                height: 120,
              }}
            >
              <p className="text-sm font-bold text-white/80">
                {loadingAd ? "⏳ Video Stream Active..." : "📡 Ready to Synchronize"}
              </p>
              <p className="text-[10px] text-center text-zinc-400 max-w-[200px] leading-tight">
                {loadingAd ? "Complete the ad video to unlock overclock." : "Tap Verify below to request advertisement data."}
              </p>
              {isError && (
                <p className="text-[10px] font-black text-red-500 uppercase animate-pulse mt-1">
                  ❌ Network Timeout. Try again.
                </p>
              )}
            </div>

            {/* TOMBOL AKSI BAWAAN LU */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loadingAd}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all bg-white/5 border border-white/10 text-white/40 disabled:opacity-30"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleWatchAd}
                disabled={loadingAd}
                className="flex-[2] py-3 rounded-2xl font-black text-sm transition-all"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                  border: "1px solid rgba(255,240,100,0.5)",
                  color: "#000",
                  boxShadow: "0 0 20px rgba(255,215,0,0.4)",
                  cursor: loadingAd ? "not-allowed" : "pointer",
                }}
              >
                {loadingAd ? "Processing..." : "Verify Coin Unlock"}
              </motion.button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}