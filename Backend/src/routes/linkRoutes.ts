import { Router } from 'express'
import * as linkController from '../controllers/linkController'
import { auth } from '../middleware/authMiddleware'

const router = Router()

// Проверим, какие функции доступны в контроллере
// Примечание: Имена должны точно соответствовать экспортируемым функциям

// Защищенные маршруты (требуют авторизации)
router.get('/user', auth, linkController.getUserLinks)
router.get('/statistics/:id', auth, linkController.getLinkStatistics)
router.get('/details/:id', auth, linkController.getLinkDetails)
router.post('/', auth, linkController.createLink)
router.delete('/:id', auth, linkController.deleteLink)

// Открытые маршруты - динамический маршрут в конце
router.get('/:shortIdOrAlias', linkController.redirectLink)

export default router
