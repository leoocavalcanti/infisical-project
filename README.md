# projeto-infisical

Demo mínima: NestJS consumindo 3 secrets do Infisical self-hosted, via Machine Identity.

## Estrutura

```
projeto-infisical/
├── infisical/              # self-hosted (Infisical + Postgres + Redis)
├── nest-app/               # NestJS app + Dockerfile (CLI embutido)
├── docker-compose.yml      # inclui o compose do Infisical + sobe o nest-app
├── .env.nest.example       # template das creds Machine Identity
└── README.md
```

## Pré-requisitos

- Docker + Docker Compose v2.20+
- `openssl` (para gerar as chaves)

## Setup (uma vez só)

### 1. Configure o Infisical

```bash
cp infisical/.env.example infisical/.env
# edite infisical/.env e substitua:
#   ENCRYPTION_KEY: openssl rand -hex 16
#   AUTH_SECRET:    openssl rand -base64 32
```

### 2. Suba só o Infisical primeiro

```bash
./dev.sh up:infisical
# aguarde ~30s (migrations do Postgres)
```

Abra http://localhost:8080 e:

1. Crie o usuário admin
2. Crie uma **Organization**
3. Crie um **Project** (ex: `demo-app`) — anote o `Project ID` da URL
4. No project, crie um **Environment** chamado `dev` (geralmente já vem por padrão)
5. Em **Secrets**, cadastre os 3 secrets no env `dev`:
   - `WELCOME_MESSAGE` = `Hello from Infisical!`
   - `API_KEY` = `sk-prod-abcd1234`
   - `FEATURE_FLAG_BETA` = `false`
6. Em **Access Control > Machine Identities**:
   - Create Identity → nome: `nest-app` → auth method: **Universal Auth**
   - Copie `Client ID` + crie um `Client Secret`
   - Em **Project > Access Control > Machine Identities**, adicione a identity com role `Developer` (ou superior)

### 3. Configure o nest-app

```bash
cd ..   # volta pra raiz
cp .env.nest.example .env.nest
# edite .env.nest colando CLIENT_ID e CLIENT_SECRET da Machine Identity
```

Edite `nest-app/Dockerfile` e troque `REPLACE_WITH_PROJECT_ID` pelo `Project ID` do passo 2.

## Rodar

Use o script auxiliar da raiz:

```bash
./dev.sh up            # sobe Infisical + nest-app (gera infisical/.env se faltar)
./dev.sh down          # para tudo (preserva dados)
./dev.sh restart       # reinicia nest-app após mudar secret
./dev.sh logs          # tail do nest-app
./dev.sh destroy       # down + apaga dados (reset de config do Infisical)
./dev.sh clean         # destroy + remove TODAS as imagens baixadas
./dev.sh help          # lista comandos
```

Equivale a `docker compose up -d --build` etc, só adiciona o boilerplate de env e mensagens.

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

## Demo: trocar secret e refletir no app

1. Na UI do Infisical, mude `WELCOME_MESSAGE` para `Hello v2!` (ou flip `FEATURE_FLAG_BETA` pra `true`)
2. `./dev.sh restart`
3. `curl localhost:3003/status` → novos valores aparecem.

> O restart é necessário porque `infisical run` injeta os secrets como env vars **no startup** do processo. É o padrão "CLI puro"; para refletir ao vivo sem restart seria preciso o SDK Node com polling.

## Troubleshooting

| Sintoma | Causa provável |
|---|---|
| `nest-app` em crash loop | Infisical ainda rodando migrations, ou `.env.nest` com creds erradas |
| `infisical login` retorna erro 401 no boot | `CLIENT_ID`/`CLIENT_SECRET` inválidos, ou Machine Identity sem acesso ao project |
| App sobe mas secrets vêm `not-set` | `INFISICAL_PROJECT_ID` no Dockerfile não bate com o project real |
| `include` falha no compose | Compose < v2.20 — rode `docker compose version` e atualize |

## Limpar

```bash
./dev.sh destroy   # apaga infisical/data/ (perde a config do Infisical)
./dev.sh clean     # acima + remove imagens (infisical, postgres, redis, node, nest-app)
```

## Resumo de comandos

  Comandos:
  - ./dev.sh up — sobe tudo (gera infisical/.env com chaves aleatórias se faltar)
  - ./dev.sh up:infisical — só o Infisical (pro setup inicial da UI)
  - ./dev.sh down — para containers (preserva volumes)
  - ./dev.sh destroy — reset total com volumes
  - ./dev.sh restart — reinicia só o nest-app (pós-mudança de secret)
  - ./dev.sh logs [svc] — tail de logs
  - ./dev.sh status — lista containers


## Testar Secret - Identitiy Machine Infisical

  curl -s -X POST http://localhost:8080/api/v1/auth/universal-auth/login \
    -H "Content-Type: application/json" \
    -d '{"clientId":"<id>","clientSecret":"<secret>"}' \
    | jq