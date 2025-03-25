# CI/CD инфраструктура для проекта КороткоСсылка

Эта директория содержит все необходимые файлы для настройки CI/CD инфраструктуры, мониторинга и резервного копирования для проекта "КороткоСсылка".

## Компоненты

1. **GitHub Actions workflows** - автоматизация тестирования, сборки и деплоя
2. **Docker контейнеры** - изолированные окружения для каждого компонента
3. **Nginx балансировщик** - распределение нагрузки и SSL-терминация
4. **Мониторинг с Grafana и Prometheus** - отслеживание состояния системы
5. **Автоматическое резервное копирование MongoDB** - защита данных

## Быстрый старт

### Локальное развертывание

```bash
cd CI-CD
docker-compose up -d
```

После запуска все сервисы будут доступны по следующим адресам:

- **Веб-приложение**: http://localhost
- **API**: http://localhost/api
- **Grafana**: http://localhost:3030 (admin/password)

### Настройка GitHub Actions

1. Добавьте следующие секреты в настройках вашего GitHub репозитория:

   - `DOCKER_HUB_USERNAME` - имя пользователя Docker Hub
   - `DOCKER_HUB_ACCESS_TOKEN` - токен доступа Docker Hub

2. Скопируйте файлы из `github-workflows` в директорию `.github/workflows` вашего репозитория

## Настройка для Production

### Требования

- Сервер с Docker и Docker Compose
- Доменное имя с настроенными DNS
- SSL-сертификаты (Let's Encrypt)

### Шаги по настройке

1. Клонируйте репозиторий на сервер
2. Создайте файл `.env` на основе `.env.example`
3. Поместите SSL-сертификаты в директорию `ssl/`
4. Отредактируйте файл `docker-compose.yml` для production:
   - Укажите ваше доменное имя
   - Настройте переменные окружения
   - Добавьте тома для персистентности данных
5. Запустите инфраструктуру:

```bash
docker-compose up -d
```

## Масштабирование

Для горизонтального масштабирования:

```bash
docker-compose up -d --scale backend=3 --scale frontend=2
```

## Мониторинг

В Grafana предварительно настроены дашборды для:

- Системных ресурсов
- Контейнеров Docker
- MongoDB
- Node.js приложений

## Резервное копирование

Система автоматически создает:

- Ежечасные бэкапы (хранятся 24 часа)
- Ежедневные бэкапы (хранятся 7 дней)
- Еженедельные бэкапы (хранятся 4 недели)

Для восстановления из бэкапа:

```bash
docker-compose exec backup mongorestore --host mongodb --port 27017 --username admin --password password --db url-shortener --gzip --archive=/backup/daily/backup_YYYYMMDD_HHMMSS.gz
```

## Обслуживание

### Обновление приложения

```bash
git pull
docker-compose build
docker-compose up -d
```

### Проверка логов

```bash
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```
