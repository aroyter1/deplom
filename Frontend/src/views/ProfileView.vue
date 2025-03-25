<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const passwordError = ref('')
const successMessage = ref('')
const user = ref(authStore.getCurrentUser())
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  if (!user.value) {
    loading.value = true
    try {
      // Получаем свежие данные пользователя с сервера, если нужно
      // Можно реализовать метод refreshProfile в authStore
      user.value = authStore.getCurrentUser()
    } catch (err: any) {
      error.value = err.message || 'Не удалось загрузить профиль'
    } finally {
      loading.value = false
    }
  }

  if (authStore.user) {
    username.value = authStore.user.username
    email.value = authStore.user.email
  }
})

const validatePasswordForm = () => {
  passwordError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Пароли не совпадают'
    return false
  }

  if (newPassword.value.length < 6) {
    passwordError.value = 'Пароль должен содержать минимум 6 символов'
    return false
  }

  return true
}

const updateProfile = async () => {
  // В реальном приложении здесь был бы вызов API для обновления профиля
  successMessage.value = 'Профиль успешно обновлен'

  // Сбрасываем сообщение через 3 секунды
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const updatePassword = async () => {
  if (!validatePasswordForm()) {
    return
  }

  // В реальном приложении здесь был бы вызов API для обновления пароля
  successMessage.value = 'Пароль успешно изменен'
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''

  // Сбрасываем сообщение через 3 секунды
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="text-center">
      <p class="text-gray-500 dark:text-gray-400">Загрузка профиля...</p>
    </div>

    <div v-else-if="error" class="text-center">
      <p class="text-red-500">{{ error }}</p>
    </div>

    <div
      v-else-if="user"
      class="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6"
    >
      <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Профиль пользователя
      </h1>

      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Имя пользователя
        </h2>
        <p class="text-gray-900 dark:text-white">{{ user.username }}</p>
      </div>

      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          ID пользователя
        </h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ user.id }}</p>
      </div>

      <div class="mb-4">
        <h2 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Дата регистрации
        </h2>
        <p class="text-gray-500 dark:text-gray-400">
          {{ new Date(user.createdAt).toLocaleDateString() }}
        </p>
      </div>

      <button
        @click="logout"
        class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Выйти
      </button>
    </div>

    <div v-else class="text-center">
      <p class="text-gray-500 dark:text-gray-400">Пользователь не найден</p>
    </div>
  </div>
</template>
