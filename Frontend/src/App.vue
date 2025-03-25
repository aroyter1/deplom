<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'

const authStore = useAuthStore()
const isDarkMode = ref(false)

// Функция для переключения темы
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false')
  applyTheme()
}

// Функция для применения темы
const applyTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// При монтировании компонента проверяем сохраненную тему
onMounted(() => {
  // Сначала проверяем localStorage
  const savedTheme = localStorage.getItem('darkMode')

  if (savedTheme !== null) {
    isDarkMode.value = savedTheme === 'true'
  } else {
    // Если в localStorage ничего нет, используем системные настройки
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Применяем тему
  applyTheme()

  // Инициализируем состояние авторизации
  authStore.initializeAuth()
})

// Слушаем изменения системных настроек
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (e) => {
    if (localStorage.getItem('darkMode') === null) {
      isDarkMode.value = e.matches
      applyTheme()
    }
  })

// Слушаем изменения isDarkMode
watch(isDarkMode, () => {
  applyTheme()
})
</script>

<template>
  <div
    class="min-h-screen flex flex-col transition-colors duration-200 bg-white dark:bg-gray-900"
  >
    <Navbar :isDarkMode="isDarkMode" @toggle-theme="toggleTheme" />

    <main class="flex-grow container mx-auto px-4">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <Footer />

    <!-- Overlay decorations for visual effect -->
    <div class="fixed inset-0 pointer-events-none">
      <div
        class="absolute -top-40 -right-20 w-80 h-80 bg-purple-900 rounded-full opacity-20 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-900 rounded-full opacity-20 blur-3xl"
      ></div>
    </div>
  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1e293b;
}

::-webkit-scrollbar-thumb {
  background: #4c1d95;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6d28d9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
