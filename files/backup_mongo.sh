#!/bin/bash
TIMESTAMP=$(date +"%F-%H-%M")
docker exec mongo mongodump --archive=/backups/backup-$TIMESTAMP.gz --gzip --username root --password rootpassword --authenticationDatabase admin