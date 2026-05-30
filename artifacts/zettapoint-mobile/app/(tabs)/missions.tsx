import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
  Alert, Linking, ActivityIndicator, Modal, TextInput,
  Image, TouchableOpacity, KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useApp } from "@/context/AppContext";
import { getTasks, claimTask } from "@/lib/api";
import { getUserId, getSocialVisited, markSocialVisited } from "@/lib/storage";

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  taskKey: string | null;
  rewardCoins: number;
  link: string | null;
  category: string;
  completion: { status: string; screenshotUrl?: string } | null;
}

const TASK_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  daily_login: "calendar",
  spin_3x: "disc",
  watch_ad: "tv",
  play_minigames: "game-controller",
  bonus_join: "gift",
  connect_ton_wallet: "diamond",
  invite_friends: "people",
  seven_day_streak: "flame",
  follow_twitter: "logo-twitter",
  join_tg_channel: "paper-plane",
  share_story: "camera",
};

function getIcon(taskKey: string | null, type: string): keyof typeof Ionicons.glyphMap {
  if (taskKey && TASK_ICONS[taskKey]) return TASK_ICONS[taskKey];
  if (type === "screenshot") return "camera";
  if (type === "social") return "share-social";
  return "checkmark-circle";
}

function formatNum(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString(); }

function TaskRow({ task, onClaim, onGo, onScreenshot, socialVisited, submitting }: {
  task: Task;
  onClaim: (t: Task) => void;
  onGo: (t: Task) => void;
  onScreenshot: (t: Task) => void;
  socialVisited: Record<number, boolean>;
  submitting: number | null;
}) {
  const done = task.completion?.status === "completed";
  const pending = task.completion?.status === "pending";
  const visited = socialVisited[task.id];
  const isLoading = submitting === task.id;
  const iconName = getIcon(task.taskKey, task.type);

  return (
    <View style={[row.container, done && { opacity: 0.45 }]}>
      <View style={row.iconWrap}>
        <Ionicons name={iconName} size={22} color={done ? "#4CAF50" : "#FFD700"} />
      </View>
      <View style={row.info}>
        <Text style={row.title} numberOfLines={2}>{task.title}</Text>
        <View style={row.rewardRow}>
          <Ionicons name="flash" size={10} color="#FFD700" />
          <Text style={row.reward}>+{formatNum(task.rewardCoins)}</Text>
          <Text style={row.cat}> · {task.category === "daily" ? "Daily" : "Once"}</Text>
        </View>
      </View>
      {done ? (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      ) : pending ? (
        <Ionicons name="time" size={24} color="#F59E0B" />
      ) : task.type === "screenshot" ? (
        <Pressable style={row.uploadBtn} onPress={() => onScreenshot(task)}>
          <Ionicons name="camera" size={14} color="#000" />
          <Text style={row.uploadBtnText}>Upload</Text>
        </Pressable>
      ) : task.type === "social" && !visited ? (
        <Pressable style={row.goBtn} onPress={() => onGo(task)}>
          <Text style={row.goBtnText}>GO</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[row.claimBtn, isLoading && { opacity: 0.5 }]}
          onPress={() => onClaim(task)}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={row.claimBtnText}>CLAIM</Text>}
        </Pressable>
      )}
    </View>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14, paddingHorizontal: 18, backgroundColor: "#111",
    borderRadius: 18, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,215,0,0.08)", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1 },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFF", marginBottom: 4 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  reward: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFD700" },
  cat: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.3)" },
  claimBtn: {
    backgroundColor: "#FFD700", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 60, alignItems: "center",
  },
  claimBtnText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000", letterSpacing: 1 },
  goBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FFD700", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8,
  },
  goBtnText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000", letterSpacing: 1 },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FFD700", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  uploadBtnText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000", letterSpacing: 1 },
});

interface ScreenshotModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (task: Task, imageUri: string) => Promise<void>;
  submitting: number | null;
}

