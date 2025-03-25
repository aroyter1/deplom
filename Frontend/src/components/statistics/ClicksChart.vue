<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue'

const props = defineProps<{
  data: {
    timestamp: string
    // другие свойства статистики
  }[]
}>()

const chartData = ref<{
  labels: string[]
  values: number[]
}>({
  labels: [],
  values: [],
})

// Преобразует данные о кликах в формат для графика
const prepareChartData = () => {
  if (!props.data || !props.data.length) {
    chartData.value = { labels: [], values: [] }
    return
  }

  // Группируем клики по дням
  const clicksByDay = props.data.reduce((acc, click) => {
    const date = new Date(click.timestamp)
    const dateStr = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    }).format(date)

    if (!acc[dateStr]) {
      acc[dateStr] = 0
    }

    acc[dateStr]++
    return acc
  }, {} as Record<string, number>)

  // Сортируем дни
  const sortedDays = Object.keys(clicksByDay).sort((a, b) => {
    const [dayA, monthA] = a.split('.')
    const [dayB, monthB] = b.split('.')
    return (
      new Date(2023, parseInt(monthA) - 1, parseInt(dayA)).getTime() -
      new Date(2023, parseInt(monthB) - 1, parseInt(dayB)).getTime()
    )
  })

  chartData.value = {
    labels: sortedDays,
    values: sortedDays.map((day) => clicksByDay[day]),
  }
}

onMounted(() => {
  prepareChartData()
})

watchEffect(() => {
  prepareChartData()
})
</script>

<template>
  <div class="w-full">
    <div v-if="chartData.labels.length" class="chart-container">
      <!-- Здесь будет размещаться график, в реальном приложении можно использовать библиотеку Chart.js -->
      <div class="bg-gray-100 p-4 rounded-lg">
        <div class="flex justify-between items-end mb-2">
          <div
            v-for="(value, index) in chartData.values"
            :key="index"
            class="flex flex-col items-center"
            :style="{
              height: `${Math.max(
                20,
                (value / Math.max(...chartData.values)) * 150
              )}px`,
            }"
          >
            <div
              class="w-8 bg-blue-500 rounded-t"
              :style="{
                height: `${Math.max(
                  20,
                  (value / Math.max(...chartData.values)) * 150
                )}px`,
              }"
            ></div>
            <div class="mt-2 text-xs">{{ chartData.labels[index] }}</div>
            <div class="text-xs font-semibold">{{ value }}</div>
          </div>
        </div>
      </div>

      <div class="mt-4 text-center text-sm text-gray-500">
        Распределение кликов по дням
      </div>
    </div>

    <div
      v-else
      class="flex items-center justify-center h-40 bg-gray-100 rounded-lg"
    >
      <p class="text-gray-500">Недостаточно данных для построения графика</p>
    </div>
  </div>
</template>
