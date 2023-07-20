FROM base AS inkvisitor

FROM inkvisitor AS client-build
WORKDIR /app/client
COPY ./packages/client/env /app/client/env
ARG ENV
RUN BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') pnpm build:${ENV}

FROM inkvisitor AS server-build
WORKDIR /app/server
RUN pnpm run build
RUN ls

FROM inkvisitor

COPY --from=client-build /app/client/dist /app/client/dist
COPY --from=server-build /app/server/node_modules /app/server/node_modules
RUN ls /app/server
COPY --from=server-build /app/server/dist /app/server/dist
COPY ./packages/server/secret /app/server/secret

WORKDIR /app/server

CMD ["pnpm", "start:dist"]
