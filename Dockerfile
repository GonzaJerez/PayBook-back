# Install dependencies only when needed
FROM node:16-alpine3.15 AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build


# Production image, copy all the files and run next
FROM node:16-alpine3.15 AS prod

# Set working directory
WORKDIR /usr/src/app

ENV PROD true

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=deps /app/dist ./dist

# COPY --from=deps /app/.env ./

CMD [ "node","dist/main" ]