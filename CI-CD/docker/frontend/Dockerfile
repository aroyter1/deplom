# Этап сборки
FROM node:18-alpine as build-stage

WORKDIR /app

# Аргументы и энв переменные для сборки
ARG NODE_ENV=production
ARG VITE_API_URL=http://localhost:3000
ARG VITE_APP_TITLE=КороткоСсылка

ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}

# Устанавливаем зависимости
COPY Frontend/package*.json ./
RUN npm install

# Копируем исходный код
COPY Frontend/ .

# Собираем приложение
RUN npm run build

# Этап для production с Nginx
FROM nginx:stable-alpine as production-stage

# Копируем конфигурацию nginx
COPY CI-CD/docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Создаем директорию для логов
RUN mkdir -p /var/log/nginx

# Экспонируем порт
EXPOSE 80

# Здоровье контейнера
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]