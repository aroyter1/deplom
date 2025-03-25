<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps({
  isDarkMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-theme'])

const authStore = useAuthStore()
const router = useRouter()
const isMobileMenuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated())
const username = computed(() => authStore.user?.username || '')

const logout = async () => {
  authStore.logout()
  router.push('/')
  closeMobileMenu()
}

const toggleTheme = () => {
  emit('toggle-theme')
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <nav
    class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm dark:shadow-md transition-colors duration-200"
  >
    <div class="container mx-auto px-4 py-3">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <RouterLink
            to="/"
            class="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            @click="closeMobileMenu"
          >
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <span
              class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
            >
              КороткоСсылка
            </span>
          </RouterLink>

          <div class="hidden md:flex space-x-1">
            <RouterLink
              to="/"
              class="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
              :class="{
                'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400':
                  $route.path === '/',
              }"
            >
              Главная
            </RouterLink>
            <RouterLink
              to="/my-links"
              class="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
              :class="{
                'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400':
                  $route.path === '/my-links',
              }"
            >
              Мои ссылки
            </RouterLink>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="toggleTheme"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Переключить тему"
          >
            <svg
              v-if="isDarkMode"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-700 dark:text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
              />
            </svg>
          </button>

          <template v-if="isAuthenticated">
            <div class="relative group">
              <button
                class="flex items-center space-x-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <span class="font-medium text-gray-800 dark:text-gray-200">{{
                  username
                }}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-500 dark:text-gray-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>

              <div
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-y-0 translate-y-1 z-50"
              >
                <RouterLink
                  to="/profile"
                  class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  Профиль
                </RouterLink>
                <RouterLink
                  to="/my-links"
                  class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Мои ссылки
                </RouterLink>
                <button
                  @click="logout"
                  class="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                >
                  Выйти
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <RouterLink
              to="/login"
              class="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
            >
              Войти
            </RouterLink>
            <RouterLink
              to="/register"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all"
            >
              Регистрация
            </RouterLink>
          </template>

          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-700 dark:text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Мобильное меню -->
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden mt-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-2"
      >
        <RouterLink
          to="/"
          class="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          :class="{
            'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400':
              $route.path === '/',
          }"
          @click="closeMobileMenu"
        >
          Главная
        </RouterLink>
        <RouterLink
          to="/my-links"
          class="block px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
          :class="{
            'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400':
              $route.path === '/my-links',
          }"
          @click="closeMobileMenu"
        >
          Мои ссылки
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
