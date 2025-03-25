import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { z } from 'zod'

// Схемы валидации
const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
})

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

// Генерация JWT токена
const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'secret'
  const payload = {
    id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 дней
  }

  return jwt.sign(payload, secret)
}

// Регистрация пользователя
export const register = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const validatedData = registerSchema.parse(req.body)

    // Проверка на существующего пользователя
    const existingUser = await User.findOne({
      username: validatedData.username,
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Имя пользователя уже занято' })
    }

    // Создаем нового пользователя
    const user = new User(validatedData)
    await user.save()

    // Возвращаем результат без пароля
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user._id,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('Ошибка регистрации:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Ошибка валидации',
        errors: error.errors,
      })
    }

    res.status(500).json({ message: 'Ошибка сервера при регистрации' })
  }
}

// Вход пользователя
export const login = async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const validatedData = loginSchema.parse(req.body)

    // Находим пользователя
    const user = await User.findOne({ username: validatedData.username })

    if (!user) {
      return res
        .status(401)
        .json({ message: 'Неверное имя пользователя или пароль' })
    }

    // Проверяем пароль
    const isPasswordCorrect = await user.comparePassword(validatedData.password)

    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: 'Неверное имя пользователя или пароль' })
    }

    // Генерируем токен
    const token = generateToken(user._id.toString())

    // Возвращаем результат
    res.status(200).json({
      accessToken: token,
      user: {
        id: user._id,
        username: user.username,
      },
    })
  } catch (error) {
    console.error('Ошибка входа:', error)

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Ошибка валидации',
        errors: error.errors,
      })
    }

    res.status(500).json({ message: 'Ошибка сервера при входе' })
  }
}

// Получение профиля текущего пользователя
export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    res.status(500).json({ message: 'Ошибка сервера при получении профиля' })
  }
}
