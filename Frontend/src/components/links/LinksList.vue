<script setup lang="ts">
import { onMounted } from 'vue'
import { useLinksStore } from '@/stores/links'
import { useRouter } from 'vue-router'

const linksStore = useLinksStore()
const router = useRouter()

onMounted(() => {
  linksStore.fetchUserLinks()
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const deleteLink = async (id: string) => {
  if (confirm('Вы уверены, что хотите удалить эту ссылку?')) {
    await linksStore.deleteLink(id)
  }
}

const viewStatistics = (id: string) => {
  router.push(`/statistics/${id}`)
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-2xl font-semibold mb-4">Мои ссылки</h2>

    <div v-if="linksStore.loading" class="text-center py-4">Загрузка...</div>

    <div
      v-else-if="linksStore.error"
      class="p-3 bg-red-100 text-red-700 rounded-md"
    >
      {{ linksStore.error }}
    </div>

    <div
      v-else-if="linksStore.links.length === 0"
      class="text-center py-4 text-gray-500"
    >
      У вас пока нет сокращенных ссылок.
      <router-link to="/" class="text-blue-500 hover:underline ml-2">
        Создать первую ссылку
      </router-link>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Короткая ссылка
            </th>
            <th
              class="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Оригинальная ссылка
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Клики
            </th>
            <th
              class="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Создана
            </th>
            <th
              class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="link in linksStore.links" :key="link.id">
            <td class="px-4 py-4 whitespace-nowrap">
              <a
                :href="link.shortUrl"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                {{ link.shortUrl.replace(/^https?:\/\//, '') }}
              </a>
            </td>
            <td class="hidden md:table-cell px-4 py-4">
              <div class="max-w-xs overflow-hidden text-ellipsis">
                <a
                  :href="link.originalUrl"
                  target="_blank"
                  class="text-gray-900 hover:underline"
                >
                  {{ link.originalUrl }}
                </a>
              </div>
            </td>
            <td class="px-4 py-4 whitespace-nowrap text-center">
              {{ link.clicks }}
            </td>
            <td
              class="hidden sm:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-500"
            >
              {{ formatDate(link.createdAt) }}
            </td>
            <td
              class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <div class="flex justify-end space-x-2">
                <button
                  @click="viewStatistics(link.id)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  Статистика
                </button>
                <button
                  @click="deleteLink(link.id)"
                  class="text-red-600 hover:text-red-900"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
