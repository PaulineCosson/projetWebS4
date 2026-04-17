<template>
  <div class="weekly-container">
    <div class="header-actions">
      <button class="back-btn" @click="$emit('close')">⬅ Retour</button>
      <button class="like-btn" @click="$emit('toggle-favorite')">
        {{ isFavorite ? '❤️' : '🤍' }}
      </button>
    </div>

    <h2>{{ beach?.tags?.name || beach?.name }}</h2>

    <div v-if="isLoading" class="loading">⏳ Chargement des segments de journée...</div>
    <p v-else-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div v-else-if="forecastDays.length">
      <div v-for="(day, index) in forecastDays" :key="index" class="day-group">
        <h3 class="date-title">{{ formatDate(day[0].datetime) }}</h3>

        <div class="table-wrapper">
          <table class="wind-table">
            <thead>
              <tr>
                <th>Moment</th>
                <th>Vent</th>
                <th>Rafales</th>
                <th>Direction</th>
                <th>Météo</th>
                <th>Pluie</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in day" :key="slot.period">
                <td class="hour">{{ getPeriodName(slot.period) }}</td>
                <td class="wind-speed">
                  {{ slot.wind10m }} <span class="unit">km/h</span>
                </td>
                <td class="wind-speed">
                  {{ slot.gust10m }} <span class="unit">km/h</span>
                </td>
                <td class="wind-dir">
                  <div class="arrow" :style="{ transform: `rotate(${slot.dirwind10m}deg)` }">↓</div>
                  <span class="deg">{{ slot.dirwind10m }}°</span>
                </td>
                <td class="emoji">{{ getWeatherEmoji(slot.weather) }}</td>
                <td class="rain">{{ slot.probarain }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <p v-else class="empty-state">Aucune prévision disponible pour cette plage.</p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getWeeklyForecastByPeriod } from '../services/weatherService';

const props = defineProps({
  beach: {
    type: Object,
    default: null,
  },
  isFavorite: Boolean,
});
defineEmits(['close', 'toggle-favorite']);

const METEO_TOKEN = import.meta.env.VITE_METEO_TOKEN;
const forecastDays = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

const getWeatherEmoji = (code) => {
  if (code === 0) return '☀️';
  if (code >= 1 && code <= 5) return '⛅';
  if (code >= 10 && code <= 16) return '🌧️';
  if (code >= 100 && code <= 142) return '⛈️';
  return '☁️';
};

const getPeriodName = (periodIndex) => {
  const names = ["Nuit", "Matin", "Après-midi", "Soirée"];
  return names[periodIndex] || "N/A";
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const loadForecast = async () => {
  if (props.beach?.lat == null || props.beach?.lon == null) {
    forecastDays.value = [];
    errorMessage.value = 'Impossible de charger la météo de cette plage.';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';
    const weeklyForecast = await getWeeklyForecastByPeriod(props.beach.lat, props.beach.lon, METEO_TOKEN);
    forecastDays.value = weeklyForecast.slice(0, 7);

  } catch (error) {
    console.error('Erreur API :', error);
    forecastDays.value = [];
    errorMessage.value = 'La météo est temporairement indisponible.';
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.beach,
  () => {
    loadForecast();
  },
  { immediate: true }
);
</script>

<style scoped>
.day-group {
  background: white;
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
.date-title {
  background: #007bff;
  color: white;
  margin: 0;
  padding: 10px 20px;
  text-transform: capitalize;
  font-size: 1rem;
}
.table-wrapper { overflow-x: auto; }
.wind-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}
.wind-table th {
  background: #f8f9fa;
  padding: 10px;
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
}
.wind-table td {
  padding: 12px 10px;
  border-top: 1px solid #eee;
}
.hour {
  font-weight: bold;
  color: #333;
}
.emoji { font-size: 1.5rem; }
.wind-speed {
  color: #007bff;
  font-weight: bold;
  font-size: 1.1rem; }
.unit { font-size: 0.7rem; color: #999; }
.wind-dir {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.arrow {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  width: 30px;
  height: 30px;
  transition: transform 0.5s ease;
}
.deg { font-size: 0.65rem; color: #888; }
.back-btn {
  background: #333;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 20px;
  margin-top: 10px;
}
.loading { padding: 20px; font-style: italic; }

.error,
.empty-state {
  padding: 20px;
  text-align: center;
  color: #5b6772;
}

.error {
  color: #b42318;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.like-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  margin-left: 8px;
}

@media (max-width: 640px) {
  .weekly-container {
    width: 100%;
  }

  .header-actions {
    gap: 0.75rem;
    align-items: stretch;
  }

  .back-btn,
  .like-btn {
    flex: 1 1 0;
    min-height: 44px;
    padding: 0.75rem 0.9rem;
    margin: 0;
  }

  h2 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
  }

  .day-group {
    margin-bottom: 1rem;
  }

  .date-title {
    padding: 0.8rem 1rem;
    font-size: 0.95rem;
  }

  .table-wrapper {
    -webkit-overflow-scrolling: touch;
  }

  .wind-table th,
  .wind-table td {
    padding: 0.65rem 0.45rem;
  }

  .wind-table th {
    font-size: 0.68rem;
  }

  .hour,
  .wind-speed,
  .rain {
    font-size: 0.86rem;
  }

  .emoji {
    font-size: 1.2rem;
  }

  .arrow {
    width: 24px;
    height: 24px;
    font-size: 1.15rem;
  }

  .deg {
    font-size: 0.58rem;
  }
}

</style>
