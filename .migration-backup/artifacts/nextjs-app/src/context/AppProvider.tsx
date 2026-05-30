"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

// 🌟 Instance global di luar component biar gak ke-recreate tiap kali state berubah
let bgmAudio: HTMLAudioElement | null = null;

interface AppContextType {
  coins: number;
  zp: Record<string, number>;
  usdtBalance: number;
  currentRoom: string;
  qualifiedSilver: boolean;
  qualifiedGold: boolean;
  qualifiedDiamond: boolean;
  loading: boolean;
  setCoins: (val: number) => void;
  setZp: (room: string, val: number) => void;
  setUsdtBalance: (val: number) => void;
  setCurrentRoom: (room: string) => void;
  setQualifiedSilver: (val: boolean) => void;
  setQualifiedGold: (val: boolean) => void;
  setQualifiedDiamond: (val: boolean) => void;
  playSFX: (type: "click" | "spin" | "win") => void; // 🌟 Daftarkan fungsi audio global di interface
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoinsState] = useState(0);
  const [zp, setZpState] = useState<Record<string, number>>({
    bronze: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
  });
  const [usdtBalance, setUsdtBalanceState] = useState(0);
  const [currentRoom, setCurrentRoom] = useState("bronze");
  const [qualifiedSilver, setQualifiedSilver] = useState(false);
  const [qualifiedGold, setQualifiedGold] = useState(false);
  const [qualifiedDiamond, setQualifiedDiamond] = useState(false);
  const [loading, setLoading] = useState(true);


const bgmRef = useRef<HTMLAudioElement | null>(null);
const sfxCache = useRef<Record<string, HTMLAudioElement>>({});

const startBGM = () => {
  if (typeof window === "undefined" || bgmRef.current) return;
  
  bgmRef.current = new Audio("/audio/bgm.mp3");
  bgmRef.current.loop = true;
  bgmRef.current.volume = 0.15;
  bgmRef.current.play().catch((err) => console.log("BGM blocked:", err));
};

const playSFX = (type: "click" | "spin" | "win") => {
  if (typeof window === "undefined") return;

  // Cek apakah sfx sudah di-load, kalau belum baru bikin baru
  if (!sfxCache.current[type]) {
    sfxCache.current[type] = new Audio(`/audio/${type}.mp3`);
  }
  
  const sfx = sfxCache.current[type];
  sfx.currentTime = 0; // Reset ke awal agar bisa di-spam klik
  sfx.volume = 1.0;
  sfx.play().catch((err) => console.error("SFX Error:", err));
};

useEffect(() => {
  if (typeof window === "undefined") return;

  // 1. Logic buat handle interaksi pertama (Telegram WebApp)
  const handleFirstInteraction = () => {
    startBGM();
    ["click", "touchstart", "pointerdown"].forEach(event => 
      window.removeEventListener(event, handleFirstInteraction)
    );
  };

  ["click", "touchstart", "pointerdown"].forEach(event => 
    window.addEventListener(event, handleFirstInteraction)
  );

  // 2. Logic buat stop/resume BGM pas minimize
  const handleVisibilityChange = () => {
    if (document.hidden) {
      bgmRef.current?.pause();
    } else {
      // Resume hanya kalau BGM memang sudah pernah jalan
      if (bgmRef.current) bgmRef.current.play().catch(() => {});
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    ["click", "touchstart", "pointerdown"].forEach(event => 
      window.removeEventListener(event, handleFirstInteraction)
    );
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    
    // Stop BGM kalau komponen unmount (misal refresh)
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }
  };
}, []);
  // INITIAL DATA SYNC TELEGRAM (Bawaan lu dijaga ketat)
  useEffect(() => {
    let retryCount = 0;

    const fetchUserData = async () => {
      if (typeof window === "undefined") return;
      
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      const user = tg?.initDataUnsafe?.user;

      // Tunggu ID Telegram asli (Retry up to 5 seconds)
      if (!user?.id && retryCount < 10) {
        retryCount++;
        setTimeout(fetchUserData, 500);
        return;
      }

      const tid = user?.id?.toString();
      if (!tid) {
        setLoading(false);
        return;
      }

      try {
        const firstName = encodeURIComponent(user.first_name || "Zetta Player");
        const username = user.username || "";
        const photo = encodeURIComponent(user.photo_url || "");

        const res = await fetch(
          `/api/user?telegramId=${tid}&firstName=${firstName}&username=${username}&photoUrl=${photo}`
        );
        const data = await res.json();

        if (res.ok && !data.error) {
          setCoinsState(Number(data.coins || 0));
          setUsdtBalanceState(Number(data.usdtBalance || 0));
          setZpState({
            bronze: Number(data.zpBronze || 0),
            silver: Number(data.zpSilver || 0),
            gold: Number(data.zpGold || 0),
            diamond: Number(data.zpDiamond || 0),
          });
          setQualifiedSilver(!!data.qualifiedSilver);
          setQualifiedGold(!!data.qualifiedGold);
          setQualifiedDiamond(!!data.qualifiedDiamond);
        }
      } catch (e) {
        console.error("Initial Sync Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const setCoins = (val: number) => setCoinsState(val);
  const setUsdtBalance = (val: number) => setUsdtBalanceState(val);
  const setZp = (room: string, val: number) => {
    setZpState((prev) => ({ ...prev, [room]: val }));
  };

  return (
    <AppContext.Provider
      value={{
        coins,
        zp,
        usdtBalance,
        currentRoom,
        qualifiedSilver,
        qualifiedGold,
        qualifiedDiamond,
        loading,
        setCoins,
        setZp,
        setUsdtBalance,
        setCurrentRoom,
        setQualifiedSilver,
        setQualifiedGold,
        setQualifiedDiamond,
        playSFX, // 🌟 Bagikan fungsi audio ke seluruh halaman & komponen
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};