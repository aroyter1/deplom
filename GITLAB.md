# GitLab CI/CD для КороткоСсылка

## Развертывание и масштабирование проекта на четырех серверах

В этом руководстве описывается процесс настройки CI/CD для проекта КороткоСсылка с использованием GitLab, Ansible и Docker для развертывания на четырех серверах.

## Архитектура проекта

- **SRV1**: Фронтенд, основной бэкенд и Ansible (оркестратор)
- **SRV2**: Основная база данных MongoDB (реплика set primary)
- **SRV3**: Сервер резервного копирования базы данных
- **SRV4**: Grafana, Prometheus, дополнительный бэкенд (для балансировки нагрузки) и расширение MongoDB

## Предварительные требования

- 4 сервера с Ubuntu 20.04 или выше
- GitLab аккаунт и репозиторий с кодом проекта
- Доступ к серверам по SSH с возможностью использования sudo

## 1. Настройка первого сервера (SRV1)

Начните с подготовки SRV1, который будет выступать как центр управления:

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых инструментов
sudo apt install -y python3 python3-pip git openssh-client ansible docker.io docker-compose

# Включение и запуск Docker
sudo systemctl enable docker
sudo systemctl start docker

# Добавление текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Установка GitLab Runner
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt install gitlab-runner
sudo usermod -aG docker gitlab-runner
```

## 2. Настройка SSH-ключей для доступа к другим серверам

```bash
# Генерация SSH-ключа для Ansible
ssh-keygen -t rsa -b 4096 -f ~/.ssh/ansible_id_rsa -N ""

# Копирование ключа на другие серверы
ssh-copy-id -i ~/.ssh/ansible_id_rsa.pub user@SRV2
ssh-copy-id -i ~/.ssh/ansible_id_rsa.pub user@SRV3
ssh-copy-id -i ~/.ssh/ansible_id_rsa.pub user@SRV4
```

## 3. Настройка Ansible на SRV1

Создайте структуру директорий для Ansible:

```bash
mkdir -p ~/ansible/playbooks ~/ansible/inventory ~/ansible/roles
```

### Создание inventory файла с описанием хостов

```bash
cat > ~/ansible/inventory/hosts.yml << EOF
all:
  children:
    frontend:
      hosts:
        srv1:
          ansible_host: SRV1_IP
    primary_backend:
      hosts:
        srv1:
          ansible_host: SRV1_IP
    secondary_backend:
      hosts:
        srv4:
          ansible_host: SRV4_IP
    mongodb_primary:
      hosts:
        srv2:
          ansible_host: SRV2_IP
    mongodb_secondary:
      hosts:
        srv4:
          ansible_host: SRV4_IP
    backup:
      hosts:
        srv3:
          ansible_host: SRV3_IP
    monitoring:
      hosts:
        srv4:
          ansible_host: SRV4_IP
  vars:
    ansible_user: YOUR_USER
    ansible_ssh_private_key_file: ~/.ssh/ansible_id_rsa
    ansible_python_interpreter: /usr/bin/python3
EOF
```

### Настройка ansible.cfg

```bash
cat > ~/ansible/ansible.cfg << EOF
[defaults]
inventory = inventory/hosts.yml
host_key_checking = False
roles_path = ./roles
remote_user = YOUR_USER
interpreter_python = auto_silent

[privilege_escalation]
become = True
become_method = sudo
become_ask_pass = False
EOF
```

## 4. Создание файла .gitlab-ci.yml для CI/CD

В корне вашего GitLab репозитория создайте файл .gitlab-ci.yml:

```yaml
stages:
  - test
  - build
  - deploy_mongodb
  - deploy_backup
  - deploy_monitoring
  - deploy_backend
  - deploy_frontend

variables:
  DOCKER_REGISTRY: ${CI_REGISTRY}
  DOCKER_BACKEND_IMAGE: ${CI_REGISTRY_IMAGE}/backend:${CI_COMMIT_SHORT_SHA}
  DOCKER_FRONTEND_IMAGE: ${CI_REGISTRY_IMAGE}/frontend:${CI_COMMIT_SHORT_SHA}

