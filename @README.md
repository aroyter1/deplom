# Руководство по развертыванию проекта "КороткоСсылка"

## Сетевая топология кластера

Проект развертывается в локальной сети 192.168.100.0/24 на 4-х серверах:

**Сервер 1 (Координатор)**:

- IP: 192.168.100.10
- Hostname: coordinator.korotkossylka.local
- Роли: Nginx-балансировщик, DNS-сервер (dnsmasq)

**Сервер 2 (Frontend)**:

- IP: 192.168.100.20
- Hostname: frontend.korotkossylka.local
- Роли: Vue.js приложение, Nginx для статических файлов

**Сервер 3 (Backend)**:

- IP: 192.168.100.30
- Hostname: backend.korotkossylka.local
- Роли: Node.js API-сервер, масштабируемые экземпляры

**Сервер 4 (Данные и мониторинг)**:

- IP: 192.168.100.40
- Hostname: db.korotkossylka.local
- Роли: MongoDB, сервис резервного копирования, Grafana, Prometheus

## Базовая настройка серверов

### Настройка сети

#### Сервер 1 (Координатор)

```bash
# Редактируем /etc/network/interfaces
sudo nano /etc/network/interfaces

# Добавляем конфигурацию:
# Loopback
auto lo
iface lo inet loopback

# Основной сетевой интерфейс
auto ens33
iface ens33 inet static
    address 192.168.100.10
    netmask 255.255.255.0
    gateway 192.168.100.1
    dns-nameservers 8.8.8.8 8.8.4.4

# Перезапускаем сеть
sudo systemctl restart networking
```

#### Сервер 2 (Frontend)

```bash
# Редактируем /etc/network/interfaces
sudo nano /etc/network/interfaces

# Добавляем конфигурацию:
# Loopback
auto lo
iface lo inet loopback

# Основной сетевой интерфейс
auto ens33
iface ens33 inet static
    address 192.168.100.20
    netmask 255.255.255.0
    gateway 192.168.100.1
    dns-nameservers 192.168.100.10 8.8.8.8

# Перезапускаем сеть
sudo systemctl restart networking
```

#### Сервер 3 (Backend)

```bash
# Редактируем /etc/network/interfaces
sudo nano /etc/network/interfaces

# Добавляем конфигурацию:
# Loopback
auto lo
iface lo inet loopback

# Основной сетевой интерфейс
auto ens33
iface ens33 inet static
    address 192.168.100.30
    netmask 255.255.255.0
    gateway 192.168.100.1
    dns-nameservers 192.168.100.10 8.8.8.8

# Перезапускаем сеть
sudo systemctl restart networking
```

#### Сервер 4 (База данных и Мониторинг)

```bash
# Редактируем /etc/network/interfaces
sudo nano /etc/network/interfaces

# Добавляем конфигурацию:
# Loopback
auto lo
iface lo inet loopback

# Основной сетевой интерфейс
auto ens33
iface ens33 inet static
    address 192.168.100.40
    netmask 255.255.255.0
    gateway 192.168.100.1
    dns-nameservers 192.168.100.10 8.8.8.8

# Перезапускаем сеть
sudo systemctl restart networking
```

### Настройка DNS-сервера (dnsmasq) на координаторе

После настройки статических IP-адресов, нужно обновить конфигурацию DNS-сервера на координаторе.

```bash
# На сервере 1 (Координатор)
sudo nano /etc/dnsmasq.hosts

# Добавьте следующие записи
192.168.100.10 coordinator.korotkossylka.local nginx.korotkossylka.local
192.168.100.20 frontend.korotkossylka.local
192.168.100.30 backend.korotkossylka.local
192.168.100.40 db.korotkossylka.local mongodb.korotkossylka.local grafana.korotkossylka.local prometheus.korotkossylka.local

# Перезапустите dnsmasq
sudo systemctl restart dnsmasq
```

### Обновленный inventory.ini для Ansible

