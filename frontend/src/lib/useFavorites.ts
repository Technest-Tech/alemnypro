'use client';

import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { useAuthModal } from './AuthModalContext';

const STORAGE_KEY = 'alemnypro_favorites';

function getStoredFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredFavorites(slugs: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // ignore storage errors
  }
}

/** Dispatch a global event so FavoriteEffect can show animations */
function dispatchFavoriteAdded(tutorName: string, x = window.innerWidth / 2, y = window.innerHeight / 2) {
  window.dispatchEvent(
    new CustomEvent('alemnypro-favorite-added', { detail: { tutorName, x, y } })
  );
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { openAuthModal } = useAuthModal();

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setFavorites(getStoredFavorites());
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  );

  const toggleFavorite = useCallback((slug: string, tutorName = '', event?: MouseEvent | React.MouseEvent) => {
    // If not authenticated, prompt to login
    const token = typeof window !== 'undefined' ? localStorage.getItem('alemnypro_token') : null;
    if (!token) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      openAuthModal({ 
        reason: 'favorite',
        onSuccess: () => {
          // Delay slightly so modal closes first
          setTimeout(() => toggleFavorite(slug, tutorName), 100);
        }
      });
      return;
    }

    setFavorites((prev) => {
      const isAdding = !prev.includes(slug);
      const next = isAdding
        ? [...prev, slug]
        : prev.filter((s) => s !== slug);
      setStoredFavorites(next);

      if (isAdding) {
        const x = (event as MouseEvent)?.clientX ?? window.innerWidth / 2;
        const y = (event as MouseEvent)?.clientY ?? window.innerHeight / 2;
        dispatchFavoriteAdded(tutorName, x, y);
      }

      return next;
    });
  }, []);

  const addFavorite = useCallback((slug: string, tutorName = '', event?: MouseEvent | React.MouseEvent) => {
    // If not authenticated, prompt to login
    const token = typeof window !== 'undefined' ? localStorage.getItem('alemnypro_token') : null;
    if (!token) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      openAuthModal({ 
        reason: 'favorite',
        onSuccess: () => {
          setTimeout(() => addFavorite(slug, tutorName), 100);
        }
      });
      return;
    }

    setFavorites((prev) => {
      if (prev.includes(slug)) return prev;
      const next = [...prev, slug];
      setStoredFavorites(next);
      const x = (event as MouseEvent)?.clientX ?? window.innerWidth / 2;
      const y = (event as MouseEvent)?.clientY ?? window.innerHeight / 2;
      dispatchFavoriteAdded(tutorName, x, y);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.filter((s) => s !== slug);
      setStoredFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite };
}
