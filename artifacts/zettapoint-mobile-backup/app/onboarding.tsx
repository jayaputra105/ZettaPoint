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

  const s = styles(colors, insets);

  return (
    <View style={s.container}>
      {/* Background glow */}
      <View style={s.glow} />

      <View style={s.content}>
        {/* Icon */}
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
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}
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

        <Text style={s.note}>
          No account needed — your progress is saved automatically.
        </Text>
      </View>
    </View>
  );
}

// @ts-ignore
const styles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: Platform.OS === "web" ? 67 : insets.top,
      paddingBottom: Platform.OS === "web" ? 34 : insets.bottom,
    },
    glow: {
      position: "absolute",
      top: -100,
      left: "50%",
      marginLeft: -200,
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: "rgba(255,215,0,0.06)",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    iconWrap: {
      alignSelf: "center",
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "rgba(255,215,0,0.1)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: "rgba(255,215,0,0.2)",
    },
    title: {
      fontFamily: "Inter_700Bold",
      fontSize: 36,
      color: colors.primary,
      textAlign: "center",
      letterSpacing: -1,
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 48,
    },
    inputSection: {
      marginBottom: 20,
    },
    label: {
      fontFamily: "Inter_700Bold",
      fontSize: 10,
      color: colors.mutedForeground,
      letterSpacing: 2,
      marginBottom: 10,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      fontFamily: "Inter_500Medium",
      fontSize: 16,
      color: colors.foreground,
    },
    error: {
      marginTop: 8,
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: colors.destructive,
    },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 20,
    },
    btnText: {
      fontFamily: "Inter_700Bold",
      fontSize: 13,
      color: "#000",
      letterSpacing: 2,
    },
    note: {
      fontFamily: "Inter_400Regular",
      fontSize: 11,
      color: colors.mutedForeground,
      textAlign: "center",
      opacity: 0.6,
    },
  });
