import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";

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
  tasks: any[];
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [telegramId, setTelegramId] = useState<string | null>(null);
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [multiplierLevel, setMultiplierLevelState] = useState(0);
  const [autoClickEnabled, setAutoClickEnabledState] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxCache = useRef<Record<string, HTMLAudioElement>>({});

  const startBGM = () => {
    if (bgmRef.current) return;
    bgmRef.current = new Audio("/audio/bgm.mp3");
    bgmRef.current.loop = true;
    bgmRef.current.volume = 0.15;
    bgmRef.current.play().catch(() => {});
  };

  const playSFX = (type: "click" | "spin" | "win") => {
    if (!sfxCache.current[type]) {
      sfxCache.current[type] = new Audio(`/audio/${type}.mp3`);
    }
    const sfx = sfxCache.current[type];
    sfx.currentTime = 0;
    sfx.volume = 1.0;
    sfx.play().catch(() => {});
  };

  useEffect(() => {
    const handleFirstInteraction = () => {
      startBGM();
      ["click", "touchstart", "pointerdown"].forEach((e) =>
        window.removeEventListener(e, handleFirstInteraction)
      );
    };
    ["click", "touchstart", "pointerdown"].forEach((e) =>
      window.addEventListener(e, handleFirstInteraction)
    );
    const handleVisibility = () => {
      if (document.hidden) bgmRef.current?.pause();
      else bgmRef.current?.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      ["click", "touchstart", "pointerdown"].forEach((e) =>
        window.removeEventListener(e, handleFirstInteraction)
      );
      document.removeEventListener("visibilitychange", handleVisibility);
      bgmRef.current?.pause();
      bgmRef.current = null;
    };
  }, []);

  useEffect(() => {
    let retryCount = 0;

    const bootstrap = async () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) { tg.ready(); tg.expand(); }

      const user = tg?.initDataUnsafe?.user;
      if (!user?.id && retryCount < 10) {
        retryCount++;
        setTimeout(bootstrap, 500);
        return;
      }

      const tid = user?.id?.toString();
      if (!tid) {
        setLoading(false);
        setShowLoadingScreen(false);
        return;
      }

      setTelegramId(tid);

      const firstName = encodeURIComponent(user.first_name || "Zetta Player");
      const username = user.username || "";
      const photo = encodeURIComponent(user.photo_url || "");

      try {
        // Fetch all data in parallel
        const [profileRes, tasksRes, walletRes] = await Promise.all([
          fetch(`/api/user?telegramId=${tid}&firstName=${firstName}&username=${username}&photoUrl=${photo}`),
          fetch(`/api/tasks?telegramId=${tid}`),
          fetch(`/api/wallet?telegramId=${tid}`),
        ]);

        // Handle profile
        const profileData = await profileRes.json();
        if (profileRes.ok && !profileData.error) {
          setCoinsState(Number(profileData.coins || 0));
          setUsdtBalanceState(Number(profileData.usdtBalance || 0));
          setZpState({
            bronze: Number(profileData.zpBronze || 0),
            silver: Number(profileData.zpSilver || 0),
            gold: Number(profileData.zpGold || 0),
            diamond: Number(profileData.zpDiamond || 0),
          });
          setQualifiedSilver(!!profileData.qualifiedSilver);
          setQualifiedGold(!!profileData.qualifiedGold);
          setQualifiedDiamond(!!profileData.qualifiedDiamond);
          setTonWalletAddress(profileData.tonWalletAddress || null);
          setMultiplierLevelState(Number(profileData.multiplierLevel || 0));
          setAutoClickEnabledState(!!profileData.autoClickEnabled);

          // Referral
          const startParam: string | undefined = tg?.initDataUnsafe?.start_param;
          if (startParam?.startsWith("ref_") && profileData.referrerId === null) {
            const referrerTelegramId = startParam.replace("ref_", "");
            fetch("/api/referral", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ telegramId: tid, referrerTelegramId }),
            }).catch(() => {});
          }
        }
        setCompletedSteps((prev) => [...prev, "profile"]);

        // Handle tasks
        const tasksData = await tasksRes.json();
        if (tasksRes.ok && Array.isArray(tasksData)) {
          setTasks(tasksData);
        }
        setCompletedSteps((prev) => [...prev, "tasks"]);

        // Handle wallet/balance (already set from profile, just confirm)
        await walletRes.json();
        setCompletedSteps((prev) => [...prev, "balance"]);

      } catch (e) {
        console.error("Bootstrap error:", e);
        setCompletedSteps(["profile", "tasks", "balance"]);
      } finally {
        // Small delay so user sees all steps complete before fade-out
        setTimeout(() => {
          setLoading(false);
          setTimeout(() => setShowLoadingScreen(false), 550);
        }, 300);
      }
    };

    bootstrap();
  }, []);

  const setCoins = (val: number) => setCoinsState(val);
  const setUsdtBalance = (val: number) => setUsdtBalanceState(val);
  const setZp = (room: string, val: number) =>
    setZpState((prev) => ({ ...prev, [room]: val }));
  const setMultiplierLevel = (val: number) => setMultiplierLevelState(val);
  const setAutoClickEnabled = (val: boolean) => setAutoClickEnabledState(val);

  return (
    <AppContext.Provider
      value={{
        coins, zp, usdtBalance, currentRoom,
        qualifiedSilver, qualifiedGold, qualifiedDiamond,
        loading, telegramId, tonWalletAddress,
        multiplierLevel, autoClickEnabled, tasks,
        setCoins, setZp, setUsdtBalance, setCurrentRoom,
        setQualifiedSilver, setQualifiedGold, setQualifiedDiamond,
        setTonWalletAddress, setMultiplierLevel, setAutoClickEnabled,
        playSFX,
      }}
    >
      <LoadingScreen completedSteps={completedSteps} visible={showLoadingScreen} />
      {!loading && children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
