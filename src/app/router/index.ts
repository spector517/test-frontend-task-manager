import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/tasks',
    },
    {
      path: '/tasks',
      name: 'task-list',
      component: () => import('@/pages/task-list'),
    },
    {
      path: '/tasks/:id',
      name: 'task-card',
      component: () => import('@/pages/task-card'),
      props: true,
    },
    {
      // Неизвестные адреса ведут на список задач
      path: '/:pathMatch(.*)*',
      redirect: '/tasks',
    },
  ],
})

export default router
