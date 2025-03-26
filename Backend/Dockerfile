# Build stage
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=build /app/dist ./dist
COPY .env .env

EXPOSE 4512

CMD ["npm", "start"] 