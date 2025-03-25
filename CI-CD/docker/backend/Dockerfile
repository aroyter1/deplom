FROM node:18-alpine

# Создаем рабочую директорию
WORKDIR /app

# Аргументы и переменные окружения
ARG NODE_ENV=production
ARG PORT=3000
ARG JWT_SECRET=your_jwt_secret
ARG MONGODB_URI=mongodb://mongodb:27017/url-shortener
ARG BASE_URL=http://localhost

ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV JWT_SECRET=${JWT_SECRET}
ENV MONGODB_URI=${MONGODB_URI}
ENV BASE_URL=${BASE_URL}

# Установка зависимостей
COPY Backend/package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY Backend/ .

# Создаем пользователя для запуска приложения
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Если в проекте есть TypeScript, компилируем его
RUN npm run build

# Меняем владельца файлов
RUN chown -R appuser:appgroup /app

# Переключаемся на непривилегированного пользователя
USER appuser

# Экспонируем порт
EXPOSE ${PORT}

# Здоровье контейнера
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Запускаем приложение
CMD ["npm", "start"]