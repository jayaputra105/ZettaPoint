"use client";

import { useState, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";

interface Particle {
  id: number;
  targetX: number;
  targetY: number;
}

interface CosmicCoinProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  locked: boolean;
  needsAd: boolean;
  children: React.ReactNode; // Tempat naruh bodi koin ORI lu
}

export default function CosmicCoin({ onClick, locked, needsAd, children }: CosmicCoinProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showBlackhole, setShowBlackhole] = useState(false);

  // Controls buat nge-drive timeline animasi sekuensial (pake async/await)
  const coinControls = useAnimationControls();
  const blackholeControls = useAnimationControls();

  const handleTriggerAnimasi = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Kalau dikunci atau lagi proses animasi sinematik, gak bisa diklik double
    if (locked || isAnimating) return;

    setIsAnimating(true);

    // 1. IMPACT MUNDUR DIKIT (Instan & Bertenaga)
    await coinControls.start({
      scale: 0.82,
      transition: { duration: 0.08, ease: "easeOut" }
    });

    // 2. LEMPAR MAJU KE ATAS LAYAR (Membesar Ekstrem)
    await coinControls.start({
      scale: 1.6,
      opacity: [1, 1, 0], // Di akhir lemparan langsung lenyap boom!
      transition: { duration: 0.25, ease: "backOut" }
    });

    // 3. THE GOLDEN BOOM (Generate partikel pecahan koin)
    const generatedParticles = Array.from({ length: 20 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 90 + 50; // Jarak muncratan pecahan
      return {
        id: i,
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance - 40, // Agak melosor ke atas
      };
    });
    setParticles(generatedParticles);

    // 4. FREEZE TIME (Partikel diam membeku di udara beberapa milidetik)
    await new Promise((resolve) => setTimeout(resolve, 400));

    // 5. BLACKHOLE RISING (Muncul melintir kencang dari titik nol kecil)
    setShowBlackhole(true);
    // Gak usah ditunggu await, biar munculnya barengan sama tarikan partikel
    blackholeControls.start({
      scale: [0, 1.1, 1],
      rotate: [0, -720],
      transition: { duration: 0.6, ease: "anticipate" }
    });

    // Jeda dikit biar blackhole-nya mapan ngebuka dulu
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 6. THE COSMIC SUCTION (Partikel ketarik masuk spiral sampai habis)
    // Diatur lewat stagger di f-m, kita tunggu durasi sedotannya kelar (800ms)
    await new Promise((resolve) => setTimeout(resolve, 800));
    setParticles([]); // Bersihkan pecahan karena udah ketelan habis

    // 7. CALM BEFORE STORM (Diem tenang dulu nahan energi beberapa milidetik)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 8. HIGH FREQUENCY GETAR (Blackhole overload muatan energi)
    await blackholeControls.start({
      x: [-3, 3, -4, 4, -2, 2, 0],
      y: [2, -2, 3, -3, 1, -1, 0],
      scale: 1.15,
      transition: { duration: 0.4, ease: "linear" }
    });

    // 9. BOOM COIN RE-BIRTH FLIP (Koin melesat keluar, nge-flip 3D, balik rumah)
    setShowBlackhole(false); // Blackhole lenyap kesapu ledakan koin
    
    // Trigger callback onClick ORI bawaan lu DI SINI (State points/needsAd baru berubah di detik ke-5 ini)
    onClick(e);

    await coinControls.start({
      opacity: 1,
      scale: [1.4, 1],
      rotateY: [0, 720], // Efek Coin Flip 3D horizontal pada sumbu Y mewah
      transition: { 
        duration: 0.75, 
        ease: "circOut",
        rotateY: { type: "spring", stiffness: 180, damping: 12 } 
      }
    });

    setIsAnimating(false);
  };

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]">
      
      {/* WRAPPER KOIN UTAMA LU */}
      <motion.button
        animate={coinControls}
        onClick={handleTriggerAnimasi}
        className="absolute z-30 outline-none select-none bg-transparent border-none p-0 cursor-pointer"
        style={{ WebkitTapHighlightColor: "transparent" }}
        disabled={isAnimating && !locked} // Kunci tombol pas animasi kosmik lagi jalan
      >
        {/* Supaya floating mengambang bawaan koin lu mati pas animasi kosmik */}
        <div style={{ animation: isAnimating ? "none" : undefined }}>
          {children}
        </div>
      </motion.button>

      {/* 🌌 LAYER PARTIKEL PECAHAN EMAS (Freeze -> Sedot) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={
            showBlackhole 
              ? { 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  opacity: 0,
                  rotate: 360,
                  transition: { duration: 0.6, ease: "anticipate" } 
                }
              : { 
                  x: p.targetX, 
                  y: p.targetY, 
                  scale: Math.random() * 0.6 + 0.5,
                  transition: { type: "spring", stiffness: 120, damping: 10 } 
                }
          }
          className="absolute w-3 h-3 rounded-md z-40 bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600 shadow-[0_0_8px_#ffd700]"
        />
      ))}

      {/* 🌀 LAYER BLACKHOLE COSMIC (Quantum Vortex) */}
      {showBlackhole && (
        <motion.div
          animate={blackholeControls}
          className="absolute w-[140px] h-[140px] rounded-full z-20 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, #000000 40%, #1e0b36 70%, #ffd700 95%, transparent 100%)",
            boxShadow: "0 0 45px 10px rgba(147, 51, 234, 0.45), inset 0 0 25px #000",
          }}
        >
          {/* Efek Garis Pusaran Internal Blackhole */}
          <div className="absolute inset-2 rounded-full animate-spin [animation-duration:1.5s]" style={{
            border: "2px dashed rgba(255, 215, 0, 0.25)",
            filter: "blur(0.5px)"
          }} />
          <div className="w-10 h-10 rounded-full bg-black shadow-[0_0_20px_#000]" />
        </motion.div>
      )}

    </div>
  );
}