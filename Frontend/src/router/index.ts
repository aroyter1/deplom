import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/my-links',
    name: 'my-links',
    component: () => import('@/views/MyLinksView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/statistics/:id',
    name: 'statistics',
    component: () => import('@/views/StatisticsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Защита маршрутов, требующих авторизации
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // Инициализируем состояние авторизации при каждой навигации
  // это гарантирует, что мы всегда проверяем актуальные данные
  authStore.initializeAuth()

  if (requiresAuth && !authStore.isAuthenticated()) {
    next('/login')
  } else {
    next()
  }
})

export default router
