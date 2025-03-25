FROM alpine:latest

# Установка dnsmasq и необходимых инструментов
RUN apk add --no-cache dnsmasq bash

# Создаем директорию для конфигурации и логов
RUN mkdir -p /etc/dnsmasq.d /var/log/dnsmasq

# Копируем конфигурационный файл
COPY CI-CD/docker/dnsmasq/dnsmasq.conf /etc/dnsmasq.conf
COPY CI-CD/docker/dnsmasq/hosts /etc/dnsmasq.hosts
COPY CI-CD/docker/dnsmasq/entrypoint.sh /entrypoint.sh

# Делаем скрипт запуска исполняемым
RUN chmod +x /entrypoint.sh

# Экспонируем порты
EXPOSE 53/tcp 53/udp

# Проверка здоровья сервиса
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD nslookup frontend.korotkossylka.local 127.0.0.1 || exit 1

# Запускаем dnsmasq
ENTRYPOINT ["/entrypoint.sh"]