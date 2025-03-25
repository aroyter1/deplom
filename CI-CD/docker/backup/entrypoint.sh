#!/bin/bash

echo "Запуск сервиса бэкапа MongoDB..."

# Запускаем немедленный бэкап
/usr/local/bin/backup.sh hourly

# Запускаем cron
crontab /etc/cron.d/backup-cron
cron

# Выводим логи
echo "Сервис бэкапа запущен, отслеживаем логи..."
tail -f /var/log/cron.log