import { Router } from 'express'
import * as linkController from '../controllers/linkController'
import { auth } from '../middleware/authMiddleware'

const router = Router()

// Открытые маршруты
router.get('/:shortId', linkController.redirectToOriginal)

// Защищенные маршруты (требуют авторизации)
router.post('/', auth, linkController.createLink)
router.get('/user', auth, linkController.getUserLinks)
router.get('/stats/:id', auth, linkController.getStats)
router.delete('/:id', auth, linkController.deleteLink)

export default router
