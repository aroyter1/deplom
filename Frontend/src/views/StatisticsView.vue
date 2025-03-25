<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import StatisticsChart from '@/components/StatisticsChart.vue'
import QRCode from 'qrcode.vue'

interface Stats {
  linkId: string
  totalClicks: number
  browsers: Array<{ name: string; count: number }>
  os: Array<{ name: string; count: number }>
  devices: Array<{ type: string; count: number }>
  clickDetails: Array<{
    id: string
    date: string
    browser: string
    os: string
    device: string
    referer: string
  }>
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const linkId = ref(route.params.id as string)
const stats = ref<Stats | null>(null)
const loading = ref(true)
const error = ref('')
const link = ref({
  originalUrl: '',
  shortUrl: '',
})

const qrSize = computed(() => {
  return window.innerWidth < 640 ? 200 : 250
})

const fetchStats = async () => {
  loading.value = true
  error.value = ''

  try {
    console.log(`Запрашиваем статистику для ссылки ID: ${linkId.value}`)
    console.log(`URL запроса: /api/links/statistics/${linkId.value}`)

    console.log('Токен авторизации:', authStore.token)

    const response = await axios.get(`/api/links/statistics/${linkId.value}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    console.log('Получены данные статистики:', response.data)
    stats.value = response.data

    fetchLinkDetails()
  } catch (err: any) {
    console.error('Ошибка при загрузке статистики:', err)
    if (err.response) {
      console.error('Статус ошибки:', err.response.status)
      console.error('Данные ошибки:', err.response.data)
      error.value =
        err.response.data.message || 'Не удалось загрузить данные статистики'
    } else {
      error.value = 'Ошибка соединения с сервером'
    }
  } finally {
    loading.value = false
  }
}

const fetchLinkDetails = async () => {
  try {
    const response = await axios.get(`/api/links/details/${linkId.value}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    })

    link.value = {
      originalUrl: response.data.originalUrl,
      shortUrl: response.data.shortUrl,
    }
  } catch (err) {
    console.error('Ошибка при загрузке данных ссылки:', err)
  }
}

const downloadQRCode = () => {
  const canvas = document.querySelector('.qr-code canvas') as HTMLCanvasElement
  if (!canvas) return

  const link = document.createElement('a')
  link.download = `qrcode-${linkId.value}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

onMounted(() => {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }

  fetchStats()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
      Статистика ссылки
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
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Загрузка статистики...
      </p>
    </div>

    <div
      v-else-if="error"
      class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
      role="alert"
    >
      <p>{{ error }}</p>
      <button
        @click="fetchStats"
        class="mt-2 bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded text-sm"
      >
        Попробовать снова
      </button>
    </div>

    <div v-else-if="stats" class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex flex-col md:flex-row">
          <div class="flex-grow">
            <h2
              class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              Информация о ссылке
            </h2>
            <div v-if="link.originalUrl" class="mb-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Исходная ссылка
              </p>
              <p class="text-gray-900 dark:text-white break-all">
                {{ link.originalUrl }}
              </p>
            </div>
            <div v-if="link.shortUrl" class="mb-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Короткая ссылка
              </p>
              <p class="text-blue-500 break-all">{{ link.shortUrl }}</p>
            </div>
            <div class="mb-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Всего переходов
              </p>
              <p class="text-xl font-bold text-gray-900 dark:text-white">
                {{ stats.totalClicks }}
              </p>
            </div>
          </div>

          <div class="md:w-64 mt-4 md:mt-0 md:ml-6 flex flex-col items-center">
            <div
              class="qr-code bg-white p-3 rounded-lg shadow-sm"
              v-if="link.shortUrl"
            >
              <QRCode :value="link.shortUrl" :size="qrSize" level="H" />
            </div>
            <button
              v-if="link.shortUrl"
              @click="downloadQRCode"
              class="mt-3 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded flex items-center"
            >
              <svg
                class="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Скачать QR-код
            </button>
          </div>
        </div>
      </div>

      <StatisticsChart
        :devices="stats.devices"
        :browsers="stats.browsers"
        :os="stats.os"
      />

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Детализация переходов
        </h2>

        <div
          v-if="stats.clickDetails.length === 0"
          class="text-gray-500 dark:text-gray-400"
        >
          Нет данных о переходах
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full bg-white dark:bg-gray-800">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Дата
                </th>
                <th
                  class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Браузер
                </th>
                <th
                  class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  ОС
                </th>
                <th
                  class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Устройство
                </th>
                <th
                  class="py-2 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Источник
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-600">
              <tr
                v-for="click in stats.clickDetails"
                :key="click.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ new Date(click.date).toLocaleString() }}
                </td>
                <td class="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ click.browser || 'Неизвестно' }}
                </td>
                <td class="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ click.os || 'Неизвестно' }}
                </td>
                <td class="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                  {{ click.device || 'Неизвестно' }}
                </td>
                <td class="py-2 px-4 text-sm text-gray-900 dark:text-gray-100">
                  <span v-if="click.referer">{{ click.referer }}</span>
                  <span v-else class="text-gray-500 dark:text-gray-400"
                    >Прямой переход</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
