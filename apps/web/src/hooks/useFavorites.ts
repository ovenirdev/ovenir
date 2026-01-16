'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ovenir-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load favorites:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when favorites change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.warn('Failed to save favorites:', e);
      }
    }
  }, [favorites, isLoaded]);

  const addFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav !== id));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((fav) => fav !== id);
      }
      return [...prev, id];
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites]
  );

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    hasFavorites: favorites.length > 0,
  };
}

export default useFavorites;
