<template>
  <div class="weather-card" v-if="weather">
    <h2>Météo pour {{ beachName }}</h2>
    <div class="grid">
      <div>🌡 {{ weather.forecast.tmax }}°C</div>
      <div>🌧 {{ weather.forecast.probarain }}% de pluie</div>
      <div>💨 {{ weather.forecast.wind10m }} km/h</div>
    </div>
  </div>
</template>

<script setup>
defineProps(['weather', 'beachName']);
</script>
