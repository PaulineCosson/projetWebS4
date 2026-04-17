import { ref, watch } from 'vue';
import { readJsonFromStorage, writeJsonToStorage } from './useLocalStorage';

const FAVORITES_STORAGE_KEY = 'beach-favorites';

export function useFavorites() {
  const favorites = ref(readJsonFromStorage(FAVORITES_STORAGE_KEY, []));

  const isFavorite = (beachId) => favorites.value.some((favorite) => favorite.id === beachId);

  const toggleFavorite = (beach, city = '') => {
    if (!beach) return;

    const beachId = beach.id;
    const favoriteIndex = favorites.value.findIndex((favorite) => favorite.id === beachId);

    if (favoriteIndex > -1) {
      favorites.value.splice(favoriteIndex, 1);
      return;
    }

    favorites.value.push({
      id: beachId,
      name: beach.tags?.name || beach.name || 'Plage sans nom',
      city,
      lat: beach.lat,
      lon: beach.lon,
      tags: beach.tags,
    });
  };

  watch(
    favorites,
    (newFavorites) => {
      writeJsonToStorage(FAVORITES_STORAGE_KEY, newFavorites);
    },
    { deep: true }
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
  };
}
