import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Импортируем CSS стили
import './index.css'

// Настройка базового URL для axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// Настройка перехватчика для обработки ошибок авторизации
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Если сервер вернул 401, перенаправляем на страницу входа
      const token = localStorage.getItem('token')
      if (token) {
        // Если токен существует, значит он истек или недействителен
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Перезагружаем страницу, чтобы все состояния обновились
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Создаем экземпляр Pinia (хранилище)
const pinia = createPinia()

// Создаем и монтируем приложение
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use('./utils/api') // Импортируем настройки axios
app.mount('#app')