# Определение общих задач для всех этапов
.common_setup:
  before_script:
    - cd $CI_PROJECT_DIR
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin $CI_REGISTRY

# Тесты
test_backend:
  stage: test
  script:
    - cd Backend
    - npm install
    - npm test

test_frontend:
  stage: test
  script:
    - cd Frontend
    - npm install
    - npm test

# Сборка и публикация Docker-образов
build_backend:
  stage: build
  extends: .common_setup
  script:
    - cd Backend
    - docker build -t $DOCKER_BACKEND_IMAGE .
    - docker push $DOCKER_BACKEND_IMAGE

build_frontend:
  stage: build
  extends: .common_setup
  script:
    - cd Frontend
    - docker build -t $DOCKER_FRONTEND_IMAGE .
    - docker push $DOCKER_FRONTEND_IMAGE

# Развертывание MongoDB
deploy_mongodb:
  stage: deploy_mongodb
  script:
    - cd $CI_PROJECT_DIR/ansible
    - ansible-playbook playbooks/deploy_mongodb.yml

# Настройка резервного копирования
deploy_backup:
  stage: deploy_backup
  script:
    - cd $CI_PROJECT_DIR/ansible
    - ansible-playbook playbooks/deploy_backup.yml

# Настройка мониторинга
deploy_monitoring:
  stage: deploy_monitoring
  script:
    - cd $CI_PROJECT_DIR/ansible
    - ansible-playbook playbooks/deploy_monitoring.yml

# Развертывание Backend
deploy_backend:
  stage: deploy_backend
  script:
    - cd $CI_PROJECT_DIR/ansible
    - ansible-playbook playbooks/deploy_backend.yml

# Развертывание Frontend
deploy_frontend:
  stage: deploy_frontend
  script:
    - cd $CI_PROJECT_DIR/ansible
    - ansible-playbook playbooks/deploy_frontend.yml
```

## 5. Создание Ansible плейбуков

### Для MongoDB (primary) на SRV2

```yaml
# ~/ansible/playbooks/deploy_mongodb.yml
---
- name: Deploy MongoDB Primary
  hosts: mongodb_primary
  become: yes
  tasks:
    - name: Create directories
      file:
        path: '{{ item }}'
        state: directory
        mode: '0755'
      with_items:
        - /opt/mongodb/data
        - /opt/mongodb/config

    - name: Copy MongoDB configuration
      template:
        src: templates/mongod.conf.j2
        dest: /opt/mongodb/config/mongod.conf
        mode: '0644'

    - name: Create MongoDB docker-compose.yml
      template:
        src: templates/mongodb-docker-compose.yml.j2
        dest: /opt/mongodb/docker-compose.yml
        mode: '0644'

    - name: Start MongoDB service
      docker_compose:
        project_src: /opt/mongodb
        state: present

- name: Configure Replica Set
  hosts: mongodb_primary
  become: yes
  tasks:
    - name: Wait for MongoDB to start
      wait_for:
        port: 27017
        delay: 10

    - name: Initialize replica set
      shell: |
        docker exec mongodb mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'srv2:27017'}]})"
      register: replica_init_result
      failed_when: replica_init_result.rc != 0 and 'already' not in replica_init_result.stderr

- name: Add Secondary MongoDB to Replica Set
  hosts: mongodb_primary
  become: yes
  tasks:
    - name: Add SRV4 to replica set
      shell: |
        docker exec mongodb mongosh --eval "rs.add('srv4:27017')"
      register: add_secondary_result
      failed_when: add_secondary_result.rc != 0 and 'already' not in add_secondary_result.stderr
