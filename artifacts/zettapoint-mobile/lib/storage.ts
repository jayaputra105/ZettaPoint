import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USER_ID: "zp_user_id",
  USER_NAME: "zp_user_name",
  ONBOARDED: "zp_onboarded",
  ROOM: "zp_current_room",
  SOCIAL_VISITED: "zp_social_visited",
};

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_ID);
}

export async function setUserId(id: string) {
  return AsyncStorage.setItem(KEYS.USER_ID, id);
}

export async function getUserName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_NAME);
}

export async function setUserName(name: string) {
  return AsyncStorage.setItem(KEYS.USER_NAME, name);
}

export async function isOnboarded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return v === "true";
}

export async function setOnboarded() {
  return AsyncStorage.setItem(KEYS.ONBOARDED, "true");
}

export async function getCurrentRoom(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.ROOM)) || "bronze";
}

export async function setCurrentRoom(room: string) {
  return AsyncStorage.setItem(KEYS.ROOM, room);
}

export async function getSocialVisited(): Promise<Record<number, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SOCIAL_VISITED);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function markSocialVisited(taskId: number) {
  const current = await getSocialVisited();
  current[taskId] = true;
  await AsyncStorage.setItem(KEYS.SOCIAL_VISITED, JSON.stringify(current));
}

export function generateUserId(): string {
  const ts = Date.now().toString().slice(-7);
  const rnd = Math.floor(Math.random() * 9000 + 1000).toString();
  return ts + rnd;
}
