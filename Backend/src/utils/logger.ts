import winston from 'winston'
import config from '../config'

// Определение уровней логирования
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Определяем цвета для каждого уровня
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
}

// Добавляем цвета к winston
winston.addColors(colors)

// Формат логов
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Транспорты для логов
const transports = [
  // Вывод в консоль
  new winston.transports.Console(),

  // Сохранение ошибок в файл
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),

  // Сохранение всех логов в отдельный файл
  new winston.transports.File({ filename: 'logs/all.log' }),
]

// Создаем логгер
const logger = winston.createLogger({
  level: config.LOGGING.LEVEL,
  levels,
  format,
  transports,
})

export default logger
