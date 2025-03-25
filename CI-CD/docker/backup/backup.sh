#!/bin/bash

# Параметры подключения к MongoDB из переменных окружения
MONGO_HOST=${MONGO_HOST:-mongodb}
MONGO_PORT=${MONGO_PORT:-27017}
MONGO_USER=${MONGO_USER:-admin}
MONGO_PASSWORD=${MONGO_PASSWORD:-password}
MONGO_DATABASE=${MONGO_DATABASE:-url-shortener}
MONGO_AUTH_DB=${MONGO_AUTH_DB:-admin}

# Директории для бэкапов
BACKUP_TYPE=$1
BACKUP_DIR="/backup/${BACKUP_TYPE}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.gz"

# Определяем количество бэкапов для хранения
if [ "$BACKUP_TYPE" = "hourly" ]; then
    RETENTION=${BACKUP_RETENTION_HOURLY:-24}
elif [ "$BACKUP_TYPE" = "daily" ]; then
    RETENTION=${BACKUP_RETENTION_DAILY:-7}
elif [ "$BACKUP_TYPE" = "weekly" ]; then
    RETENTION=${BACKUP_RETENTION_WEEKLY:-4}
else
    echo "Неизвестный тип бэкапа: ${BACKUP_TYPE}"
    exit 1
fi

echo "Создание ${BACKUP_TYPE} бэкапа..."
mongodump --host ${MONGO_HOST} --port ${MONGO_PORT} \
    --username ${MONGO_USER} --password ${MONGO_PASSWORD} \
    --db ${MONGO_DATABASE} --authenticationDatabase ${MONGO_AUTH_DB} \
    --gzip --archive=${BACKUP_FILE}

# Проверяем успешность бэкапа
if [ $? -eq 0 ]; then
    echo "Бэкап успешно создан: ${BACKUP_FILE}"

    # Удаляем старые бэкапы, оставляя только определенное количество
    ls -t ${BACKUP_DIR}/backup_*.gz | tail -n +$((RETENTION+1)) | xargs -r rm
    echo "Старые бэкапы удалены, осталось ${RETENTION} последних бэкапов."
else
    echo "Ошибка при создании бэкапа!"
    exit 1
fi

echo "Бэкап завершен: $(date)"