```ini
[coordinator]
coordinator ansible_host=192.168.100.10

[frontend]
frontend ansible_host=192.168.100.20

[backend]
backend ansible_host=192.168.100.30

[database]
database ansible_host=192.168.100.40

[monitoring]
monitoring ansible_host=192.168.100.40

[all:vars]
ansible_user=korotkossylka
ansible_ssh_private_key_file=~/.ssh/id_ed25519
ansible_become=yes
ansible_become_method=sudo
```

## Настройка GitHub Actions Workflows

Для обеспечения работы CI/CD-пайплайнов необходимо настроить GitHub Actions для взаимодействия с нашей инфраструктурой.

### Настройка секретов в GitHub Repository

В настройках вашего GitHub репозитория добавьте следующие секреты:

1. `DOCKER_HUB_USERNAME` - имя пользователя Docker Hub
2. `DOCKER_HUB_ACCESS_TOKEN` - токен доступа Docker Hub
3. `SSH_PRIVATE_KEY` - приватный SSH-ключ для подключения к серверам
4. `COORDINATOR_HOST` - IP-адрес координатора (192.168.100.10)
5. `FRONTEND_HOST` - IP-адрес сервера с фронтендом (192.168.100.20)
6. `BACKEND_HOST` - IP-адрес сервера с бэкендом (192.168.100.30)
7. `DATABASE_HOST` - IP-адрес сервера с базой данных (192.168.100.40)

### Создание deploy-workflow.yml для развертывания на серверах

Создайте файл `.github/workflows/deploy.yml` в вашем репозитории:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main, master]
    paths:
      - '**/*'
      - '!README.md'
      - '!.github/workflows/frontend.yml'
      - '!.github/workflows/backend.yml'
      - '!.gitignore'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add hosts to known_hosts
        run: |
          ssh-keyscan -H ${{ secrets.COORDINATOR_HOST }} >> ~/.ssh/known_hosts
          ssh-keyscan -H ${{ secrets.FRONTEND_HOST }} >> ~/.ssh/known_hosts
          ssh-keyscan -H ${{ secrets.BACKEND_HOST }} >> ~/.ssh/known_hosts
          ssh-keyscan -H ${{ secrets.DATABASE_HOST }} >> ~/.ssh/known_hosts

      - name: Install Ansible
        run: |
          sudo apt update
          sudo apt install -y ansible

      - name: Create inventory file
        run: |
          echo "[coordinator]" > inventory.ini
          echo "coordinator ansible_host=${{ secrets.COORDINATOR_HOST }}" >> inventory.ini
          echo "[frontend]" >> inventory.ini
          echo "frontend ansible_host=${{ secrets.FRONTEND_HOST }}" >> inventory.ini
          echo "[backend]" >> inventory.ini
          echo "backend ansible_host=${{ secrets.BACKEND_HOST }}" >> inventory.ini
          echo "[database]" >> inventory.ini
          echo "database ansible_host=${{ secrets.DATABASE_HOST }}" >> inventory.ini
          echo "[monitoring]" >> inventory.ini
          echo "monitoring ansible_host=${{ secrets.DATABASE_HOST }}" >> inventory.ini
          echo "[all:vars]" >> inventory.ini
          echo "ansible_user=korotkossylka" >> inventory.ini
          echo "ansible_become=yes" >> inventory.ini
          echo "ansible_become_method=sudo" >> inventory.ini

      - name: Copy project files
        run: |
          ansible-playbook -i inventory.ini CI-CD/ansible/copy-files.yml

      - name: Deploy services
        run: |
          ansible-playbook -i inventory.ini CI-CD/ansible/deploy-services.yml
