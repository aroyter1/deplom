import express from 'express'
import { register, login, getProfile } from '../controllers/authController'
import { auth } from '../middleware/authMiddleware'

const router = express.Router()

// Публичные маршруты
router.post('/register', register)
router.post('/login', login)

// Защищенные маршруты
router.get('/profile', auth, getProfile)

export default router
