#!/bin/bash
# Скрипт для проверки состояния системы

echo "=== Проверка состояния системы КороткоСсылка ==="
echo

# Проверка доступности серверов
echo "Проверка доступности серверов:"
for host in 192.168.100.10 192.168.100.11 192.168.100.12
do
  if ping -c 1 $host &> /dev/null
  then
    echo "✅ Сервер $host доступен"
  else
    echo "❌ Сервер $host недоступен!"
  fi
done
echo

# Проверка работы DNS
echo "Проверка работы DNS:"
if dig +short shortlink.local @192.168.100.11 | grep -q "192.168.100.11"
then
  echo "✅ DNS-сервер правильно разрешает shortlink.local"
else
  echo "❌ Проблема с DNS-сервером для shortlink.local!"
fi

if dig +short mongo1.shortlink.local @192.168.100.11 | grep -q "192.168.100.12"
then
  echo "✅ DNS-сервер правильно разрешает mongo1.shortlink.local"
else
  echo "❌ Проблема с DNS-сервером для mongo1.shortlink.local!"
fi
echo

# Проверка доступности веб-сервисов
echo "Проверка доступности веб-сервисов:"
for service in "https://shortlink.local" "https://monitor.shortlink.local"
do
  if curl -k -s -o /dev/null -w "%{http_code}" $service | grep -q "200\|301\|302"
  then
    echo "✅ Сервис $service доступен"
  else
    echo "❌ Сервис $service недоступен!"
  fi
done
echo

# Проверка состояния MongoDB
echo "Проверка состояния MongoDB:"
mongo_status=$(ssh youruser@192.168.100.12 "docker exec -t mongo1 mongosh --eval 'rs.status().ok'" | tail -n 1)
if [ "$mongo_status" == "1" ]
then
  echo "✅ MongoDB репликасет работает нормально"
else
  echo "❌ Проблема с MongoDB репликасетом!"
fi
echo

# Проверка состояния Docker контейнеров
echo "Проверка состояния Docker на сервере приложения:"
ssh youruser@192.168.100.11 "docker ps --format '{{.Names}}: {{.Status}}' | grep -v 'Exited\|Created'"
echo

echo "Проверка состояния Docker на сервере MongoDB:"
ssh youruser@192.168.100.12 "docker ps --format '{{.Names}}: {{.Status}}' | grep -v 'Exited\|Created'"
echo

echo "Проверка состояния Docker на сервере мониторинга:"
docker ps --format '{{.Names}}: {{.Status}}' | grep -v 'Exited\|Created'
echo

echo "=== Проверка завершена ==="