import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'map',
  },
  {
    path: '/favorites',
    name: 'favorites',
  },
  {
    path: '/details',
    name: 'details',
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'map' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
