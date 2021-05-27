FROM node:14.15.4-alpine3.10

WORKDIR /home/node/lonosms

COPY ["package.json", "package-lock.json*", "./"]

RUN apk add --update python make g++\
   && rm -rf /var/cache/apk/*

RUN npm install

COPY . .

EXPOSE 6200 8080

CMD [ "npm", "start" ]
