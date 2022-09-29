FROM node:16-alpine3.15

RUN mkdir -p /home/app

WORKDIR /home/app

EXPOSE 3000

CMD ["npm", "run", "start:dev"]