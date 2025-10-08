#!/bin/bash

# ========================================
# BarberBook - Docker Stop Script
# ========================================

echo "🛑 Zaustavljam BarberBook kontejnere..."
echo ""

docker-compose down

echo ""
echo "✅ Svi kontejneri su zaustavljeni"
echo ""
echo "📝 Napomena: PostgreSQL podaci su SAČUVANI u Docker volume-u"
echo "   Za potpuno brisanje (uključujući bazu) koristi:"
echo "   docker-compose down -v"
echo ""
