#!/bin/sh
set -e

echo "🔄 Waiting for database to be ready..."

# Attendre que PostgreSQL accepte les connexions
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_DATABASE" -c '\q' 2>/dev/null; do
  echo "⏳ Postgres is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running migrations..."
pnpm db:migrate

echo "🌱 Running seed..."
pnpm db:seed

echo "🚀 Starting backend server..."
exec pnpm dev
