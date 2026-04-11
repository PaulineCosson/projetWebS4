<template>
  <main class="app-container">
    <h1>Météo des Plages 🏖️</h1>

    <div class="search-section">
      <input v-model="searchQuery" @keyup.enter="searchBeaches" placeholder="Ville (ex: Marseille)..." />
      <button @click="searchBeaches" :disabled="isLoading">Trouver</button>
    </div>

    <div ref="mapContainer" class="map-view"></div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <div class="content-grid"> ... </div>
  </main>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import important pour l'affichage de la carte

const METEO_TOKEN = import.meta.env.VITE_METEO_TOKEN;

const searchQuery = ref('');
const beaches = ref([]);
const selectedWeather = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');

// --- LOGIQUE DE LA CARTE ---
const mapContainer = ref(null);
let map = null;
let markersLayer = null;

const initMap = () => {
  if (map) return; // Ne pas réinitialiser si elle existe déjà
  map = L.map(mapContainer.value).setView([46.2276, 2.2137], 5); // Centré sur la France par défaut
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
};

const updateMap = (lat, lon, beachList) => {
  if (!map) initMap();

  // On vide les anciens marqueurs
  markersLayer.clearLayers();

  // On centre la carte sur la ville recherchée
  map.setView([lat, lon], 11);

  // On ajoute un marqueur pour chaque plage
  beachList.forEach(beach => {
    const marker = L.marker([beach.lat, beach.lon])
      .addTo(markersLayer)
      .bindPopup(beach.tags.name || "Plage");

    // Si on clique sur le marqueur, on lance la météo
    marker.on('click', () => showWeather(beach));
  });
};

// On initialise la carte au montage du composant
onMounted(() => {
  initMap();
});

// --- RECHERCHE ---
const searchBeaches = async () => {
  if (!searchQuery.value) return;
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: searchQuery.value, format: 'json', limit: 1 }
    });

    if (geoRes.data.length === 0) throw new Error("Ville introuvable.");
    const { lat, lon } = geoRes.data[0];

    const query = `[out:json];node["natural"="beach"](around:30000,${lat},${lon});out;`;
    const overpassRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

    beaches.value = overpassRes.data.elements;

    // Mettre à jour la carte avec les nouvelles données
    updateMap(lat, lon, beaches.value);

    if (beaches.value.length === 0) errorMessage.value = "Aucune plage trouvée.";
  } catch (err) {
    errorMessage.value = "Erreur de recherche.";
  } finally {
    isLoading.value = false;
  }
};

const showWeather = async (beach) => {
  try {
    const res = await axios.get(`https://api.meteo-concept.com/api/forecast/daily/0`, {
      params: { token: METEO_TOKEN, latlng: `${beach.lat},${beach.lon}` }
    });
    selectedWeather.value = {
      name: beach.tags.name || "Plage sans nom",
      data: res.data.forecast
    };
  } catch (err) {
    alert("Erreur météo.");
  }
};
</script>

<style>
body { font-family: 'Segoe UI', sans-serif; background: #eef2f3; margin: 0; }
.app-container { max-width: 900px; margin: 0 auto; padding: 2rem; text-align: center; }

.search-section { display: flex; gap: 10px; justify-content: center; margin-bottom: 2rem; }
input { padding: 12px; border: 1px solid #ccc; border-radius: 8px; width: 60%; }
button { padding: 12px 20px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; }
button:disabled { background: #ccc; }

.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: left; }
@media (max-width: 600px) { .content-grid { grid-template-columns: 1fr; } }

.beach-list ul { list-style: none; padding: 0; }
.beach-list li {
  background: white; padding: 15px; margin-bottom: 8px; border-radius: 8px;
  cursor: pointer; display: flex; justify-content: space-between; transition: 0.2s;
}
.beach-list li:hover { background: #007bff; color: white; }

.weather-card { background: #fff; padding: 20px; border-radius: 12px; border-left: 5px solid #007bff; }
.temp { font-size: 2.5rem; font-weight: bold; margin: 0; color: #007bff; }
.error { color: red; font-weight: bold; }

.map-view {
  height: 400px;
  width: 100%;
  border-radius: 12px;
  margin-bottom: 2rem;
  z-index: 1; /* Pour éviter que la carte passe au dessus d'éventuels menus */
  border: 2px solid #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>
