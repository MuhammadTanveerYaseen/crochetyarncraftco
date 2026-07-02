'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { graphqlRequest } from '@/lib/graphqlClient';

export interface FavoriteItem {
  _id: string;
  title: string;
  price: number;
  salePrice?: number;
  images: string[];
  category: string;
  difficulty: string;
  pdfUrl: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => Promise<void>;
  removeFavorite: (itemId: string) => void;
  isFavorited: (itemId: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { showToast } = useCart();

  // Load user email on mount to identify who favorited
  useEffect(() => {
    async function loadUser() {
      try {
        const query = `
          query GetFavoritesMe {
            me {
              email
            }
          }
        `;
        const data = await graphqlRequest(query);
        if (data && data.me) {
          setUserEmail(data.me.email);
        }
      } catch (err) {
        // Suppress unauthenticated errors
      }
    }
    loadUser();
  }, []);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yarncraft_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse favorites storage:', e);
      }
    }
  }, []);

  // Sync favorites to localStorage
  const saveFavorites = (newFavs: FavoriteItem[]) => {
    setFavorites(newFavs);
    localStorage.setItem('yarncraft_favorites', JSON.stringify(newFavs));
  };

  const isFavorited = (itemId: string) => {
    return favorites.some(item => item._id === itemId);
  };

  const addFavorite = async (item: FavoriteItem) => {
    if (isFavorited(item._id)) return;

    const newFavs = [...favorites, item];
    saveFavorites(newFavs);
    showToast(`"${item.title}" added to your favorites! ❤️`, 'success');

    // Notify admin via GraphQL mutation
    try {
      const mutation = `
        mutation NotifyAdminFav($productId: ID!, $userEmail: String) {
          notifyAdminProductFavorited(productId: $productId, userEmail: $userEmail)
        }
      `;
      await graphqlRequest(mutation, {
        productId: item._id,
        userEmail: userEmail || null
      });
    } catch (err) {
      console.error('Failed to send admin favorite email notification:', err);
    }
  };

  const removeFavorite = (itemId: string) => {
    const item = favorites.find(i => i._id === itemId);
    const newFavs = favorites.filter(i => i._id !== itemId);
    saveFavorites(newFavs);
    if (item) {
      showToast(`Removed "${item.title}" from favorites.`, 'info');
    }
  };

  const toggleFavorite = async (item: FavoriteItem) => {
    if (isFavorited(item._id)) {
      removeFavorite(item._id);
    } else {
      await addFavorite(item);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorited,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
