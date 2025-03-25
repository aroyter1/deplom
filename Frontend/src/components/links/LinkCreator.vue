<script setup lang="ts">
import { ref } from 'vue'
import { useLinksStore } from '@/stores/links'

const linksStore = useLinksStore()

const originalUrl = ref('')
const customAlias = ref('')
const showQRCode = ref(false)

const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

const createLink = async () => {
  try {
    await linksStore.createShortLink({
      originalUrl: originalUrl.value,
      alias: customAlias.value || undefined,
    })

    // Сбрасываем форму
    customAlias.value = ''
  } catch (error) {
    console.error('Ошибка при создании ссылки:', error)
  }
}

const toggleQRCode = () => {
  showQRCode.value = !showQRCode.value
}

const copyLinkToClipboard = () => {
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
  <div>
    <h2 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
      Создать короткую ссылку
    </h2>

    <form @submit.prevent="createLink" class="space-y-6">
      <div>
        <label
          for="originalUrl"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Ваша ссылка:
        </label>
        <input
          id="originalUrl"
          v-model="originalUrl"
          type="url"
          required
          placeholder="https://example.com/long-url-here"
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
        />
      </div>

      <div>
        <label
          for="customAlias"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Короткий адрес (необязательно):
        </label>
        <div class="flex rounded-xl overflow-hidden">
          <span
            class="inline-flex items-center px-4 py-3 rounded-l-xl border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
          >
            mysite.com/
          </span>
          <input
            id="customAlias"
            v-model="customAlias"
            type="text"
            placeholder="мой-адрес"
            class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-r-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white font-medium rounded-xl shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all transform hover:-translate-y-0.5"
      >
        Сократить ссылку
      </button>

      <!-- Результат создания ссылки -->
      <div
        v-if="linksStore.currentLink && linksStore.currentLink.shortUrl"
        class="p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 mt-6"
      >
        <h3
          class="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-4"
        >
          Ваша сокращенная ссылка:
        </h3>

        <div class="flex items-center mb-5">
          <a
            :href="linksStore.currentLink.shortUrl"
            target="_blank"
            class="text-indigo-600 dark:text-indigo-400 hover:underline mr-3 truncate"
          >
            {{ linksStore.currentLink.shortUrl }}
          </a>
          <button
            @click="copyLinkToClipboard"
            class="flex-shrink-0 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
            title="Копировать ссылку"
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

        <div
          class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3"
        >
          <button
            @click="toggleQRCode"
            class="flex-1 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-medium px-4 py-3 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM13 12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-3zm1 2v1h1v-1h-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ showQRCode ? 'Скрыть QR-код' : 'Показать QR-код' }}
          </button>

          <router-link
            v-if="linksStore.currentLink.id"
            :to="`/statistics/${linksStore.currentLink.id}`"
            class="flex-1 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium px-4 py-3 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
              />
            </svg>
            Статистика
          </router-link>
        </div>

        <div
          v-if="showQRCode"
          class="mt-6 flex justify-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <img
            v-if="linksStore.currentLink.id"
            :src="`/api/qr/${linksStore.currentLink.id}`"
            alt="QR-код для вашей ссылки"
            class="w-48 h-48 object-contain"
          />
          <div v-else class="text-gray-500 dark:text-gray-400">
            QR-код недоступен
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
