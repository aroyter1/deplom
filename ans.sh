#!/bin/bash
# ansible_roles_init.sh
# Скрипт для автоматического создания структуры ролей Ansible и заполнения их тестовым содержимым

set -e

mkdir -p roles/frontend_backend/tasks
mkdir -p roles/mongodb/tasks
mkdir -p roles/backend_replica/tasks
mkdir -p roles/monitoring/tasks

cat > roles/frontend_backend/tasks/main.yml <<EOF
- name: Проверка роли frontend_backend
  debug:
    msg: 'Роль frontend_backend работает!'

EOF

cat > roles/mongodb/tasks/main.yml <<EOF
- name: Проверка роли mongodb
  debug:
    msg: 'Роль mongodb работает!'

EOF

cat > roles/backend_replica/tasks/main.yml <<EOF
- name: Проверка роли backend_replica
  debug:
    msg: 'Роль backend_replica работает!'

EOF

cat > roles/monitoring/tasks/main.yml <<EOF
- name: Проверка роли monitoring
  debug:
    msg: 'Роль monitoring работает!'

EOF

echo "Структура ролей Ansible успешно создана и заполнена!"