#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

cmd="${1:-help}"

ensure_infisical_env() {
  if [ ! -f infisical/.env ]; then
    echo "→ gerando infisical/.env com chaves aleatórias"
    cp infisical/.env.example infisical/.env
    local enc_key auth_secret
    enc_key=$(openssl rand -hex 16)
    auth_secret=$(openssl rand -base64 32)
    # macOS sed requires empty string after -i
    sed -i '' "s|REPLACE_WITH_32_HEX_CHARS|${enc_key}|" infisical/.env
    sed -i '' "s|REPLACE_WITH_BASE64_SECRET|${auth_secret}|" infisical/.env
  fi
}

ensure_nest_env() {
  if [ ! -f .env.nest ]; then
    echo "⚠  .env.nest não existe — copiando do example"
    echo "   edite com CLIENT_ID/SECRET da Machine Identity antes do nest-app funcionar"
    cp .env.nest.example .env.nest
  fi
}

case "$cmd" in
  up)
    ensure_infisical_env
    ensure_nest_env
    echo "→ subindo stack completa"
    docker compose up -d --build
    echo ""
    echo "✓ Infisical:  http://localhost:8080"
    echo "✓ nest-app:   http://localhost:3003/status"
    echo "✓ Postgres:   localhost:5437"
    echo "✓ Redis:      localhost:6381"
    ;;
  up:infisical)
    ensure_infisical_env
    echo "→ subindo só o Infisical"
    cd infisical && docker compose up -d
    echo "✓ Infisical:  http://localhost:8080"
    ;;
  down)
    echo "→ parando stack (volumes preservados)"
    docker compose down
    ;;
  destroy)
    read -p "⚠  isso apaga o volume do Postgres (perde a config do Infisical). continuar? [y/N] " ans
    if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
      docker compose down -v
    fi
    ;;
  restart)
    docker compose restart nest-app
    echo "✓ nest-app reiniciado — secrets recarregados"
    ;;
  logs)
    docker compose logs -f "${2:-nest-app}"
    ;;
  status)
    docker compose ps
    ;;
  help|*)
    cat <<EOF
Uso: ./dev.sh <comando>

Comandos:
  up            sobe tudo (Infisical + nest-app)
  up:infisical  sobe só o Infisical (pra fazer setup inicial na UI)
  down          para containers (preserva volumes)
  destroy       down + apaga volumes (reset completo)
  restart       reinicia só o nest-app (usar após mudar secret na UI)
  logs [svc]    tail nos logs (default: nest-app)
  status        lista containers
EOF
    ;;
esac
