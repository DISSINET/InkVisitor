FROM gplane/pnpm:8.6.0-node16-alpine as build-env

RUN apk add tzdata
ENV TZ=Europe/Prague

WORKDIR /app

ARG ENV

COPY ./packages .

RUN cd client && BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') pnpm build:${ENV}
RUN rm -rf client/node_modules client/src

RUN cd server && pnpm build
RUN cd server && pnpm prune --prod

FROM gplane/pnpm:8.6.0-node16-alpine

COPY --from=build-env /app /app

WORKDIR /app/server

CMD ["pnpm", "start:dist"]
