<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLinksStore } from '@/stores/links'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const linksStore = useLinksStore()
const authStore = useAuthStore()

const linkId = computed(() => route.params.id as string)
const statistics = ref<any>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }

  try {
    loading.value = true
    await linksStore.getLinkDetails(linkId.value)
    await linksStore.getLinkStatistics(linkId.value)
    loading.value = false
  } catch (err) {
    error.value = 'Не удалось загрузить данные статистики'
    loading.value = false
    console.error(err)
  }
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const copyToClipboard = () => {
  if (!linksStore.currentLink?.shortUrl) return

  navigator.clipboard
    .writeText(linksStore.currentLink.shortUrl)
    .then(() => {
      alert('Ссылка скопирована в буфер обмена')
    })
    .catch((err) => {
      console.error('Ошибка при копировании:', err)
    })
}
</script>

<template>
  <div class="py-8">
    <!-- Заголовок страницы -->
    <h1 class="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">
      Статистика ссылки
    </h1>

    <!-- Загрузка и обработка ошибок -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"
      ></div>
    </div>

    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg mb-8"
    >
      {{ error }}
    </div>

    <div v-else class="space-y-8">
      <!-- Информация о ссылке -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-xl border border-gray-100 dark:border-gray-700 p-6"
      >
        <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
          Информация о ссылке
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              Оригинальная ссылка:
            </h3>
            <a
              :href="linksStore.currentLink?.originalUrl"
              target="_blank"
              class="text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
            >
              {{ linksStore.currentLink?.originalUrl }}
            </a>
          </div>

          <div>
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              Короткая ссылка:
            </h3>
            <div class="flex items-center">
              <a
                :href="linksStore.currentLink?.shortUrl"
                target="_blank"
                class="text-indigo-600 dark:text-indigo-400 hover:underline mr-2"
              >
                {{ linksStore.currentLink?.shortUrl }}
              </a>
              <button
                @click="copyToClipboard"
                class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                title="Копировать ссылку"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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
          </div>

          <div>
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              Создана:
            </h3>
            <p class="text-gray-700 dark:text-gray-300">
              {{ formatDate(linksStore.currentLink?.createdAt || '') }}
            </p>
          </div>

          <div>
            <h3
              class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1"
            >
              Всего кликов:
            </h3>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {{ linksStore.statistics?.totalClicks || 0 }}
            </p>
          </div>
        </div>
      </div>

      <!-- Статистика по устройствам и браузерам -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-xl border border-gray-100 dark:border-gray-700 p-6"
        >
          <h2
            class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200"
          >
            Устройства
          </h2>

          <div class="space-y-4">
            <div
              v-for="(count, device) in linksStore.statistics?.devices"
              :key="device"
              class="flex items-center justify-between"
            >
              <div class="flex items-center">
                <span
                  class="w-3 h-3 rounded-full bg-indigo-500 dark:bg-indigo-400 mr-2"
                ></span>
                <span class="text-gray-700 dark:text-gray-300">{{
                  device
                }}</span>
              </div>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                count
              }}</span>
            </div>

            <div
              v-if="
                !linksStore.statistics?.devices ||
                Object.keys(linksStore.statistics.devices).length === 0
              "
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              Нет данных об устройствах
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-xl border border-gray-100 dark:border-gray-700 p-6"
        >
          <h2
            class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200"
          >
            Браузеры
          </h2>

          <div class="space-y-4">
            <div
              v-for="(count, browser) in linksStore.statistics?.browsers"
              :key="browser"
              class="flex items-center justify-between"
            >
              <div class="flex items-center">
                <span
                  class="w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400 mr-2"
                ></span>
                <span class="text-gray-700 dark:text-gray-300">{{
                  browser
                }}</span>
              </div>
              <span class="font-medium text-gray-900 dark:text-gray-100">{{
                count
              }}</span>
            </div>

            <div
              v-if="
                !linksStore.statistics?.browsers ||
                Object.keys(linksStore.statistics.browsers).length === 0
              "
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              Нет данных о браузерах
            </div>
          </div>
        </div>
      </div>

      <!-- График активности -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-xl border border-gray-100 dark:border-gray-700 p-6"
      >
        <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
          Активность по времени
        </h2>

        <div
          class="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <p class="text-gray-500 dark:text-gray-400">
            Здесь будет график активности
          </p>
        </div>
      </div>

      <!-- Таблица с последними кликами -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-xl border border-gray-100 dark:border-gray-700 p-6"
      >
        <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
          Последние клики
        </h2>

        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead>
              <tr>
                <th
                  class="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Дата и время
                </th>
                <th
                  class="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  IP адрес
                </th>
                <th
                  class="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Источник
                </th>
                <th
                  class="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Устройство
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <tr v-if="!linksStore.statistics?.clicks?.length">
                <td
                  colspan="4"
                  class="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                >
                  Нет данных о кликах
                </td>
              </tr>
              <tr
                v-for="(click, index) in linksStore.statistics?.clicks"
                :key="index"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ formatDate(click.timestamp) }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ click.ip || 'Неизвестно' }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ click.referrer || 'Прямой переход' }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ click.device || 'Неизвестно' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Кнопка генерации нового QR-кода -->
      <div class="flex justify-center pt-4">
        <a
          :href="`/api/qr/${linkId}`"
          target="_blank"
          download
          class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
        >
          Скачать QR-код
        </a>
      </div>
    </div>
  </div>
</template>