```

### Обновление nginx.conf для новых IP-адресов

Отредактируйте файл `CI-CD/docker/nginx/nginx.conf` для использования правильных IP-адресов:

```bash
# Создайте playbook для обновления конфигурации Nginx
cat > update-nginx-config.yml << EOF
---
- name: Обновление конфигурации Nginx
  hosts: coordinator
  tasks:
    - name: Обновление upstream серверов в конфигурации
      replace:
        path: /opt/korotkossylka/CI-CD/docker/nginx/nginx.conf
        regexp: 'server backend1:3000'
        replace: 'server 192.168.100.30:3000'

    - name: Обновление upstream фронтенд серверов
      replace:
        path: /opt/korotkossylka/CI-CD/docker/nginx/nginx.conf
        regexp: 'server frontend1:80'
        replace: 'server 192.168.100.20:80'

    - name: Перезапуск Nginx
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml restart nginx
EOF

# Выполните playbook
ansible-playbook -i inventory.ini update-nginx-config.yml
```

## Интеграция GitHub Actions с локальным развертыванием

Для интеграции GitHub Actions с локальным кластером (без публичного доступа) настройте VPN или SSH-туннель:

```bash
# На каждом сервере установите wireguard для создания безопасной VPN
sudo apt install -y wireguard

# Создайте конфигурацию wireguard на координаторе (пример)
cat > /etc/wireguard/wg0.conf << EOF
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <coordinator-private-key>

# Frontend
[Peer]
PublicKey = <frontend-public-key>
AllowedIPs = 10.0.0.2/32

# Backend
[Peer]
PublicKey = <backend-public-key>
AllowedIPs = 10.0.0.3/32

# Database
[Peer]
PublicKey = <database-public-key>
AllowedIPs = 10.0.0.4/32

# GitHub Actions Runner
[Peer]
PublicKey = <github-runner-public-key>
AllowedIPs = 10.0.0.5/32
EOF

# Активируйте wireguard на всех серверах
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0
```

## Обновленные настройки hosts-файлов

```bash
# Создайте playbook для обновления hosts-файлов
cat > update-hosts.yml << EOF
---
- name: Обновление файла hosts
  hosts: all
  tasks:
    - name: Добавление записей в /etc/hosts
      lineinfile:
        path: /etc/hosts
        line: '{{ item }}'
        state: present
      loop:
        - '192.168.100.10 coordinator.korotkossylka.local nginx.korotkossylka.local'
        - '192.168.100.20 frontend.korotkossylka.local'
        - '192.168.100.30 backend.korotkossylka.local'
        - '192.168.100.40 db.korotkossylka.local mongodb.korotkossylka.local grafana.korotkossylka.local prometheus.korotkossylka.local'
EOF

# Выполните playbook
ansible-playbook -i inventory.ini update-hosts.yml
```

## Автоматизированное обновление и масштабирование с GitHub Actions

Создайте файл `.github/workflows/scale.yml` для масштабирования сервисов:

```yaml
name: Scale Services

on:
  workflow_dispatch:
    inputs:
      frontend_replicas:
        description: 'Количество реплик Frontend'
        required: true
        default: '2'
      backend_replicas:
        description: 'Количество реплик Backend'
        required: true
        default: '3'

jobs:
  scale:
    runs-on: ubuntu-latest
    steps:
      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.7.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add hosts to known_hosts
        run: |
          ssh-keyscan -H ${{ secrets.FRONTEND_HOST }} >> ~/.ssh/known_hosts
          ssh-keyscan -H ${{ secrets.BACKEND_HOST }} >> ~/.ssh/known_hosts

      - name: Scale Frontend
        run: |
          ssh korotkossylka@${{ secrets.FRONTEND_HOST }} "cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml up -d --scale frontend=${{ github.event.inputs.frontend_replicas }}"

      - name: Scale Backend
        run: |
          ssh korotkossylka@${{ secrets.BACKEND_HOST }} "cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml up -d --scale backend=${{ github.event.inputs.backend_replicas }}"
```

## Обновление Docker Compose для сетевых настроек

Обновите файл `CI-CD/docker-compose.yml` для работы с внешними IP-адресами:

```yaml
# Добавьте эту секцию в networks для обеспечения доступа между серверами
networks:
  web:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  db:
    driver: bridge
    ipam:
      config:
        - subnet: 172.21.0.0/16
  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.22.0.0/16
