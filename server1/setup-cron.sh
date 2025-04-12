#!/bin/bash

# Добавляем задание для ежедневного создания резервной копии в 2:00
(crontab -l 2>/dev/null; echo "0 2 * * * /home/youruser/backup-mongodb.sh") | crontab -

# Добавляем задание для еженедельной проверки системы в понедельник в 9:00
(crontab -l 2>/dev/null; echo "0 9 * * 1 /home/youruser/check-system.sh > /home/youruser/system-check-report.txt") | crontab -

echo "Задания cron настроены:"
crontab -l