import { Router } from 'express'
import * as userController from '../controllers/userController'
import { auth } from '../middleware/authMiddleware'

const router = Router()

router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/profile', auth, userController.getProfile)
router.get('/stats', auth, userController.getUserStats)
router.put('/profile', auth, userController.updateProfile)
router.put('/password', auth, userController.changePassword)

export default router
