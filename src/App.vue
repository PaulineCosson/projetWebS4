<template>
  <div class="app-shell">
    <SiteHeader
      :current-view="currentView"
      :favorites-count="favorites.length"
      @change-view="currentView = $event"
    />

    <main class="app-container">
      <section v-show="currentView === 'map'" class="map-page">
        <div class="search-section">
          <input
            v-model="searchQuery"
            @keyup.enter="searchBeaches"
            placeholder="Ville (ex: Marseille)..."
          />
          <button @click="searchBeaches" :disabled="isLoading">Trouver</button>
        </div>

        <div ref="mapContainer" class="map-view"></div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </section>

      <FavoritesList
        v-if="currentView === 'favorites'"
        :favorites="favorites"
        @go-map="currentView = 'map'"
        @remove="toggleFavorite"
        @view-details="openDetails"
      />

      <WeeklyForecast
        v-if="currentView === 'details' && selectedBeachForDetails"
        :beach="selectedBeachForDetails"
        :is-favorite="favorites.some((favorite) => favorite.id === selectedBeachForDetails.id)"
        @toggle-favorite="toggleFavorite(selectedBeachForDetails)"
        @close="closeDetails"
      />
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import axios from 'axios';
import L from 'leaflet';
import WeeklyForecast from './components/WeeklyForecast.vue';
import FavoritesList from './components/FavoritesList.vue';
import SiteHeader from './components/SiteHeader.vue';
import AppFooter from './components/AppFooter.vue';
import 'leaflet/dist/leaflet.css';

const METEO_TOKEN = import.meta.env.VITE_METEO_TOKEN;

const searchQuery = ref('');
const beaches = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const selectedBeachForDetails = ref(null);
const currentView = ref('map');
const favorites = ref(loadFavorites());

function loadFavorites() {
  try {
    const storedFavorites = localStorage.getItem('beach-favorites');
    return storedFavorites ? JSON.parse(storedFavorites) : [];
  } catch {
    return [];
  }
}

const openDetails = (beach) => {
  selectedBeachForDetails.value = beach;
  currentView.value = 'details';
  window.scrollTo(0, 0);
};

const mapContainer = ref(null);
let map = null;
let markersLayer = null;

const initMap = () => {
  if (map) return;
  map = L.map(mapContainer.value).setView([46.2276, 2.2137], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
};

const getWeatherEmoji = (code) => {
  if (code === 0) return '☀️ Soleil';
  if (code >= 1 && code <= 5) return '⛅ Éclaircies / Nuages';
  if (code >= 10 && code <= 16) return '🌧️ Pluie';
  if (code >= 20 && code <= 22) return '❄️ Neige';
  if (code >= 100 && code <= 142) return '⛈️ Orage';
  return '☁️ Couvert'; // Par défaut
};

const updateMap = (lat, lon, beachList) => {
  if (!map) initMap();
  markersLayer.clearLayers();
  map.setView([lat, lon], 11);
  const isFavorite = (id) => favorites.value.some((favorite) => favorite.id === id);

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
      const likeBtn = document.getElementById(`like-${beach.id}`);

      if (!weatherContainer || !detailButton || !likeBtn) {
        return;
      }

      detailButton.onclick = () => {
        openDetails(beach);
      };

      try {
        const res = await axios.get(`https://api.meteo-concept.com/api/forecast/daily/0`, {
          params: { token: METEO_TOKEN, latlng: `${beach.lat},${beach.lon}` },
        });

        const forecast = res.data.forecast;
        const condition = getWeatherEmoji(forecast.weather);

        weatherContainer.innerHTML = `
          <div style="font-weight:bold; color:#007bff; font-size:1.2em; margin-bottom:5px;">${condition}</div>
          💨 Vent : <b>${forecast.wind10m} km/h</b><br>
          ⏩ Rafale : <b>${forecast.gust10m} km/h</b><br>
          ☔ Prob. pluie : <b>${forecast.probarain}%</b>
        `;
      } catch (error) {
        console.error(error);
        weatherContainer.innerHTML = `<span style="color:red;">❌ Météo indisponible</span>`;
      }

      likeBtn.onclick = () => {
        toggleFavorite(beach);
        likeBtn.innerText = isFavorite(beach.id) ? '❤️' : '🤍';
      };

    });
  });
};

onMounted(() => {
  initMap();
});

const searchBeaches = async () => {
  if (!searchQuery.value) return;
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: searchQuery.value, format: 'json', limit: 1 },
    });

    if (geoRes.data.length === 0) throw new Error('Ville introuvable.');
    const { lat, lon } = geoRes.data[0];

    const query = `[out:json];node["natural"="beach"](around:30000,${lat},${lon});out;`;
    const overpassRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

    beaches.value = overpassRes.data.elements;

    // Mettre à jour la carte avec les nouvelles données
    updateMap(lat, lon, beaches.value);

    if (beaches.value.length === 0) errorMessage.value = 'Aucune plage trouvée.';
  } catch (error) {
    console.error(error);
    errorMessage.value = error instanceof Error ? error.message : 'Erreur de recherche.';
  } finally {
    isLoading.value = false;
  }
};

const closeDetails = () => {
  currentView.value = 'map';
  selectedBeachForDetails.value = null;
  nextTick(() => {
    if (map) map.invalidateSize();
  });
};

const toggleFavorite = (beach) => {
  if (!beach) return;

  const index = favorites.value.findIndex((favorite) => favorite.id === beach.id);
  if (index > -1) {
    favorites.value.splice(index, 1);
  } else {
    favorites.value.push({
      id: beach.id,
      name: beach.tags?.name || 'Plage sans nom',
      city: searchQuery.value,
      lat: beach.lat,
      lon: beach.lon,
      tags: beach.tags,
    });
  }
};

watch(favorites, (newFavs) => {
  localStorage.setItem('beach-favorites', JSON.stringify(newFavs));
}, { deep: true });

watch(currentView, (newView) => {
  if (newView === 'map') {
    nextTick(() => {
      if (map) {
        map.invalidateSize();
      }
    });
  }
});

</script>

<style>
body {
  font-family: 'Segoe UI', sans-serif;
  background:
    radial-gradient(circle at top, rgba(110, 184, 255, 0.2), transparent 40%),
    linear-gradient(180deg, #eef7fb 0%, #f7f9fb 100%);
  margin: 0;
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1rem 0 2rem;
  flex: 1;
}

.search-section {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 2rem;
}

input {
  padding: 12px;
  border: 1px solid #cfdbe6;
  border-radius: 999px;
  width: min(100%, 34rem);
  background: rgba(255, 255, 255, 0.9);
}

button {
  padding: 12px 20px;
  background: #10324a;
  color: white;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

button:disabled {
  background: #9ca6af;
}

.error {
  color: #b42318;
  font-weight: 700;
  text-align: center;
}

.map-view {
  height: 400px;
  width: 100%;
  border-radius: 12px;
  margin-bottom: 2rem;
  z-index: 1; /* Pour éviter que la carte passe au dessus d'éventuels menus */
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

@media (max-width: 640px) {
  .search-section {
    flex-direction: column;
  }

  input,
  button {
    width: 100%;
  }
}

</style>
