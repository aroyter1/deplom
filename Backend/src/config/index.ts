import dotenv from 'dotenv'
import path from 'path'

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// Настройки сервера
export const SERVER = {
  PORT: parseInt(process.env.PORT || '4512', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
}

// Настройки базы данных
export const DATABASE = {
  URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener',
  REPLICA_SET: process.env.MONGODB_REPLICA_SET || '',
  OPTIONS: {
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    connectTimeoutMS: parseInt(
      process.env.MONGODB_CONNECT_TIMEOUT_MS || '30000',
      10
    ),
    socketTimeoutMS: parseInt(
      process.env.MONGODB_SOCKET_TIMEOUT_MS || '360000',
      10
    ),
    retryWrites: false,
  },
}

// Настройки JWT
export const JWT = {
  SECRET: process.env.JWT_SECRET || 'default_secret_key_change_in_production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
}

// Настройки URL
export const URLS = {
  BASE: process.env.BASE_URL || 'http://localhost:4512',
  CLIENT: process.env.CLIENT_URL || 'http://localhost:5200',
}

// Настройки логирования
export const LOGGING = {
  LEVEL: process.env.LOG_LEVEL || 'info',
}

// Настройки лимитов запросов
export const RATE_LIMITS = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 минут по умолчанию
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
}

export default {
  SERVER,
  DATABASE,
  JWT,
  URLS,
  LOGGING,
  RATE_LIMITS,
}
