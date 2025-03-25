<script setup lang="ts">
import LinkCreator from '@/components/links/LinkCreator.vue'
import { computed } from 'vue'

// Добавляем вычисляемое свойство для получения текущего хоста
const currentHost = computed(() => {
  return window.location.host
})
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-900 transition-colors duration-200"
  >
    <div class="max-w-5xl mx-auto pt-10 px-4">
      <!-- Hero Section с улучшенной анимацией -->
      <div class="text-center mb-16 animate-fade-in-up">
        <h1
          class="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-500"
        >
          Сокращайте ссылки. Отслеживайте клики.
        </h1>
        <p
          class="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
        >
          Создавайте короткие ссылки, генерируйте QR-коды и анализируйте
          эффективность ваших маркетинговых кампаний.
        </p>
      </div>

      <!-- Контейнер для LinkCreator -->
      <div
        class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-2xl p-6 sm:p-8 mb-16 transform hover:shadow-2xl dark:hover:shadow-2xl/70 transition-all duration-300 border border-gray-100 dark:border-gray-700"
      >
        <LinkCreator />
      </div>

      <!-- Преимущества с иконками и карточками -->
      <div class="my-20">
        <h2
          class="text-2xl sm:text-3xl font-bold mb-12 text-center text-gray-800 dark:text-gray-200"
        >
          Наши преимущества
        </h2>

        <div class="grid md:grid-cols-3 gap-6 sm:gap-8">
          <div
            class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-xl/70 transition-shadow border border-gray-100 dark:border-gray-700 group hover:-translate-y-1 transform transition duration-300"
          >
            <div
              class="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">
              Простота использования
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Создавайте короткие ссылки в один клик без необходимости
              регистрации.
            </p>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-xl/70 transition-shadow border border-gray-100 dark:border-gray-700 group hover:-translate-y-1 transform transition duration-300"
          >
            <div
              class="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 dark:from-purple-500 dark:to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1zM13 12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-3zm1 2v1h1v-1h-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">
              QR-коды
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Мгновенно создавайте QR-коды для всех ваших сокращенных ссылок.
            </p>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-xl/70 transition-shadow border border-gray-100 dark:border-gray-700 group hover:-translate-y-1 transform transition duration-300"
          >
            <div
              class="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200">
              Аналитика
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              Отслеживайте клики, анализируйте источники трафика и поведение
              пользователей.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Волнистая декоративная линия внизу страницы -->
    <div class="w-full overflow-hidden">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 320"
        class="w-full h-auto"
      >
        <path
          fill="currentColor"
          fill-opacity="0.1"
          class="text-indigo-600 dark:text-indigo-500"
          d="M0,192L48,176C96,160,192,128,288,122.7C384,117,480,139,576,165.3C672,192,768,224,864,224C960,224,1056,192,1152,160C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
}

/* Медиа-запрос для улучшения адаптивности на мобильных устройствах */
@media (max-width: 640px) {
  .animate-fade-in-up {
    animation-duration: 0.6s;
  }
}
</style>
