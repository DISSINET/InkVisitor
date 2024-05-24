FROM gplane/pnpm:node18-alpine as build-env

RUN apk add tzdata openssl
ENV TZ=Europe/Prague

WORKDIR /app

ARG ENV

COPY ./packages .

RUN cd client && pnpm install && BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') pnpm build:${ENV}
RUN rm -rf client/node_modules client/src

WORKDIR /app/server
RUN pnpm install && pnpm build
RUN pnpm prune --prod
RUN mkdir -p ./secret
RUN openssl req -x509 -newkey rsa:2048 -nodes -out ./secret/cert.pem -keyout ./secret/key.pem -days 365 -subj "/C=FR/O=krkr/OU=Domain Control Validated/CN=*"

FROM gplane/pnpm:node18-alpine 

COPY --from=build-env /app /app

WORKDIR /app/server

CMD ["pnpm", "start:dist"]
