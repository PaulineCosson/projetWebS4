<template>
  <header class="site-header">
    <div class="brand-block">
      <h1>Météo des Plages</h1>
      <p class="subtitle">
        Recherche une plage, compare les conditions et garde tes spots favoris à portée de main.
      </p>
    </div>

    <nav class="main-nav" aria-label="Navigation principale">
      <button
        type="button"
        :class="{ active: currentView === 'map' }"
        @click="$emit('change-view', 'map')"
      >
        Carte
      </button>
      <button
        type="button"
        :class="{ active: currentView === 'favorites' }"
        @click="$emit('change-view', 'favorites')"
      >
        Favoris ({{ favoritesCount }})
      </button>
    </nav>
  </header>
</template>

<script setup>
defineProps({
  currentView: {
    type: String,
    required: true,
  },
  favoritesCount: {
    type: Number,
    required: true,
  },
});

defineEmits(['change-view']);
</script>

<style scoped>
.site-header {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-end;
}

.brand-block {
  text-align: left;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  color: #10324a;
}

.subtitle {
  margin: 0.5rem 0 0;
  max-width: 42rem;
  color: #4a6375;
  line-height: 1.5;
}

.main-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.main-nav button {
  background: rgba(255, 255, 255, 0.75);
  color: #24465f;
  border: 1px solid rgba(36, 70, 95, 0.16);
  font-weight: 700;
  padding: 0.85rem 1.15rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease,
    border-color 0.2s ease;
  backdrop-filter: blur(10px);
}

.main-nav button:hover {
  transform: translateY(-1px);
}

.main-nav button.active {
  background: #10324a;
  color: white;
  border-color: #10324a;
}

@media (max-width: 640px) {
  .site-header {
    width: min(100%, calc(100% - 1rem));
    padding: 1rem 0 0.75rem;
    gap: 1rem;
  }

  .brand-block,
  .main-nav {
    width: 100%;
  }

  .brand-block {
    text-align: center;
  }

  h1 {
    font-size: clamp(1.7rem, 8vw, 2.25rem);
  }

  .subtitle {
    max-width: none;
    font-size: 0.95rem;
  }

  .main-nav button {
    flex: 1 1 0;
    padding: 0.8rem 0.9rem;
    min-height: 44px;
  }
}
</style>
