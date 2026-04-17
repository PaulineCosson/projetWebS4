<template>
  <div class="favorites-container">
    <h2>Mes Plages Favorites</h2>

    <div v-if="favorites.length === 0" class="empty-state">
      <p>Vous n'avez pas encore de plages favorites.</p>
      <button @click="$emit('go-map')" class="btn-primary">Explorer la carte</button>
    </div>

    <div v-else>
      <div class="controls-panel">
        <label class="control-item" for="sort-mode">
          Trier les favoris
          <select id="sort-mode" v-model="sortMode">
            <option value="none">Sans tri</option>
            <option value="wind-desc">Vent décroissant</option>
            <option value="temp-desc">Température décroissante</option>
          </select>
        </label>

        <label class="control-item checkbox-item">
          <input v-model="hideBadWeather" type="checkbox" />
          Uniquement les plages ensoleillées
        </label>
      </div>

      <p v-if="isLoadingWeather" class="status-row">Mise à jour météo des favoris...</p>

      <p v-if="displayedFavorites.length === 0" class="empty-state inline-empty">
        Aucune plage ne correspond au tri/filtre actuel.
      </p>

      <div v-else class="fav-grid">
        <div v-for="beach in displayedFavorites" :key="beach.id" class="fav-card">
          <div class="fav-info">
            <h3>{{ beach.name }}</h3>
            <p class="city-name">📍 {{ beach.city }}</p>
            <p class="weather-line" v-if="weatherByBeachId[beach.id]">
              💨 {{ getWindValue(weatherByBeachId[beach.id]) }} km/h
              · 🌡️ {{ getTemperatureValue(weatherByBeachId[beach.id]) }}°C
            </p>
            <p class="weather-line muted" v-else>Météo indisponible pour le tri avancé</p>
          </div>

          <div class="fav-actions">
            <button @click="$emit('view-details', beach)" class="btn-details">Météo</button>
            <button @click="$emit('remove', beach)" class="btn-remove">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { getTodayForecast } from '../services/weatherService';

const props = defineProps({
  favorites: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['go-map', 'view-details', 'remove']);

const METEO_TOKEN = import.meta.env.VITE_METEO_TOKEN;

const sortMode = ref('none');
const hideBadWeather = ref(false);
const isLoadingWeather = ref(false);
const weatherByBeachId = ref({});

function isBadWeather(weatherCode) {
  if (typeof weatherCode !== 'number') return false;
  return weatherCode > 2; // Nuageux à partir du code 3
}

function getWindValue(forecast) {
  return typeof forecast?.wind10m === 'number' ? forecast.wind10m : 0;
}

function getTemperatureValue(forecast) {
  if (typeof forecast?.tmax === 'number') return forecast.tmax;
  if (typeof forecast?.temp2m === 'number') return forecast.temp2m;
  if (typeof forecast?.tmin === 'number' && typeof forecast?.tmax === 'number') {
    return Math.round((forecast.tmin + forecast.tmax) / 2);
  }

  return 0;
}

const displayedFavorites = computed(() => {
  let list = props.favorites.map((favorite) => ({
    ...favorite,
    forecast: weatherByBeachId.value[favorite.id] ?? null,
  }));

  if (hideBadWeather.value) {
    list = list.filter((favorite) => favorite.forecast && !isBadWeather(favorite.forecast.weather));
  }

  if (sortMode.value === 'wind-desc') {
    return [...list].sort((a, b) => getWindValue(b.forecast) - getWindValue(a.forecast));
  }

  if (sortMode.value === 'temp-desc') {
    return [...list].sort((a, b) => getTemperatureValue(b.forecast) - getTemperatureValue(a.forecast));
  }

  return list;
});

async function refreshWeatherForFavorites() {
  if (props.favorites.length === 0) {
    weatherByBeachId.value = {};
    return;
  }

  isLoadingWeather.value = true;

  const weatherEntries = await Promise.all(
    props.favorites.map(async (favorite) => {
      try {
        const forecast = await getTodayForecast(favorite.lat, favorite.lon, METEO_TOKEN);
        return [favorite.id, forecast ?? null];
      } catch (error) {
        console.error(error);
        return [favorite.id, null];
      }
    })
  );

  weatherByBeachId.value = Object.fromEntries(weatherEntries);
  isLoadingWeather.value = false;
}

watch(
  () => props.favorites.map((favorite) => `${favorite.id}-${favorite.lat}-${favorite.lon}`).join('|'),
  () => {
    refreshWeatherForFavorites();
  },
  { immediate: true }
);
</script>

<style scoped>
.controls-panel {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 1rem;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
  color: #365265;
}

.control-item select {
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  border: 1px solid #c8d6e2;
  background: white;
  color: #365265;
  font-weight: 500;

}

.checkbox-item {
  flex-direction: row;
  align-items: center;
  gap: 0.55rem;
  background: white;
  border: 1px solid #c8d6e2;
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  min-height: 38px;
  cursor: pointer;
}

.checkbox-item input[type='checkbox'] {
  appearance: none;
  width: 18px;
  height: 18px;
  margin: 0;
  border: 1.5px solid #9ab0c3;
  border-radius: 5px;
  background: white;
  display: grid;
  place-content: center;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.checkbox-item input[type='checkbox']::before {
  content: '';
  width: 10px;
  height: 10px;
  transform: scale(0);
  transition: transform 0.2s ease;
  background: white;
  clip-path: polygon(14% 44%, 0 59%, 44% 100%, 100% 14%, 84% 0, 43% 62%);
}

.checkbox-item input[type='checkbox']:checked {
  background: #10324a;
  border-color: #10324a;
}

.checkbox-item input[type='checkbox']:checked::before {
  transform: scale(1);
}

.checkbox-item input[type='checkbox']:focus-visible {
  outline: 2px solid #91b9de;
  outline-offset: 2px;
}

.status-row {
  margin: 1rem 0 0;
  color: #4a6375;
  font-style: italic;
}

.inline-empty {
  margin-top: 1rem;
}

.fav-grid { display: grid; gap: 15px; margin-top: 20px; }
.fav-card {
  background: white; padding: 15px; border-radius: 12px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.fav-info h3 { margin: 0; font-size: 1.1rem; color: #333; }
.city-name { margin: 5px 0 0; color: #666; font-size: 0.9rem; }
.weather-line { margin: 6px 0 0; color: #24465f; font-size: 0.9rem; font-weight: 600; }
.weather-line.muted { color: #8294a1; font-weight: 500; }
.fav-actions { display: flex; gap: 10px; }
.btn-details { background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }
.btn-remove { background: #fee; border: none; padding: 8px; border-radius: 6px; cursor: pointer; }

@media (max-width: 640px) {
  .fav-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 0.85rem;
  }

  .fav-info {
    min-width: 0;
  }

  .fav-actions {
    justify-self: end;
    align-self: center;
    gap: 0.5rem;
  }

  .btn-details,
  .btn-remove {
    white-space: nowrap;
    min-height: 40px;
    padding: 0.6rem 0.8rem;
  }
}
</style>
