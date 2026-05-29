"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

  // 🌟 AUDIO LOGIC ENGINE (BGM & SFX)
  const startBGM = () => {
    if (typeof window === "undefined" || bgmAudio) return;
    
    bgmAudio = new Audio("/audio/bgm.mp3");
    bgmAudio.loop = true;
    bgmAudio.volume = 0.15; // Setel sayup-sayup pelan biar gak budek di HP player
    bgmAudio.play().catch((err) => {
      console.log("Autoplay diblokir browser, nunggu interaksi klik pertama:", err);
    });
  };

  const playSFX = (type: "click" | "spin" | "win") => {
    if (typeof window === "undefined") return;
    const sfx = new Audio(`/audio/${type}.mp3`);
    
    // Atur volume masing-masing sfx biar seimbang
    if (type === "spin") sfx.volume = 1.5;
    else if (type === "win") sfx.volume = 1.5;
    else sfx.volume = 3; // click volume

    sfx.play().catch(() => {});
  };

  // Trigger BGM setelah user menyentuh layar pertama kali (Syarat mutlak Telegram WebApp)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleFirstInteraction = () => {
        startBGM();
        window.removeEventListener("click", handleFirstInteraction);
        window.removeEventListener("touchstart", handleFirstInteraction);
      };
      
      window.addEventListener("click", handleFirstInteraction);
      window.addEventListener("touchstart", handleFirstInteraction);
      
      return () => {
        window.removeEventListener("click", handleFirstInteraction);
        window.removeEventListener("touchstart", handleFirstInteraction);
      };
    }
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