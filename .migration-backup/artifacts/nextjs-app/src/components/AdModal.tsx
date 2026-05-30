"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdModalProps {
  open: boolean;
  adNumber: number;
  maxAds: number;
  onComplete: () => void;
  onClose: () => void;
}

export default function AdModal({ open, adNumber, maxAds, onComplete, onClose }: AdModalProps) {
  const [loadingAd, setLoadingAd] = useState(false);
  const [isError, setIsError] = useState(false);
  
  if (!open) return null;
  
  
  const handleWatchAd = () => {
    const windowObj = window as any;
    
    // Cek apakah SDK Adsgram sudah siap di browser
    if (!windowObj.Adsgram) {
      // Jika belum ada, suntik script secara instan (0.1 milidetik)
      setIsError(false);
      setLoadingAd(true);
      
      const script = document.createElement("script");
      script.src = "https://sad.adsgram.ai/js/sad.min.js";
      script.async = true;
      script.onload = () => {
        triggerAdsgram(windowObj.Adsgram);
      };
      script.onerror = () => {
        setIsError(true);
        setLoadingAd(false);
      };
      document.body.appendChild(script);
    } else {
      setIsError(false);
      setLoadingAd(true);
      triggerAdsgram(windowObj.Adsgram);
    }
  };
  
  // Eksekutor iklan murni
  const triggerAdsgram = async (adsgramInstance: any) => {
    try {
      const controller = adsgramInstance.init({ blockId: "30467" });
      const result = await controller.show();
      
      setLoadingAd(false);
      if (result && result.done === true) {
        onComplete(); // Sukses nonton -> cairkan +100 ZP
      } else {
        alert("⚠️ Overclock Sync Failed! You must watch the video until the end.");
      }
    } catch (err) {
      console.error("Adsgram Error:", err);
      setLoadingAd(false);
      // Fallback darurat aman biar user gak stuck pas iklan zonk
      alert("📡 Server Busy: Emergency core unlocked!");
      onComplete();
    }
  };
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-end justify-center overflow-hidden"
          style={{ backdropFilter: "blur(4px)" }}
        >
          {/* OVERLAY TUTUP */}
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={!loadingAd ? onClose : undefined}
            style={{ cursor: loadingAd ? "default" : "pointer" }}
          />
          
          {/* MODAL CARD */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md mx-auto rounded-t-3xl px-6 pt-6 pb-8 z-[10000]"
            style={{
              background: "linear-gradient(180deg, #0d0d1a 0%, #080810 100%)",
              border: "1.5px solid rgba(255,215,0,0.3)",
              borderBottom: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER EMAS LU */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-yellow-500/50">
                  Sponsored Content
                </p>
                <p className="font-black text-lg text-yellow-500">
                  Watch ad 📺
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20">
                <span className="text-xs font-bold text-yellow-500/70">{adNumber}/{maxAds}</span>
                <span className="text-xs text-white/30">ads</span>
              </div>
            </div>

            {/* STATUS BOX FLAT (ANTI-LOAD MEMORI) */}
            <div className="rounded-2xl flex flex-col items-center justify-center gap-1 mb-5 p-4 bg-white/5 border border-yellow-500/10 h-28">
              <p className="text-sm font-bold text-white/90">
                {loadingAd ? "⏳ Streaming Core Video..." : "📡 Connection Standby"}
              </p>
              <p className="text-[10px] text-center text-zinc-400 max-w-[220px] leading-tight">
                {loadingAd ? "Please maintain connection until stream completes." : "Tap Verify below to sync with the Adsgram network."}
              </p>
              {isError && (
                <p className="text-[10px] font-black text-red-500 uppercase animate-pulse mt-1">
                  ❌ Signal Lost. Try again.
                </p>
              )}
            </div>

            {/* GRUP TOMBOL FLAT STANDAR (0% BEBAN FRAMER-MOTION) */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loadingAd}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm bg-white/5 border border-white/10 text-white/40 active:scale-95 transition-transform disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleWatchAd}
                disabled={loadingAd}
                className="flex-[2] py-3 rounded-2xl font-black text-sm active:scale-95 transition-all text-black border border-yellow-400/50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #FFD700, #FF8C00)",
                  boxShadow: loadingAd ? "none" : "0 0 15px rgba(255,215,0,0.3)",
                  opacity: loadingAd ? 0.5 : 1
                }}
              >
                {loadingAd ? "Processing..." : "Verify watch ad"}
              </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
