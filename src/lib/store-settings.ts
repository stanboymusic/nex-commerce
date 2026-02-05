import type PocketBase from "pocketbase";

const STORE_SETTINGS_CANDIDATES = ["store_settings", "store_settings_"];

export async function resolveStoreSettingsCollection(pb: PocketBase) {
  for (const name of STORE_SETTINGS_CANDIDATES) {
    try {
      await pb.collection(name).getList(1, 1);
      return name;
    } catch (_) {
      // Try next candidate
    }
  }

  return STORE_SETTINGS_CANDIDATES[0];
}

export async function getStoreSettingsRecord(pb: PocketBase) {
  const collection = await resolveStoreSettingsCollection(pb);
  const record = await pb.collection(collection).getFirstListItem("").catch(() => null);
  return { collection, record };
}
