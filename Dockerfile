FROM node:16.16-alpine as build-env

RUN apk add --no-cache tzdata
ENV TZ=Europe/Prague

WORKDIR /app

ARG ENV

COPY ./packages .

RUN cd client && npm install && BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') npm run build-${ENV}
RUN rm -rf client/node_modules client/src
 
RUN cd server && yarn && yarn build
RUN cd server && yarn autoclean --force && npm prune --production

FROM node:16.16-alpine

COPY --from=build-env /app /app

WORKDIR /app/server

CMD ["npm", "run", "start"]