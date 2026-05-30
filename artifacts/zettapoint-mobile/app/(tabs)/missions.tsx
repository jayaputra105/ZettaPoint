import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
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
  completion: { status: string } | null;
}

const TASK_ICONS: Record<string, string> = {
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

function getIcon(taskKey: string | null, type: string): string {
  if (taskKey && TASK_ICONS[taskKey]) return TASK_ICONS[taskKey];
  if (type === "screenshot") return "camera";
  if (type === "social") return "share-social";
  return "checkmark-circle";
}

function formatNum(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "K" : n.toString();
}

function TaskRow({
  task,
  onClaim,
  onGo,
  socialVisited,
  submitting,
}: {
  task: Task;
  onClaim: (t: Task) => void;
  onGo: (t: Task) => void;
  socialVisited: Record<number, boolean>;
  submitting: number | null;
}) {
  const colors = useColors();
  const done = task.completion?.status === "completed";
  const pending = task.completion?.status === "pending";
  const visited = socialVisited[task.id];
  const isLoading = submitting === task.id;

  const iconName = getIcon(task.taskKey, task.type) as any;

  return (
    <View style={[row.container, done && { opacity: 0.45 }]}>
      <View style={row.iconWrap}>
        <Ionicons name={iconName} size={22} color={done ? "#4CAF50" : "#FFD700"} />
      </View>

      <View style={row.info}>
        <Text style={row.title}>{task.title}</Text>
        <View style={row.rewardRow}>
          <Ionicons name="flash" size={10} color="#FFD700" />
          <Text style={row.reward}>+{formatNum(task.rewardCoins)}</Text>
          <Text style={row.cat}> · {task.category === "daily" ? "Daily" : "One-time"}</Text>
        </View>
      </View>

      {done ? (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      ) : pending ? (
        <Ionicons name="time" size={24} color="#f59e0b" />
      ) : task.type === "social" ? (
        !visited ? (
          <Pressable style={row.goBtn} onPress={() => onGo(task)}>
            <Text style={row.goBtnText}>GO</Text>
            <Ionicons name="open-outline" size={12} color="#000" />
          </Pressable>
        ) : (
          <Pressable
            style={[row.claimBtn, isLoading && { opacity: 0.5 }]}
            onPress={() => onClaim(task)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={row.claimBtnText}>CLAIM</Text>
            )}
          </Pressable>
        )
      ) : (
        <Pressable
          style={[row.claimBtn, isLoading && { opacity: 0.5 }]}
          onPress={() => onClaim(task)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={row.claimBtnText}>CLAIM</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#111",
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,215,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFF",
    marginBottom: 4,
  },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  reward: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#FFD700" },
  cat: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.3)" },
  claimBtn: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
  },
  claimBtnText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000", letterSpacing: 1 },
  goBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  goBtnText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#000", letterSpacing: 1 },
});

export default function MissionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { coins, setCoins } = useApp();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [socialVisited, setSocialVisited] = useState<Record<number, boolean>>({});

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
      setTasks((prev) =>
        prev.map((t) => t.id === task.id ? { ...t, completion: { status: "completed" } } : t)
      );
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

  const sorted = [...tasks].sort((a, b) => {
    if (!!a.completion !== !!b.completion) return !!a.completion ? 1 : -1;
    return 0;
  });

  const completed = tasks.filter((t) => t.completion?.status === "completed").length;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = styles(colors, insets);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>MISSIONS</Text>
        <View style={s.progress}>
          <Text style={s.progressText}>{completed}/{tasks.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#FFD700" size="large" />
        </View>
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
              socialVisited={socialVisited}
              submitting={submitting}
            />
          )}
          contentContainerStyle={s.list}
          scrollEnabled={!!sorted.length}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// @ts-ignore
const styles = (colors: any, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    title: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      color: "#FFD700",
      letterSpacing: 2,
    },
    progress: {
      backgroundColor: "rgba(255,215,0,0.1)",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: "rgba(255,215,0,0.2)",
    },
    progressText: {
      fontFamily: "Inter_700Bold",
      fontSize: 12,
      color: "#FFD700",
    },
    list: { paddingHorizontal: 16, paddingBottom: 120 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    emptyText: {
      fontFamily: "Inter_500Medium",
      fontSize: 14,
      color: "rgba(255,255,255,0.2)",
    },
  });
