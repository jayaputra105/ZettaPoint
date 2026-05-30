import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { getUser } from "@/lib/api";
import { setUserId, setUserName, setOnboarded as persistOnboarded, generateUserId } from "@/lib/storage";

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setOnboarded, refreshUser } = useApp();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter at least 2 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const userId = generateUserId();
      await setUserId(userId);
      await setUserName(trimmed);
      await getUser({ telegramId: userId, firstName: trimmed });
      await persistOnboarded();
      await refreshUser();
      setOnboarded(true);
    } catch (e: any) {
      setError(e?.message || "Failed to connect. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[s.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={s.glow} />
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="trophy" size={48} color={colors.primary} />
        </View>
        <Text style={s.title}>ZettaPoint</Text>
        <Text style={s.subtitle}>Tap. Spin. Earn. Withdraw.</Text>

        <View style={s.inputSection}>
          <Text style={s.label}>YOUR DISPLAY NAME</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. CryptoKing99"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />
          {!!error && <Text style={s.error}>{error}</Text>}
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={handleStart}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={s.btnText}>START PLAYING</Text>
          )}
        </Pressable>

        <Text style={s.note}>No account needed — progress saved automatically.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  glow: {
    position: "absolute", top: -100, left: "50%", marginLeft: -200,
    width: 400, height: 400, borderRadius: 200,
    backgroundColor: "rgba(255,215,0,0.06)",
  },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  iconWrap: {
    alignSelf: "center", width: 88, height: 88, borderRadius: 44,
    backgroundColor: "rgba(255,215,0,0.1)", alignItems: "center", justifyContent: "center",
    marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,215,0,0.2)",
  },
  title: {
    fontFamily: "Inter_700Bold", fontSize: 36, color: "#FFD700",
    textAlign: "center", letterSpacing: -1, marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_500Medium", fontSize: 14, color: "rgba(255,255,255,0.3)",
    textAlign: "center", letterSpacing: 2, textTransform: "uppercase", marginBottom: 48,
  },
  inputSection: { marginBottom: 20 },
  label: {
    fontFamily: "Inter_700Bold", fontSize: 10, color: "rgba(255,255,255,0.3)",
    letterSpacing: 2, marginBottom: 10,
  },
  input: {
    backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16, padding: 18, fontFamily: "Inter_500Medium", fontSize: 16, color: "#FFF",
  },
  error: { marginTop: 8, fontFamily: "Inter_500Medium", fontSize: 12, color: "#EF4444" },
  btn: {
    backgroundColor: "#FFD700", borderRadius: 16, paddingVertical: 18,
    alignItems: "center", marginBottom: 20,
  },
  btnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000", letterSpacing: 2 },
  note: {
    fontFamily: "Inter_400Regular", fontSize: 11,
    color: "rgba(255,255,255,0.2)", textAlign: "center",
  },
});
