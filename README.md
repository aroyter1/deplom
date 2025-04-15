# 🚀 Гайд по автоматическому развертыванию КороткоСсылка-кластера через Ansible

## Описание

Этот проект позволяет быстро и удобно развернуть сервис сокращения ссылок с балансировкой, HTTPS, мониторингом и резервным копированием на 3 локальных серверах с помощью **Ansible** и **Docker**.

---

## Архитектура

- **Сервер 1 (`192.168.100.10`)**:

  - Nginx (балансировщик, HTTPS)
  - Frontend (Vue)
  - Backend (Node.js)

- **Сервер 2 (`192.168.100.11`)**:

  - MongoDB (основная база)

- **Сервер 3 (`192.168.100.12`)**:
  - Backend (Node.js, реплика для балансировки)
  - Grafana (мониторинг)
  - Бэкап MongoDB (каждые 12 часов, хранение локально)

---

## Быстрый старт

### 1. Подготовка серверов

- Установите Ubuntu 20.04+ на все 3 сервера.
- На **Сервере 1** (или любом удобном) установите Ansible и git:

  ```bash
  sudo apt update
  sudo apt install -y ansible git
  ```

- Настройте SSH-доступ без пароля ко всем серверам:

  ```bash
  ssh-keygen -t ed25519
  ssh-copy-id user@192.168.100.10
  ssh-copy-id user@192.168.100.11
  ssh-copy-id user@192.168.100.12
  ```

---

### 2. Клонируйте репозиторий с Ansible-скриптами

bash
git clone https://github.com/yourusername/korotkosilka-ansible.git
cd korotkosilka-ansible

---

### 3. Проверьте инвентарь

Файл `inventory.ini` должен содержать:
ini
[frontend_backend]
192.168.100.10
[mongodb]
192.168.100.11
[backend_replica]
192.168.100.12
[monitoring]
192.168.100.12

---

### 4. Подготовьте сертификаты для HTTPS

- Для теста можно сгенерировать самоподписанные сертификаты:

  ```bash
  mkdir -p files/certs
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout files/certs/privkey.pem \
    -out files/certs/fullchain.pem \
    -subj "/CN=korotko.local"
  ```

- Или используйте свои сертификаты.

---

### 5. Запустите деплой

bash
ansible-playbook -i inventory.ini playbook.yml

---

## Что будет развернуто

- **Сервер 1**:
  - Nginx с HTTPS и балансировкой между двумя backend
  - Frontend (Vue) и основной backend (Node.js)
- **Сервер 2**:
  - MongoDB с сохранением данных и бэкапов
- **Сервер 3**:
  - Реплика backend (Node.js)
  - Grafana (мониторинг, порт 3000)
  - Скрипт бэкапа MongoDB (каждые 12 часов)

---

## Проверка работы

- **Frontend**: https://192.168.100.10/
- **API**: https://192.168.100.10/api
- **Grafana**: http://192.168.100.12:3000 (логин/пароль: admin/admin)

---

## Восстановление из бэкапа MongoDB

На сервере с MongoDB:

bash
docker exec -i mongo mongorestore --archive=/backups/backup-YYYY-MM-DD-HH-MM.gz --gzip --username root --password rootpassword --authenticationDatabase admin

---

## FAQ

- **Как изменить переменные окружения?**
  Измените `.env` файлы в папках `Backend` и `Frontend` перед деплоем.

- **Как добавить новые сервера?**
  Просто добавьте их в `inventory.ini` и настройте соответствующие роли.

- **Как обновить проект?**
  Обновите репозиторий и снова выполните `ansible-playbook`.

---

## Полезные команды

- Перезапустить сервисы на сервере:

  ```bash
  cd /opt/korotkosilka
  docker-compose restart
  ```

- Посмотреть логи:
  ```bash
  docker logs <имя_контейнера>
  ```

---

## Контакты

Если возникли вопросы — пишите в Issues или на почту your@email.com

---

**Удачного деплоя!**
