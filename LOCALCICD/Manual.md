# Инструкция по развертыванию инфраструктуры

## 1. Сетевая конфигурация серверов

### Таблица сетевых настроек
| Сервер | IP адрес | Маска подсети | Шлюз | DNS | Hostname |
|--------|----------|---------------|-------|-----|----------|
| Frontend | 192.168.200.10 | 255.255.255.0 | 192.168.200.1 | 192.168.200.1 | frontend01 |
| Backend | 192.168.200.11 | 255.255.255.0 | 192.168.200.1 | 192.168.200.1 | backend01 |
| Database | 192.168.200.12 | 255.255.255.0 | 192.168.200.1 | 192.168.200.1 | db01 |
| Monitoring | 192.168.200.13 | 255.255.255.0 | 192.168.200.1 | 192.168.200.1 | monitor01 |

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
      gateway4: 192.168.200.1
      nameservers:
        addresses: [192.168.200.1]
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
address=/frontend.deplom.local/192.168.200.10
address=/backend.deplom.local/192.168.200.11
address=/db.deplom.local/192.168.200.12
address=/monitor.deplom.local/192.168.200.13

# DHCP настройки
dhcp-range=192.168.200.50,192.168.200.150,12h
dhcp-option=option:router,192.168.200.1
dhcp-option=option:dns-server,192.168.200.1

# Статические привязки
dhcp-host=frontend01,192.168.200.10,infinite
dhcp-host=backend01,192.168.200.11,infinite
dhcp-host=db01,192.168.200.12,infinite
dhcp-host=monitor01,192.168.200.13,infinite
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
for ip in 192.168.200.{10,11,12,13}; do
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
ssh deploy@192.168.200.10 'docker logs frontend'

# Backend логи
ssh deploy@192.168.200.11 'docker logs backend'

# База данных
ssh deploy@192.168.200.12 'docker logs database'
```

## 8. Резервное копирование

### База данных:
```bash
# Создание бэкапа
ssh deploy@192.168.200.12 'docker exec database mongodump --out /backup'

# Копирование на сервер мониторинга
ssh deploy@192.168.200.12 'docker cp database:/backup /tmp/backup'
scp -r deploy@192.168.200.12:/tmp/backup deploy@192.168.200.13:/backup/$(date +%Y%m%d)
```

## 8. Настройка Grafana и мониторинга

### Установка Grafana на сервере мониторинга:
```bash
# Подключение к серверу мониторинга
ssh deploy@192.168.200.13

# Создание директорий для данных
sudo mkdir -p /opt/grafana/{data,provisioning}

# Создание docker-compose.yml для Grafana
cat > /opt/grafana/docker-compose.yml << EOF
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_secure_password
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://monitor.deplom.local/grafana
    volumes:
      - /opt/grafana/data:/var/lib/grafana
      - /opt/grafana/provisioning:/etc/grafana/provisioning
    restart: always

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - /opt/grafana/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: always

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: always
EOF

# Создание конфигурации Prometheus
cat > /opt/grafana/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'frontend'
    static_configs:
      - targets: ['192.168.200.10:9100']

  - job_name: 'backend'
    static_configs:
      - targets: ['192.168.200.11:9100']

  - job_name: 'database'
    static_configs:
      - targets: ['192.168.200.12:9100']
EOF

# Запуск Grafana и Prometheus
cd /opt/grafana
docker-compose up -d
```

### Настройка Node Exporter на всех серверах:
```bash
# Выполнить на каждом сервере (frontend, backend, database)
docker run -d \
  --name node-exporter \
  --restart always \
  --net="host" \
  --pid="host" \
  -v "/:/host:ro,rslave" \
  prom/node-exporter:latest \
  --path.rootfs=/host
```

### Базовая настройка Grafana:
1. Откройте http://monitor.deplom.local:3000
2. Войдите с credentials:
   - Username: admin
   - Password: your_secure_password (указанный в docker-compose.yml)
3. Добавьте Prometheus как источник данных:
   - URL: http://prometheus:9090
4. Импортируйте базовые дашборды:
   - Node Exporter Full (ID: 1860)
   - MongoDB Overview (ID: 2583)

### Настройка алертов:
```bash
# Создание конфигурации алертов
cat > /opt/grafana/provisioning/alerting/alerts.yml << EOF
groups:
  - name: Basic Alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High CPU usage on {{ $labels.instance }}
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High memory usage on {{ $labels.instance }}
          
      - alert: LowDiskSpace
        expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Low disk space on {{ $labels.instance }}
EOF
```
