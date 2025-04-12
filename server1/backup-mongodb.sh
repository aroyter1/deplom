#!/bin/bash
# Скрипт для создания резервных копий MongoDB

# Настройки
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR=/backup/mongodb
RETENTION_DAYS=7
SSH_USER=youruser
MONGODB_HOST=192.168.100.12
APP_HOST=192.168.100.11

# Создание директории для резервных копий
mkdir -p $BACKUP_DIR

# Логирование
echo "[$(date)] Начало создания резервной копии MongoDB" >> $BACKUP_DIR/backup.log

# Создание резервной копии на сервере MongoDB
ssh $SSH_USER@$MONGODB_HOST "mkdir -p /tmp/backup-$DATE"
ssh $SSH_USER@$MONGODB_HOST "docker exec -t mongo1 mongodump --out=/tmp/backup-$DATE"
ssh $SSH_USER@$MONGODB_HOST "docker cp mongo1:/tmp/backup-$DATE /tmp/"

# Копирование резервной копии на сервер мониторинга
scp -r $SSH_USER@$MONGODB_HOST:/tmp/backup-$DATE $BACKUP_DIR/

# Очистка временных файлов
ssh $SSH_USER@$MONGODB_HOST "rm -rf /tmp/backup-$DATE"
ssh $SSH_USER@$MONGODB_HOST "docker exec mongo1 rm -rf /tmp/backup-$DATE"

# Удаление старых резервных копий (оставляем только RETENTION_DAYS последних)
find $BACKUP_DIR -type d -name "backup-*" -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# Создаем архив последней резервной копии
tar -czf $BACKUP_DIR/backup-$DATE.tar.gz $BACKUP_DIR/backup-$DATE

# Логирование
echo "[$(date)] Резервное копирование завершено. Создана копия: backup-$DATE" >> $BACKUP_DIR/backup.log

# Отправка уведомления о успешном создании резервной копии
echo "Резервная копия MongoDB успешно создана: backup-$DATE" | mail -s "MongoDB Backup Success" admin@example.com