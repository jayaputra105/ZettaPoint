import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  Alert, Platform, Modal, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/context/AppContext";
import { getWallet, requestWithdrawal, connectWallet } from "@/lib/api";
import { getUserId } from "@/lib/storage";

const MIN_WD = 30;

function validateTON(addr: string) { return /^[EeUu][Qq][A-Za-z0-9_\-]{46}$/.test(addr.trim()); }
function validateTRC20(addr: string) { return /^T[A-Za-z1-9]{33}$/.test(addr.trim()); }
function validateAddress(method: string, addr: string): string | null {
  if (!addr.trim()) return null;
  if (method === "TON") return validateTON(addr) ? "valid" : "Must start with EQ or UQ, 48 chars";
  if (method === "TRC20") return validateTRC20(addr) ? "valid" : "Must start with T, 34 chars";
  return null;
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { coins, usdtBalance, zp, tonWalletAddress, setTonWalletAddress } = useApp();

  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [wdModalOpen, setWdModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [tonInput, setTonInput] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSaveError, setWalletSaveError] = useState("");

  const [method, setMethod] = useState<"TON" | "TRC20" | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalZp = Object.values(zp).reduce((a, b) => a + b, 0);

  useEffect(() => { loadWallet(); }, []);

  const loadWallet = async () => {
    const tid = await getUserId();
    if (!tid) return;
    try {
      const data = await getWallet(tid);
      if (data.transactions) setTxHistory(data.transactions);
    } catch (e) { console.error(e); }
  };

  const handleOpenWalletModal = () => {
    setTonInput(tonWalletAddress || "");
    setWalletSaveError("");
    setWalletModalOpen(true);
  };

  const handleSaveWallet = async () => {
    const input = tonInput.trim();
    if (!input) { setWalletModalOpen(false); return; }
    if (!validateTON(input)) {
      setWalletSaveError("Must start with EQ or UQ, 48 characters total.");
      return;
    }
    setSavingWallet(true);
    try {
      const tid = await getUserId();
      if (!tid) throw new Error("No user");
      await connectWallet(tid, input);
      setTonWalletAddress(input);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWalletModalOpen(false);
    } catch (e: any) {
      setWalletSaveError(e?.message || "Failed to save wallet.");
    } finally {
      setSavingWallet(false);
    }
  };

  const addressValidation = method && address ? validateAddress(method, address) : null;
  const addressOk = addressValidation === "valid";
  const addressError = addressValidation && addressValidation !== "valid" ? addressValidation : null;
  const amountNum = parseFloat(amount);
  const amountError = !amount ? "" : isNaN(amountNum) ? "Invalid amount"
    : amountNum < MIN_WD ? `Minimum is $${MIN_WD}`
    : amountNum > usdtBalance ? "Insufficient balance" : "";

  const handleWithdraw = async () => {
    const tid = await getUserId();
    if (!tid) return;
    if (!method) return Alert.alert("Select a method first");
    if (amountError) return Alert.alert("Amount error", amountError);
    if (!address) return Alert.alert("Enter wallet address");
    if (!addressOk) return Alert.alert("Invalid address", addressError || "Check your address");
    setSubmitting(true);
    try {
      await requestWithdrawal({ telegramId: tid, method, amount: amountNum, walletAddress: address });
      Alert.alert("Submitted!", "Your withdrawal request is under review (24h).");
      setWdModalOpen(false);
      setAmount(""); setAddress(""); setMethod(null);
      loadWallet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Withdrawal failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={s.header}>
          <Text style={s.title}>WALLET</Text>
          <Ionicons name="wallet" size={24} color="#FFD700" />
        </View>

        {/* TON Wallet */}
        <Pressable style={[s.tonRow, !!tonWalletAddress && s.tonRowConnected]} onPress={handleOpenWalletModal}>
          <Ionicons name="link" size={18} color={tonWalletAddress ? "#4CAF50" : "rgba(255,255,255,0.3)"} />
          <View style={{ flex: 1 }}>
            <Text style={s.tonLabel}>TON WALLET</Text>
            <Text style={[s.tonAddr, !!tonWalletAddress && { color: "#4CAF50" }]}>
              {tonWalletAddress
                ? `${tonWalletAddress.slice(0, 10)}...${tonWalletAddress.slice(-6)}`
                : "Tap to connect"}
            </Text>
          </View>
          {!!tonWalletAddress && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
        </Pressable>

        {/* USDT Card */}
        <View style={s.usdtCard}>
          <View style={s.usdtCardTop}>
            <Text style={s.usdtCardLabel}>AVAILABLE USDT</Text>
            <View style={s.activeBadge}>
              <View style={s.activeDot} />
              <Text style={s.activeBadgeText}>ACTIVE</Text>
            </View>
          </View>
          <Text style={s.usdtAmount}>${usdtBalance.toFixed(2)}</Text>
          <Pressable style={({ pressed }) => [s.wdBtn, pressed && { opacity: 0.85 }]} onPress={() => setWdModalOpen(true)}>
            <Text style={s.wdBtnText}>Request Withdrawal</Text>
            <Ionicons name="arrow-up-circle" size={20} color="#000" />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Ionicons name="flash" size={16} color="rgba(255,255,255,0.3)" />
            <Text style={s.statLabel}>Total Coins</Text>
            <Text style={s.statValue}>{coins >= 1000 ? (coins / 1000).toFixed(1) + "K" : coins.toLocaleString()}</Text>
          </View>
          <View style={s.statCard}>
            <Ionicons name="star" size={16} color="rgba(255,255,255,0.3)" />
            <Text style={s.statLabel}>Total ZP</Text>
            <Text style={s.statValue}>{totalZp >= 1000 ? (totalZp / 1000).toFixed(1) + "K" : totalZp.toLocaleString()}</Text>
          </View>
        </View>

        {/* History */}
        <Text style={s.historyLabel}>RECENT ACTIVITY</Text>
        {txHistory.length === 0 ? (
          <View style={s.emptyHistory}>
            <Ionicons name="receipt-outline" size={36} color="rgba(255,255,255,0.1)" />
            <Text style={s.emptyHistoryText}>No transactions yet</Text>
          </View>
        ) : txHistory.map((tx) => (
          <View key={tx.id} style={s.txRow}>
            <View style={s.txIcon}><Ionicons name="arrow-up" size={16} color="#ef4444" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.txType}>{tx.type}</Text>
              <Text style={s.txMeta}>{tx.method} · {new Date(tx.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.txAmount}>-${tx.amount}</Text>
              <View style={[s.txStatus, tx.status === "completed" && s.txStatusDone, tx.status === "rejected" && s.txStatusFail]}>
                <Text style={s.txStatusText}>{tx.status}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* TON Wallet Connect Modal (cross-platform) */}
      <Modal visible={walletModalOpen} animationType="slide" transparent onRequestClose={() => setWalletModalOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setWalletModalOpen(false)}>
          <Pressable style={[s.sheet, { paddingBottom: bottomInset + 20 }]} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Connect TON Wallet</Text>
            <Text style={s.sheetSub}>Enter your TON address (EQ... or UQ...)</Text>
            <View style={[s.inputWrap, !!walletSaveError && s.inputError, !walletSaveError && !!tonInput && validateTON(tonInput) && s.inputOk]}>
              <TextInput
                style={s.input}
                value={tonInput}
                onChangeText={(t) => { setTonInput(t); setWalletSaveError(""); }}
                placeholder="EQ... or UQ..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {!!tonInput && (
                <Ionicons
                  name={validateTON(tonInput) ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={validateTON(tonInput) ? "#4CAF50" : "#ef4444"}
                />
              )}
            </View>
            {!!walletSaveError && <Text style={s.fieldError}>{walletSaveError}</Text>}
            <Pressable
              style={[s.confirmBtn, savingWallet && { opacity: 0.5 }]}
              onPress={handleSaveWallet}
              disabled={savingWallet}
            >
              {savingWallet ? <ActivityIndicator color="#000" /> : <Text style={s.confirmBtnText}>SAVE WALLET</Text>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal visible={wdModalOpen} animationType="slide" transparent onRequestClose={() => setWdModalOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setWdModalOpen(false)}>
          <Pressable style={[s.sheet, { paddingBottom: bottomInset + 20 }]} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Payout USDT</Text>
            <Text style={s.sheetSub}>Min. withdrawal: ${MIN_WD}</Text>
            <View style={s.methodRow}>
              {(["TON", "TRC20"] as const).map((m) => (
                <Pressable key={m} onPress={() => { setMethod(m); setAddress(""); }} style={[s.methodBtn, method === m && s.methodBtnActive]}>
                  <Text style={[s.methodBtnText, method === m && { color: "#000" }]}>{m}</Text>
                </Pressable>
              ))}
            </View>
            {!!method && (
              <>
                <View style={[s.inputWrap, !!amountError && s.inputError]}>
                  <TextInput
                    style={s.input}
                    placeholder="Amount"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <Text style={s.inputSuffix}>USDT</Text>
                </View>
                {!!amountError && <Text style={s.fieldError}>{amountError}</Text>}
                <View style={[s.inputWrap, addressError ? s.inputError : addressOk && address ? s.inputOk : null]}>
                  <TextInput
                    style={s.input}
                    placeholder={method === "TON" ? "EQ... or UQ..." : "T..."}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {!!address && (
                    <Ionicons name={addressOk ? "checkmark-circle" : "close-circle"} size={18} color={addressOk ? "#4CAF50" : "#ef4444"} />
                  )}
                </View>
                {!!addressError && <Text style={s.fieldError}>{addressError}</Text>}
                <Pressable
                  style={[s.confirmBtn, (submitting || !!amountError || (!addressOk && !!address)) && { opacity: 0.4 }]}
                  onPress={handleWithdraw}
                  disabled={submitting || !!amountError || (!addressOk && !!address)}
                >
                  {submitting ? <ActivityIndicator color="#000" /> : <Text style={s.confirmBtnText}>CONFIRM PAYOUT</Text>}
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#FFD700", letterSpacing: 2 },
  tonRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, padding: 14, backgroundColor: "#111",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 12,
  },
  tonRowConnected: { borderColor: "rgba(76,175,80,0.3)", backgroundColor: "rgba(76,175,80,0.05)" },
  tonLabel: { fontFamily: "Inter_700Bold", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2 },
  tonAddr: { fontFamily: "Inter_500Medium", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  usdtCard: {
    marginHorizontal: 16, padding: 24, backgroundColor: "#111",
    borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 12,
  },
  usdtCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  usdtCardLabel: { fontFamily: "Inter_700Bold", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(76,175,80,0.1)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(76,175,80,0.2)" },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4CAF50" },
  activeBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#4CAF50", letterSpacing: 1 },
  usdtAmount: { fontFamily: "Inter_700Bold", fontSize: 44, color: "#FFF", letterSpacing: -1, marginVertical: 12 },
  wdBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFD700", borderRadius: 14, paddingVertical: 14 },
  wdBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000" },
  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: "#111", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 4 },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1, textTransform: "uppercase" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: "#FFF" },
  historyLabel: { fontFamily: "Inter_700Bold", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 3, marginHorizontal: 24, marginBottom: 12 },
  emptyHistory: { alignItems: "center", paddingVertical: 40, gap: 12, marginHorizontal: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.05)", borderRadius: 20, borderStyle: "dashed" },
  emptyHistoryText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.15)" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, padding: 14, backgroundColor: "#111", borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  txIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" },
  txType: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFF", textTransform: "capitalize" },
  txMeta: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.3)" },
  txAmount: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFD700" },
  txStatus: { backgroundColor: "rgba(245,158,11,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  txStatusDone: { backgroundColor: "rgba(76,175,80,0.1)" },
  txStatusFail: { backgroundColor: "rgba(239,68,68,0.1)" },
  txStatusText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#f59e0b", letterSpacing: 1, textTransform: "uppercase" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#111", borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  sheetHandle: { width: 48, height: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFD700", marginBottom: 4 },
  sheetSub: { fontFamily: "Inter_500Medium", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 20 },
  methodRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  methodBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  methodBtnActive: { backgroundColor: "#FFD700", borderColor: "#FFD700" },
  methodBtnText: { fontFamily: "Inter_700Bold", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 1 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#000", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 16, marginBottom: 8 },
  inputError: { borderColor: "rgba(239,68,68,0.5)" },
  inputOk: { borderColor: "rgba(76,175,80,0.5)" },
  input: { flex: 1, paddingVertical: 16, fontFamily: "Inter_500Medium", fontSize: 14, color: "#FFF" },
  inputSuffix: { fontFamily: "Inter_700Bold", fontSize: 12, color: "#FFD700" },
  fieldError: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#ef4444", marginBottom: 8, paddingHorizontal: 4 },
  confirmBtn: { backgroundColor: "#FFD700", borderRadius: 16, paddingVertical: 18, alignItems: "center", marginTop: 8 },
  confirmBtnText: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#000", letterSpacing: 2 },
});
