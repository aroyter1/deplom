<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

interface UserStats {
  totalLinks: number
  totalClicks: number
}

const router = useRouter()
const authStore = useAuthStore()

const profile = ref<UserProfile | null>(null)
const stats = ref<UserStats>({ totalLinks: 0, totalClicks: 0 })
const loading = ref(true)
const error = ref('')

// Форматирование даты в удобочитаемый вид
const formattedDate = computed(() => {
  if (!profile.value?.createdAt) return 'Неизвестно'

  try {
    const date = new Date(profile.value.createdAt)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch (err) {
    console.error('Ошибка форматирования даты:', err)
    return 'Неверная дата'
  }
})

const fetchProfile = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    profile.value = response.data

    // Загрузка статистики пользователя
    fetchUserStats()
  } catch (err: any) {
    console.error('Ошибка получения профиля:', err)
    if (err.response) {
      error.value = err.response.data.message || 'Не удалось загрузить профиль'
    } else {
      error.value = 'Ошибка соединения с сервером'
    }
    loading.value = false
  }
}

const fetchUserStats = async () => {
  try {
    const response = await axios.get('/api/user/stats', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    stats.value = response.data
  } catch (err) {
    console.error('Ошибка получения статистики пользователя:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Проверяем авторизацию
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }

  fetchProfile()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
      Мой профиль
    </h1>

    <div v-if="loading" class="text-center py-10">
      <svg
        class="animate-spin h-10 w-10 mx-auto text-blue-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Загрузка профиля...</p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
      role="alert"
    >
      <p>{{ error }}</p>
      <button
        @click="fetchProfile"
        class="mt-2 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded text-sm"
      >
        Попробовать снова
      </button>
    </div>

    <div v-else-if="profile" class="space-y-6">
      <!-- Информация о профиле -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Информация о профиле
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
            <p class="text-lg text-gray-900 dark:text-white">
              {{ profile.email }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Имя</p>
            <p class="text-lg text-gray-900 dark:text-white">
              {{ profile.name || 'Не указано' }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Дата регистрации
            </p>
            <p class="text-lg text-gray-900 dark:text-white">
              {{ formattedDate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Статистика пользователя -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Моя статистика
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p class="text-sm text-blue-500 dark:text-blue-400 mb-1">
              Всего сокращенных ссылок
            </p>
            <p class="text-3xl font-bold text-blue-600 dark:text-blue-300">
              {{ stats.totalLinks }}
            </p>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p class="text-sm text-green-500 dark:text-green-400 mb-1">
              Всего переходов
            </p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-300">
              {{ stats.totalClicks }}
            </p>
          </div>
        </div>

        <div class="mt-4">
          <router-link
            to="/my-links"
            class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded mt-4"
          >
            Управление моими ссылками
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
