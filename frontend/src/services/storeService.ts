import { browserStorage } from '../api/browserStorage';
import { initialStore, type Store } from '../data/mockStore';

const STORE_KEY = 'lasynet-cybercafe-store-v1';

/** Loads persisted demo data and merges defaults for fields added in newer versions. */
export function readStore(): Store {
  const raw = browserStorage.read(STORE_KEY);
  if (!raw) return initialStore;

  try {
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      ...initialStore,
      ...parsed,
      computers: (parsed.computers ?? initialStore.computers).map(computer => ({
        ...computer,
        type: computer.type ?? 'Interne',
        macAddress: computer.macAddress ?? '',
      })),
      settings: { ...initialStore.settings, ...parsed.settings },
    };
  } catch (error) {
    console.warn('Impossible de lire les données locales LasyNet.', error);
    return initialStore;
  }
}

/** Persists the current demo store. Returns false when browser storage is unavailable. */
export function writeStore(store: Store): boolean {
  return browserStorage.write(STORE_KEY, JSON.stringify(store));
}

/** Clears persisted demo data and returns the initial demo dataset. */
export function resetStore(): Store {
  browserStorage.remove(STORE_KEY);
  return initialStore;
}