```

### Для резервного копирования на SRV3

```yaml
# ~/ansible/playbooks/deploy_backup.yml
---
- name: Deploy Backup System
  hosts: backup
  become: yes
  tasks:
    - name: Create backup directories
      file:
        path: '{{ item }}'
        state: directory
        mode: '0755'
      with_items:
        - /opt/backups/mongodb
        - /opt/backups/scripts

    - name: Copy backup scripts
      template:
        src: templates/mongodb-backup.sh.j2
        dest: /opt/backups/scripts/mongodb-backup.sh
        mode: '0755'

    - name: Create cron job for automatic backups
      cron:
        name: 'MongoDB daily backup'
        minute: '0'
        hour: '3'
        job: '/opt/backups/scripts/mongodb-backup.sh'
```

### Для мониторинга и дополнительного бэкенда на SRV4

```yaml
# ~/ansible/playbooks/deploy_monitoring.yml
---
- name: Deploy MongoDB Secondary
  hosts: mongodb_secondary
  become: yes
  tasks:
    - name: Create MongoDB directories
      file:
        path: '{{ item }}'
        state: directory
        mode: '0755'
      with_items:
        - /opt/mongodb/data
        - /opt/mongodb/config

    - name: Copy MongoDB configuration
      template:
        src: templates/mongod-secondary.conf.j2
        dest: /opt/mongodb/config/mongod.conf
        mode: '0644'

    - name: Create MongoDB docker-compose.yml
      template:
        src: templates/mongodb-secondary-docker-compose.yml.j2
        dest: /opt/mongodb/docker-compose.yml
        mode: '0644'

    - name: Start MongoDB service
      docker_compose:
        project_src: /opt/mongodb
        state: present

- name: Deploy Monitoring System
  hosts: monitoring
  become: yes
  tasks:
    - name: Create monitoring directories
      file:
        path: '{{ item }}'
        state: directory
        mode: '0755'
      with_items:
        - /opt/monitoring/grafana
        - /opt/monitoring/prometheus
        - /opt/monitoring/alertmanager

    - name: Copy monitoring configurations
      template:
        src: 'templates/{{ item.src }}'
        dest: '/opt/monitoring/{{ item.dest }}'
        mode: '0644'
      with_items:
        - { src: prometheus.yml.j2, dest: prometheus/prometheus.yml }
        - { src: alertmanager.yml.j2, dest: alertmanager/alertmanager.yml }
        - { src: grafana-provisioning.yml.j2, dest: grafana/provisioning.yml }

    - name: Create monitoring docker-compose.yml
      template:
        src: templates/monitoring-docker-compose.yml.j2
        dest: /opt/monitoring/docker-compose.yml
        mode: '0644'

    - name: Start monitoring services
      docker_compose:
        project_src: /opt/monitoring
        state: present
```

### Для бэкенда (на SRV1 и SRV4)

```yaml
# ~/ansible/playbooks/deploy_backend.yml
---
- name: Deploy Backend
  hosts: primary_backend:secondary_backend
  become: yes
  vars:
    backend_image: "{{ lookup('env', 'DOCKER_BACKEND_IMAGE') }}"
  tasks:
    - name: Create backend directories
      file:
        path: /opt/backend
        state: directory
        mode: '0755'

    - name: Copy backend configuration
      template:
        src: templates/backend-env.j2
        dest: /opt/backend/.env
        mode: '0644'

    - name: Create backend docker-compose.yml
      template:
        src: templates/backend-docker-compose.yml.j2
        dest: /opt/backend/docker-compose.yml
        mode: '0644'
      vars:
        docker_image: '{{ backend_image }}'
        server_name: '{{ inventory_hostname }}'

    - name: Login to GitLab Registry
      shell: |
        echo "{{ lookup('env', 'CI_REGISTRY_PASSWORD') }}" | docker login -u "{{ lookup('env', 'CI_REGISTRY_USER') }}" --password-stdin {{ lookup('env', 'CI_REGISTRY') }}

    - name: Pull backend image
      shell: |
        docker pull {{ backend_image }}

    - name: Start backend service
      docker_compose:
        project_src: /opt/backend
        state: present
