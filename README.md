# КороткоСсылка

Профессиональный сервис для сокращения URL-адресов с аналитикой и QR-кодами.

## Требования для запуска

- Docker и Docker Compose
- Node.js (для локальной разработки)
- MongoDB (для локальной разработки)

## Запуск с помощью Docker Compose

Самый простой способ запустить всё окружение:

```bash
# Клонируем репозиторий
git clone https://github.com/username/korotko-ssilka.git
cd korotko-ssilka

# Создаем директорию для конфигурации Nginx
mkdir -p nginx

# Запускаем все сервисы
docker-compose up -d

# Для масштабирования бэкенда (например, до 3 экземпляров)
docker-compose up -d --scale backend=3
```

Сервисы будут доступны по адресам:

- Frontend: http://localhost:5200
- Backend API: http://localhost:4512

## Масштабирование MongoDB

Для масштабирования MongoDB можно использовать несколько подходов:

### 1. Настройка Replica Set (реализовано по умолчанию)

Replica Set уже настроен в docker-compose.yml. Это обеспечивает высокую доступность и отказоустойчивость.

### 2. Добавление дополнительных узлов в Replica Set

Для добавления нового узла в существующий Replica Set:

```bash
# Добавляем новый MongoDB сервер в docker-compose.yml
services:
  mongo2:
    image: mongo:latest
    container_name: korotko_mongo2
    volumes:
      - mongo_data2:/data/db
    ports:
      - '27018:27017'
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=rootpassword
    networks:
      - app_network
    restart: unless-stopped
    command: --replSet rs0

# Затем подключаемся к существующему экземпляру MongoDB и добавляем новый узел
docker exec -it korotko_mongo mongo -u root -p rootpassword --authenticationDatabase admin

# В консоли MongoDB выполняем:
rs.add("mongo2:27017")
```

### 3. Настройка Sharding для горизонтального масштабирования

Для очень больших проектов можно настроить шардинг MongoDB:

1. Настройте конфигурационные серверы
2. Настройте сервер маршрутизации mongos
3. Настройте шарды (каждый в виде Replica Set)
4. Включите шардинг для базы данных и коллекций

Пример настройки для больших проектов доступен в отдельном [документе по масштабированию](docs/mongodb-scaling.md).

## Резервное копирование MongoDB

### 1. Автоматическое резервное копирование с помощью mongodump

```bash
# Создаем скрипт для резервного копирования
mkdir -p backup-scripts
cat > backup-scripts/mongodb-backup.sh << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb/$TIMESTAMP"

# Создаем директорию для бэкапа
mkdir -p $BACKUP_DIR

# Выполняем резервное копирование
mongodump --host mongodb://root:rootpassword@mongo:27017 --authenticationDatabase admin --db url-shortener --out $BACKUP_DIR

# Сжимаем архив
tar -zcvf "$BACKUP_DIR.tar.gz" -C /backups/mongodb $TIMESTAMP

# Удаляем несжатые файлы
rm -rf $BACKUP_DIR

# Удаляем бэкапы старше 30 дней
find /backups/mongodb -name "*.tar.gz" -type f -mtime +30 -delete
EOF

# Делаем скрипт исполняемым
chmod +x backup-scripts/mongodb-backup.sh

# Добавляем сервис для бэкапа в docker-compose.yml
services:
  mongodb-backup:
    image: mongo:latest
    volumes:
      - ./backup-scripts:/scripts
      - ./backups:/backups
    entrypoint: /bin/bash
    command: -c "echo '0 3 * * * /scripts/mongodb-backup.sh' | crontab - && crond -f"
    depends_on:
      - mongo
    networks:
      - app_network
```

### 2. Ручное резервное копирование

```bash
# Создание резервной копии всей базы данных
docker exec korotko_mongo mongodump --username root --password rootpassword --authenticationDatabase admin --db url-shortener --out /data/backup

# Копирование дампа на локальный компьютер
docker cp korotko_mongo:/data/backup ./backups

# Восстановление из резервной копии
docker cp ./backups korotko_mongo:/data/
docker exec korotko_mongo mongorestore --username root --password rootpassword --authenticationDatabase admin --db url-shortener /data/backups/url-shortener
```

### 3. Репликация для резервного копирования

Replica Set, настроенный в проекте, также служит в качестве первой линии защиты данных. Вы всегда можете восстановить данные с реплики в случае повреждения основного узла.

## Локальная разработка

### Бэкенд

```bash
cd Backend
cp .env.example .env  # Скопируйте и настройте переменные окружения
npm install
npm run dev
# Сервер запустится на http://localhost:4512
```

### Фронтенд

```bash
cd Frontend
cp .env.example .env  # Скопируйте и настройте переменные окружения
npm install
npm run dev
# Приложение будет доступно на http://localhost:5200
```

## Настройка переменных окружения

### Backend (.env)

```
# Основные настройки сервера
PORT=4512
NODE_ENV=development

# Настройки базы данных
MONGODB_URI=mongodb://localhost:27017/url-shortener
MONGODB_REPLICA_SET=rs0
MONGODB_POOL_SIZE=10
MONGODB_CONNECT_TIMEOUT_MS=30000
MONGODB_SOCKET_TIMEOUT_MS=360000

# Настройки JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# URL настройки
BASE_URL=http://localhost:4512
CLIENT_URL=http://localhost:5200

# Логирование
LOG_LEVEL=info

# Лимиты запросов
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env)

```
# Основные настройки приложения
VITE_APP_NAME=КороткоСсылка
VITE_APP_DESCRIPTION=Профессиональный сервис для сокращения ссылок

# API настройки
VITE_API_URL=http://localhost:4512
VITE_API_TIMEOUT=30000

# Настройки приложения
VITE_APP_PORT=5200
VITE_APP_HOST=localhost
```
