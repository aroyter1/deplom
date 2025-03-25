import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Настраиваем базовый URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// Настраиваем перехватчик для запросов
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Настраиваем перехватчик для ответов
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      // Если получаем 401, выходим из системы
      authStore.logout()
      // Перенаправление на логин при 401 можно сделать тут или в компоненте
    }
    return Promise.reject(error)
  }
)

export default axios
