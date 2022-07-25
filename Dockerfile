FROM node:16.10

WORKDIR /app

ARG ENV

COPY ./packages .

RUN cd client && npm install && npm run build-${ENV}

RUN cd server && npm install && npm run build

WORKDIR /app/server

CMD ["npm", "run", "start"]