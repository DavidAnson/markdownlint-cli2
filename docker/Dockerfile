FROM node:lts-alpine AS build
WORKDIR /pack
ADD --chown=1000 . .
RUN npm pack

FROM node:lts-alpine AS prod
COPY --from=build /pack/markdownlint-cli2-*.tgz .
RUN npm install --global --no-package-lock --production markdownlint-cli2-*.tgz
RUN rm markdownlint-cli2-*.tgz

USER node

ENTRYPOINT ["/usr/local/bin/markdownlint-cli2"]