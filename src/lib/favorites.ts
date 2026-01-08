// Favorites are stored in localStorage (browser-side)
// Format: { [path: string]: true }

const STORAGE_KEY = 'flight-deck-favorites';

export interface FavoriteItem {
  path: string;
  type: 'command' | 'agent' | 'plugin' | 'hook' | 'skill';
}

export function getFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    return new Set(Object.keys(parsed));
  } catch {
    return new Set();
  }
}

export function isFavorite(path: string): boolean {
  return getFavorites().has(path);
}

export function toggleFavorite(path: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const favorites: Record<string, true> = stored ? JSON.parse(stored) : {};

    if (favorites[path]) {
      delete favorites[path];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      return false; // No longer a favorite
    } else {
      favorites[path] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      return true; // Now a favorite
    }
  } catch {
    return false;
  }
}

export function addFavorite(path: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const favorites: Record<string, true> = stored ? JSON.parse(stored) : {};
    favorites[path] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Silently fail
  }
}

export function removeFavorite(path: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const favorites: Record<string, true> = stored ? JSON.parse(stored) : {};
    delete favorites[path];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Silently fail
  }
}
