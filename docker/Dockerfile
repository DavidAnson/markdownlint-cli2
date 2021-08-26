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
