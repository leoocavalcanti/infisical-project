FROM node:22-alpine

# Infisical CLI (binário direto do GitHub releases, multi-arch)
ARG TARGETARCH
ARG INFISICAL_VERSION=0.45.0
RUN apk add --no-cache bash curl ca-certificates \
 && curl -fsSL "https://github.com/Infisical/cli/releases/download/v${INFISICAL_VERSION}/cli_${INFISICAL_VERSION}_linux_${TARGETARCH}.tar.gz" -o /tmp/infisical.tar.gz \
 && tar -xzf /tmp/infisical.tar.gz -C /usr/local/bin infisical \
 && chmod +x /usr/local/bin/infisical \
 && rm /tmp/infisical.tar.gz \
 && infisical --version

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

ENV INFISICAL_DOMAIN=http://infisical:8080
ENV INFISICAL_PROJECT_ID=cd8e4ff1-5b9d-4a42-941e-5952e64f77ad
ENV INFISICAL_ENVIRONMENT=dev

# INFISICAL_UNIVERSAL_AUTH_CLIENT_ID/SECRET vêm em runtime via env_file — o CLI lê direto das env vars
EXPOSE 3000
CMD ["sh", "-c", "infisical run --token=$(infisical login --method=universal-auth --silent --plain) -- node dist/main.js"]
