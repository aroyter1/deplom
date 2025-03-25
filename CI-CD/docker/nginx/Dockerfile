FROM nginx:stable-alpine

# Копируем конфигурацию nginx
COPY CI-CD/docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Создаем директории для SSL-сертификатов (заполнятся при развертывании)
RUN mkdir -p /etc/nginx/ssl

# Создаем директории для логов
RUN mkdir -p /var/log/nginx

# Проверка конфигурации при запуске
HEALTHCHECK --interval=30s --timeout=3s \
  CMD nginx -t || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]