#!/bin/bash

# ========================================
# BarberBook - Docker Quick Start Script
# ========================================

set -e  # Exit on error

echo "🐳 BarberBook Docker Deployment"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker nije pokrenut!"
    echo ""
    echo "Molim te:"
    echo "1. Otvori Docker Desktop aplikaciju"
    echo "2. Sačekaj da se Docker potpuno pokrene (ikonica u system tray)"
    echo "3. Ponovo pokreni ovaj script"
    echo ""
    exit 1
fi

echo "✅ Docker je pokrenut"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env fajl ne postoji - kreiram iz template-a..."
    cp .env.example .env
    echo "✅ .env fajl kreiran"
    echo ""
    echo "📝 NAPOMENA: Uredi .env i dodaj svoje SMTP kredencijale:"
    echo "   MAIL_USERNAME=tvoj-email@gmail.com"
    echo "   MAIL_PASSWORD=app-password"
    echo ""
    echo "Za nastavak pritisni ENTER (ili Ctrl+C za prekid)..."
    read
fi

echo "🧹 Čistim stare kontejnere (ako postoje)..."
docker-compose down 2>/dev/null || true
echo ""

echo "🏗️  Build-ujem Docker image-e..."
echo "   (Ovo može trajati 5-10 minuta pri prvom pokretanju)"
echo ""
docker-compose build

echo ""
echo "🚀 Pokrećem kontejnere..."
docker-compose up -d

echo ""
echo "⏳ Čekam da se servisi pokrenu..."
sleep 5

echo ""
echo "📊 Status kontejnera:"
docker-compose ps

echo ""
echo "✅ Gotovo!"
echo ""
echo "📍 Aplikacija je dostupna na:"
echo "   - Frontend: http://localhost"
echo "   - Backend:  http://localhost:8080"
echo "   - Postgres: localhost:5432"
echo ""
echo "📝 Korisne komande:"
echo "   docker-compose logs -f          # Prati logove"
echo "   docker-compose logs -f backend  # Samo backend logovi"
echo "   docker-compose ps               # Proveri status"
echo "   docker-compose down             # Zaustavi sve"
echo "   docker-compose restart          # Restartuj sve"
echo ""
echo "🆘 Troubleshooting:"
echo "   docker-compose logs             # Pogledaj logove"
echo "   docker-compose down -v          # Potpuno resetuj (BRIŠE BAZU!)"
echo "   docker-compose up --build       # Rebuild i restart"
echo ""
