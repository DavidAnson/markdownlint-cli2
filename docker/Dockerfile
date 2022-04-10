FROM node:lts-alpine AS build
WORKDIR /pack
COPY . .
RUN npm pack

FROM node:lts-alpine
# hadolint ignore=DL3010
COPY --from=build /pack/markdownlint-cli2-*.tgz /
RUN npm install --global --no-package-lock --production markdownlint-cli2-*.tgz && \
    rm /markdownlint-cli2-*.tgz

USER node

WORKDIR /workdir

ENTRYPOINT ["/usr/local/bin/markdownlint-cli2"]

LABEL org.opencontainers.image.description="A fast, flexible, configuration-based command-line interface for linting Markdown/CommonMark files with the `markdownlint` library"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/DavidAnson/markdownlint-cli2"
LABEL org.opencontainers.image.title="markdownlint-cli2"
LABEL org.opencontainers.image.url="https://github.com/DavidAnson/markdownlint-cli2"
