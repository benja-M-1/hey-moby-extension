FROM golang:1.19-alpine3.16 AS vm-builder
ENV CGO_ENABLED=1
RUN apk update \
    && apk add --no-cache git \
    && apk add --no-cache ca-certificates \
    && apk add --update gcc musl-dev \
    && update-ca-certificates
WORKDIR /backend
COPY vm/go.* .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download
COPY vm/. .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-s -w" -o bin/service

FROM --platform=$BUILDPLATFORM node:18.9-alpine3.16 AS ui-builder
WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/.yarnrc.yml /ui/.yarnrc.yml
COPY ui/.yarn /ui/.yarn
COPY ui/yarn.lock /ui/yarn.lock
RUN echo "cacheFolder: '/usr/src/app/.npm'" >> /ui/.yarnrc.yml
RUN --mount=type=cache,target=/usr/src/app/.npm \
    yarn install --immutable
# install
COPY ui /ui
RUN --mount=type=secret,id=SPEECHLY_APP_ID \
    VITE_SPEECHLY_APP_ID=$(cat /run/secrets/SPEECHLY_APP_ID) \
    yarn build

FROM alpine
LABEL org.opencontainers.image.title="Hey Moby" \
    org.opencontainers.image.description="Moby will generate a Dockerfile or a compose file from what you say" \
    org.opencontainers.image.vendor="Benjamin Grandfond" \
    com.docker.desktop.extension.api.version="0.3.0" \
    com.docker.extension.screenshots="" \
    com.docker.extension.detailed-description="" \
    com.docker.extension.publisher-url="" \
    com.docker.extension.additional-urls="" \
    com.docker.extension.changelog=""

COPY docker-compose.yaml .
COPY metadata.json .
COPY docker.svg .
COPY --from=ui-builder /ui/dist ui
COPY --from=vm-builder /backend/bin/service /

RUN --mount=type=secret,id=OPENAI_API_KEY \
    OPENAI_API_KEY=$(cat /run/secrets/OPENAI_API_KEY); \
    echo "$OPENAI_API_KEY" > /tmp/openai-api-key.txt

ENTRYPOINT [ "/bin/sh", "-c", "OPENAI_API_KEY=$(cat /tmp/openai-api-key.txt); rm -rf /tmp/openai-api-key.txt; OPENAI_API_KEY=$OPENAI_API_KEY /service -socket /run/guest-services/extension-hey-moby-extension.sock"]
