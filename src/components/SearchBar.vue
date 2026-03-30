<template>
  <div class="search-box">
    <input v-model="city" @keyup.enter="submit" placeholder="Quelle ville ? (ex: Nice)" />
    <button @click="submit">Chercher les plages</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const city = ref('');
const emit = defineEmits(['search']);
const submit = () => { if (city.value) emit('search', city.value); };
</script>
