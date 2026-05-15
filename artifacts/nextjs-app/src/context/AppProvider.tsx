"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  coins: number;
  zp: Record<string, number>; 
  usdtBalance: number; // Sesuaikan dengan nama di DB: usdtBalance
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

  // Sync awal dengan Database
  useEffect(() => {
    const fetchUserData = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const tid = tg?.initDataUnsafe?.user?.id?.toString() || "12345"; // fallback dev

      try {
        const res = await fetch(`/api/user?telegramId=${tid}`);
        const data = await res.json();
        
        if (res.ok && !data.error) {
          setCoinsState(Number(data.coins || 0));
          setUsdtBalanceState(Number(data.usdtBalance || 0));
          
          // SINKRONISASI SEMUA KOLOM ZP SEKALIGUS
          setZpState({
            bronze: Number(data.zpBronze || 0),
            silver: Number(data.zpSilver || 0),
            gold: Number(data.zpGold || 0),
            diamond: Number(data.zpDiamond || 0),
          });

          // SINKRONISASI KUALIFIKASI ROOM
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
  }, []); // Cukup running sekali pas mount

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
        setQualifiedDiamond
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