import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Favorite {
  id: string;
  userId: string;
  entityType: 'VENUE' | 'ARTIST';
  entityId: string;
  createdAt: string;
  entity?: any; // The actual venue or artist data
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const lastLoadTime = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  // Load user's favorites with caching
  const loadFavorites = useCallback(async (force = false) => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    // Prevent excessive API calls - cache for 30 seconds
    const now = Date.now();
    if (!force && now - lastLoadTime.current < 30000) {
      return;
    }

    // Prevent concurrent requests
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const result = await response.json();
        // Fix: Access favorites from the response object
        const data = result.favorites || result;
        setFavorites(data);
        
        // Create a set of favorite entity IDs for quick lookup
        const entityIds: string[] = data.map((fav: Favorite) => fav.entityId);
        const ids = new Set<string>(entityIds);
        setFavoriteIds(ids);
        lastLoadTime.current = now;
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user]);

  // Load favorites when user changes (only once)
  useEffect(() => {
    if (user && favorites.length === 0) {
      loadFavorites();
    }
  }, [user]); // Remove loadFavorites from dependencies to prevent loops

  // Add a favorite
  const addFavorite = useCallback(async (entityType: 'VENUE' | 'ARTIST', entityId: string) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entityType, entityId }),
      });

      if (response.ok) {
        // Add to local state immediately for optimistic UI
        setFavoriteIds(prev => new Set([...prev, entityId]));
        
        // Force reload favorites to get the full data
        setTimeout(() => loadFavorites(true), 100);
        return true;
      } else {
        const error = await response.json();
        console.error('Error adding favorite:', error);
        return false;
      }
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }, [user, loadFavorites]);

  // Remove a favorite
  const removeFavorite = useCallback(async (entityType: 'VENUE' | 'ARTIST', entityId: string) => {
    if (!user) return false;

    try {
      const response = await fetch(`/api/favorites?entityType=${entityType}&entityId=${entityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state immediately for optimistic UI
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(entityId);
          return newSet;
        });
        
        // Force reload favorites to sync with server
        setTimeout(() => loadFavorites(true), 100);
        return true;
      } else {
        const error = await response.json();
        console.error('Error removing favorite:', error);
        return false;
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }, [user, loadFavorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (entityType: 'VENUE' | 'ARTIST', entityId: string) => {
    const isFavorited = favoriteIds.has(entityId);
    
    if (isFavorited) {
      return await removeFavorite(entityType, entityId);
    } else {
      return await addFavorite(entityType, entityId);
    }
  }, [favoriteIds, addFavorite, removeFavorite]);

  // Check if an entity is favorited
  const isFavorited = useCallback((entityId: string) => {
    return favoriteIds.has(entityId);
  }, [favoriteIds]);

  // Get favorites by type
  const getFavoritesByType = useCallback((entityType: 'VENUE' | 'ARTIST') => {
    return favorites.filter(fav => fav.entityType === entityType);
  }, [favorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoritesByType,
    loadFavorites: () => loadFavorites(true) // Allow manual refresh
  };
} 