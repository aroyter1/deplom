<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

interface Link {
  id: string
  originalUrl: string
  shortUrl: string
  shortId: string
  alias: string | null
  clicks: number
  createdAt: string
  updatedAt: string
}

const links = ref<Link[]>([])
const loading = ref(true)
const error = ref('')
const router = useRouter()
const authStore = useAuthStore()

const fetchLinks = async () => {
  loading.value = true
  error.value = ''

  try {
    console.log('Запрашиваем ссылки пользователя...')
    console.log('Токен авторизации:', authStore.token)

    const response = await axios.get('/api/links/user', {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    console.log('Получен ответ:', response.data)
    links.value = response.data
  } catch (err: any) {
    console.error('Ошибка при получении ссылок:', err)
    if (err.response) {
      error.value = err.response.data.message || 'Не удалось загрузить ссылки'
    } else {
      error.value = 'Ошибка соединения с сервером'
    }
  } finally {
    loading.value = false
  }
}

const deleteLink = async (id: string) => {
  try {
    await axios.delete(`/api/links/${id}`)
    // Удаляем ссылку из локального массива
    links.value = links.value.filter((link) => link.id !== id)
  } catch (err: any) {
    console.error('Ошибка при удалении ссылки:', err)
    alert(err.response?.data?.message || 'Ошибка при удалении ссылки')
  }
}

const viewStatistics = (id: string) => {
  router.push(`/statistics/${id}`)
}

const copyToClipboard = (text: string) => {
  navigator.clipboard
    .writeText(text)
    .then(() => alert('Ссылка скопирована в буфер обмена'))
    .catch((err) => console.error('Не удалось скопировать: ', err))
}

onMounted(() => {
  // Проверяем авторизацию
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }

  fetchLinks()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
      Мои ссылки
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
      <p class="mt-2 text-gray-600 dark:text-gray-400">Загрузка ссылок...</p>
    </div>

    <div v-else-if="error" class="text-center py-10">
      <p class="text-red-500">{{ error }}</p>
      <button
        @click="fetchLinks"
        class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Попробовать снова
      </button>
    </div>

    <div v-else-if="links.length === 0" class="text-center py-10">
      <p class="text-gray-600 dark:text-gray-400">
        У вас пока нет сохраненных ссылок
      </p>
      <router-link
        to="/"
        class="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
      >
        Создать первую ссылку
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="link in links"
        :key="link.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
      >
        <div class="flex flex-col md:flex-row justify-between">
          <div class="flex-grow md:mr-4">
            <h2
              class="text-lg font-semibold text-gray-900 dark:text-white truncate"
            >
              {{ link.originalUrl }}
            </h2>

            <div class="mt-2 flex items-center">
              <span class="text-blue-500 font-medium">{{ link.shortUrl }}</span>
              <button
                @click="copyToClipboard(link.shortUrl)"
                class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path
                    d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"
                  />
                </svg>
              </button>
            </div>

            <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Переходов: {{ link.clicks }}</span>
              <span class="mx-2">•</span>
              <span
                >Создана:
                {{ new Date(link.createdAt).toLocaleDateString() }}</span
              >
            </div>
          </div>

          <div class="flex mt-4 md:mt-0">
            <button
              @click="viewStatistics(link.id)"
              class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded mr-2"
            >
              Статистика
            </button>
            <button
              @click="deleteLink(link.id)"
              class="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