function ScreenshotModal({ task, onClose, onSubmit, submitting }: ScreenshotModalProps) {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"pick" | "url">("pick");

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;
    const submitUri = mode === "pick" ? pickedUri : urlInput;
    if (!submitUri) {
      Alert.alert("No image", "Please pick an image or enter a URL.");
      return;
    }
    await onSubmit(task, submitUri);
    setPickedUri(null);
    setUrlInput("");
  };

  const isSubmitting = task ? submitting === task.id : false;

  return (
    <Modal visible={!!task} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>Submit Screenshot</Text>
            {task && <Text style={modal.taskName}>{task.title}</Text>}

            <View style={modal.modeRow}>
              <TouchableOpacity
                style={[modal.modeBtn, mode === "pick" && modal.modeBtnActive]}
                onPress={() => setMode("pick")}
              >
                <Text style={[modal.modeBtnText, mode === "pick" && modal.modeBtnActiveText]}>📷 Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.modeBtn, mode === "url" && modal.modeBtnActive]}
                onPress={() => setMode("url")}
              >
                <Text style={[modal.modeBtnText, mode === "url" && modal.modeBtnActiveText]}>🔗 URL</Text>
              </TouchableOpacity>
            </View>

            {mode === "pick" ? (
              <>
                {pickedUri ? (
                  <View style={modal.previewWrap}>
                    <Image source={{ uri: pickedUri }} style={modal.preview} resizeMode="cover" />
                    <TouchableOpacity style={modal.clearBtn} onPress={() => setPickedUri(null)}>
                      <Text style={modal.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={modal.pickRow}>
                    <TouchableOpacity style={modal.pickBtn} onPress={handlePickImage}>
                      <Ionicons name="images" size={24} color="#FFD700" />
                      <Text style={modal.pickBtnText}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={modal.pickBtn} onPress={handleCamera}>
                      <Ionicons name="camera" size={24} color="#FFD700" />
                      <Text style={modal.pickBtnText}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <TextInput
                style={modal.urlInput}
                placeholder="https://i.imgur.com/example.jpg"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                keyboardType="url"
              />
            )}

            <View style={modal.btnRow}>
              <TouchableOpacity style={modal.cancelBtn} onPress={onClose}>
                <Text style={modal.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modal.submitBtn, isSubmitting && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <ActivityIndicator size="small" color="#000" />
                  : <Text style={modal.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: {
    backgroundColor: "#0d0d0d", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  handle: {
    width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2, alignSelf: "center", marginBottom: 20,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFD700", marginBottom: 4 },
  taskName: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 },
  modeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 14, backgroundColor: "#1a1a1a",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center",
  },
  modeBtnActive: { backgroundColor: "rgba(255,215,0,0.1)", borderColor: "rgba(255,215,0,0.3)" },
  modeBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.4)" },
  modeBtnActiveText: { color: "#FFD700" },
  pickRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  pickBtn: {
    flex: 1, height: 100, borderRadius: 16, backgroundColor: "#1a1a1a",
    borderWidth: 1, borderColor: "rgba(255,215,0,0.15)", alignItems: "center", justifyContent: "center", gap: 8,
  },
  pickBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.5)" },
  previewWrap: { height: 160, borderRadius: 16, overflow: "hidden", marginBottom: 16, position: "relative" },
  preview: { width: "100%", height: "100%" },
  clearBtn: {
    position: "absolute", top: 8, right: 8, width: 28, height: 28,
    backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 14, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  clearBtnText: { color: "#fff", fontSize: 12 },
  urlInput: {
    backgroundColor: "#1a1a1a", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: "#fff", fontFamily: "Inter_400Regular", fontSize: 13,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 16,
  },
  btnRow: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#1a1a1a",
    alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  cancelBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "rgba(255,255,255,0.4)" },
  submitBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 16, backgroundColor: "#FFD700", alignItems: "center",
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#000", letterSpacing: 1 },
});

export default function MissionsScreen() {
  const insets = useSafeAreaInsets();
  const { coins, setCoins } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [socialVisited, setSocialVisited] = useState<Record<number, boolean>>({});
  const [screenshotTask, setScreenshotTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
    getSocialVisited().then(setSocialVisited);
  }, []);

  const loadTasks = async () => {
    const tid = await getUserId();
    if (!tid) { setLoading(false); return; }
    try {
      const data = await getTasks(tid);
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (task: Task) => {
    const tid = await getUserId();
    if (!tid || submitting) return;
    setSubmitting(task.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const data = await claimTask(tid, task.id);
      setCoins(coins + (data.rewardCoins || 0));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completion: { status: "completed" } } : t));
    } catch (e: any) {
      Alert.alert("Cannot claim", e?.message || "Requirements not met yet.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleGo = async (task: Task) => {
    if (task.link) Linking.openURL(task.link);
    await markSocialVisited(task.id);
    setSocialVisited((prev) => ({ ...prev, [task.id]: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleScreenshotSubmit = async (task: Task, imageUri: string) => {
    const tid = await getUserId();
    if (!tid) return;
    setSubmitting(task.id);
    try {
      const BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";
      const res = await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, screenshotUrl: imageUri, telegramId: tid }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Upload failed");
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completion: { status: "pending" } } : t));
      setScreenshotTask(null);
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not submit screenshot.");
    } finally {
      setSubmitting(null);
    }
  };

  const sorted = [...tasks].sort((a, b) => {
    const aDone = a.completion?.status === "completed" ? 1 : 0;
    const bDone = b.completion?.status === "completed" ? 1 : 0;
    return aDone - bDone;
  });

  const completed = tasks.filter((t) => t.completion?.status === "completed").length;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>MISSIONS</Text>
        <View style={s.progress}>
          <Text style={s.progressText}>{completed}/{tasks.length}</Text>
        </View>
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator color="#FFD700" size="large" /></View>
      ) : tasks.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="checkmark-done-circle-outline" size={48} color="rgba(255,255,255,0.1)" />
          <Text style={s.emptyText}>No missions yet</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(t) => String(t.id)}
          renderItem={({ item }) => (
            <TaskRow
              task={item}
              onClaim={handleClaim}
              onGo={handleGo}
              onScreenshot={setScreenshotTask}
              socialVisited={socialVisited}
              submitting={submitting}
            />
          )}
          contentContainerStyle={s.list}
          scrollEnabled={!!sorted.length}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ScreenshotModal
        task={screenshotTask}
        onClose={() => setScreenshotTask(null)}
        onSubmit={handleScreenshotSubmit}
        submitting={submitting}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, marginBottom: 16,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#FFD700", letterSpacing: 2 },
  progress: {
    backgroundColor: "rgba(255,215,0,0.1)", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(255,215,0,0.2)",
  },
  progressText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFD700" },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 14, color: "rgba(255,255,255,0.2)" },
});
