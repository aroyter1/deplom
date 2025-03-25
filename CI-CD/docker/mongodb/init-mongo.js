db = db.getSiblingDB('url-shortener')

// Создаем коллекции
db.createCollection('users')
db.createCollection('links')
db.createCollection('clicks')

// Создаем индексы
db.users.createIndex({ username: 1 }, { unique: true })
db.links.createIndex({ shortId: 1 }, { unique: true })
db.links.createIndex({ alias: 1 }, { unique: true, sparse: true })
db.links.createIndex({ userId: 1 })
db.clicks.createIndex({ linkId: 1 })

print('MongoDB инициализирована с индексами для url-shortener')
