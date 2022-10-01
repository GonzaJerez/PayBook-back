<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

# Gastos app


## Description

An app to management the expenses easily.

<!-- 
## Running the app (build up postgres DB) - Development

```bash
# 1. Install dependencies
$ npm install

# 2. Clone ".env.example" to create ".env" and change environment variables

# 3. Build up DB
$ docker compose up -d postgresqldb

# 4. Build up app development mode
$ npm run start:dev

# 5. Ejecute seed
(GET) http://localhost:3000/api/seed
``` -->

## Running the entire app as docker container - Development

```bash
# 1. Install dependencies
$ npm install

# 2. Clone ".env.example" to ".env.dev" file and complete with development environments variables

# 3. Build up DB
$ npm run docker:dev

# 4. Ejecute seed
(GET) http://localhost:3000/api/seed
```

### Down container - Development

```bash
$ npm run docker:dev:down
```

## Running the production app - Production

```bash
# 1. Clone ".env.example" to ".env.prod" file and complete with production environments variables

# 2. Build up DB
$ npm run docker:prod
```

### Down container - Production

```bash
$ npm run docker:prod:down
```
## Test

```bash
# 1. Build up DB for testing
$ npm run docker:db

# e2e tests watch mode
$ npm run test:e2e:watch
```

### Down container - DB test

```bash
$ npm run docker:db:down
```