```

## Проверка развернутой инфраструктуры

### Мониторинг состояния контейнеров

```bash
# Проверка состояния на всех серверах
ansible -i inventory/hosts.ini all -m shell -a "docker ps"

# Проверка логов DNS-сервера
ansible -i inventory/hosts.ini coordinator -m shell -a "docker logs dnsmasq"

# Проверка доступности Frontend
ansible -i inventory/hosts.ini coordinator -m shell -a "curl -I http://frontend.korotkossylka.local"
```

### Доступ к сервисам

После успешного развертывания все сервисы будут доступны по следующим адресам:

- **Веб-приложение**: http://nginx.korotkossylka.local
- **API**: http://nginx.korotkossylka.local/api
- **Grafana**: http://grafana.korotkossylka.local:3030 (логин: admin, пароль: password)
- **Prometheus**: http://prometheus.korotkossylka.local:9090

## Обслуживание кластера

### Обновление приложения

Для обновления приложения выполните следующие шаги:

```bash
# 1. Обновите код в репозитории
git pull

# 2. Скопируйте обновленные файлы на серверы
ansible-playbook -i inventory/hosts.ini playbooks/copy-files.yml

# 3. Перезапустите необходимые сервисы
ansible-playbook -i inventory/hosts.ini playbooks/deploy-services.yml
```

### Масштабирование сервисов

Для горизонтального масштабирования сервисов:

```bash
# Масштабирование Backend
ansible -i inventory/hosts.ini backend -m shell -a "cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml up -d --scale backend=3"

# Масштабирование Frontend
ansible -i inventory/hosts.ini frontend -m shell -a "cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml up -d --scale frontend=2"
```

### Резервное копирование

Система автоматически создает резервные копии MongoDB:

- Ежечасные бэкапы (хранятся 24 часа)
- Ежедневные бэкапы (хранятся 7 дней)
- Еженедельные бэкапы (хранятся 4 недели)

Для ручного создания бэкапа:

```bash
ansible -i inventory/hosts.ini database -m shell -a "docker exec -it korotkossylka_backup /usr/local/bin/backup.sh hourly"
```

Для восстановления из бэкапа:

```bash
ansible -i inventory/hosts.ini database -m shell -a "docker exec -it korotkossylka_mongodb mongorestore --host mongodb --port 27017 --username admin --password password --db url-shortener --gzip --archive=/backup/daily/backup_YYYYMMDD_HHMMSS.gz"
```

### Просмотр логов

```bash
# Логи Nginx
ansible -i inventory/hosts.ini coordinator -m shell -a "docker logs korotkossylka_nginx"

# Логи Frontend
ansible -i inventory/hosts.ini frontend -m shell -a "docker logs korotkossylka_frontend"

# Логи Backend
ansible -i inventory/hosts.ini backend -m shell -a "docker logs korotkossylka_backend"

