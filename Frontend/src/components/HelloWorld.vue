<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  msg: string
}>()

const count = ref(0)
</script>

<template>
  <div class="card bg-gray-800 max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 gradient-text">{{ msg }}</h1>

    <div class="mb-6">
      <button type="button" class="btn-primary" @click="count++">
        Счетчик: {{ count }}
      </button>
    </div>

    <p class="text-gray-300 mb-4">
      Добро пожаловать в обновленный дизайн сервиса КороткоСсылка!
    </p>

    <div class="chart-container p-6 mt-6">
      <h2 class="text-xl font-bold mb-4 text-white">
        Демо визуализации данных
      </h2>
      <div class="relative h-48">
        <div class="absolute inset-0 overflow-hidden">
          <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,100 C50,130 100,60 150,80 C200,100 250,120 300,100 C350,80 400,120 450,100"
              fill="none"
              stroke="url(#gradient1)"
              stroke-width="3"
            />
            <path
              d="M0,120 C50,150 100,80 150,100 C200,120 250,140 300,120 C350,100 400,140 450,120"
              fill="none"
              stroke="url(#gradient2)"
              stroke-width="3"
            />
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#6366f1" />
              <stop offset="100%" stop-color="#d946ef" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#8b5cf6" />
            </linearGradient>
          </svg>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="stat-card border-indigo-800 bg-indigo-900">
          <p class="text-sm text-indigo-300">Текущие</p>
          <p class="text-2xl font-bold text-white">1,254</p>
        </div>
        <div class="stat-card border-purple-800 bg-purple-900">
          <p class="text-sm text-purple-300">Активные</p>
          <p class="text-2xl font-bold text-white">845</p>
        </div>
        <div class="stat-card border-pink-800 bg-pink-900">
          <p class="text-sm text-pink-300">Переходы</p>
          <p class="text-2xl font-bold text-white">3,621</p>
        </div>
        <div class="stat-card border-blue-800 bg-blue-900">
          <p class="text-sm text-blue-300">Устройства</p>
          <p class="text-2xl font-bold text-white">12</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
