import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения для текущего режима
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: parseInt(env.VITE_APP_PORT || '5200'),
      host: env.VITE_APP_HOST || 'localhost',
    },
    // Замена переменных в HTML
    define: {
      'process.env': {},
    },
    // Настраиваем замену переменных в HTML
    html: {
      // Заменяем плейсхолдеры в HTML
      transform(html) {
        return html
          .replace(/%%VITE_APP_NAME%%/g, env.VITE_APP_NAME || 'КороткоСсылка')
          .replace(
            /%%VITE_APP_DESCRIPTION%%/g,
            env.VITE_APP_DESCRIPTION || 'Сервис для сокращения ссылок'
          )
      },
    },
  }
})
