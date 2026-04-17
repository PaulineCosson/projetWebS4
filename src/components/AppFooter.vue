<template>
  <footer class="site-footer">
    <p>Projet Vue.js avec  <a href="https://api.meteo-concept.com/">données météo</a> et <a href="https://www.openstreetmap.fr/">cartes interactives</a>.</p>
    <p>Pauline Cosson - IMAC 2</p>
  </footer>
</template>

<style scoped>
.site-footer {
  width: min(1100px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1rem 0 1rem;
  color: #5c7282;
  text-align: center;
  font-size: 0.92rem;
}

.site-footer p {
  margin: 0.25rem 0;
}

.site-footer a {
  color: #10324a;
  text-decoration: none;
  font-weight: 500;
}
</style>
