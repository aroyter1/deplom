import { Request, Response } from 'express'
import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
import Link from '../models/Link'
import Click from '../models/Click'
import { z } from 'zod'
import UAParser from 'ua-parser-js'

// Схема валидации для создания ссылки
const createLinkSchema = z.object({
  originalUrl: z.string().url('Требуется действительный URL'),
  alias: z.string().min(0).optional(),
})

// Функция для проверки и подготовки URL
const prepareUrl = (url: string): string => {
  // Если URL не содержит протокол http:// или https://
  if (!/^https?:\/\//i.test(url)) {
    // Добавляем https:// в начало
    return `https://${url}`
  }
  return url
}

// Создание короткой ссылки
export const createLink = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const validatedData = createLinkSchema.parse({
      ...req.body,
      originalUrl: prepareUrl(req.body.originalUrl),
    })

    // Генерируем короткий ID, если не указан alias
    const shortId = validatedData.alias || nanoid(8)

    // Проверяем, не занят ли уже этот alias
    if (validatedData.alias) {
      const existingLink = await Link.findOne({
        $or: [{ shortId }, { alias: validatedData.alias }],
      })

      if (existingLink) {
        return res
          .status(400)
          .json({ message: 'Указанный alias уже используется' })
      }
    }

    // Создаем новую запись в БД
    const link = new Link({
      originalUrl: validatedData.originalUrl,
      shortId,
      alias: validatedData.alias,
      userId: req.userId || null,
    })

    await link.save()

    // Формируем полный URL короткой ссылки
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const shortUrl = `${baseUrl}/${link.alias || link.shortId}`

    res.status(201).json({
      id: link._id,
      originalUrl: link.originalUrl,
      shortUrl,
      shortId: link.shortId,
      alias: link.alias,
      clicks: link.clicks,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    })
  } catch (error) {
    console.error('Ошибка создания ссылки:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Ошибка валидации',
        errors: error.errors,
      })
    }

    res.status(500).json({ message: 'Ошибка сервера при создании ссылки' })
  }
}

// Получение всех ссылок пользователя
export const getUserLinks = async (req: Request, res: Response) => {
  try {
    // Проверяем авторизацию пользователя
    if (!req.userId) {
      return res.status(401).json({ message: 'Не авторизован' })
    }

    // Логируем запрос для отладки
    console.log('Запрос ссылок для пользователя:', req.userId)

    // Получаем ссылки из БД
    const links = await Link.find({ userId: req.userId }).sort({
      createdAt: -1,
    })

    // Формируем полные URL для каждой ссылки
    const baseUrl = process.env.BASE_URL || 'http://localhost:4512'
    const linksWithFullUrl = links.map((link) => {
      const shortUrl = `${baseUrl}/${link.alias || link.shortId}`
      return {
        id: link._id,
        originalUrl: link.originalUrl,
        shortUrl,
        shortId: link.shortId,
        alias: link.alias,
        clicks: link.clicks,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      }
    })

    // Отправляем ответ
    res.status(200).json(linksWithFullUrl)
  } catch (error) {
    console.error('Ошибка получения ссылок пользователя:', error)
    res.status(500).json({ message: 'Ошибка сервера при получении ссылок' })
  }
}

// Получение детальной информации о ссылке
export const getLinkDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный ID ссылки' })
    }

    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({ message: 'Ссылка не найдена' })
    }

    // Проверяем права доступа для приватных ссылок
    if (link.userId && req.userId && link.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет доступа к этой ссылке' })
    }

    // Формируем полный URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const shortUrl = `${baseUrl}/${link.alias || link.shortId}`

    res.status(200).json({
      id: link._id,
      originalUrl: link.originalUrl,
      shortUrl,
      shortId: link.shortId,
      alias: link.alias,
      clicks: link.clicks,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
    })
  } catch (error) {
    console.error('Ошибка получения данных ссылки:', error)
    res
      .status(500)
      .json({ message: 'Ошибка сервера при получении данных ссылки' })
  }
}

// Получение статистики по ссылке
export const getLinkStatistics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный ID ссылки' })
    }

    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({ message: 'Ссылка не найдена' })
    }

    // Проверяем права доступа для приватных ссылок
    if (link.userId && req.userId && link.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет доступа к этой ссылке' })
    }

    // Получаем все клики по ссылке
    const clicks = await Click.find({ linkId: id }).sort({ timestamp: -1 })

    // Анализируем статистику
    const uniqueIPs = new Set(clicks.map((click) => click.ip)).size

    // Группируем по источникам перехода
    const referrers: Record<string, number> = {}
    const browsers: Record<string, number> = {}
    const devices: Record<string, number> = {}
    const operatingSystems: Record<string, number> = {}

    clicks.forEach((click) => {
      // Обрабатываем референсы
      const referrer = click.referrer || 'Прямой переход'
      referrers[referrer] = (referrers[referrer] || 0) + 1

      // Обрабатываем браузеры
      if (click.browser) {
        browsers[click.browser] = (browsers[click.browser] || 0) + 1
      }

      // Обрабатываем устройства
      if (click.device) {
        devices[click.device] = (devices[click.device] || 0) + 1
      }

      // Обрабатываем ОС
      if (click.os) {
        operatingSystems[click.os] = (operatingSystems[click.os] || 0) + 1
      }
    })

    // Преобразуем объекты в массивы для фронтенда
    const referrersArray = Object.entries(referrers).map(([source, count]) => ({
      source,
      count,
    }))
    const browsersArray = Object.entries(browsers).map(([name, count]) => ({
      name,
      count,
    }))
    const devicesArray = Object.entries(devices).map(([type, count]) => ({
      type,
      count,
    }))
    const osArray = Object.entries(operatingSystems).map(([name, count]) => ({
      name,
      count,
    }))

    // Форматируем клики для более удобного вывода
    const formattedClicks = clicks.map((click) => ({
      id: click._id,
      linkId: click.linkId,
      timestamp: click.timestamp,
      ip: click.ip,
      referrer: click.referrer || 'Прямой переход',
      browser: click.browser || 'Неизвестно',
      device: click.device || 'Неизвестно',
      os: click.os || 'Неизвестно',
    }))

    res.status(200).json({
      totalClicks: clicks.length,
      uniqueVisitors: uniqueIPs,
      referrers: referrersArray,
      browsers: browsersArray,
      devices: devicesArray,
      operatingSystems: osArray,
      clicks: formattedClicks,
    })
  } catch (error) {
    console.error('Ошибка получения статистики:', error)
    res.status(500).json({ message: 'Ошибка сервера при получении статистики' })
  }
}

// Удаление ссылки
export const deleteLink = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный ID ссылки' })
    }

    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({ message: 'Ссылка не найдена' })
    }

    // Проверяем права доступа (только владелец может удалить)
    if (!link.userId || link.userId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: 'Нет доступа к удалению этой ссылки' })
    }

    // Удаляем ссылку и связанные клики
    await Promise.all([
      Link.findByIdAndDelete(id),
      Click.deleteMany({ linkId: id }),
    ])

    res.status(200).json({ message: 'Ссылка успешно удалена' })
  } catch (error) {
    console.error('Ошибка удаления ссылки:', error)
    res.status(500).json({ message: 'Ошибка сервера при удалении ссылки' })
  }
}
