FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

COPY . ./

RUN npm install --legacy-peer-deps

RUN npm run build

RUN npm install -g serve

EXPOSE 8080

CMD ["npm", "start"]