import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Svg, { Path, G, Text as SvgText } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getSpinState, doSpin } from "@/lib/api";
import { getUserId } from "@/lib/storage";

const SEGMENTS = [
  { label: "50", color: "#ef4444", textColor: "#fff", type: "coins" },
  { label: "150", color: "#3b82f6", textColor: "#fff", type: "coins" },
  { label: "300", color: "#a855f7", textColor: "#fff", type: "coins" },
  { label: "500", color: "#eab308", textColor: "#000", type: "coins" },
  { label: "1000", color: "#f97316", textColor: "#fff", type: "coins" },
  { label: "1 USDT", color: "#22c55e", textColor: "#fff", type: "usdt" },
  { label: "5 USDT", color: "#ec4899", textColor: "#fff", type: "usdt" },
  { label: "25 USDT", color: "#ffd700", textColor: "#000", type: "usdt" },
  { label: "1 USDT", color: "#22c55e", textColor: "#fff", type: "usdt" },
  { label: "1000", color: "#f97316", textColor: "#fff", type: "coins" },
  { label: "500", color: "#eab308", textColor: "#000", type: "coins" },
  { label: "300", color: "#a855f7", textColor: "#fff", type: "coins" },
];

const NUM_SEG = SEGMENTS.length;
const SEG_ANGLE = 360 / NUM_SEG;
const WHEEL_SIZE = 300;
const RADIUS = WHEEL_SIZE / 2;
const INNER_RADIUS = 30;

function getSegmentPath(index: number, total: number, r: number, innerR: number) {
  const startAngle = (index * 360) / total - 90;
  const endAngle = ((index + 1) * 360) / total - 90;
  const s = startAngle * (Math.PI / 180);
  const e = endAngle * (Math.PI / 180);
  const x1 = r + r * Math.cos(s);
  const y1 = r + r * Math.sin(s);
  const x2 = r + r * Math.cos(e);
  const y2 = r + r * Math.sin(e);
  const ix1 = r + innerR * Math.cos(s);
  const iy1 = r + innerR * Math.sin(s);
  const ix2 = r + innerR * Math.cos(e);
  const iy2 = r + innerR * Math.sin(e);
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
}

function getLabelPosition(index: number, total: number, r: number) {
  const angle = ((index + 0.5) * 360) / total - 90;
  const rad = angle * (Math.PI / 180);
  const dist = r * 0.68;
  return {
    x: r + dist * Math.cos(rad),
    y: r + dist * Math.sin(rad),
    angle: angle + 90,
  };
}

