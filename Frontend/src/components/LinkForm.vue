<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const originalUrl = ref('')
const alias = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const shortUrl = ref('')

// Валидация URL с автоматическим добавлением https://
const validateAndPrepareUrl = (url: string): string => {
  // Если URL не содержит протокол http:// или https://
  if (!/^https?:\/\//i.test(url)) {
    // Добавляем https:// в начало
    return `https://${url}`
  }
  return url
}

const createLink = async () => {
  error.value = ''
  success.value = false
  shortUrl.value = ''

  if (!originalUrl.value) {
    error.value = 'Пожалуйста, введите URL'
    return
  }

  // Подготавливаем URL, добавляя https:// если необходимо
  const preparedUrl = validateAndPrepareUrl(originalUrl.value)

  loading.value = true

  try {
    const response = await axios.post('/api/links', {
      originalUrl: preparedUrl,
      alias: alias.value || undefined,
    })

    success.value = true
    shortUrl.value = response.data.shortUrl
  } catch (err: any) {
    if (err.response && err.response.data.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Произошла ошибка при создании ссылки'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Остальной код компонента... -->
</template>
