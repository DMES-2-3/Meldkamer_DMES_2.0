const STORAGE_KEY = "shared_map_state";
const CHANNEL_NAME = "map-sync";

export function getStoredMapState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredMapState(partialState) {
  const current = getStoredMapState();
  const next = {
    ...current,
    ...partialState,
    updatedAt: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function createMapSyncChannel() {
  if ("BroadcastChannel" in window) {
    return new BroadcastChannel(CHANNEL_NAME);
  }
  return null;
}

export function broadcastMapState(partialState) {
  const next = saveStoredMapState(partialState);

  const channel = createMapSyncChannel();
  if (channel) {
    channel.postMessage(next);
    channel.close();
  }
}