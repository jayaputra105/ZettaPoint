import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface AppContextType {
  coins: number;
  zp: Record<string, number>;
  usdtBalance: number;
  currentRoom: string;
  qualifiedSilver: boolean;
  qualifiedGold: boolean;
  qualifiedDiamond: boolean;
  loading: boolean;
  telegramId: string | null;
  tonWalletAddress: string | null;
  multiplierLevel: number;
  autoClickEnabled: boolean;
  setCoins: (val: number) => void;
  setZp: (room: string, val: number) => void;
  setUsdtBalance: (val: number) => void;
  setCurrentRoom: (room: string) => void;
  setQualifiedSilver: (val: boolean) => void;
  setQualifiedGold: (val: boolean) => void;
  setQualifiedDiamond: (val: boolean) => void;
  setTonWalletAddress: (addr: string | null) => void;
  setMultiplierLevel: (val: number) => void;
  setAutoClickEnabled: (val: boolean) => void;
  playSFX: (type: "click" | "spin" | "win") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoinsState] = useState(0);
  const [zp, setZpState] = useState<Record<string, number>>({
    bronze: 0, silver: 0, gold: 0, diamond: 0,
  });
  const [usdtBalance, setUsdtBalanceState] = useState(0);
  const [currentRoom, setCurrentRoom] = useState("bronze");
  const [qualifiedSilver, setQualifiedSilver] = useState(false);
  const [qualifiedGold, setQualifiedGold] = useState(false);
  const [qualifiedDiamond, setQualifiedDiamond] = useState(false);
  const [loading, setLoading] = useState(true);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [multiplierLevel, setMultiplierLevelState] = useState(0);
  const [autoClickEnabled, setAutoClickEnabledState] = useState(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxCache = useRef<Record<string, HTMLAudioElement>>({});

  const startBGM = () => {
    if (bgmRef.current) return;
    bgmRef.current = new Audio("/audio/bgm.mp3");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.15;
    bgmRef.current.play().catch((err) => console.log("BGM blocked:", err));
  };

  const playSFX = (type: "click" | "spin" | "win") => {
    if (!sfxCache.current[type]) {
      sfxCache.current[type] = new Audio(`/audio/${type}.mp3`);
    }
    const sfx = sfxCache.current[type];
    sfx.currentTime = 0;
    sfx.volume = 1.0;
    sfx.play().catch((err) => console.error("SFX Error:", err));
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      startBGM();
      ["click", "touchstart", "pointerdown"].forEach((event) =>
        window.removeEventListener(event, handleFirstInteraction)
      );
    };
    ["click", "touchstart", "pointerdown"].forEach((event) =>
      window.addEventListener(event, handleFirstInteraction)
    );

    const handleVisibilityChange = () => {
      if (document.hidden) {
        bgmRef.current?.pause();
      } else {
        if (bgmRef.current) bgmRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      ["click", "touchstart", "pointerdown"].forEach((event) =>
        window.removeEventListener(event, handleFirstInteraction)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let retryCount = 0;

    const fetchUserData = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }

      const user = tg?.initDataUnsafe?.user;

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

      setTelegramId(tid);

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
          setTonWalletAddress(data.tonWalletAddress || null);
          setMultiplierLevelState(Number(data.multiplierLevel || 0));
          setAutoClickEnabledState(!!data.autoClickEnabled);

          const startParam: string | undefined = tg?.initDataUnsafe?.start_param;
          if (startParam?.startsWith("ref_") && data.referrerId === null) {
            const referrerTelegramId = startParam.replace("ref_", "");
            fetch("/api/referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ telegramId: tid, referrerTelegramId }),
            }).catch((e) => console.warn("Referral processing failed:", e));
          }
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
  const setMultiplierLevel = (val: number) => setMultiplierLevelState(val);
  const setAutoClickEnabled = (val: boolean) => setAutoClickEnabledState(val);

  return (
    <AppContext.Provider
      value={{
        coins, zp, usdtBalance, currentRoom,
        qualifiedSilver, qualifiedGold, qualifiedDiamond, loading,
        telegramId, tonWalletAddress,
        multiplierLevel, autoClickEnabled,
        setCoins, setZp, setUsdtBalance, setCurrentRoom,
        setQualifiedSilver, setQualifiedGold, setQualifiedDiamond,
        setTonWalletAddress,
        setMultiplierLevel, setAutoClickEnabled,
        playSFX,
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
