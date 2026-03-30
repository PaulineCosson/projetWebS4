<template>
  <div id="app">
    <h1>Beach & Weather Finder</h1>

    <SearchBar @search="handleSearch" />

    <div class="main-layout" v-if="beaches.length">
      <BeachList :beaches="beaches" @select="fetchWeather" />
      <WeatherDetails :weather="selectedWeather" :beachName="selectedBeach?.name" />
    </div>

    <p v-if="loading">Traitement en cours...</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from './services/geoWeatherService';
import SearchBar from './components/SearchBar.vue';
import BeachList from './components/BeachList.vue';
import WeatherDetails from './components/WeatherDetails.vue';

const beaches = ref([]);
const selectedBeach = ref(null);
const selectedWeather = ref(null);
const loading = ref(false);

async function handleSearch(city) {
  loading.value = true;
  beaches.value = [];
  selectedWeather.value = null;
  try {
    const coords = await api.getCityCoords(city);
    beaches.value = await api.getBeaches(coords.lat, coords.lon);
  } catch (e) {
    alert(e.message);
  } finally {
    loading.value = false;
  }
}

async function fetchWeather(beach) {
  selectedBeach.value = beach;
  selectedWeather.value = null; // Reset le temps du chargement
  try {
    selectedWeather.value = await api.getWeather(beach.lat, beach.lon);
  } catch (e) {
    alert("Erreur météo");
  }
}
</script>

<style>
.main-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
.beach-item { padding: 10px; border: 1px solid #ddd; margin-bottom: 5px; cursor: pointer; transition: 0.2s; }
.beach-item:hover { background: #e3f2fd; }
.weather-card { padding: 20px; background: #f9f9f9; border-radius: 12px; border-left: 5px solid #2196f3; }
</style>
