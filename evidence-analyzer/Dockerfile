FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY server.js .

EXPOSE 8002

CMD ["npm", "start"]