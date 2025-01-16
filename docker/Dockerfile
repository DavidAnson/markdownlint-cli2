# hadolint global ignore=DL3003,DL3059

FROM node:lts-alpine AS build
WORKDIR /pack
COPY . .
RUN npm pack
RUN cd formatter-codequality && npm pack --pack-destination=..
RUN cd formatter-default && npm pack --pack-destination=..
RUN cd formatter-json && npm pack --pack-destination=..
RUN cd formatter-junit && npm pack --pack-destination=..
RUN cd formatter-pretty && npm pack --pack-destination=..
RUN cd formatter-sarif && npm pack --pack-destination=..
RUN cd formatter-summarize && npm pack --pack-destination=..
RUN cd formatter-template && npm pack --pack-destination=..

FROM node:lts-alpine
COPY --from=build /pack/markdownlint-cli2-*.tgz /
RUN npm install --global --no-package-lock --production /markdownlint-cli2-*.tgz
RUN rm /markdownlint-cli2-*.tgz

# "1000" is the documented UID for the "node" user: https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md#non-root-user
# Systems configured to disallow running images as root aren't able to run images that use user name string values for the USER because they can't validate that a named user isn't root.
# To allow this image to run on such systems, use the uid of the user as the value for USER instead of the username.
# See https://github.com/kubernetes/kubernetes/pull/56503
USER 1000

WORKDIR /workdir

ENTRYPOINT ["/usr/local/bin/markdownlint-cli2"]

# LABEL org.opencontainers.image.description="A fast, flexible, configuration-based command-line interface for linting Markdown/CommonMark files with the markdownlint library"
# LABEL org.opencontainers.image.licenses="MIT"
# LABEL org.opencontainers.image.source="https://github.com/DavidAnson/markdownlint-cli2"
# LABEL org.opencontainers.image.title="markdownlint-cli2"
# LABEL org.opencontainers.image.url="https://github.com/DavidAnson/markdownlint-cli2"
