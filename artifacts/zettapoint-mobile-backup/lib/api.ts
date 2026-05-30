const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function getUser(params: { telegramId: string; firstName?: string; username?: string }) {
  const q = new URLSearchParams({
    telegramId: params.telegramId,
    firstName: params.firstName || "Mobile Player",
    username: params.username || "",
  });
  return apiFetch(`/api/user?${q}`);
}

export function getTasks(telegramId: string) {
  return apiFetch(`/api/tasks?telegramId=${telegramId}`);
}

export function claimTask(telegramId: string, taskId: number) {
  return apiFetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, taskId }),
  });
}

export function getLeaderboard(telegramId: string) {
  return apiFetch(`/api/leaderboard?telegramId=${telegramId}`);
}

export function getSpinState(telegramId: string) {
  return apiFetch(`/api/spin?telegramId=${telegramId}`);
}

export function doSpin(telegramId: string, type: "free" | "ads") {
  return apiFetch("/api/spin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, type }),
  });
}

export function getWallet(telegramId: string) {
  return apiFetch(`/api/wallet?telegramId=${telegramId}`);
}

export function requestWithdrawal(params: {
  telegramId: string;
  method: string;
  amount: number;
  walletAddress: string;
}) {
  return apiFetch("/api/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function updateUserZP(telegramId: string, addZp: number, addCoins: number, room: string) {
  return apiFetch("/api/user", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, addZp, addCoins, room }),
  });
}

export function connectWallet(telegramId: string, tonWalletAddress: string) {
  return apiFetch("/api/user/wallet", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, tonWalletAddress }),
  });
}
