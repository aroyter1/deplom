import express from 'express'
import { redirectToOriginal } from '../controllers/redirectController'

const router = express.Router()

// Маршрут для перенаправления
router.get('/:shortId', redirectToOriginal)

export default router
