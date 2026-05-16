// Di dalam AppProvider.tsx bagian useEffect:

useEffect(() => {
  let retryCount = 0;
  
  const fetchUserData = async () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.ready();
    
    const user = tg?.initDataUnsafe?.user;
    
    // Tunggu ID Telegram asli muncul, jangan langsung nyerah pake 12345
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
      // Panggil API dengan parameter lengkap biar backend bisa Upsert nama asli
      const firstName = encodeURIComponent(user.first_name || "Zetta Player");
      const username = user.username || "";
      const photo = encodeURIComponent(user.photo_url || "");
      
      const res = await fetch(`/api/user?telegramId=${tid}&firstName=${firstName}&username=${username}&photoUrl=${photo}`);
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