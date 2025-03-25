import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

// Импортируем маршруты
import authRoutes from './routes/authRoutes'
import linkRoutes from './routes/linkRoutes'
import redirectRoutes from './routes/redirectRoutes'
import qrRoutes from './routes/qrRoutes'
import userRoutes from './routes/userRoutes'

// Загружаем переменные окружения
dotenv.config()

// Инициализируем приложение Express
const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

// Ограничение запросов
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за 15 минут
  standardHeaders: true,
  legacyHeaders: false,
})

// Применяем ограничитель запросов к API маршрутам
app.use('/api', apiLimiter)

// Регистрируем маршруты
app.use('/api/auth', authRoutes)
app.use('/api/links', linkRoutes)
app.use('/api/qr', qrRoutes)
app.use('/api/user', userRoutes)
app.use('/', redirectRoutes) // Маршрут для перенаправления коротких ссылок

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ message: 'Не найдено' })
})

// Глобальный обработчик ошибок
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack)
    res.status(err.status || 500).json({
      message: err.message || 'Внутренняя ошибка сервера',
    })
  }
)

// Подключение к базе данных и запуск сервера
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener')
  .then(() => {
    console.log('Подключение к базе данных установлено')
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Ошибка подключения к базе данных:', error)
    process.exit(1)
  })
