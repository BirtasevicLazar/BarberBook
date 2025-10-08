#!/bin/sh

# ========================================
# Backend Entrypoint - Auto migrations
# ========================================

set -e

echo "🔄 Pokrećem migracije..."

# Run migrations using goose directly
cd /app/migrations
export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=${DB_SSLMODE}"

# Wait for postgres to be ready
echo "⏳ Čekam PostgreSQL..."
until PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -c '\q' 2>/dev/null; do
  echo "   PostgreSQL nije spremna - čekam 2 sekunde..."
  sleep 2
done

echo "✅ PostgreSQL je spremna!"
echo ""
echo "🗄️  Izvršavam SQL migracije..."

# Execute all SQL files manually (since goose binary is not available)
for migration in *.sql; do
  if [ -f "$migration" ]; then
    echo "   Izvršavam: $migration"
    
    # Extract only the -- +goose Up section
    awk '/-- \+goose Up/,/-- \+goose Down/' "$migration" | \
    grep -v "^-- +goose" | \
    PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 || {
      echo "❌ Greška pri izvršavanju $migration"
      # Continue anyway - migrations might already be applied
    }
  fi
done

echo "✅ Migracije završene!"
echo ""
echo "🚀 Pokrećem backend server..."

# Start the main application (stay as root since Dockerfile didn't switch users)
cd /app
exec ./barberbook-server
