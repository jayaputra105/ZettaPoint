import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from "@/lib/api";
import { getUserId, getUserName, isOnboarded } from "@/lib/storage";

interface AppUser {
  id: number;
  telegramId: string;
  name: string;
  username: string;
  avatar: string;
  coins: number;
  usdtBalance: number;
  zpBronze: number;
  zpSilver: number;
  zpGold: number;
  zpDiamond: number;
  tonWalletAddress: string | null;
  streakDays: number;
  referrerId: number | null;
}

interface AppContextType {
  user: AppUser | null;
  loading: boolean;
  onboarded: boolean;
  currentRoom: string;
  coins: number;
  usdtBalance: number;
  zp: Record<string, number>;
  tonWalletAddress: string | null;
  setCoins: (n: number) => void;
  setUsdtBalance: (n: number) => void;
  setCurrentRoom: (r: string) => void;
  setTonWalletAddress: (addr: string | null) => void;
  setOnboarded: (v: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboardedState] = useState(false);
  const [currentRoom, setCurrentRoomState] = useState("bronze");
  const [coins, setCoinsState] = useState(0);
  const [usdtBalance, setUsdtBalanceState] = useState(0);
  const [tonWalletAddress, setTonWalletAddressState] = useState<string | null>(null);
  const [zp, setZp] = useState<Record<string, number>>({ bronze: 0, silver: 0, gold: 0, diamond: 0 });

  const refreshUser = useCallback(async () => {
    const tid = await getUserId();
    const name = await getUserName();
    if (!tid) { setLoading(false); return; }
    try {
      const data = await getUser({ telegramId: tid, firstName: name || "Mobile Player" });
      setUser(data);
      setCoinsState(Number(data.coins || 0));
      setUsdtBalanceState(Number(data.usdtBalance || 0));
      setTonWalletAddressState(data.tonWalletAddress || null);
      setZp({
        bronze: Number(data.zpBronze || 0),
        silver: Number(data.zpSilver || 0),
        gold: Number(data.zpGold || 0),
        diamond: Number(data.zpDiamond || 0),
      });
    } catch (e) {
      console.error("User fetch error:", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const [ob, room] = await Promise.all([
        isOnboarded(),
        AsyncStorage.getItem("zp_current_room"),
      ]);
      setOnboardedState(ob);
      if (room) setCurrentRoomState(room);
      if (ob) await refreshUser();
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  const setOnboarded = (v: boolean) => setOnboardedState(v);
  const setCoins = (n: number) => setCoinsState(n);
  const setUsdtBalance = (n: number) => setUsdtBalanceState(n);
  const setCurrentRoom = (r: string) => {
    setCurrentRoomState(r);
    AsyncStorage.setItem("zp_current_room", r);
  };
  const setTonWalletAddress = (addr: string | null) => setTonWalletAddressState(addr);

  return (
    <AppContext.Provider
      value={{
        user, loading, onboarded, currentRoom, coins, usdtBalance, zp, tonWalletAddress,
        setCoins, setUsdtBalance, setCurrentRoom, setTonWalletAddress, setOnboarded, refreshUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
