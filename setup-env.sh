#!/bin/bash

# ========================================
# Setup Environment Files
# ========================================

set -e

echo "🔧 BarberBook - Setup Environment Files"
echo "========================================"
echo ""

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "📝 Kreiram backend/.env iz template-a..."
    cp backend/.env.example backend/.env
    echo "   ✅ backend/.env kreiran"
else
    echo "   ⚠️  backend/.env već postoji - preskaćem"
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Kreiram frontend/.env.local iz template-a..."
    cp frontend/.env.local.example frontend/.env.local
    echo "   ✅ frontend/.env.local kreiran"
else
    echo "   ⚠️  frontend/.env.local već postoji - preskaćem"
fi

# Android .env
if [ ! -f "android/.env" ]; then
    echo "📝 Kreiram android/.env iz template-a..."
    cp android/.env.example android/.env
    echo "   ✅ android/.env kreiran"
else
    echo "   ⚠️  android/.env već postoji - preskaćem"
fi

echo ""
echo "✅ Environment fajlovi su spremni!"
echo ""
echo "📍 Lokacije:"
echo "   - backend/.env"
echo "   - frontend/.env.local"
echo "   - android/.env"
echo ""
echo "💡 Backend i frontend su spremni za Docker."
echo "💡 Android koristi 10.0.2.2:8080 za emulator (defaultno)."
echo "   Za fizički uređaj, promeni IP u android/.env na lokalnu IP adresu računara."
echo ""
