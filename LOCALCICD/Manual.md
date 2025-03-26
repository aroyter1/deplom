# Инструкция по развертыванию инфраструктуры

## 1. Сетевая конфигурация серверов

### Таблица сетевых настроек
| Сервер | IP адрес | Маска подсети | Шлюз | DNS | Hostname |
|--------|----------|---------------|-------|-----|----------|
| Frontend | 192.168.1.10 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 | frontend01 |
| Backend | 192.168.1.11 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 | backend01 |
| Database | 192.168.1.12 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 | db01 |
| Monitoring | 192.168.1.13 | 255.255.255.0 | 192.168.1.1 | 192.168.1.1 | monitor01 |

### Настройка сетевых интерфейсов (Ubuntu)
На каждом сервере создать файл `/etc/netplan/01-netcfg.yaml`:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - IP_АДРЕС/24  # Заменить на IP из таблицы
      gateway4: 192.168.1.1
      nameservers:
        addresses: [192.168.1.1]
```

Применить настройки:
```bash
sudo netplan apply
```

## 2. Настройка DNS (dnsmasq)

### На управляющем сервере установить dnsmasq:
```bash
sudo apt update
sudo apt install dnsmasq
```

### Конфигурация dnsmasq
Создать файл `/etc/dnsmasq.conf`:
```conf
# Основные настройки
domain-needed
bogus-priv
no-resolv
no-poll

# DNS серверы
server=8.8.8.8
server=8.8.4.4

# Локальный домен
local=/deplom.local/
domain=deplom.local

# DNS записи
address=/frontend.deplom.local/192.168.1.10
address=/backend.deplom.local/192.168.1.11
address=/db.deplom.local/192.168.1.12
address=/monitor.deplom.local/192.168.1.13

# DHCP настройки
dhcp-range=192.168.1.50,192.168.1.150,12h
dhcp-option=option:router,192.168.1.1
dhcp-option=option:dns-server,192.168.1.1

# Статические привязки
dhcp-host=frontend01,192.168.1.10,infinite
dhcp-host=backend01,192.168.1.11,infinite
dhcp-host=db01,192.168.1.12,infinite
dhcp-host=monitor01,192.168.1.13,infinite
```

Перезапустить dnsmasq:
```bash
sudo systemctl restart dnsmasq
```

## 3. Настройка SSH

### На управляющем сервере:
```bash
# Генерация SSH ключей
ssh-keygen -t rsa -b 4096 -C "deploy@deplom"

# Копирование ключей на серверы
for ip in 192.168.1.{10,11,12,13}; do
    ssh-copy-id deploy@$ip
done
```

### На каждом сервере:
```bash
# Создание пользователя deploy
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy

# Настройка SSH
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

## 4. Настройка Ansible

### На управляющем сервере:
```bash
# Установка Ansible
sudo apt update
sudo apt install ansible

# Проверка подключения
ansible all -i inventory.yml -m ping
```

## 5. Развертывание сервиса

### Клонирование репозитория:
```bash
git clone https://github.com/aroyter1/deplom
cd deplom/LOCALCICD
```

### Создание файла с переменными окружения:
```bash
cat > .env << EOF
JWT_SECRET=ваш_секретный_ключ
EOF
```

### Запуск развертывания:
```bash
# Проверка синтаксиса
ansible-playbook -i inventory.yml deploy.yml --syntax-check

# Проверка изменений
ansible-playbook -i inventory.yml deploy.yml --check

# Развертывание
ansible-playbook -i inventory.yml deploy.yml
```

## 6. Проверка развертывания

### Проверка доступности сервисов:
```bash
# Frontend
curl http://frontend.deplom.local

# Backend
curl http://backend.deplom.local/api/health

# Grafana
curl http://monitor.deplom.local/grafana
```

## 7. Обслуживание

### Обновление сервисов:
```bash
# Обновление репозитория
git pull origin main

# Повторное развертывание
ansible-playbook -i inventory.yml deploy.yml
```

### Мониторинг логов:
```bash
# Frontend логи
ssh deploy@192.168.1.10 'docker logs frontend'

# Backend логи
ssh deploy@192.168.1.11 'docker logs backend'

# База данных
ssh deploy@192.168.1.12 'docker logs database'
```

## 8. Резервное копирование

### База данных:
```bash
# Создание бэкапа
ssh deploy@192.168.1.12 'docker exec database mongodump --out /backup'

# Копирование на сервер мониторинга
ssh deploy@192.168.1.12 'docker cp database:/backup /tmp/backup'
scp -r deploy@192.168.1.12:/tmp/backup deploy@192.168.1.13:/backup/$(date +%Y%m%d)
```
