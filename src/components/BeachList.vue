<template>
  <div class="list-container">
    <h3>Plages trouvées ({{ beaches.length }})</h3>
    <div v-for="beach in beaches" :key="beach.id"
         class="beach-item" @click="$emit('select', beach)">
      {{ beach.name }}
    </div>
  </div>
</template>

<script setup>
defineProps(['beaches']);
defineEmits(['select']);
</script>
