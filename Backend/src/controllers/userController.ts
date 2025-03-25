import { Request, Response } from 'express'
import mongoose from 'mongoose'
import User from '../models/User'
import Link from '../models/Link'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// Получение статистики пользователя
export const getUserStats = async (req: Request, res: Response) => {
  try {
    // Проверяем авторизацию
    if (!req.userId) {
      return res.status(401).json({ message: 'Не авторизован' })
    }

    // Находим все ссылки пользователя
    const links = await Link.find({ userId: req.userId })

    // Общее количество ссылок
    const totalLinks = links.length

    // Подсчитываем общее количество переходов
    let totalClicks = 0
    if (links.length > 0) {
      totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
    }

    // Возвращаем статистику
    res.status(200).json({
      totalLinks,
      totalClicks,
    })
  } catch (error) {
    console.error('Ошибка получения статистики пользователя:', error)
    res.status(500).json({ message: 'Ошибка сервера при получении статистики' })
  }
}

// Регистрация нового пользователя
export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, name } = req.body

    // Проверяем, существует ли пользователь с таким username
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Пользователь с таким логином уже существует' })
    }

    // Создаем нового пользователя
    const user = new User({
      username,
      password, // Пароль будет хешироваться через pre-save hook в модели
      name: name || '',
    })

    await user.save()

    // Генерируем токен
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    res.status(500).json({ message: 'Ошибка сервера при регистрации' })
  }
}

// Авторизация пользователя
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    // Ищем пользователя
    const user = await User.findOne({ username })
    if (!user) {
      return res.status(401).json({ message: 'Неверный логин или пароль' })
    }

    // Проверяем пароль
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный логин или пароль' })
    }

    // Генерируем токен
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    )

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Ошибка авторизации:', error)
    res.status(500).json({ message: 'Ошибка сервера при авторизации' })
  }
}

// Получение профиля пользователя
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Не авторизован' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    res.status(500).json({ message: 'Ошибка сервера при получении профиля' })
  }
}

// Обновление профиля пользователя
export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Не авторизован' })
    }

    const { username, name } = req.body

    // Проверяем, занят ли username другим пользователем
    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: req.userId },
      })
      if (existingUser) {
        return res.status(400).json({ message: 'Этот логин уже используется' })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { username, name } },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    res.status(200).json({
      id: user._id,
      username: user.username,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('Ошибка обновления профиля:', error)
    res.status(500).json({ message: 'Ошибка сервера при обновлении профиля' })
  }
}

// Изменение пароля
export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Не авторизован' })
    }

    const { currentPassword, newPassword } = req.body

    // Находим пользователя
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    // Проверяем текущий пароль
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный текущий пароль' })
    }

    // Обновляем пароль
    user.password = newPassword
    await user.save()

    res.status(200).json({ message: 'Пароль успешно изменен' })
  } catch (error) {
    console.error('Ошибка изменения пароля:', error)
    res.status(500).json({ message: 'Ошибка сервера при изменении пароля' })
  }
}
