# Lono

Lono SMS API service

## Setup and Installation

- clone repository
- run `npm install`
- add a '.env' file by making a copy of ".env.example" and update the variables with yours
- run `npx sequelize-cli db:migrate`
- run `npx sequelize-cli db:seed:all`
- run `npm run dev`

## Docker setup

- run `docker build -t lonosms-dev .`
- run `docker run --env-file ./.env --name lonosms-dev --net=host -d lonosms-dev`
