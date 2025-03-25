import { Request, Response } from 'express'
import QRCode from 'qrcode'
import mongoose from 'mongoose'
import Link from '../models/Link'

export const generateQRCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Некорректный ID ссылки' })
    }

    const link = await Link.findById(id)

    if (!link) {
      return res.status(404).json({ message: 'Ссылка не найдена' })
    }

    // Формируем полный URL для QR-кода
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
    const shortUrl = `${baseUrl}/${link.alias || link.shortId}`

    // Опции для QR-кода
    const options = {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    }

    // Генерируем QR-код в виде Buffer
    // @ts-ignore - игнорируем проверку типов для этой строки
    const qrCodeBuffer = await QRCode.toBuffer(shortUrl, options)

    // Устанавливаем заголовки и отправляем изображение
    res.setHeader('Content-Type', 'image/png')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="qrcode-${link.shortId}.png"`
    )
    res.send(qrCodeBuffer)
  } catch (error) {
    console.error('Ошибка генерации QR-кода:', error)
    res.status(500).json({ message: 'Ошибка сервера при генерации QR-кода' })
  }
}
