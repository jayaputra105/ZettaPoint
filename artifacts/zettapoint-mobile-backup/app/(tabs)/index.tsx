import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { updateUserZP } from "@/lib/api";
import { getUserId } from "@/lib/storage";

const ROOMS = [
  { id: "bronze", label: "BRONZE", color: "#CD7F32", coins: "1 ZP/tap" },
  { id: "silver", label: "SILVER", color: "#C0C0C0", coins: "2 ZP/tap" },
  { id: "gold", label: "GOLD", color: "#FFD700", coins: "5 ZP/tap" },
  { id: "diamond", label: "DIAMOND", color: "#B9F2FF", coins: "10 ZP/tap" },
];

const ZP_PER_TAP: Record<string, number> = {
  bronze: 1, silver: 2, gold: 5, diamond: 10,
};
const COINS_PER_TAP = 10;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n?.toLocaleString() ?? "0";
}

function CoinBurst({ x, y }: { x: number; y: number }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withTiming(0, { duration: 800 });
    translateY.value = withTiming(-60, { duration: 800 });
    scale.value = withSequence(
      withTiming(1.4, { duration: 200 }),
      withTiming(0.8, { duration: 600 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.Text
      style={[{ position: "absolute", left: x - 20, top: y - 20, color: "#FFD700", fontFamily: "Inter_700Bold", fontSize: 18, zIndex: 999 }, style]}
    >
      +{COINS_PER_TAP}
    </Animated.Text>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, setCoins, zp, currentRoom, setCurrentRoom } = useApp();
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [syncing, setSyncing] = useState(false);
  const tapBufferRef = useRef({ coins: 0, zp: 0 });
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstIdRef = useRef(0);

  const coinScale = useSharedValue(1);
  const coinRotate = useSharedValue(0);

  const currentZp = zp[currentRoom] || 0;
  const zpPerTap = ZP_PER_TAP[currentRoom] || 1;
  const room = ROOMS.find((r) => r.id === currentRoom) || ROOMS[0];

  const syncToServer = useCallback(async () => {
    const { coins: c, zp: z } = tapBufferRef.current;
    if (c === 0 && z === 0) return;
    tapBufferRef.current = { coins: 0, zp: 0 };
    setSyncing(true);
    try {
      const tid = await getUserId();
      if (tid) await updateUserZP(tid, z, c, currentRoom);
    } catch (e) {
      console.warn("Sync failed:", e);
    } finally {
      setSyncing(false);
    }
  }, [currentRoom]);

  const handleTap = useCallback((evt: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setCoins(coins + COINS_PER_TAP);
    tapBufferRef.current.coins += COINS_PER_TAP;
    tapBufferRef.current.zp += zpPerTap;

    const { locationX, locationY } = evt.nativeEvent;
    const id = burstIdRef.current++;
    setBursts((prev) => [...prev.slice(-5), { id, x: locationX, y: locationY }]);

    coinScale.value = withSequence(
      withTiming(0.92, { duration: 80 }),
      withSpring(1, { damping: 5 })
    );
    coinRotate.value = withSequence(
      withTiming(-3, { duration: 60 }),
      withTiming(3, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(syncToServer, 2000);
  }, [coins, zpPerTap, syncToServer]);

  const coinAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: coinScale.value },
      { rotate: `${coinRotate.value}deg` },
    ],
  }));

  const s = styles(colors, insets);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.appTitle}>ZETTAPOINT</Text>
          <Text style={s.appSub}>TAP TO EARN</Text>
        </View>
        <View style={s.coinBadge}>
          <Ionicons name="flash" size={14} color="#FFD700" />
          <Text style={s.coinBadgeText}>{formatNumber(coins)}</Text>
        </View>
      </View>

      {/* Room selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.roomRow}
      >
        {ROOMS.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setCurrentRoom(r.id)}
            style={[s.roomChip, currentRoom === r.id && { borderColor: r.color, backgroundColor: r.color + "20" }]}
          >
            <Text style={[s.roomLabel, { color: currentRoom === r.id ? r.color : colors.mutedForeground }]}>
              {r.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ZP Badge */}
      <View style={s.zpRow}>
        <Text style={s.zpLabel}>ZP {room.label}</Text>
        <Text style={[s.zpValue, { color: room.color }]}>{formatNumber(currentZp)}</Text>
      </View>

      {/* Coin clicker */}
      <View style={s.clickerWrap}>
        <Pressable onPress={handleTap} style={s.coinOuter}>
          <Animated.View style={[s.coinInner, coinAnimStyle]}>
            <Ionicons name="trophy" size={80} color="#FFD700" />
          </Animated.View>
        </Pressable>
        {/* Bursts */}
        {bursts.map((b) => (
          <CoinBurst key={b.id} x={b.x} y={b.y} />
        ))}
      </View>

      <Text style={s.tapHint}>
        +{COINS_PER_TAP} coins · +{zpPerTap} ZP per tap
      </Text>

      {syncing && (
        <View style={s.syncRow}>
          <ActivityIndicator size="small" color={colors.mutedForeground} />
          <Text style={s.syncText}>Syncing...</Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </View>
  );
}

// @ts-ignore
const styles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    appTitle: {
      fontFamily: "Inter_700Bold",
      fontSize: 22,
      color: "#FFD700",
      letterSpacing: 2,
    },
    appSub: {
      fontFamily: "Inter_500Medium",
      fontSize: 9,
      color: "rgba(255,255,255,0.3)",
      letterSpacing: 3,
    },
    coinBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,215,0,0.1)",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "rgba(255,215,0,0.2)",
    },
    coinBadgeText: {
      fontFamily: "Inter_700Bold",
      fontSize: 14,
      color: "#FFD700",
    },
    roomRow: {
      paddingHorizontal: 20,
      gap: 8,
      paddingBottom: 16,
    },
    roomChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
      backgroundColor: "transparent",
    },
    roomLabel: {
      fontFamily: "Inter_700Bold",
      fontSize: 10,
      letterSpacing: 1.5,
    },
    zpRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 24,
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 18,
      backgroundColor: "rgba(255,255,255,0.03)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.06)",
    },
    zpLabel: {
      fontFamily: "Inter_700Bold",
      fontSize: 10,
      color: "rgba(255,255,255,0.3)",
      letterSpacing: 2,
    },
    zpValue: {
      fontFamily: "Inter_700Bold",
      fontSize: 22,
    },
    clickerWrap: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      position: "relative",
    },
    coinOuter: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: "rgba(255,215,0,0.08)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(255,215,0,0.2)",
    },
    coinInner: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: "rgba(255,215,0,0.12)",
      alignItems: "center",
      justifyContent: "center",
    },
    tapHint: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: "rgba(255,255,255,0.2)",
      textAlign: "center",
      letterSpacing: 1,
      marginBottom: 8,
    },
    syncRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 4,
    },
    syncText: {
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      color: "rgba(255,255,255,0.2)",
    },
  });
