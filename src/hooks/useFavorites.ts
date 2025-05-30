import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Favorite {
  id: string;
  userId: string;
  entityType: 'VENUE' | 'ARTIST';
  entityId: string;
  createdAt: string;
  entity: any; // The actual venue or artist data
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load user's favorites
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        
        // Create a set of favorite entity IDs for quick lookup
        const entityIds: string[] = data.map((fav: Favorite) => fav.entityId);
        const ids = new Set<string>(entityIds);
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load favorites when user changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

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
        
        // Reload favorites to get the full data
        await loadFavorites();
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
        
        // Reload favorites to sync with server
        await loadFavorites();
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
    loadFavorites
  };
} 