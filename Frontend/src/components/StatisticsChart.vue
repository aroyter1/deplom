<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import {
  formatDeviceType,
  formatBrowserName,
  formatOSName,
} from '@/utils/formatters'

// Определяем интерфейс для данных статистики
interface DeviceStats {
  type: string
  count: number
}

interface BrowserStats {
  name: string
  count: number
}

interface OSStats {
  name: string
  count: number
}

const props = defineProps<{
  devices: DeviceStats[]
  browsers: BrowserStats[]
  os: OSStats[]
}>()

// Форматируем названия для более дружественного отображения
const formattedDevices = computed(() => {
  return props.devices.map((device) => ({
    type: formatDeviceType(device.type),
    count: device.count,
  }))
})

const formattedBrowsers = computed(() => {
  return props.browsers.map((browser) => ({
    name: formatBrowserName(browser.name),
    count: browser.count,
  }))
})

const formattedOS = computed(() => {
  return props.os.map((os) => ({
    name: formatOSName(os.name),
    count: os.count,
  }))
})
</script>

<template>
  <div class="statistics-charts">
    <!-- Секция устройств -->
    <div class="stat-section">
      <h3 class="text-lg font-semibold mb-2">Типы устройств</h3>
      <div v-if="formattedDevices.length === 0" class="text-gray-500">
        Нет данных о устройствах
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="(device, index) in formattedDevices"
          :key="index"
          class="bg-white dark:bg-gray-800 p-3 rounded shadow"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium">{{ device.type }}</span>
            <span
              class="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded text-sm"
            >
              {{ device.count }}
              {{ device.count === 1 ? 'переход' : 'переходов' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция браузеров -->
    <div class="stat-section mt-6">
      <h3 class="text-lg font-semibold mb-2">Браузеры</h3>
      <div v-if="formattedBrowsers.length === 0" class="text-gray-500">
        Нет данных о браузерах
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="(browser, index) in formattedBrowsers"
          :key="index"
          class="bg-white dark:bg-gray-800 p-3 rounded shadow"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium">{{ browser.name }}</span>
            <span
              class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-sm"
            >
              {{ browser.count }}
              {{ browser.count === 1 ? 'переход' : 'переходов' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Секция операционных систем -->
    <div class="stat-section mt-6">
      <h3 class="text-lg font-semibold mb-2">Операционные системы</h3>
      <div v-if="formattedOS.length === 0" class="text-gray-500">
        Нет данных об ОС
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div
          v-for="(os, index) in formattedOS"
          :key="index"
          class="bg-white dark:bg-gray-800 p-3 rounded shadow"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium">{{ os.name }}</span>
            <span
              class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 px-2 py-1 rounded text-sm"
            >
              {{ os.count }} {{ os.count === 1 ? 'переход' : 'переходов' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
