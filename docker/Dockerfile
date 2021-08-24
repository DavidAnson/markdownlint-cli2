FROM node:lts-alpine AS build
WORKDIR /pack
COPY --chown=1000 . .
RUN npm pack

FROM node:lts-alpine AS prod
# hadolint ignore=DL3010
COPY --from=build /pack/markdownlint-cli2-*.tgz /
RUN npm install --global --no-package-lock --production markdownlint-cli2-*.tgz && \
    rm /markdownlint-cli2-*.tgz

USER node

ENTRYPOINT ["/usr/local/bin/markdownlint-cli2"]