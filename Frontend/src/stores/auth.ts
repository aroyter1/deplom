import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import axios from 'axios'

interface User {
  id: string
  username: string
  createdAt?: string
}

interface LoginData {
  username: string
  password: string
}

interface RegisterData {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)

  // Наблюдаем за изменениями токена и обновляем заголовки axios
  watch(token, (newToken) => {
    if (newToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  })

  // Инициализация состояния аутентификации из localStorage
  const initializeAuth = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)

      // Устанавливаем заголовок Authorization
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
  }

  // Логин пользователя
  const login = async (credentials: LoginData) => {
    isLoading.value = true
    try {
      const response = await axios.post('/api/auth/login', credentials)
      const { accessToken, user: userData } = response.data

      token.value = accessToken
      user.value = userData

      // Сохраняем в localStorage
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(userData))

      return userData
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Ошибка при входе')
      }
      throw new Error('Не удалось соединиться с сервером')
    } finally {
      isLoading.value = false
    }
  }

  // Регистрация пользователя
  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post('/api/auth/register', userData)
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Ошибка при регистрации')
      }
      throw new Error('Не удалось соединиться с сервером')
    }
  }

  // Выход пользователя
  const logout = () => {
    user.value = null
    token.value = null

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }

  // Проверка аутентификации
  const isAuthenticated = () => {
    return !!token.value
  }

  // Получение текущего пользователя
  const getCurrentUser = () => {
    return user.value
  }

  return {
    user,
    token,
    isLoading,
    initializeAuth,
    login,
    register,
    logout,
    isAuthenticated,
    getCurrentUser,
  }
})
