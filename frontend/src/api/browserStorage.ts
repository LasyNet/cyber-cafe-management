/**
 * Low-level browser storage adapter.
 * Keep browser-specific persistence details out of domain services and UI.
 */
export const browserStorage = {
  read(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('Lecture du stockage navigateur impossible.', error);
      return null;
    }
  },

  write(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Écriture du stockage navigateur impossible.', error);
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Suppression du stockage navigateur impossible.', error);
      return false;
    }
  },
};
