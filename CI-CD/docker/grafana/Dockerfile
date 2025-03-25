FROM grafana/grafana:latest

# Копируем провизионирование дашбордов и источников данных
COPY CI-CD/docker/grafana/provisioning /etc/grafana/provisioning

# Устанавливаем переменные окружения
ENV GF_SECURITY_ADMIN_USER=admin
ENV GF_SECURITY_ADMIN_PASSWORD=password
ENV GF_USERS_ALLOW_SIGN_UP=false
ENV GF_SERVER_DOMAIN=localhost
ENV GF_SMTP_ENABLED=false

# Экспонируем порт
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1