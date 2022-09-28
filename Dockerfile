FROM --platform=$BUILDPLATFORM node:17.7-alpine3.14 AS client-builder
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

COPY metadata.json .
COPY docker.svg .
COPY --from=client-builder /ui/dist ui