function formatCountdown(ms: number): string {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SpinScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, setCoins, setUsdtBalance, usdtBalance } = useApp();

  const [spinState, setSpinState] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState<any>(null);
  const [now, setNow] = useState(Date.now());

  const rotation = useSharedValue(0);
  const totalRotationRef = useRef(0);

  useEffect(() => {
    loadSpinState();
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadSpinState = async () => {
    try {
      const tid = await getUserId();
      if (!tid) return;
      const data = await getSpinState(tid);
      setSpinState(data);
    } catch (e) {
      console.error("Spin state error:", e);
    }
  };

  const canFreeSpin = () => {
    if (!spinState?.lastFreeSpinAt) return true;
    return now - new Date(spinState.lastFreeSpinAt).getTime() >= 24 * 60 * 60 * 1000;
  };

  const freeSpinCooldownMs = () => {
    if (!spinState?.lastFreeSpinAt) return 0;
    return 24 * 60 * 60 * 1000 - (now - new Date(spinState.lastFreeSpinAt).getTime());
  };

  const handleSpin = async (type: "free" | "ads") => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLastPrize(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const tid = await getUserId();
      if (!tid) throw new Error("No user");
      const data = await doSpin(tid, type);

      const targetIndex = data.segmentIndex ?? 0;
      const targetAngle = targetIndex * SEG_ANGLE;
      const spins = 5 * 360 + (360 - targetAngle);
      const newTotal = totalRotationRef.current + spins;
      totalRotationRef.current = newTotal;

      rotation.value = withTiming(newTotal, {
        duration: 3000,
        easing: Easing.out(Easing.cubic),
      }, (done) => {
        if (done) {
          runOnJS(onSpinEnd)(data);
        }
      });
    } catch (e: any) {
      setIsSpinning(false);
      Alert.alert("Spin failed", e?.message || "Try again");
    }
  };

  const onSpinEnd = (data: any) => {
    setLastPrize(data);
    setIsSpinning(false);
    if (data.coinsWon > 0) setCoins(coins + data.coinsWon);
    if (data.usdtWon > 0) setUsdtBalance(usdtBalance + data.usdtWon);
    loadSpinState();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = styles(colors, insets);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>LUCKY SPIN</Text>
        <Text style={s.subtitle}>Try your luck daily</Text>
      </View>

      {/* Wheel */}
      <View style={s.wheelSection}>
        {/* Pointer */}
        <View style={s.pointer}>
          <Ionicons name="caret-down" size={24} color="#FFD700" />
        </View>

        <Animated.View style={[{ width: WHEEL_SIZE, height: WHEEL_SIZE }, wheelStyle]}>
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
            {SEGMENTS.map((seg, i) => {
              const lp = getLabelPosition(i, NUM_SEG, RADIUS);
              const path = getSegmentPath(i, NUM_SEG, RADIUS, INNER_RADIUS);
              return (
                <G key={i}>
                  <Path d={path} fill={seg.color} stroke="#000" strokeWidth={1} />
                  <SvgText
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={seg.textColor}
                    fontSize={seg.label.length > 4 ? 7 : 9}
                    fontWeight="bold"
                    transform={`rotate(${lp.angle}, ${lp.x}, ${lp.y})`}
                  >
                    {seg.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </View>

      {/* Prize display */}
      {lastPrize && (
        <View style={s.prizeBox}>
          <Text style={s.prizeEmoji}>🎉</Text>
          <Text style={s.prizeText}>
            {lastPrize.coinsWon > 0 ? `+${lastPrize.coinsWon} Coins!` : ""}
            {lastPrize.usdtWon > 0 ? `+${lastPrize.usdtWon} USDT!` : ""}
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View style={s.buttonSection}>
        {canFreeSpin() ? (
          <Pressable
            style={({ pressed }) => [s.spinBtn, isSpinning && s.spinBtnDisabled, pressed && { opacity: 0.85 }]}
            onPress={() => handleSpin("free")}
            disabled={isSpinning}
          >
            <Ionicons name="flash" size={20} color="#000" />
            <Text style={s.spinBtnText}>{isSpinning ? "SPINNING..." : "FREE SPIN"}</Text>
          </Pressable>
        ) : (
          <View style={s.cooldownBox}>
            <Ionicons name="time-outline" size={18} color={colors.mutedForeground} />
            <Text style={s.cooldownText}>Next free spin in</Text>
            <Text style={s.cooldownTimer}>{formatCountdown(freeSpinCooldownMs())}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [s.adBtn, isSpinning && s.spinBtnDisabled, pressed && { opacity: 0.85 }]}
          onPress={() => handleSpin("ads")}
          disabled={isSpinning}
        >
          <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
          <Text style={s.adBtnText}>SPIN WITH AD</Text>
        </Pressable>
      </View>

      <View style={{ height: 100 }} />
    </View>
  );
}

// @ts-ignore
const styles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 24, marginBottom: 12 },
    title: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      color: "#FFD700",
      letterSpacing: 2,
    },
    subtitle: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: "rgba(255,255,255,0.3)",
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    wheelSection: {
      alignItems: "center",
      marginBottom: 12,
      position: "relative",
    },
    pointer: {
      position: "absolute",
      top: -12,
      zIndex: 10,
    },
    prizeBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: 24,
      padding: 16,
      backgroundColor: "rgba(255,215,0,0.1)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255,215,0,0.3)",
      marginBottom: 16,
    },
    prizeEmoji: { fontSize: 20 },
    prizeText: {
      fontFamily: "Inter_700Bold",
      fontSize: 18,
      color: "#FFD700",
    },
    buttonSection: {
      paddingHorizontal: 24,
      gap: 12,
    },
    spinBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "#FFD700",
      borderRadius: 18,
      paddingVertical: 18,
    },
    spinBtnDisabled: { opacity: 0.5 },
    spinBtnText: {
      fontFamily: "Inter_700Bold",
      fontSize: 14,
      color: "#000",
      letterSpacing: 1.5,
    },
    cooldownBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 18,
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cooldownText: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: colors.mutedForeground,
    },
    cooldownTimer: {
      fontFamily: "Inter_700Bold",
      fontSize: 14,
      color: colors.foreground,
    },
    adBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: "rgba(255,215,0,0.08)",
      borderRadius: 18,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: "rgba(255,215,0,0.2)",
    },
    adBtnText: {
      fontFamily: "Inter_700Bold",
      fontSize: 13,
      color: "#FFD700",
      letterSpacing: 1.5,
    },
  });
