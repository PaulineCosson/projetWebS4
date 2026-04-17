import { createRouter, createWebHistory } from 'vue-router';

const RouteStub = {
  name: 'RouteStub',
  template: '<div aria-hidden="true" style="display:none"></div>',
};

const routes = [
  {
    path: '/',
    name: 'map',
    component: RouteStub,
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: RouteStub,
  },
  {
    path: '/details',
    name: 'details',
    component: RouteStub,
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
