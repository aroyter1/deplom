import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export interface LinkInfo {
  id: string
  originalUrl: string
  shortUrl: string
  alias?: string
  userId?: string
  createdAt: string
  updatedAt: string
  clicks: number
}

export interface CreateLinkDto {
  originalUrl: string
  alias?: string
}

export interface LinkStatistics {
  totalClicks: number
  uniqueVisitors: number
  referrers: Array<{ source: string; count: number }>
  browsers: Array<{ name: string; count: number }>
  devices: Array<{ type: string; count: number }>
  operatingSystems: Array<{ name: string; count: number }>
  clicks: Array<{
    id: string
    linkId: string
    timestamp: string
    ip?: string
    referrer?: string
    browser?: string
    device?: string
    os?: string
  }>
}

export const useLinksStore = defineStore('links', () => {
  const currentLink = ref<LinkInfo | null>(null)
  const userLinks = ref<LinkInfo[]>([])
  const statistics = ref<LinkStatistics | null>(null)

  // Создать короткую ссылку
  const createShortLink = async (data: CreateLinkDto) => {
    try {
      const response = await axios.post('/api/links', data)
      currentLink.value = response.data
      return response.data
    } catch (error) {
      console.error('Ошибка при создании ссылки:', error)
      throw error
    }
  }

  // Получить ссылки пользователя
  const getUserLinks = async () => {
    try {
      const response = await axios.get('/api/links/user')
      userLinks.value = response.data
      return response.data
    } catch (error) {
      console.error('Ошибка при получении списка ссылок:', error)
      throw error
    }
  }

  // Получить детали ссылки
  const getLinkDetails = async (id: string) => {
    try {
      const response = await axios.get(`/api/links/${id}`)
      currentLink.value = response.data
      return response.data
    } catch (error) {
      console.error('Ошибка при получении деталей ссылки:', error)
      throw error
    }
  }

  // Получить статистику ссылки
  const getLinkStatistics = async (id: string) => {
    try {
      const response = await axios.get(`/api/links/${id}/statistics`)
      statistics.value = response.data
      return response.data
    } catch (error) {
      console.error('Ошибка при получении статистики:', error)
      throw error
    }
  }

  // Удалить ссылку
  const deleteLink = async (id: string) => {
    try {
      await axios.delete(`/api/links/${id}`)
      // Обновляем список после удаления
      userLinks.value = userLinks.value.filter((link) => link.id !== id)
    } catch (error) {
      console.error('Ошибка при удалении ссылки:', error)
      throw error
    }
  }

  return {
    currentLink,
    userLinks,
    statistics,
    createShortLink,
    getUserLinks,
    getLinkDetails,
    getLinkStatistics,
    deleteLink,
  }
})