```

### Для фронтенда (на SRV1)

```yaml
# ~/ansible/playbooks/deploy_frontend.yml
---
- name: Deploy Frontend
  hosts: frontend
  become: yes
  vars:
    frontend_image: "{{ lookup('env', 'DOCKER_FRONTEND_IMAGE') }}"
  tasks:
    - name: Create frontend directories
      file:
        path: /opt/frontend
        state: directory
        mode: '0755'

    - name: Copy frontend configuration
      template:
        src: templates/frontend-env.j2
        dest: /opt/frontend/.env
        mode: '0644'

    - name: Create frontend docker-compose.yml
      template:
        src: templates/frontend-docker-compose.yml.j2
        dest: /opt/frontend/docker-compose.yml
        mode: '0644'
      vars:
        docker_image: '{{ frontend_image }}'

    - name: Login to GitLab Registry
      shell: |
        echo "{{ lookup('env', 'CI_REGISTRY_PASSWORD') }}" | docker login -u "{{ lookup('env', 'CI_REGISTRY_USER') }}" --password-stdin {{ lookup('env', 'CI_REGISTRY') }}

    - name: Pull frontend image
      shell: |
        docker pull {{ frontend_image }}

    - name: Start frontend service
      docker_compose:
        project_src: /opt/frontend
        state: present
```

## 6. Настройка NGINX для балансировки нагрузки

```yaml
# ~/ansible/playbooks/deploy_nginx.yml
---
- name: Deploy NGINX Load Balancer
  hosts: frontend
  become: yes
  tasks:
    - name: Create NGINX directories
      file:
        path: '{{ item }}'
        state: directory
        mode: '0755'
      with_items:
        - /opt/nginx/conf.d
        - /opt/nginx/certs

    - name: Copy NGINX configuration
      template:
        src: templates/nginx.conf.j2
        dest: /opt/nginx/nginx.conf
        mode: '0644'

    - name: Create NGINX docker-compose.yml
      template:
        src: templates/nginx-docker-compose.yml.j2
        dest: /opt/nginx/docker-compose.yml
        mode: '0644'

    - name: Start NGINX service
      docker_compose:
        project_src: /opt/nginx
        state: present
```

## 7. Настройка GitLab Runner

Зарегистрируйте GitLab Runner на SRV1:

```bash
sudo gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.com/" \
  --registration-token "YOUR_REGISTRATION_TOKEN" \
  --executor "shell" \
  --description "KorotkoSsylka CI/CD Runner" \
  --tag-list "deploy,docker" \
  --run-untagged="true" \
  --locked="false"
```

## 8. Расширение инфраструктуры

Для расширения инфраструктуры:

1. Добавьте новые серверы в inventory файл Ansible
2. Создайте соответствующие плейбуки для развертывания
3. Обновите конфигурацию балансировщика нагрузки

### Пример добавления нового бэкенд-сервера:

```yaml
# Добавление в inventory/hosts.yml
secondary_backend:
  hosts:
    srv4:
      ansible_host: SRV4_IP
    srv5: # Новый сервер
      ansible_host: SRV5_IP
```

## 9. Автоматизация развертывания всей инфраструктуры

Создайте мастер-плейбук для полного развертывания:

```yaml
# ~/ansible/playbooks/deploy_all.yml
---
- import_playbook: deploy_mongodb.yml
- import_playbook: deploy_backup.yml
- import_playbook: deploy_monitoring.yml
- import_playbook: deploy_backend.yml
- import_playbook: deploy_frontend.yml
- import_playbook: deploy_nginx.yml
```

Запустите полное развертывание:

```bash
cd ~/ansible
ansible-playbook playbooks/deploy_all.yml
```

## 10. Мониторинг и оповещения

Настройте оповещения в Grafana для мониторинга:

1. Доступности серверов
2. Использования ресурсов (CPU, RAM, диск)
3. Активности MongoDB
4. Времени отклика API

## Заключение

Эта инструкция обеспечивает полное развертывание приложения КороткоСсылка на четырех серверах с возможностью горизонтального масштабирования. Используя GitLab CI/CD и Ansible, вы можете автоматизировать весь процесс развертывания и управления инфраструктурой.
