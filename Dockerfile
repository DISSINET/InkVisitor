FROM base

ARG ENV

FROM base AS client-build
WORKDIR /app/client
RUN BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') pnpm build:${ENV}

FROM base AS server-build
WORKDIR /app/server
RUN pnpm run build

FROM base

COPY --from=client-build /app/client/dist /app/client/dist
COPY --from=server-build /app/server/node_modules /app/server/node_modules
COPY --from=server-build /app/server/dist /app/server/dist

WORKDIR /app/server

CMD ["pnpm", "start:dist"]
