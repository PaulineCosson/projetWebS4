<template>
  <div class="app-shell">
    <SiteHeader
      :current-view="currentView"
      :favorites-count="favorites.length"
      @change-view="goToView"
    />

    <main class="app-container">
      <MapView
        v-show="isMapView"
        :favorites="favorites"
        :is-active="isMapView"
        @open-details="openDetails"
        @toggle-favorite="handleToggleFavorite"
        @search-city-change="updateLastSearchCity"
      />

      <FavoritesList
        v-if="isFavoritesView"
        :favorites="favorites"
        @go-map="goToView('map')"
        @remove="handleToggleFavorite"
        @view-details="openDetails"
      />

      <WeeklyForecast
        v-if="isDetailsView && beachForDetails"
        :beach="beachForDetails"
        :is-favorite="isFavorite(beachForDetails.id)"
        @toggle-favorite="toggleFavoriteFromDetails"
        @close="closeDetails"
      />

      <section v-else-if="isDetailsView" class="details-empty-state">
        <p>Sélectionne une plage sur la carte ou dans tes favoris pour voir ses prévisions.</p>
        <button type="button" @click="goToView('map')">Retour à la carte</button>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import WeeklyForecast from './components/features/forecast/WeeklyForecast.vue';
import FavoritesList from './components/features/favorites/FavoritesList.vue';
import MapView from './components/features/map/MapView.vue';
import SiteHeader from './components/layout/SiteHeader.vue';
import AppFooter from './components/layout/AppFooter.vue';
import { useFavorites } from './composables/useFavorites';

const router = useRouter();
const route = useRoute();

const selectedBeachForDetails = ref(null);
const lastSearchCity = ref('');

const { favorites, isFavorite, toggleFavorite } = useFavorites();

const isMapView = computed(() => route.name === 'map');
const isFavoritesView = computed(() => route.name === 'favorites');
const isDetailsView = computed(() => route.name === 'details');
const currentView = computed(() => {
  if (route.name === 'favorites') return 'favorites';
  if (route.name === 'details') return 'details';
  return 'map';
});

const beachFromRoute = computed(() => {
  if (route.name !== 'details') return null;

  const lat = Number(route.query.lat);
  const lon = Number(route.query.lon);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  const beachId = route.query.id ? Number(route.query.id) : `route-${lat}-${lon}`;
  const beachName = typeof route.query.name === 'string' && route.query.name
    ? route.query.name
    : 'Plage sans nom';

  return {
    id: beachId,
    lat,
    lon,
    name: beachName,
    tags: {
      name: beachName,
    },
  };
});

const beachForDetails = computed(() => selectedBeachForDetails.value ?? beachFromRoute.value);

const goToView = (viewName) => {
  if (viewName === 'favorites') {
    router.push({ name: 'favorites' });
    return;
  }

  router.push({ name: 'map' });
};

const openDetails = (beach) => {
  selectedBeachForDetails.value = beach;
  router.push({
    name: 'details',
    query: {
      id: String(beach.id),
      lat: String(beach.lat),
      lon: String(beach.lon),
      name: beach.tags?.name || beach.name || 'Plage sans nom',
    },
  });
  window.scrollTo(0, 0);
};

const handleToggleFavorite = (payloadOrBeach) => {
  if (!payloadOrBeach) return;

  if (payloadOrBeach.beach) {
    toggleFavorite(payloadOrBeach.beach, payloadOrBeach.city || lastSearchCity.value);
    return;
  }

  toggleFavorite(payloadOrBeach, lastSearchCity.value);
};

const toggleFavoriteFromDetails = () => {
  if (!beachForDetails.value) return;
  toggleFavorite(beachForDetails.value, lastSearchCity.value);
};

const updateLastSearchCity = (cityName) => {
  lastSearchCity.value = cityName;
};

const closeDetails = () => {
  selectedBeachForDetails.value = null;
  router.push({ name: 'map' });
};

watch(
  () => route.query,
  () => {
    if (route.name === 'details') {
      selectedBeachForDetails.value = beachFromRoute.value;
      return;
    }

    selectedBeachForDetails.value = null;
  },
  { immediate: true }
);

</script>

<style>
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

.details-empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #4a6375;
}

.details-empty-state p {
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .app-container {
    width: min(100%, calc(100% - 1rem));
    padding: 0.75rem 0 1.5rem;
  }

}

</style>
