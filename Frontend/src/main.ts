import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Импортируем CSS стили
import './index.css'

// Загружаем настройки из .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4512'
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 30000)

// Настройка базового URL для axios
axios.defaults.baseURL = API_URL
axios.defaults.timeout = API_TIMEOUT

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

// Добавляем глобальные данные из .env
app.config.globalProperties.$appName =
  import.meta.env.VITE_APP_NAME || 'КороткоСсылка'
app.config.globalProperties.$appDescription =
  import.meta.env.VITE_APP_DESCRIPTION

app.mount('#app')
