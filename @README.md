# Руководство по развертыванию проекта "КороткоСсылка"

## Архитектура кластера

Проект реализован на основе микросервисной архитектуры и разворачивается на 4-х серверах:

1. **Сервер 1 (Координатор)**:

   - Nginx-балансировщик
   - DNS-сервер (dnsmasq)

2. **Сервер 2 (Frontend)**:

   - Vue.js приложение
   - Nginx для статических файлов

3. **Сервер 3 (Backend)**:

   - Node.js API-сервер
   - Масштабируемые экземпляры

4. **Сервер 4 (Данные и мониторинг)**:
   - MongoDB
   - Сервис резервного копирования
   - Grafana
   - Prometheus
   - Экспортеры для мониторинга

## Базовая настройка серверов

### Настройка сети

#### Сервер 1 (Координатор - Nginx, DNS)

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
    address 192.168.1.10
    netmask 255.255.255.0
    gateway 192.168.1.1
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
    address 192.168.1.11
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.10 8.8.8.8

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
    address 192.168.1.12
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.10 8.8.8.8

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
    address 192.168.1.13
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.10 8.8.8.8

# Перезапускаем сеть
sudo systemctl restart networking
```

### Настройка SSH

На каждом сервере:

```bash
# Установка SSH
sudo apt update
sudo apt install openssh-server -y

# Настройка безопасности
sudo nano /etc/ssh/sshd_config

# Добавляем/изменяем следующие настройки:
Port 22
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no

# Перезапуск SSH
sudo systemctl restart sshd
```

#### Настройка SSH-ключей

На управляющей машине (вашем компьютере):

```bash
# Создание SSH-ключа
ssh-keygen -t ed25519 -C "admin@korotkossylka"

# Копирование ключа на каждый сервер
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@192.168.1.10
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@192.168.1.11
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@192.168.1.12
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@192.168.1.13
```

## Настройка с помощью Ansible

### Установка Ansible

```bash
sudo apt update
sudo apt install ansible -y
```

### Создание структуры Ansible

```bash
mkdir -p ~/korotkossylka-deploy/{playbooks,inventory,files}
cd ~/korotkossylka-deploy
```

### Настройка inventory

Создайте файл `inventory/hosts.ini`:

```ini
[coordinator]
server1 ansible_host=192.168.1.10

[frontend]
server2 ansible_host=192.168.1.11

[backend]
server3 ansible_host=192.168.1.12

[database]
server4 ansible_host=192.168.1.13

[monitoring]
server4 ansible_host=192.168.1.13

[all:vars]
ansible_user=your_username
ansible_ssh_private_key_file=~/.ssh/id_ed25519
ansible_become=yes
ansible_become_method=sudo
```

### Playbooks для настройки серверов

#### 1. Установка Docker

Создайте файл `playbooks/setup-docker.yml`:

```yaml
---
- name: Установка Docker на все серверы
  hosts: all
  tasks:
    - name: Установка необходимых пакетов
      apt:
        name:
          - apt-transport-https
          - ca-certificates
          - curl
          - gnupg
          - lsb-release
        state: present
        update_cache: yes

    - name: Добавление ключа Docker GPG
      apt_key:
        url: https://download.docker.com/linux/debian/gpg
        state: present

    - name: Добавление репозитория Docker
      apt_repository:
        repo: 'deb [arch=amd64] https://download.docker.com/linux/debian {{ ansible_distribution_release }} stable'
        state: present

    - name: Установка Docker Engine
      apt:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
          - docker-compose-plugin
        state: present
        update_cache: yes

    - name: Установка Docker Compose
      get_url:
        url: https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-linux-x86_64
        dest: /usr/local/bin/docker-compose
        mode: '0755'

    - name: Добавление текущего пользователя в группу docker
      user:
        name: '{{ ansible_user }}'
        groups: docker
        append: yes

    - name: Запуск и включение сервиса Docker
      systemd:
        name: docker
        state: started
        enabled: yes
```

#### 2. Копирование файлов проекта

Создайте файл `playbooks/copy-files.yml`:

```yaml
---
- name: Копирование файлов проекта
  hosts: all
  tasks:
    - name: Создание директории проекта
      file:
        path: /opt/korotkossylka
        state: directory
        mode: '0755'

    - name: Копирование файлов CI-CD
      copy:
        src: ../CI-CD/
        dest: /opt/korotkossylka/CI-CD/
        mode: preserve
```

#### 3. Настройка DNS-сервера

Создайте файл `playbooks/setup-dns.yml`:

```yaml
---
- name: Настройка DNS-сервера
  hosts: coordinator
  tasks:
    - name: Проверка, запущен ли DNS контейнер
      shell: docker ps | grep dnsmasq
      register: dns_container
      ignore_errors: yes

    - name: Запуск DNS контейнера
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml up -d dnsmasq
      when: dns_container.rc != 0
```

#### 4. Обновление hosts-файлов

Создайте файл `playbooks/update-hosts.yml`:

```yaml
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
        - '192.168.1.10 coordinator.korotkossylka.local nginx.korotkossylka.local'
        - '192.168.1.11 frontend.korotkossylka.local'
        - '192.168.1.12 backend.korotkossylka.local'
        - '192.168.1.13 mongodb.korotkossylka.local grafana.korotkossylka.local prometheus.korotkossylka.local'
```

#### 5. Развертывание сервисов

Создайте файл `playbooks/deploy-services.yml`:

```yaml
---
- name: Развертывание Frontend
  hosts: frontend
  tasks:
    - name: Запуск Frontend сервисов
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml up -d frontend

- name: Развертывание Backend
  hosts: backend
  tasks:
    - name: Запуск Backend сервисов
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml up -d backend

- name: Развертывание MongoDB и мониторинга
  hosts: database, monitoring
  tasks:
    - name: Запуск MongoDB и связанных сервисов
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml up -d mongodb backup

    - name: Запуск сервисов мониторинга
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml up -d grafana prometheus node-exporter cadvisor mongodb-exporter

- name: Настройка Nginx на координаторе
  hosts: coordinator
  tasks:
    - name: Обновление конфигурации Nginx
      shell: |
        # Обновление конфигурации Nginx для работы с реальными адресами серверов
        sed -i 's/server backend1:3000/server 192.168.1.12:3000/g' /opt/korotkossylka/CI-CD/docker/nginx/nginx.conf
        sed -i 's/server frontend1:80/server 192.168.1.11:80/g' /opt/korotkossylka/CI-CD/docker/nginx/nginx.conf

    - name: Запуск Nginx балансировщика
      shell: |
        cd /opt/korotkossylka
        docker-compose -f CI-CD/docker-compose.yml up -d nginx
```

### Выполнение развертывания

```bash
# 1. Установка Docker на все серверы
ansible-playbook -i inventory/hosts.ini playbooks/setup-docker.yml

# 2. Копирование файлов проекта
ansible-playbook -i inventory/hosts.ini playbooks/copy-files.yml

# 3. Обновление hosts-файлов
ansible-playbook -i inventory/hosts.ini playbooks/update-hosts.yml

# 4. Запуск DNS-сервера на координаторе
ansible-playbook -i inventory/hosts.ini playbooks/setup-dns.yml

# 5. Развертывание всех сервисов
ansible-playbook -i inventory/hosts.ini playbooks/deploy-services.yml
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
