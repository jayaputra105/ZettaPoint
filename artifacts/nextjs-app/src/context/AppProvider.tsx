"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  coins: number;
  // ZP dipisah per Room (Logic sinkron dengan database ZP kolom utama)
  zp: Record<string, number>; 
  usdt: number;
  currentRoom: string;
  // Status Kualifikasi (Hasil dari Reset Global/Top 150)
  qualifiedSilver: boolean;
  qualifiedGold: boolean;
  qualifiedDiamond: boolean;
  loading: boolean;
  setCoins: (val: number) => void;
  setZp: (room: string, val: number) => void;
  setUsdt: (val: number) => void;
  setCurrentRoom: (room: string) => void;
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
  const [usdt, setUsdtState] = useState(0);
  const [currentRoom, setCurrentRoom] = useState("bronze");
  const [qualifiedSilver, setQualifiedSilver] = useState(false);
  const [qualifiedGold, setQualifiedGold] = useState(false);
  const [qualifiedDiamond, setQualifiedDiamond] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync dengan Database pas aplikasi dibuka
  useEffect(() => {
    const fetchUserData = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const tid = tg?.initDataUnsafe?.user?.id?.toString();

      if (tid) {
        try {
          const res = await fetch(`/api/user?telegramId=${tid}`);
          const data = await res.json();
          if (res.ok) {
            setCoinsState(data.coins || 0);
            setUsdtState(data.usdtBalance || 0);
            // Sementara mapping ZP dari database ke room yang aktif
            setZpState((prev) => ({ ...prev, [currentRoom]: data.zp || 0 }));
            setQualifiedSilver(data.qualifiedSilver || false);
            setQualifiedGold(data.qualifiedGold || false);
            setQualifiedDiamond(data.qualifiedDiamond || false);
          }
        } catch (e) {
          console.error("Sync Error:", e);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [currentRoom]); // Re-fetch kalau pindah room buat sinkron data ZP

  const setCoins = (val: number) => setCoinsState(val);
  const setUsdt = (val: number) => setUsdtState(val);
  const setZp = (room: string, val: number) => {
    setZpState((prev) => ({ ...prev, [room]: val }));
  };

  return (
    <AppContext.Provider
      value={{
        coins,
        zp,
        usdt,
        currentRoom,
        qualifiedSilver,
        qualifiedGold,
        qualifiedDiamond,
        loading,
        setCoins,
        setZp,
        setUsdt,
        setCurrentRoom,
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