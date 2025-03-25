FROM mongo:5.0

# Устанавливаем необходимые пакеты
RUN apt-get update && apt-get install -y \
    cron \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем часовой пояс
ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Создаем директории для бэкапов
RUN mkdir -p /backup/hourly /backup/daily /backup/weekly

# Настройки MongoDB по умолчанию
ENV MONGO_HOST=mongodb
ENV MONGO_PORT=27017
ENV MONGO_USER=admin
ENV MONGO_PASSWORD=password
ENV MONGO_DATABASE=url-shortener
ENV MONGO_AUTH_DB=admin
ENV BACKUP_RETENTION_HOURLY=24
ENV BACKUP_RETENTION_DAILY=7
ENV BACKUP_RETENTION_WEEKLY=4

# Копируем скрипты
COPY CI-CD/docker/backup/backup.sh /usr/local/bin/backup.sh
COPY CI-CD/docker/backup/entrypoint.sh /entrypoint.sh

# Делаем скрипты исполняемыми
RUN chmod +x /usr/local/bin/backup.sh /entrypoint.sh

# Создаем файл задач cron
RUN echo "0 * * * * /usr/local/bin/backup.sh hourly 2>&1 | tee -a /var/log/cron.log" > /etc/cron.d/backup-cron \
    && echo "0 0 * * * /usr/local/bin/backup.sh daily 2>&1 | tee -a /var/log/cron.log" >> /etc/cron.d/backup-cron \
    && echo "0 0 * * 0 /usr/local/bin/backup.sh weekly 2>&1 | tee -a /var/log/cron.log" >> /etc/cron.d/backup-cron \
    && chmod 0644 /etc/cron.d/backup-cron

# Создаем файл для логов
RUN touch /var/log/cron.log

# Запускаем скрипт входа
ENTRYPOINT ["/entrypoint.sh"]