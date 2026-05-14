"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Struktur data utama sesuai rencana kita
interface AppContextType {
  coins: number;
  zp: Record<string, number>; // ZP dipisah per Room (e.g., { bronze: 500, silver: 0 })
  usdt: number;
  currentRoom: string;
  setCoins: (val: number) => void;
  setZp: (room: string, val: number) => void;
  setUsdt: (val: number) => void;
  setCurrentRoom: (room: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // State utama
  const [coins, setCoinsState] = useState(0);
  const [zp, setZpState] = useState<Record<string, number>>({
    bronze: 0,
    silver: 0,
    gold: 0,
    diamond: 0,
  });
  const [usdt, setUsdtState] = useState(0);
  const [currentRoom, setCurrentRoom] = useState("bronze");

  // Fungsi updater
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