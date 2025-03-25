import express from 'express'
import { generateQRCode } from '../controllers/qrController'

const router = express.Router()

// Маршрут для генерации QR-кода по ID ссылки
router.get('/:id', generateQRCode)

export default router
