#!/bin/bash

# ========================================
# BarberBook - Docker Logs Viewer
# ========================================

echo "📋 BarberBook Docker Logs"
echo "========================="
echo ""
echo "Pritisni Ctrl+C za izlaz"
echo ""

# Check which service to show logs for
if [ -z "$1" ]; then
    echo "📊 Prikazujem logove svih servisa..."
    echo ""
    docker-compose logs -f
else
    echo "📊 Prikazujem logove za: $1"
    echo ""
    docker-compose logs -f "$1"
fi
