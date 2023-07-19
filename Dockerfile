FROM gplane/pnpm:8.6.0-node16-alpine as base

RUN apk add tzdata
ENV TZ=Europe/Prague

WORKDIR /app

ARG ENV

COPY ./packages .

FROM base AS client-dependencies
WORKDIR /app/client
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store/v3 pnpm install --frozen-lockfile

FROM client-dependencies AS client-build
WORKDIR /app/client
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store/v3 pnpm install --frozen-lockfile
RUN BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') pnpm build:${ENV}

FROM base AS server-dependencies
WORKDIR /app/server
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store/v3 pnpm install --frozen-lockfile

FROM base AS server-build
WORKDIR /app/server
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store/v3 pnpm install --frozen-lockfile
RUN pnpm run build


FROM base

COPY --from=client-build /app/client/dist /app/client/dist
COPY --from=server-dependencies /app/server/node_modules /app/server/node_modules
COPY --from=server-build /app/server/dist /app/server/dist

WORKDIR /app/server

CMD ["pnpm", "start:dist"]
