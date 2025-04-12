# КороткоСсылка - Инструкция по развертыванию в локальной сети

Профессиональный сервис для сокращения URL-адресов с аналитикой, QR-кодами и надежной инфраструктурой.

## Содержание

1. [Схема архитектуры](#схема-архитектуры)
2. [Требования](#требования)
3. [Структура серверов](#структура-серверов)
4. [Быстрый старт](#быстрый-старт)
5. [Детальная инструкция по развертыванию](#детальная-инструкция-по-развертыванию)
6. [Настройка локального DNS](#настройка-локального-dns)
7. [Настройка HTTPS](#настройка-https)
8. [Мониторинг и логирование](#мониторинг-и-логирование)
9. [Резервное копирование](#резервное-копирование)
10. [Проверка системы](#проверка-системы)
11. [Масштабирование](#масштабирование)
12. [Устранение неполадок](#устранение-неполадок)

## Схема архитектуры

```
                      ┌─────────────────────┐
                      │   Виртуальный       │
                      │   Роутер FRR        │
                      └─────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
┌─────────────────────┐ ┌──────────────────┐ ┌────────────────┐
│ 1SRV - Мониторинг   │ │ 2SRV - Приложение│ │ 3SRV - База    │
│ IP: 192.168.100.10  │ │ IP: 192.168.100.11│ │ IP: 192.168.100.12│
│ - Ansible           │ │ - Frontend        │ │ - MongoDB      │
│ - Grafana           │ │ - Backend         │ │ - MongoDB      │
│ - Prometheus        │ │ - Nginx           │ │   Replica      │
│ - Loki              │ │ - Local DNS       │ │                │
│ - Load Balancer     │ │                   │ │                │
└─────────────────────┘ └──────────────────┘ └────────────────┘
```

## Требования

- Три физических/виртуальных сервера с Ubuntu 20.04 LTS или выше
- Следующие IP-адреса для серверов:
  - 192.168.100.10 (сервер мониторинга)
  - 192.168.100.11 (сервер приложения)
  - 192.168.100.12 (сервер базы данных)
- Доступ по SSH с правами sudo к каждому серверу
- Доступ в интернет для загрузки пакетов и образов Docker

## Структура серверов

### 1SRV - Сервер мониторинга (192.168.100.10)

- Ansible (оркестрация)
- Grafana (визуализация)
- Prometheus (метрики)
- Loki (логи)
- Nginx (обратный прокси с HTTPS)

### 2SRV - Сервер приложения (192.168.100.11)

- Backend (Node.js API)
- Frontend (Vue.js)
- Nginx (обратный прокси с HTTPS)
- Dnsmasq (локальный DNS)

### 3SRV - Сервер базы данных (192.168.100.12)

- MongoDB Replica Set (3 реплики)

## Быстрый старт

Для автоматического развертывания всей инфраструктуры:

1. Клонируйте репозиторий на сервер мониторинга:

```bash
git clone https://github.com/username/korotko-ssilka.git
cd korotko-ssilka
```

2. Настройте Ansible и запустите плейбук развертывания:

```bash
# Установите Ansible
sudo apt update && sudo apt install -y ansible

# Обновите inventoy.ini вашими данными
nano ansible/inventory.ini

# Запустите playbook
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

3. Дождитесь окончания развертывания и проверьте работу системы:

```bash
./server1/check-system.sh
```

4. Откройте в браузере https://shortlink.local для доступа к приложению

## Детальная инструкция по развертыванию

### 1. Подготовка серверов

На всех серверах:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker и Docker Compose
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Настройка сервера MongoDB (3SRV)

```bash
# Создайте директорию для проекта
mkdir -p ~/mongodb-cluster
cd ~/mongodb-cluster

# Создайте docker-compose.yml
nano docker-compose.yml
# Скопируйте содержимое из server3/docker-compose.yml

# Запустите MongoDB кластер
docker-compose up -d

# Проверьте статус репликации через несколько секунд
docker exec -it mongo1 mongosh --eval "rs.status()"
```

### 3. Настройка сервера приложения (2SRV)

```bash
# Создайте директорию для проекта
mkdir -p ~/shortlink-app
cd ~/shortlink-app

# Создайте необходимые директории
mkdir -p nginx/conf.d nginx/ssl dnsmasq Backend Frontend

# Создайте конфигурационные файлы
nano nginx/conf.d/default.conf
# Скопируйте содержимое из server2/nginx/conf.d/default.conf

nano dnsmasq/dnsmasq.conf
# Скопируйте содержимое из server2/dnsmasq/dnsmasq.conf

nano Backend/.env
# Скопируйте содержимое из server2/Backend/.env

nano Frontend/.env
# Скопируйте содержимое из server2/Frontend/.env

# Создайте docker-compose.yml
nano docker-compose.yml
# Скопируйте содержимое из server2/docker-compose.yml

# Создайте скрипт для генерации сертификатов
nano generate-certs.sh
# Скопируйте содержимое из server2/generate-certs.sh
chmod +x generate-certs.sh

# Генерируйте сертификаты
./generate-certs.sh

# Клонируйте или скопируйте исходный код
git clone https://github.com/username/korotko-ssilka-src.git temp-repo
cp -r temp-repo/Backend/* Backend/
cp -r temp-repo/Frontend/* Frontend/
rm -rf temp-repo

# Запустите приложение
docker-compose up -d
```

### 4. Настройка сервера мониторинга (1SRV)

```bash
# Создайте директорию для проекта
mkdir -p ~/monitoring
cd ~/monitoring

# Создайте необходимые директории
mkdir -p prometheus grafana/provisioning/datasources grafana/provisioning/dashboards loki promtail nginx/conf.d nginx/ssl

# Создайте конфигурационные файлы
nano prometheus/prometheus.yml
# Скопируйте содержимое из server1/prometheus/prometheus.yml

nano loki/loki-config.yaml
# Скопируйте содержимое из server1/loki/loki-config.yaml

nano promtail/promtail-config.yaml
# Скопируйте содержимое из server1/promtail/promtail-config.yaml

nano grafana/provisioning/datasources/datasources.yaml
# Скопируйте содержимое из server1/grafana/provisioning/datasources/datasources.yaml

nano nginx/conf.d/default.conf
# Скопируйте содержимое из server1/nginx/conf.d/default.conf

# Скопируйте сертификаты с сервера приложения
mkdir -p ~/monitoring/nginx/ssl
scp youruser@192.168.100.11:~/shortlink-app/nginx/ssl/* ~/monitoring/nginx/ssl/

# Создайте docker-compose.yml
nano docker-compose.yml
# Скопируйте содержимое из server1/docker-compose.yml

# Создайте скрипты для резервного копирования и проверки системы
nano backup-mongodb.sh
# Скопируйте содержимое из server1/backup-mongodb.sh
chmod +x backup-mongodb.sh

nano check-system.sh
# Скопируйте содержимое из server1/check-system.sh
chmod +x check-system.sh

nano setup-cron.sh
# Скопируйте содержимое из server1/setup-cron.sh
chmod +x setup-cron.sh

# Запустите мониторинг
docker-compose up -d

# Настройте cron для резервного копирования
./setup-cron.sh
```

## Настройка локального DNS

Система использует Dnsmasq на сервере приложения (2SRV) для локальных DNS-записей:

```
shortlink.local         -> 192.168.100.11
monitor.shortlink.local -> 192.168.100.10
mongo1.shortlink.local  -> 192.168.100.12
mongo2.shortlink.local  -> 192.168.100.12
mongo3.shortlink.local  -> 192.168.100.12
```

### Настройка на клиентских машинах

#### Вариант 1: Использование DNS-сервера

Настройте DNS-сервер на клиентских машинах на IP-адрес 192.168.100.11

#### Вариант 2: Изменение /etc/hosts

Добавьте в файл /etc/hosts следующие строки:

```
192.168.100.11 shortlink.local
192.168.100.10 monitor.shortlink.local
192.168.100.12 mongo1.shortlink.local mongo2.shortlink.local mongo3.shortlink.local
```

## Настройка HTTPS

Система использует самоподписанные сертификаты для HTTPS:

1. Сертификаты генерируются скриптом `generate-certs.sh` на сервере приложения
2. Корневой сертификат `rootCA.crt` нужно установить в доверенные на клиентских машинах
3. Для доступа к приложению используйте URL https://shortlink.local
4. Для доступа к мониторингу используйте URL https://monitor.shortlink.local

### Установка корневого сертификата на клиентских машинах

#### 1. Скопируйте сертификат с сервера приложения:

```bash
scp youruser@192.168.100.11:~/shortlink-app/nginx/ssl/rootCA.crt ~/
```

#### 2. Ubuntu/Debian:

```bash
sudo cp ~/rootCA.crt /usr/local/share/ca-certificates/
sudo update-ca-certificates
```

#### 3. Windows:

- Дважды кликните на файл rootCA.crt
- Нажмите "Установить сертификат"
- Выберите "Локальный компьютер"
- Выберите "Поместить все сертификаты в следующее хранилище"
- Нажмите "Обзор" и выберите "Доверенные корневые центры сертификации"
- Завершите установку

#### 4. MacOS:

- Дважды кликните на файл rootCA.crt
- В Keychain Access добавьте сертификат в "System"
- Найдите сертификат, дважды кликните на него
- Разверните раздел "Trust" и выберите "Always Trust" для "When using this certificate"

## Мониторинг и логирование

Система мониторинга доступна по адресу https://monitor.shortlink.local:

1. **Grafana**: основной интерфейс для мониторинга (логин/пароль по умолчанию: admin/admin)
2. **Prometheus**: сбор и хранение метрик (/prometheus/)
3. **Loki**: сбор и хранение логов (/loki/)

### Полезные дашборды для Grafana

1. Создайте дашборд для мониторинга MongoDB
2. Создайте дашборд для мониторинга Node.js (Backend)
3. Создайте дашборд для мониторинга Nginx

### Оповещения

Настройте оповещения в Grafana:

1. Перейдите в Alerting -> Notification channels
2. Добавьте каналы оповещения (Email, Slack, Telegram)
3. Создайте правила для оповещений

## Резервное копирование

Система автоматически создает резервные копии MongoDB ежедневно в 2:00 с помощью скрипта `backup-mongodb.sh`:

- Резервные копии хранятся в директории `/backup/mongodb/`
- Хранится 7 последних копий
- Каждая копия архивируется в tar.gz
- Лог операций сохраняется в `/backup/mongodb/backup.log`

### Ручное создание резервной копии

```bash
ssh youruser@192.168.100.10 "~/backup-mongodb.sh"
```

### Восстановление из резервной копии

```bash
# На сервере мониторинга
cd /backup/mongodb
ls -la  # Выберите нужную дату резервной копии

# Распакуйте архив, если необходимо
tar -xzf backup-YYYY-MM-DD_HH-MM-SS.tar.gz

# Скопируйте резервную копию на сервер MongoDB
scp -r backup-YYYY-MM-DD_HH-MM-SS youruser@192.168.100.12:/tmp/

# На сервере MongoDB выполните восстановление
ssh youruser@192.168.100.12
docker exec -it mongo1 mongorestore --drop /tmp/backup-YYYY-MM-DD_HH-MM-SS
```

## Проверка системы

Для проверки состояния всей инфраструктуры используйте скрипт `check-system.sh`:

```bash
ssh youruser@192.168.100.10 "~/check-system.sh"
```

Скрипт проверяет:

- Доступность всех серверов
- Корректность работы DNS
- Доступность веб-сервисов
- Состояние MongoDB репликасета
- Статус Docker контейнеров

## Масштабирование

### Горизонтальное масштабирование приложения

Для добавления дополнительного сервера приложения:

1. Подготовьте новый сервер с IP-адресом (например, 192.168.100.13)
2. Добавьте DNS-запись:

```bash
echo "address=/app2.shortlink.local/192.168.100.13" | ssh youruser@192.168.100.11 "cat >> ~/shortlink-app/dnsmasq/dnsmasq.conf"
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose restart dnsmasq"
```

3. Разверните приложение на новом сервере (повторите шаги из раздела "Настройка сервера приложения")
4. Настройте балансировку нагрузки на Nginx:

```nginx
# На сервере мониторинга обновите конфигурацию Nginx
upstream backend_servers {
    server 192.168.100.11:4512;
    server 192.168.100.13:4512;
}

server {
    listen 443 ssl;
    server_name shortlink.local;

    # ...

    location /api/ {
        proxy_pass http://backend_servers/api/;
        # ...
    }
}
```

### Масштабирование MongoDB

MongoDB уже настроен как репликасет из трех узлов. Для добавления нового узла:

1. Добавьте новый контейнер в `docker-compose.yml` на сервере MongoDB
2. Подключитесь к MongoDB и добавьте новый узел в репликасет:

```bash
docker exec -it mongo1 mongosh
rs.add("mongo4.shortlink.local:27017")
```

## Устранение неполадок

### Проблемы с DNS

```bash
# Перезапустите Dnsmasq
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose restart dnsmasq"

# Проверьте работу DNS
dig +short shortlink.local @192.168.100.11
```

### Проблемы с HTTPS

```bash
# Перегенерируйте сертификаты
ssh youruser@192.168.100.11 "cd ~/shortlink-app && ./generate-certs.sh"

# Обновите сертификаты на других серверах
scp youruser@192.168.100.11:~/shortlink-app/nginx/ssl/* youruser@192.168.100.10:~/monitoring/nginx/ssl/

# Перезапустите Nginx
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose restart nginx"
ssh youruser@192.168.100.10 "cd ~/monitoring && docker-compose restart nginx"
```

### Проблемы с MongoDB

```bash
# Проверьте статус репликасета
ssh youruser@192.168.100.12 "docker exec -it mongo1 mongosh --eval 'rs.status()'"

# Перезапустите MongoDB при необходимости
ssh youruser@192.168.100.12 "cd ~/mongodb-cluster && docker-compose restart"

# Если репликасет нужно реинициализировать
ssh youruser@192.168.100.12 "docker exec -it mongo1 mongosh --eval 'rs.initiate({
  _id: \"rs0\",
  members: [
    {_id: 0, host: \"mongo1.shortlink.local:27017\"},
    {_id: 1, host: \"mongo2.shortlink.local:27017\"},
    {_id: 2, host: \"mongo3.shortlink.local:27017\"}
  ]
})'"
```

### Проблемы с приложением

```bash
# Проверьте логи контейнеров
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose logs -f backend"
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose logs -f frontend"
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose logs -f nginx"

# Перезапустите контейнеры
ssh youruser@192.168.100.11 "cd ~/shortlink-app && docker-compose restart"
```

---

© 2023 КороткоСсылка. Все права защищены.