# Логи MongoDB
ansible -i inventory/hosts.ini database -m shell -a "docker logs korotkossylka_mongodb"
```

## Устранение неполадок

### Проблемы с DNS

1. Проверьте, работает ли контейнер dnsmasq:

   ```bash
   ansible -i inventory/hosts.ini coordinator -m shell -a "docker ps | grep dnsmasq"
   ```

2. Проверьте логи dnsmasq:

   ```bash
   ansible -i inventory/hosts.ini coordinator -m shell -a "docker logs korotkossylka_dnsmasq"
   ```

3. Проверьте настройки DNS в `/etc/resolv.conf` на всех серверах:
   ```bash
   ansible -i inventory/hosts.ini all -m shell -a "cat /etc/resolv.conf"
   ```

### Проблемы с сетевой связностью

1. Проверьте доступность серверов:

   ```bash
   ansible -i inventory/hosts.ini all -m ping
   ```

2. Проверьте доступность портов:

   ```bash
   ansible -i inventory/hosts.ini all -m shell -a "ss -tulpn | grep LISTEN"
   ```

3. Проверьте настройки брандмауэра:
   ```bash
   ansible -i inventory/hosts.ini all -m shell -a "iptables -L -n"
   ```

### Проблемы с Docker

1. Проверьте состояние сервиса Docker:

   ```bash
   ansible -i inventory/hosts.ini all -m shell -a "systemctl status docker"
   ```

2. Проверьте сети Docker:

   ```bash
   ansible -i inventory/hosts.ini all -m shell -a "docker network ls"
   ```

3. Перезапустите Docker:
   ```bash
   ansible -i inventory/hosts.ini all -m shell -a "systemctl restart docker"
   ```

## Безопасность

### Настройка SSL/TLS

В production-окружении необходимо настроить SSL-сертификаты для безопасного доступа:

1. Получите SSL-сертификаты (например, через Let's Encrypt):

```bash
ansible -i inventory/hosts.ini coordinator -m shell -a "apt install certbot -y"
ansible -i inventory/hosts.ini coordinator -m shell -a "certbot certonly --standalone -d your-domain.com -d www.your-domain.com"
```

2. Скопируйте сертификаты в директорию Nginx:

```bash
ansible -i inventory/hosts.ini coordinator -m shell -a "mkdir -p /opt/korotkossylka/CI-CD/ssl"
ansible -i inventory/hosts.ini coordinator -m shell -a "cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /opt/korotkossylka/CI-CD/ssl/"
ansible -i inventory/hosts.ini coordinator -m shell -a "cp /etc/letsencrypt/live/your-domain.com/privkey.pem /opt/korotkossylka/CI-CD/ssl/"
```

3. Обновите docker-compose.yml для монтирования SSL-сертификатов:

```bash
ansible -i inventory/hosts.ini coordinator -m shell -a "sed -i 's|nginx-certs:/etc/nginx/ssl|./CI-CD/ssl:/etc/nginx/ssl:ro|g' /opt/korotkossylka/CI-CD/docker-compose.yml"
```

4. Перезапустите Nginx:

```bash
ansible -i inventory/hosts.ini coordinator -m shell -a "cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml restart nginx"
```

### Настройка брандмауэра

Настройте брандмауэр (iptables или ufw) на каждом сервере:

```yaml
# Создайте playbook для настройки брандмауэра
---
- name: Настройка брандмауэра
  hosts: all
  tasks:
    - name: Установка ufw
      apt:
        name: ufw
        state: present

    - name: Настройка базовых правил
      ufw:
        rule: allow
        port: '{{ item }}'
        proto: tcp
      loop:
        - 22 # SSH

    - name: Настройка правил для coordinator
      ufw:
        rule: allow
        port: '{{ item }}'
        proto: tcp
      loop:
        - 80 # HTTP
        - 443 # HTTPS
        - 53 # DNS (TCP)
      when: inventory_hostname in groups['coordinator']

    - name: Настройка правил DNS UDP
      ufw:
        rule: allow
        port: 53
        proto: udp
      when: inventory_hostname in groups['coordinator']

    - name: Настройка правил для frontend
      ufw:
        rule: allow
        port: 80
        proto: tcp
      when: inventory_hostname in groups['frontend']

    - name: Настройка правил для backend
      ufw:
        rule: allow
        port: 3000
        proto: tcp
      when: inventory_hostname in groups['backend']

    - name: Настройка правил для database
      ufw:
        rule: allow
        port: 27017
        proto: tcp
      when: inventory_hostname in groups['database']

    - name: Настройка правил для мониторинга
      ufw:
        rule: allow
        port: '{{ item }}'
        proto: tcp
      loop:
        - 3030 # Grafana
        - 9090 # Prometheus
      when: inventory_hostname in groups['monitoring']

    - name: Включение ufw
      ufw:
        state: enabled
