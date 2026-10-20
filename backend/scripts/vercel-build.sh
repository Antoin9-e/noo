#!/bin/sh
# Build du service backend sur Vercel
set -e

bunx prisma generate
# Migrations seulement en prod : les previews partagent la même base
if [ "$VERCEL_ENV" = "production" ]; then
  bunx prisma migrate deploy
fi
