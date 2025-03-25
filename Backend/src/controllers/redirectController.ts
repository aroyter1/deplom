import { Request, Response } from 'express'
import Link from '../models/Link'
import Click from '../models/Click'
import UAParser from 'ua-parser-js'

export const redirectToOriginal = async (req: Request, res: Response) => {
  try {
    const { shortId } = req.params

    // Ищем ссылку по shortId или alias
    const link = await Link.findOne({
      $or: [{ shortId }, { alias: shortId }],
    })

    if (!link) {
      return res.status(404).json({ message: 'Ссылка не найдена' })
    }

    // Увеличиваем счетчик кликов
    link.clicks += 1
    await link.save()

    // Получаем информацию о браузере и устройстве
    const userAgent = req.headers['user-agent'] || ''
    const parser = new UAParser(userAgent)
    const browser = parser.getBrowser()
    const os = parser.getOS()
    const device = parser.getDevice()

    // Сохраняем информацию о клике
    const click = new Click({
      linkId: link._id,
      ip: req.ip || req.socket.remoteAddress,
      referrer: req.headers.referer || null,
      userAgent,
      browser: browser.name || null,
      os: os.name || null,
      device: device.type || 'desktop',
    })

    // Сохраняем асинхронно, не блокируя редирект
    click.save().catch((error) => {
      console.error('Ошибка сохранения статистики:', error)
    })

    // Перенаправляем на исходный URL
    res.redirect(link.originalUrl)
  } catch (error) {
    console.error('Ошибка перенаправления:', error)
    res.status(500).json({ message: 'Ошибка сервера при перенаправлении' })
  }
}