```

### Настройка безопасности MongoDB

Настройте дополнительную безопасность для MongoDB:

```yaml
# Создайте playbook для настройки безопасности MongoDB
---
- name: Настройка безопасности MongoDB
  hosts: database
  tasks:
    - name: Создание конфигурационного файла MongoDB
      copy:
        content: |
          # mongod.conf
          storage:
            dbPath: /data/db
            journal:
              enabled: true
          systemLog:
            destination: file
            logAppend: true
            path: /var/log/mongodb/mongod.log
          net:
            port: 27017
            bindIp: 0.0.0.0
          security:
            authorization: enabled
          setParameter:
            enableLocalhostAuthBypass: false
        dest: /opt/korotkossylka/CI-CD/docker/mongodb/mongod.conf
        mode: '0644'

    - name: Обновление docker-compose.yml для использования конфигурационного файла
      shell: |
        # Добавьте монтирование конфигурационного файла
        sed -i '/mongodb-data:/a\      - ./CI-CD/docker/mongodb/mongod.conf:/etc/mongod.conf:ro' /opt/korotkossylka/CI-CD/docker-compose.yml

    - name: Перезапуск MongoDB с новой конфигурацией
      shell: |
        cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml restart mongodb
```

## Дополнительные возможности

### Настройка Redis для кэширования

Добавьте Redis для улучшения производительности:

```yaml
# Создайте playbook для настройки Redis
---
- name: Настройка Redis для кэширования
  hosts: database
  tasks:
    - name: Создание Dockerfile для Redis
      copy:
        content: |
          FROM redis:alpine

          # Настройка для безопасности
          CMD ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD:-password}"]
        dest: /opt/korotkossylka/CI-CD/docker/redis/Dockerfile
        mode: '0644'

    - name: Добавление Redis в docker-compose.yml
      shell: |
        # Добавьте сервис Redis
        cat >> /opt/korotkossylka/CI-CD/docker-compose.yml << EOF

          # Redis для кэширования
          redis:
            build:
              context: ..
              dockerfile: CI-CD/docker/redis/Dockerfile
            restart: always
            environment:
              - REDIS_PASSWORD=password
            volumes:
              - redis-data:/data
            networks:
              - db
            deploy:
              resources:
                limits:
                  cpus: '0.5'
                  memory: 512M
        EOF

        # Добавьте том для данных Redis
        sed -i '/volumes:/a\  redis-data:' /opt/korotkossylka/CI-CD/docker-compose.yml

        # Запустите Redis
        cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml up -d redis
```

### Настройка Nginx для оптимизации

Улучшите конфигурацию Nginx для оптимальной производительности:

```bash
# Создайте улучшенную конфигурацию Nginx
cat > /opt/korotkossylka/CI-CD/docker/nginx/optimized.conf << EOF
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main buffer=16k;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Настройка буферов
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 4 4k;

    # Настройка GZIP сжатия
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Кэширование микрокэша
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Остальная конфигурация...
    # (добавьте остальные блоки конфигурации)
EOF

# Обновите Dockerfile Nginx
sed -i 's|COPY CI-CD/docker/nginx/nginx.conf /etc/nginx/nginx.conf|COPY CI-CD/docker/nginx/optimized.conf /etc/nginx/nginx.conf|g' /opt/korotkossylka/CI-CD/docker/nginx/Dockerfile

# Перезапустите Nginx
cd /opt/korotkossylka && docker-compose -f CI-CD/docker-compose.yml up -d --build nginx
```

## Дополнительные ресурсы

- [Официальная документация Docker](https://docs.docker.com/)
- [Официальная документация Ansible](https://docs.ansible.com/)
- [Руководство по MongoDB](https://docs.mongodb.com/)
- [Руководство по Nginx](https://nginx.org/en/docs/)
- [Документация Prometheus](https://prometheus.io/docs/introduction/overview/)
- [Документация Grafana](https://grafana.com/docs/)

## Заключение

Данное руководство предоставляет полные инструкции по настройке, развертыванию и обслуживанию кластера КороткоСсылка на базе микросервисной архитектуры. Следуя этим инструкциям, вы сможете настроить высокодоступную, безопасную и масштабируемую инфраструктуру.

При возникновении вопросов или проблем обращайтесь к команде разработки или создавайте issue в репозитории проекта.
