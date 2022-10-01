<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

# Gastos app


## Description

An app to management the expenses easily.


## Build up postgres DB - Development

```bash
# 1. Install dependencies
$ npm install

# 2. Clone ".env.example" to ".env" and change environment variables

# 3. Build up DB
$ docker compose up -d

# 4. Build up app development mode
$ npm run start:dev

# 5. Ejecute seed
(GET) http://localhost:3000/api/seed
```

#### Down container - Development

```bash
$ docker compose down
```


## Running the production mode app on local - Production

```bash
# 1. Clone ".env.example" to ".env" file and complete with production environments variables

# 2. Build up DB
$ npm run docker:prod
```

#### Down container - Production

```bash
$ npm run docker:prod:down
```
## Test

```bash
# 1. Make sure to db is running
$ docker compose up -d

# e2e tests watch mode
$ npm run test:e2e:watch
```
