import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'
import config from './config'

// Импортируем маршруты
import authRoutes from './routes/authRoutes'
import linkRoutes from './routes/linkRoutes'
import redirectRoutes from './routes/redirectRoutes'
import qrRoutes from './routes/qrRoutes'
import userRoutes from './routes/userRoutes'

// Настройка логгера
import './utils/logger'
import logger from './utils/logger'

// Инициализируем приложение Express
const app = express()
const PORT = config.SERVER.PORT

// Настройка CORS с учетом клиентского URL
const corsOptions = {
  origin: [config.URLS.CLIENT],
  credentials: true,
  optionsSuccessStatus: 200,
}

// Middlewares
app.use(express.json())
app.use(cors(corsOptions))
app.use(helmet())
app.use(morgan('combined'))

// Ограничение запросов
const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMITS.WINDOW_MS,
  max: config.RATE_LIMITS.MAX_REQUESTS,
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
    logger.error(`Ошибка: ${err.message}`, { stack: err.stack })
    res.status(err.status || 500).json({
      message: err.message || 'Внутренняя ошибка сервера',
    })
  }
)

// Настройки подключения к MongoDB с репликацией для масштабирования
const mongoOptions: any = {
  ...config.DATABASE.OPTIONS,
}

// Добавляем replicaSet только если он указан и не пустой
if (config.DATABASE.REPLICA_SET && config.DATABASE.REPLICA_SET.trim() !== '') {
  mongoOptions.replicaSet = config.DATABASE.REPLICA_SET
}

// Подключение к базе данных и запуск сервера
mongoose
  .connect(config.DATABASE.URI, mongoOptions)
  .then(() => {
    logger.info('Подключение к базе данных установлено')
    app.listen(PORT, () => {
      logger.info(`Сервер запущен на порту ${PORT}`)
      logger.info(`Режим: ${config.SERVER.NODE_ENV}`)
    })
  })
  .catch((error) => {
    logger.error('Ошибка подключения к базе данных:', error)
    process.exit(1)
  })

// Обработка сигналов завершения для корректного закрытия соединений
process.on('SIGTERM', () => {
  logger.info('SIGTERM получен. Завершение работы...')
  mongoose.connection
    .close(false)
    .then(() => {
      logger.info('Соединение с MongoDB закрыто')
      process.exit(0)
    })
    .catch((err) => {
      logger.error('Ошибка при закрытии соединения с MongoDB:', err)
      process.exit(1)
    })
})
