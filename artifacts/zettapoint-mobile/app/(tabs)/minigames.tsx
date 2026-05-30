import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const FEATURED = [
  { id: 1, tag: "ACTION", emoji: "🎯", color: "#4C1D95", border: "rgba(167,139,250,0.2)" },
  { id: 2, tag: "PUZZLE", emoji: "🧩", color: "#1E3A5F", border: "rgba(96,165,250,0.2)" },
  { id: 3, tag: "ARCADE", emoji: "🕹️", color: "#4A0D67", border: "rgba(236,72,153,0.2)" },
  { id: 4, tag: "RACING", emoji: "🏎️", color: "#4A2C04", border: "rgba(251,191,36,0.2)" },
];

const GRID = [
  { id: 5, tag: "RPG", emoji: "⚔️" },
  { id: 6, tag: "CLICKER", emoji: "👆" },
  { id: 7, tag: "SHOOTER", emoji: "🔫" },
  { id: 8, tag: "TOWER", emoji: "🏰" },
  { id: 9, tag: "MATCH-3", emoji: "💎" },
  { id: 10, tag: "BATTLE", emoji: "🥊" },
  { id: 11, tag: "CARD", emoji: "🃏" },
  { id: 12, tag: "CASINO", emoji: "🎲" },
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function MinigamesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[s.container, { paddingTop: topPad }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <Text style={s.title}>MINIGAMES</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>ARCADE ZONE</Text>
        </View>
      </View>

      <Text style={s.sectionLabel}>⭐  FEATURED</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.featuredScroll}
        style={s.featuredContainer}
      >
        {FEATURED.map((item) => (
          <View key={item.id} style={[s.featuredCard, { backgroundColor: item.color, borderColor: item.border }]}>
            <Text style={s.featuredEmoji}>{item.emoji}</Text>
            <Text style={s.featuredTag}>{item.tag}</Text>
            <View style={s.soonBadge}>
              <Text style={s.soonText}>SOON</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Text style={[s.sectionLabel, { marginTop: 24 }]}>🎮  ALL GAMES</Text>
      {chunk(GRID, 2).map((pair, rowIdx) => (
        <View key={rowIdx} style={s.gridRow}>
          {pair.map((item) => (
            <View key={item.id} style={s.gridCard}>
              <Text style={s.gridEmoji}>{item.emoji}</Text>
              <Text style={s.gridTag}>{item.tag}</Text>
              <Text style={s.gridSoon}>Coming Soon</Text>
            </View>
          ))}
          {pair.length < 2 && <View style={[s.gridCard, { opacity: 0 }]} />}
        </View>
      ))}

      <View style={s.comingSoon}>
        <Text style={{ fontSize: 28 }}>🚀</Text>
        <Text style={s.comingSoonTitle}>Launching Soon</Text>
        <Text style={s.comingSoonSub}>New games added in upcoming updates. Stay tuned!</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080610" },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#D4AF37", letterSpacing: 2 },
  badge: {
    backgroundColor: "rgba(167,139,250,0.1)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(167,139,250,0.2)",
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "rgba(167,139,250,0.8)", letterSpacing: 1 },
  sectionLabel: {
    fontFamily: "Inter_700Bold", fontSize: 9, color: "rgba(255,255,255,0.2)",
    letterSpacing: 4, textTransform: "uppercase", marginBottom: 12,
  },
  featuredContainer: { marginHorizontal: -16 },
  featuredScroll: { paddingHorizontal: 16, gap: 12 },
  featuredCard: {
    width: 140, height: 200, borderRadius: 20,
    borderWidth: 1, alignItems: "center", justifyContent: "center",
    gap: 8, position: "relative",
  },
  featuredEmoji: { fontSize: 40 },
  featuredTag: {
    fontFamily: "Inter_700Bold", fontSize: 9, color: "rgba(255,255,255,0.4)",
    letterSpacing: 2, textTransform: "uppercase",
  },
  soonBadge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  soonText: { fontFamily: "Inter_700Bold", fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: 1 },
  gridRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1, height: 130, borderRadius: 18, backgroundColor: "#111",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  gridEmoji: { fontSize: 30 },
  gridTag: {
    fontFamily: "Inter_700Bold", fontSize: 9, color: "rgba(255,255,255,0.25)",
    letterSpacing: 2, textTransform: "uppercase",
  },
  gridSoon: {
    fontFamily: "Inter_400Regular", fontSize: 9, color: "rgba(255,255,255,0.15)",
  },
  comingSoon: {
    marginTop: 24, padding: 24, borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.04)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.12)",
    alignItems: "center", gap: 8,
  },
  comingSoonTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#D4AF37" },
  comingSoonSub: {
    fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.25)",
    textAlign: "center", lineHeight: 18,
  },
});
