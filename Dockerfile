FROM base AS inkvisitor

FROM inkvisitor AS client-build
WORKDIR /app/client
COPY ./packages/client/env /app/client/env

FROM inkvisitor AS server-build
WORKDIR /app/server
RUN pnpm run build
RUN ls

FROM inkvisitor

COPY --from=server-build /app/server/node_modules /app/server/node_modules
RUN  ls /app/server
COPY --from=server-build /app/server/dist /app/server/dist

WORKDIR /app/server

CMD ["pnpm", "start:dist"]
