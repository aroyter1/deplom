import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

// Расширяем интерфейс Request для добавления userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Требуется авторизация' })
    }

    const token = authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Отсутствует токен авторизации' })
    }

    // Проверяем и декодируем токен
    try {
      const secret = process.env.JWT_SECRET || 'secret'
      const decoded = jwt.verify(token, secret) as { id: string; exp?: number }

      // Проверяем, не истек ли срок действия токена
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res
          .status(401)
          .json({ message: 'Токен истек, требуется повторный вход' })
      }

      // Проверяем существование пользователя
      const user = await User.findById(decoded.id)

      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' })
      }

      // Добавляем ID пользователя к запросу
      req.userId = decoded.id

      next()
    } catch (error) {
      console.error('Ошибка проверки токена:', error)
      return res.status(401).json({ message: 'Недействительный токен' })
    }
  } catch (error) {
    console.error('Ошибка авторизации:', error)
    return res.status(500).json({ message: 'Ошибка сервера при авторизации' })
  }
}
