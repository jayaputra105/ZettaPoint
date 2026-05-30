import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useColors } from "@/hooks/useColors";
import { getLeaderboard } from "@/lib/api";
import { getUserId } from "@/lib/storage";

interface Player {
  id: number;
  rank: number;
  name: string;
  username: string;
  avatar: string;
  zpBronze: number;
  zpSilver: number;
  zpGold: number;
  zpDiamond: number;
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <Ionicons name="trophy" size={22} color="#FFD700" />;
  if (rank === 2) return <Ionicons name="trophy" size={22} color="#C0C0C0" />;
  if (rank === 3) return <Ionicons name="trophy" size={22} color="#CD7F32" />;
  return <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "rgba(255,255,255,0.3)", width: 22, textAlign: "center" }}>{rank}</Text>;
}

function PlayerRow({ player, isMe }: { player: Player; isMe: boolean }) {
  const totalZp = (player.zpBronze || 0) + (player.zpSilver || 0) + (player.zpGold || 0) + (player.zpDiamond || 0);

  return (
    <View style={[pRow.container, isMe && pRow.meHighlight]}>
      <RankMedal rank={player.rank} />
      <Image
        source={{ uri: player.avatar || `https://api.dicebear.com/9.x/pixel-art/svg?seed=${player.id}` }}
        style={pRow.avatar}
        contentFit="cover"
      />
      <View style={pRow.info}>
        <Text style={pRow.name} numberOfLines={1}>{player.name}</Text>
        <Text style={pRow.username} numberOfLines={1}>@{player.username || "player"}</Text>
      </View>
      <View style={pRow.zpWrap}>
        <Text style={pRow.zp}>{totalZp >= 1000 ? (totalZp / 1000).toFixed(1) + "K" : totalZp}</Text>
        <Text style={pRow.zpLabel}>ZP</Text>
      </View>
    </View>
  );
}

const pRow = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#111",
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  meHighlight: {
    borderColor: "rgba(255,215,0,0.3)",
    backgroundColor: "rgba(255,215,0,0.06)",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222",
  },
  info: { flex: 1 },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: "#FFF",
  },
  username: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
  },
  zpWrap: { alignItems: "flex-end" },
  zp: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "#FFD700",
  },
  zpLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    color: "rgba(255,215,0,0.5)",
    letterSpacing: 1,
  },
});

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [players, setPlayers] = useState<Player[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getUserId().then((id) => { setMyId(id); loadLeaderboard(id); });
  }, []);

  const loadLeaderboard = async (tid?: string | null) => {
    const id = tid ?? myId;
    if (!id) return;
    try {
      const data = await getLeaderboard(id);
      setPlayers(Array.isArray(data?.leaderboard) ? data.leaderboard : Array.isArray(data) ? data : []);
      if (data?.myRank) setMyRank(data.myRank);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const s = styles(colors, insets);

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <View style={s.header}>
        <Text style={s.title}>RANKINGS</Text>
        {myRank && (
          <View style={s.myRankBadge}>
            <Text style={s.myRankText}>#{myRank}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color="#FFD700" size="large" />
        </View>
      ) : players.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="podium-outline" size={48} color="rgba(255,255,255,0.1)" />
          <Text style={s.emptyText}>No players yet</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <PlayerRow player={item} isMe={myId ? item.id.toString() === myId || item.id === Number(myId) : false} />
          )}
          contentContainerStyle={s.list}
          scrollEnabled={!!players.length}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadLeaderboard(); }}
              tintColor="#FFD700"
            />
          }
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
    myRankBadge: {
      backgroundColor: "rgba(255,215,0,0.1)",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: "rgba(255,215,0,0.3)",
    },
    myRankText: {
      fontFamily: "Inter_700Bold",
      fontSize: 13,
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
