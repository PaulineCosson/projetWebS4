<template>
  <main class="app-container">
    <h1>Météo des Plages 🏖️</h1>

    <div class="search-section">
      <input v-model="searchQuery" @keyup.enter="searchBeaches" placeholder="Ville (ex: Marseille)..." />
      <button @click="searchBeaches" :disabled="isLoading">Trouver</button>
    </div>

    <div ref="mapContainer" class="map-view"></div>

    <div v-if="errorMessage" class="error">{{ errorMessage }}</div>

    <div class="content-grid">
      <section v-if="beaches.length > 0" class="beach-list">
        <h2>Plages aux alentours</h2>
        <ul>
          <li v-for="beach in beaches" :key="beach.id" @click="showWeather(beach)">
            {{ beach.tags.name || 'Plage anonyme' }} <span>➔</span>
          </li>
        </ul>
      </section>

      <section v-if="selectedWeather" class="weather-detail">
        <h2>Météo à {{ selectedWeather.name }}</h2>
        <div class="weather-card">
          <p class="temp">{{ selectedWeather.data.temp2m }}°C</p>
          <p>Pluie : {{ selectedWeather.data.proprobailite }}%</p>
          <p>Vent : {{ selectedWeather.data.wind10m }} km/h</p>
          <p class="weather-info">Code météo : {{ selectedWeather.data.weather }}</p>
        </div>
      </section>
    </div>
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

// Fonction utilitaire pour traduire les codes de Météo-Concept
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

  beachList.forEach(beach => {
    const beachName = beach.tags.name || "Plage sans nom";
    const marker = L.marker([beach.lat, beach.lon]).addTo(markersLayer);

    // 1. On prépare le HTML de base du popup (avec un "Chargement...")
    const popupHtml = `
      <div style="text-align: center; min-width: 150px;">
        <strong style="display:block; margin-bottom:8px; font-size:1.1em;">${beachName}</strong>
        <div id="weather-${beach.id}" style="margin-bottom: 10px;">
          ⏳ <i>Chargement météo...</i>
        </div>
        <button id="btn-${beach.id}" style="background:#007bff; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; width: 100%;">
          Prévisions 7 jours ➔
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml);

    // 2. Événement : Quand on ouvre le popup en cliquant sur le marqueur
    marker.on('popupopen', async () => {
      const weatherContainer = document.getElementById(`weather-${beach.id}`);
      const detailButton = document.getElementById(`btn-${beach.id}`);

      // On prépare le clic sur le bouton pour la future page (Étape 2)
      detailButton.onclick = () => {
        console.log("Bientôt, on ira sur la page de détail pour :", beachName);
        // Nous mettrons le code de redirection ici à l'étape 2 !
      };

      try {
        // On fait l'appel API uniquement pour la plage cliquée
        const res = await axios.get(`https://api.meteo-concept.com/api/forecast/daily/0`, {
          params: { token: METEO_TOKEN, latlng: `${beach.lat},${beach.lon}` }
        });

        const forecast = res.data.forecast;
        const condition = getWeatherEmoji(forecast.weather);

        // On remplace le texte de chargement par les vraies données !
        weatherContainer.innerHTML = `
          <div style="font-weight:bold; color:#007bff; font-size:1.2em; margin-bottom:5px;">${condition}</div>
          🌡️ Température : <b>${forecast.temp2m}°C</b><br>
          💨 Vent : <b>${forecast.wind10m} km/h</b><br>
          ☔ Prob. pluie : <b>${forecast.proprobailite}%</b>
        `;
      } catch (error) {
        weatherContainer.innerHTML = `<span style="color:red;">❌ Météo indisponible</span>`;
      }
    });
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
