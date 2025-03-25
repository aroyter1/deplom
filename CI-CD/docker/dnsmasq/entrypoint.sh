#!/bin/bash

echo "Запуск DNS-сервера dnsmasq..."

# Создаем файл логов, если он не существует
touch /var/log/dnsmasq/dnsmasq.log

# Запускаем dnsmasq в режиме foreground с подробным выводом
exec dnsmasq -k -d