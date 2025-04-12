#!/bin/bash

# Создание директории для сертификатов
mkdir -p nginx/ssl

# Генерация корневого сертификата
openssl genrsa -out nginx/ssl/rootCA.key 4096
openssl req -x509 -new -nodes -key nginx/ssl/rootCA.key -sha256 -days 1024 -out nginx/ssl/rootCA.crt -subj "/C=RU/ST=Moscow/L=Moscow/O=ShortLink/OU=IT/CN=ShortLink Root CA"

# Создание конфигурации для сертификата
cat > nginx/ssl/openssl.cnf << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
C=RU
ST=Moscow
L=Moscow
O=ShortLink
OU=IT
CN=shortlink.local

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = shortlink.local
DNS.2 = *.shortlink.local
EOF

# Генерация сертификата для домена
openssl genrsa -out nginx/ssl/shortlink.local.key 2048
openssl req -new -key nginx/ssl/shortlink.local.key -out nginx/ssl/shortlink.local.csr -config nginx/ssl/openssl.cnf
openssl x509 -req -in nginx/ssl/shortlink.local.csr -CA nginx/ssl/rootCA.crt -CAkey nginx/ssl/rootCA.key -CAcreateserial -out nginx/ssl/shortlink.local.crt -days 365 -sha256 -extensions req_ext -extfile nginx/ssl/openssl.cnf

echo "Сертификаты успешно созданы в директории nginx/ssl"