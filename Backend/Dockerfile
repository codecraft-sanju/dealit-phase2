FROM node:22-alpine
RUN npm install -g npm@11.12.1
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000


CMD ["npm", "start"]