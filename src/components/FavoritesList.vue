<template>
  <div class="favorites-container">
    <h2>Mes Plages Favorites</h2>

    <div v-if="favorites.length === 0" class="empty-state">
      <p>Vous n'avez pas encore de plages favorites.</p>
      <button @click="$emit('go-map')" class="btn-primary">Explorer la carte</button>
    </div>

    <div v-else class="fav-grid">
      <div v-for="beach in favorites" :key="beach.id" class="fav-card">
        <div class="fav-info">
          <h3>{{ beach.name }}</h3>
          <p class="city-name">📍 {{ beach.city }}</p>
        </div>
        <div class="fav-actions">
          <button @click="$emit('view-details', beach)" class="btn-details">Météo</button>
          <button @click="$emit('remove', beach)" class="btn-remove">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps(['favorites']);
defineEmits(['go-map', 'view-details', 'remove']);
</script>

<style scoped>
.fav-grid { display: grid; gap: 15px; margin-top: 20px; }
.fav-card {
  background: white; padding: 15px; border-radius: 12px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.fav-info h3 { margin: 0; font-size: 1.1rem; color: #333; }
.city-name { margin: 5px 0 0; color: #666; font-size: 0.9rem; }
.fav-actions { display: flex; gap: 10px; }
.btn-details { background: #007bff; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; }
.btn-remove { background: #fee; border: none; padding: 8px; border-radius: 6px; cursor: pointer; }
</style>
