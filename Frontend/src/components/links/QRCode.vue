<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  url: string
  size?: number
}>()

const qrCodeUrl = ref('')

const generateQRCode = async () => {
  try {
    // В реальном приложении здесь был бы запрос к API для генерации QR-кода
    // Для примера, мы просто используем API Google Charts
    qrCodeUrl.value = `https://chart.googleapis.com/chart?cht=qr&chs=${
      props.size || 200
    }x${props.size || 200}&chl=${encodeURIComponent(props.url)}`
  } catch (e) {
    console.error('Ошибка при генерации QR-кода:', e)
  }
}

onMounted(() => {
  generateQRCode()
})

watch(
  () => props.url,
  () => {
    generateQRCode()
  }
)
</script>

<template>
  <div class="qr-code">
    <img
      v-if="qrCodeUrl"
      :src="qrCodeUrl"
      :width="props.size || 200"
      :height="props.size || 200"
      alt="QR-код для ссылки"
    />
    <div v-else class="flex items-center justify-center w-full h-full">
      Загрузка QR-кода...
    </div>
  </div>
</template>
