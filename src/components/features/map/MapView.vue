<template>
  <section class="map-page">
    <div class="search-section">
      <input
        v-model="searchQuery"
        @keyup.enter="searchBeaches"
        placeholder="Ville (ex: Marseille)..."
      />
      <button @click="searchBeaches" :disabled="isLoading">Trouver</button>
    </div>

    <div class="radius-control">
      <label for="radius-slider">Rayon de recherche: {{ searchRadiusKm }} km</label>
      <input
        id="radius-slider"
        v-model.number="searchRadiusKm"
        type="range"
        min="5"
        max="80"
        step="5"
      />
    </div>

    <p v-if="isRadiusUpdatePending && !isLoading" class="status-row">
      Mise a jour du rayon...
    </p>

    <div ref="mapContainer" class="map-view"></div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import { getCityCoordinates } from '../../../services/api/geocodingService';
import { getBeachesAround } from '../../../services/api/beachService';
import { getTodayForecast } from '../../../services/api/weatherService';
import { readNumberFromStorage, writeStringToStorage } from '../../../composables/useLocalStorage';
import { getWeatherLabel } from '../../../utils/weatherCode';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  favorites: {
    type: Array,
    default: () => [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['open-details', 'toggle-favorite', 'search-city-change']);

const METEO_TOKEN = import.meta.env.VITE_METEO_TOKEN;
const SEARCH_RADIUS_STORAGE_KEY = 'beach-search-radius-km';

const searchQuery = ref('');
const beaches = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const searchRadiusKm = ref(readNumberFromStorage(SEARCH_RADIUS_STORAGE_KEY, 30, 5, 80));
const lastSearchCenter = ref(null);
const isRadiusUpdatePending = ref(false);

const mapContainer = ref(null);
let map = null;
let markersLayer = null;
let latestRequestId = 0;
let radiusSearchDebounceTimer = null;

const isFavorite = (beachId) => props.favorites.some((favorite) => favorite.id === beachId);

const initMap = () => {
  if (map || !mapContainer.value) return;

  map = L.map(mapContainer.value).setView([46.2276, 2.2137], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
};

const updateMap = (lat, lon, beachList) => {
  if (!map) {
    initMap();
  }

  if (!map || !markersLayer) return;

  markersLayer.clearLayers();
  map.setView([lat, lon], 11);

  beachList.forEach((beach) => {
    const beachName = beach.tags?.name || 'Plage sans nom';
    const marker = L.marker([beach.lat, beach.lon]).addTo(markersLayer);
    const heartIcon = isFavorite(beach.id) ? '❤️' : '🤍';

    const popupHtml = `
      <div style="text-align: center; min-width: 160px;">
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom:8px;">
          <strong style="font-size:1.1em;">${beachName}</strong>
          <button id="like-${beach.id}" style="background:none; border:none; cursor:pointer; font-size:1.5rem; padding:0;">${heartIcon}</button>
        </div>
        <div id="weather-${beach.id}" style="margin-bottom: 10px; font-size: 0.9em;">...</div>
        <button id="btn-${beach.id}" style="background:#007bff; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer; width: 100%;">
          Détails 7 jours
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on('popupopen', async () => {
      const weatherContainer = document.getElementById(`weather-${beach.id}`);
      const detailButton = document.getElementById(`btn-${beach.id}`);
      const likeButton = document.getElementById(`like-${beach.id}`);

      if (!weatherContainer || !detailButton || !likeButton) {
        return;
      }

      detailButton.onclick = () => {
        emit('open-details', beach);
      };

      try {
        const forecast = await getTodayForecast(beach.lat, beach.lon, METEO_TOKEN);
        const condition = getWeatherLabel(forecast.weather);

        weatherContainer.innerHTML = `
          <div style="font-weight:bold; color:#007bff; font-size:1.2em; margin-bottom:5px;">${condition}</div>
          💨 Vent : <b>${forecast.wind10m} km/h</b><br>
          ⏩ Rafale : <b>${forecast.gust10m} km/h</b><br>
          ☔ Prob. pluie : <b>${forecast.probarain}%</b>
        `;
      } catch {
        weatherContainer.innerHTML = '<span style="color:red;">❌ Météo indisponible</span>';
      }

      likeButton.onclick = () => {
        const wasFavorite = isFavorite(beach.id);
        emit('toggle-favorite', {
          beach,
          city: searchQuery.value,
        });
        likeButton.innerText = wasFavorite ? '🤍' : '❤️';
      };
    });
  });
};

const fetchBeachesFromCenter = async (lat, lon, cityName) => {
  const requestId = ++latestRequestId;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    beaches.value = await getBeachesAround(lat, lon, searchRadiusKm.value * 1000);

    // Ignore stale responses when multiple searches overlap.
    if (requestId !== latestRequestId) {
      return;
    }

    emit('search-city-change', cityName);
    updateMap(lat, lon, beaches.value);

    if (beaches.value.length === 0) {
      errorMessage.value = 'Aucune plage trouvée.';
    }
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }

    errorMessage.value = error instanceof Error ? error.message : 'Erreur de recherche.';
  } finally {
    if (requestId === latestRequestId) {
      isLoading.value = false;
    }
  }
};

const searchBeaches = async () => {
  if (!searchQuery.value) return;

  if (radiusSearchDebounceTimer) {
    clearTimeout(radiusSearchDebounceTimer);
    radiusSearchDebounceTimer = null;
  }
  isRadiusUpdatePending.value = false;

  try {
    const { lat, lon } = await getCityCoordinates(searchQuery.value);

    lastSearchCenter.value = {
      lat,
      lon,
      cityName: searchQuery.value,
    };

    await fetchBeachesFromCenter(lat, lon, searchQuery.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erreur de recherche.';
  }
};

onMounted(() => {
  initMap();
});

watch(searchRadiusKm, (newRadius) => {
  writeStringToStorage(SEARCH_RADIUS_STORAGE_KEY, newRadius);

  if (!lastSearchCenter.value) {
    return;
  }

  isRadiusUpdatePending.value = true;

  if (radiusSearchDebounceTimer) {
    clearTimeout(radiusSearchDebounceTimer);
  }

  // Debounce to avoid flooding Overpass when the slider is dragged.
  radiusSearchDebounceTimer = setTimeout(() => {
    isRadiusUpdatePending.value = false;
    const { lat, lon, cityName } = lastSearchCenter.value;
    fetchBeachesFromCenter(lat, lon, cityName);
  }, 700);
});

watch(
  () => props.isActive,
  (isMapActive) => {
    if (!isMapActive) return;

    nextTick(() => {
      if (map) {
        map.invalidateSize();
      }
    });
  }
);

onBeforeUnmount(() => {
  if (radiusSearchDebounceTimer) {
    clearTimeout(radiusSearchDebounceTimer);
  }

  isRadiusUpdatePending.value = false;
});
</script>

<style scoped>
.search-section {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 1rem;
  width: min(100%, 34rem);
  margin-left: auto;
  margin-right: auto;
}

.radius-control {
  margin: 0 auto 1.25rem;
  width: min(100%, 34rem);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: #24465f;
  font-weight: 600;
}

.radius-control input[type='range'] {
  width: 100%;
  accent-color: #10324a;
}

.error {
  color: #b42318;
  font-weight: 700;
  text-align: center;
}

.status-row {
  margin: 0 auto 0.75rem;
  width: min(100%, 34rem);
  color: #4a6375;
  font-style: italic;
}

.map-view {
  height: 400px;
  width: 100%;
  border-radius: 12px;
  margin-bottom: 2rem;
  z-index: 1;
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .search-section {
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-section,
  .radius-control {
    width: 100%;
  }

  .radius-control {
    font-size: 0.95rem;
  }

  .map-view {
    height: 320px;
    margin-bottom: 1.25rem;
  }
}
</style>
