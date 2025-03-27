<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useAppConfig } from '@/composables/useAppConfig'

const originalUrl = ref('')
const alias = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const shortUrl = ref('')
const copied = ref(false)
const authStore = useAuthStore()
const router = useRouter()
const { appName, appDescription } = useAppConfig()

// Вычисляемое свойство для получения текущего хоста
const currentHost = computed(() => {
  return window.location.host
})

// Вычисляемое свойство для плейсхолдера
const urlPlaceholder = computed(() => {
  return `https://example.com/long-url-here`
})

const createLink = async () => {
  if (!originalUrl.value) {
    error.value = 'Введите URL для сокращения'
    return
  }

  loading.value = true
  error.value = ''
  success.value = false

  try {
    const response = await axios.post(
      '/api/links',
      {
        originalUrl: originalUrl.value,
        alias: alias.value || undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    )

    shortUrl.value = response.data.shortUrl
    success.value = true
    originalUrl.value = ''
    alias.value = ''
  } catch (err: any) {
    console.error('Ошибка при создании ссылки:', err)

    if (err.response) {
      error.value = err.response.data.message || 'Ошибка при создании ссылки'
    } else {
      error.value = 'Ошибка соединения с сервером'
    }
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(shortUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Не удалось скопировать в буфер обмена:', err)
  }
}

const goToMyLinks = () => {
  router.push('/my-links')
}
</script>

<template>
  <div class="w-full max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1
        class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
      >
        {{ appName }}
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
        {{ appDescription }}
      </p>
    </div>

    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-3xl mx-auto"
    >
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Сократить ссылку
      </h2>

      <div v-if="!success">
        <div class="mb-4">
          <label
            for="url"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Вставьте длинную ссылку
          </label>
          <input
            type="url"
            id="url"
            v-model="originalUrl"
            :placeholder="urlPlaceholder"
            class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div class="mb-6">
          <label
            for="alias"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Пользовательский алиас (необязательно)
          </label>
          <div class="flex rounded-xl">
            <span
              class="inline-flex items-center px-4 py-3 rounded-l-xl border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"
            >
              {{ currentHost }}/
            </span>
            <input
              type="text"
              id="alias"
              v-model="alias"
              placeholder="my-custom-link"
              class="flex-1 px-4 py-3 rounded-r-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Оставьте пустым для автоматического создания короткого
            идентификатора
          </p>
        </div>

        <button
          @click="createLink"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            Создание...
          </span>
          <span v-else>Сократить ссылку</span>
        </button>

        <div v-if="error" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {{ error }}
        </div>
      </div>

      <div v-else class="text-center py-4">
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ваша короткая ссылка готова!
          </h3>
          <div class="flex items-center justify-center mt-4 mb-6">
            <div
              class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-full overflow-auto"
            >
              <code
                class="text-blue-600 dark:text-blue-400 text-lg break-all"
                >{{ shortUrl }}</code
              >
            </div>
            <button
              @click="copyToClipboard"
              class="ml-3 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              :class="{ 'bg-green-600 hover:bg-green-700': copied }"
            >
              <svg
                v-if="!copied"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                ></path>
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap justify-center gap-3">
          <button
            @click="success = false"
            class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-2 px-4 rounded-lg"
          >
            Создать еще
          </button>

          <button
            @click="goToMyLinks"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Мои ссылки
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
