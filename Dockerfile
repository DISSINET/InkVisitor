FROM gplane/pnpm:node22-alpine AS build-env

RUN apk add tzdata openssl
RUN npm install -g pnpm@11
ENV TZ=Europe/Prague

WORKDIR /app

ARG ENV

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# Build internal libraries first, then the per-env client bundle, then the server.
RUN pnpm exec turbo run build --filter=@inkvisitor/shared --filter=@inkvisitor/annotator
RUN cd packages/client && BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') && export BUILD_TIMESTAMP && pnpm build:${ENV}
RUN pnpm exec turbo run build --filter=inkvisitor-server

# Produce a lean, deployable server (server + its prod deps incl. built @inkvisitor/shared).
RUN pnpm deploy --legacy --filter=inkvisitor-server --prod /app/out

RUN mkdir -p /app/out/secret
RUN openssl req -x509 -newkey rsa:2048 -nodes -out /app/out/secret/cert.pem -keyout /app/out/secret/key.pem -days 365 -subj "/C=FR/O=krkr/OU=Domain Control Validated/CN=*"

FROM gplane/pnpm:node22-alpine

RUN npm install -g pnpm@11

COPY --from=build-env /app/out /app/server
COPY --from=build-env /app/packages/client/dist /app/client/dist

WORKDIR /app/server

RUN BUILD_TIMESTAMP=$(date +'%a %d.%m.%Y %H:%M') && \
    echo "Build Timestamp during build: $BUILD_TIMESTAMP" && \
    echo "BUILD_TIMESTAMP=\"$BUILD_TIMESTAMP\"" > /app/server/.build_env

RUN echo "source /app/server/.build_env" >> /etc/profile

CMD ["/bin/sh", "-c", "source /app/server/.build_env && pnpm start:dist -- \"$BUILD_TIMESTAMP\""]
