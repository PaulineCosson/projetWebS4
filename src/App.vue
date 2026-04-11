<template>
  <main class="app-container">
    <h1>Météo des Plages 🏖️</h1>

    <div class="search-section">
      <input
        v-model="searchQuery"
        @keyup.enter="searchBeaches"
        placeholder="Entrez une ville (ex: Biarritz)..."
      />
      <button @click="searchBeaches" :disabled="isLoading">
        {{ isLoading ? 'Recherche...' : 'Trouver des plages' }}
      </button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

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
import { ref } from 'vue';
import axios from 'axios';

const METEO_TOKEN = import.meta.env.VITE_METEO_TOKEN;

// --- ÉTATS (REFS) ---
const searchQuery = ref('');      // Ce que l'utilisateur tape
const beaches = ref([]);          // Liste des plages trouvées
const selectedWeather = ref(null); // Météo de la plage sélectionnée
const isLoading = ref(false);     // Pour afficher un message de chargement
const errorMessage = ref('');     // Pour gérer les erreurs

// --- MÉTHODES ---

// Étape A : Rechercher la ville et les plages
const searchBeaches = async () => {
  if (!searchQuery.value) return;

  isLoading.value = true;
  errorMessage.value = '';
  beaches.value = [];
  selectedWeather.value = null;

  try {
    // 1. Géocodage
    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: searchQuery.value, format: 'json', limit: 1 }
    });

    if (geoRes.data.length === 0) throw new Error("Ville introuvable.");
    const { lat, lon } = geoRes.data[0];

    // 2. Recherche des plages (30km autour)
    const query = `[out:json];node["natural"="beach"](around:30000,${lat},${lon});out;`;
    const overpassRes = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);

    beaches.value = overpassRes.data.elements;
    if (beaches.value.length === 0) errorMessage.value = "Aucune plage trouvée dans les 30km.";

  } catch (err) {
    errorMessage.value = "Erreur lors de la recherche. Réessayez.";
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

// Étape B : Voir la météo d'une plage spécifique
const showWeather = async (beach) => {
  try {
    const res = await axios.get(`https://api.meteo-concept.com/api/forecast/daily/0`, {
      params: {
        token: METEO_TOKEN,
        latlng: `${beach.lat},${beach.lon}`
      }
    });
    selectedWeather.value = {
      name: beach.tags.name || "Plage sans nom",
      data: res.data.forecast
    };
    // On scrolle vers la météo pour mobile
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } catch (err) {
    alert("Impossible de récupérer la météo.");
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
</style>
