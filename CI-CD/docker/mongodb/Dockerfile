FROM mongo:5.0

# Создаем директории для данных и логов
RUN mkdir -p /data/db /data/configdb /var/log/mongodb

# Настройки безопасности
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=password
ENV MONGO_INITDB_DATABASE=url-shortener

# Копируем скрипт инициализации
COPY CI-CD/docker/mongodb/init-mongo.js /docker-entrypoint-initdb.d/

# Экспонируем порт
EXPOSE 27017

# Здоровье контейнера
HEALTHCHECK --interval=30s --timeout=5s \
  CMD mongo --eval 'db.runCommand("ping").ok' mongodb://localhost:27017/test --quiet

# Запускаем MongoDB
CMD ["mongod", "--bind_ip_all"]