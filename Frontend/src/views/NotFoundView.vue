<template>
  <div
    class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full text-center">
      <div class="flex justify-center mb-6">
        <div
          class="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <h1 class="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
        404
      </h1>
      <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        Страница не найдена
      </h2>

      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Упс! Похоже, вы перешли по несуществующей ссылке.
      </p>

      <div class="flex justify-center">
        <router-link
          to="/"
          class="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
        >
          Вернуться на главную
        </router-link>
      </div>
    </div>
  </div>
</template>
