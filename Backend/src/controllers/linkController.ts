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
    console.log('Получен запрос на ссылки пользователя')
    console.log('User ID в запросе:', req.userId)

    // Проверяем авторизацию пользователя
    if (!req.userId) {
      console.log('Ошибка авторизации: отсутствует userId')
      return res.status(401).json({ message: 'Не авторизован' })
    }

    // Получаем ссылки из БД
    console.log('Ищем ссылки для пользователя:', req.userId)
    const links = await Link.find({ userId: req.userId }).sort({
      createdAt: -1,
    })
    console.log('Найдено ссылок:', links.length)

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

// Получение деталей ссылки
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

    // Проверяем права на доступ к ссылке
    if (link.userId && link.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет доступа к этой ссылке' })
    }

    // Формируем полный URL короткой ссылки
    const baseUrl = process.env.BASE_URL || 'http://localhost:4512'
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
    console.error('Ошибка получения деталей ссылки:', error)
    res
      .status(500)
      .json({ message: 'Ошибка сервера при получении деталей ссылки' })
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

    // Проверяем права на доступ к статистике
    if (link.userId && link.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Нет доступа к этой ссылке' })
    }

    const clicks = await Click.find({ linkId: id })

    // Агрегация по браузерам
    const browserStats = clicks.reduce((acc, click) => {
      const browser = click.browser || 'Unknown'
      acc[browser] = (acc[browser] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Агрегация по OS
    const osStats = clicks.reduce((acc, click) => {
      const os = click.os || 'Unknown'
      acc[os] = (acc[os] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Агрегация по устройствам
    const deviceStats = clicks.reduce((acc, click) => {
      const device = click.device || 'desktop'
      acc[device] = (acc[device] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Преобразование в формат для фронтенда
    const browsers = Object.entries(browserStats).map(([name, count]) => ({
      name,
      count,
    }))
    const os = Object.entries(osStats).map(([name, count]) => ({ name, count }))
    const devices = Object.entries(deviceStats).map(([type, count]) => ({
      type,
      count,
    }))

    res.status(200).json({
      linkId: id,
      totalClicks: link.clicks,
      browsers,
      os,
      devices,
      clickDetails: clicks.map((click) => ({
        id: click._id,
        date: click.timestamp || new Date(),
        browser: click.browser,
        os: click.os,
        device: click.device,
        referer: click.referrer || '',
      })),
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

// Редирект по короткой ссылке
export const redirectLink = async (req: Request, res: Response) => {
  try {
    const { shortIdOrAlias } = req.params

    const link = await Link.findOne({
      $or: [{ shortId: shortIdOrAlias }, { alias: shortIdOrAlias }],
    })

    if (!link) {
      return res.status(404).json({ message: 'Ссылка не найдена' })
    }

    // Увеличиваем счетчик кликов
    link.clicks += 1
    await link.save()

    // Сохраняем информацию о клике
    const userAgent = req.headers['user-agent'] || ''
    const parser = new UAParser(userAgent)

    const clickData = new Click({
      linkId: link._id,
      userAgent,
      browser: parser.getBrowser().name || 'Unknown',
      os: parser.getOS().name || 'Unknown',
      device: parser.getDevice().type || 'desktop',
      referrer: req.headers.referer || '',
      ip: req.ip,
    })

    await clickData.save()

    // Редирект на оригинальный URL
    res.redirect(link.originalUrl)
  } catch (error) {
    console.error('Ошибка при редиректе:', error)
    res.status(500).json({ message: 'Ошибка сервера при редиректе' })
  }
}
