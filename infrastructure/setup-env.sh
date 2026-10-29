#!/usr/bin/env bash
set -euo pipefail

echo "Configuration de l'environnement Cyber Café..."
if [[ -f .env ]]; then
  read -r -p "Le fichier .env existe déjà. Le remplacer ? (y/N): " answer
  if [[ ! "$answer" =~ ^[Yy]$ ]]; then
    echo "Configuration annulée; le fichier existant est conservé."
    exit 0
  fi
fi
if [[ ! -f env.example ]]; then
  echo "Erreur : env.example introuvable. Lancez ce script depuis infrastructure." >&2
  exit 1
fi
if ! command -v openssl >/dev/null 2>&1; then
  echo "Erreur : OpenSSL est requis pour générer les secrets." >&2
  exit 1
fi

cp env.example .env
postgres_password="$(openssl rand -hex 24)"
redis_password="$(openssl rand -hex 24)"
sed -i \
  -e "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${postgres_password}/" \
  -e "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=${redis_password}/" .env
chmod 600 .env
echo "Fichier .env créé avec des secrets aléatoires (permissions 600)."
echo "Vérifiez les variables locales, puis lancez ./start-services.sh."
