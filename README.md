# projeto-infisical

NestJS consumindo secrets de um Infisical self-hosted via Machine Identity (Universal Auth).

## Estrutura

```
projeto-infisical/
├── infisical/              # self-hosted (Infisical + Postgres + Redis)
├── nest-app/               # NestJS + Dockerfile (CLI do Infisical embutido)
├── docker-compose.yml      # inclui o compose do Infisical e sobe o nest-app
├── .env.nest.example       # template das credenciais da Machine Identity
├── dev.sh                  # script auxiliar
└── README.md
```

## Pré-requisitos

- Docker + Docker Compose v2.20+
- `openssl` (para gerar as chaves do Infisical)

## Setup inicial

### 1. Configurar o Infisical

```bash
cp infisical/.env.example infisical/.env
```

Edite `infisical/.env` e substitua:

- `ENCRYPTION_KEY` → `openssl rand -hex 16`
- `AUTH_SECRET` → `openssl rand -base64 32`

### 2. Subir só o Infisical

```bash
./dev.sh up:infisical
# aguarde ~30s pelas migrations do Postgres
```

Abra http://localhost:8080 e:

1. Crie o usuário admin
2. Crie uma **Organization**
3. Crie um **Project** (ex: `demo-app`) e anote o `Project ID` da URL
4. No project, confirme o environment `dev` (vem por padrão)
5. Em **Secrets** (env `dev`), cadastre:
   - `WELCOME_MESSAGE` = `Hello from Infisical!`
   - `API_KEY` = `sk-prod-abcd1234`
   - `FEATURE_FLAG_BETA` = `false`
6. Em **Access Control → Machine Identities**:
   - Create Identity → nome: `nest-app` → auth method: **Universal Auth**
   - Copie o `Client ID` e crie um `Client Secret`
   - No **Project → Access Control → Machine Identities**, adicione a identity com role `Developer` (ou superior)

### 3. Configurar o nest-app

```bash
cp .env.nest.example .env.nest
```

Edite `.env.nest` colando `CLIENT_ID` e `CLIENT_SECRET` da Machine Identity.

Em `nest-app/Dockerfile`, troque `REPLACE_WITH_PROJECT_ID` pelo `Project ID` do passo 2.

## Uso

```bash
./dev.sh up            # sobe Infisical + nest-app
./dev.sh down          # para containers (preserva dados)
./dev.sh restart       # reinicia nest-app (após alterar secret)
./dev.sh logs [svc]    # tail de logs
./dev.sh status        # lista containers
./dev.sh destroy       # down + apaga dados do Infisical
./dev.sh clean         # destroy + remove imagens baixadas
./dev.sh help          # lista comandos
```

Teste o endpoint:

```bash
curl -s localhost:3003/status | jq
```

Resposta esperada:

```json
{
  "welcomeMessage": "Hello from Infisical!",
  "apiKey": "***1234",
  "featureFlagBeta": false,
  "betaFeatureState": "Beta features OFF",
  "readAt": "2026-11-05T..."
}
```

## Trocar um secret e refletir no app

1. Na UI do Infisical, mude `WELCOME_MESSAGE` para `Hello v2!` (ou vire `FEATURE_FLAG_BETA` para `true`)
2. `./dev.sh restart`
3. `curl localhost:3003/status` → novos valores aparecem

O restart é necessário porque o `infisical run` injeta os secrets como variáveis de ambiente no startup do processo. Para atualizar ao vivo sem restart, seria preciso usar o SDK Node com polling.

## Testar a Machine Identity via API

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/universal-auth/login \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<id>","clientSecret":"<secret>"}' | jq
```

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| `nest-app` em crash loop | Infisical ainda rodando migrations, ou `.env.nest` com credenciais erradas |
| `infisical login` retorna 401 no boot | `CLIENT_ID`/`CLIENT_SECRET` inválidos, ou Machine Identity sem acesso ao project |
| App sobe mas secrets vêm `not-set` | `INFISICAL_PROJECT_ID` no Dockerfile não bate com o project real |
| `include` falha no compose | Compose < v2.20 — rode `docker compose version` e atualize |

## Portas

| Serviço | Porta |
|---|---|
| nest-app | 3003 |
| Infisical UI/API | 8080 |
| Postgres | 5437 |
| Redis | 6381 |
