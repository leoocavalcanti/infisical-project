FROM node:22-alpine

# Infisical CLI
RUN apk add --no-cache bash curl \
 && curl -1sLf 'https://artifacts-cli.infisical.com/setup.alpine.sh' | bash \
 && apk add --no-cache infisical

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Config "estática" do projeto (não é secret) - edite após criar o projeto no Infisical UI
ENV INFISICAL_API_URL=http://infisical:8080
ENV INFISICAL_PROJECT_ID=REPLACE_WITH_PROJECT_ID
ENV INFISICAL_ENVIRONMENT=dev

# CLIENT_ID e CLIENT_SECRET vêm em runtime via env_file (nunca no Dockerfile)
EXPOSE 3000
CMD ["sh", "-c", "infisical run --projectId=$INFISICAL_PROJECT_ID --env=$INFISICAL_ENVIRONMENT --domain=$INFISICAL_API_URL --token=$(infisical login --method=universal-auth --client-id=$INFISICAL_CLIENT_ID --client-secret=$INFISICAL_CLIENT_SECRET --domain=$INFISICAL_API_URL --silent --plain) -- node dist/main.js"]
