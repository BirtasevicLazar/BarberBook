# ✅ Docker Setup - Kompletna Lista Fajlova

## 📦 Kreirani Fajlovi

### Root direktorijum (`/`)
- ✅ `.env` - **LOKALNO SAMO** - Environment varijable sa SMTP kredencijalima
- ✅ `.env.example` - Template za .env (ide na Git)
- ✅ `.gitignore` - Ignoriše .env, node_modules, itd.
- ✅ `.gitattributes` - Line endings za shell scriptove (LF)
- ✅ `docker-compose.yml` - Orkestracija svih servisa
- ✅ `README.md` - Glavni README sa uputstvom
- ✅ `README-DOCKER.md` - Detaljna Docker dokumentacija
- ✅ `QUICKSTART.md` - Brzo uputstvo (TL;DR)
- ✅ `start-docker.sh` - Automatski start script
- ✅ `stop-docker.sh` - Automatski stop script
- ✅ `logs-docker.sh` - Prikaz logova

### Backend (`/backend/`)
- ✅ `Dockerfile` - Multi-stage build za Go
- ✅ `.dockerignore` - Šta ignorisati pri buildu
- ✅ `.gitignore` - Ignoriše binaries, .env, vendor
- ✅ `entrypoint.sh` - Automatske migracije pri startu

### Frontend (`/frontend/`)
- ✅ `Dockerfile` - Multi-stage build za React + Nginx
- ✅ `nginx.conf` - Nginx konfiguracija
- ✅ `.dockerignore` - Šta ignorisati pri buildu
- ✅ `.gitignore` - Ignoriše node_modules, dist, .env

---

## 🔐 Sigurnost - Šta ide na Git

### ✅ IDE NA GIT (safe):
- `.env.example` - Template bez secrets
- `.gitignore`, `.gitattributes`
- `docker-compose.yml`
- `Dockerfile` (svi)
- `nginx.conf`
- `entrypoint.sh`
- `*.sh` scriptovi
- `README*.md` dokumentacija
- **Ceo source code** (Go, React, SQL migracije)

### ❌ NE IDE NA GIT (u .gitignore):
- `.env` - **SECRETS UNUTRA!**
- `node_modules/`
- `dist/`, `build/`
- `vendor/`
- Binary fajlovi
- `*.log`
- OS fajlovi (`.DS_Store`)

---

## 🚀 Kako koristiti na različitim računarima

### Na TVOM računaru (prvi put):
```bash
# 1. Otvori Docker Desktop
# 2. Pokreni:
cd /Users/lazarbirtasevic/BarberBook
./start-docker.sh
```

### Na DRUGOM računaru (kolega, novi laptop):
```bash
# 1. Instaliraj Docker Desktop
# 2. Kloniraj repo:
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook

# 3. Kopiraj .env template i popuni secrets:
cp .env.example .env
nano .env  # ← Unesi MAIL_USERNAME i MAIL_PASSWORD

# 4. Pokreni:
./start-docker.sh
```

---

## 🗄️ Šta Docker kreira automatski

### Kontejneri (4 kom):
1. **barberbook-postgres** - PostgreSQL 16 baza
2. **barberbook-backend** - Go API server
3. **barberbook-frontend** - React + Nginx

### Volumes (trajno skladište):
1. **postgres_data** - PostgreSQL podaci (ostaju i nakon gašenja!)

### Networks:
1. **barberbook-network** - Private network za kontejnere

---

## 📊 Status provera

```bash
# Proveri da li sve radi
docker-compose ps

# Trebalo bi da vidiš:
# barberbook-postgres   Up (healthy)   0.0.0.0:5432->5432/tcp
# barberbook-backend    Up (healthy)   0.0.0.0:8080->8080/tcp
# barberbook-frontend   Up (healthy)   0.0.0.0:80->80/tcp
```

---

## 🔧 Troubleshooting

### Problem: "Docker nije pokrenut"
```bash
# Rešenje: Otvori Docker Desktop aplikaciju
open -a "Docker Desktop"  # macOS
```

### Problem: "Port 80 is already in use"
```bash
# Rešenje: Promeni port u docker-compose.yml
# Promeni: "80:80" → "3000:80"
docker-compose down
docker-compose up -d
```

### Problem: Migracije nisu izvršene
```bash
# Proveri backend logove:
docker-compose logs backend | grep -i migration

# Ako treba, ručno uđi u kontejner:
docker-compose exec backend sh
cd /app/migrations
ls -la
```

### Problem: Frontend ne učitava podatke
```bash
# 1. Proveri backend health:
curl http://localhost:8080/health

# 2. Proveri CORS u backend logu:
docker-compose logs backend | grep -i cors

# 3. Proveri browser console (F12)
```

---

## 🧪 Testiranje pre commit-a

```bash
# 1. Proveri da .env nije u Git-u:
git status | grep ".env"  # ← Treba da NE prikaže .env (samo .env.example)

# 2. Proveri .gitignore:
cat .gitignore | grep ".env"  # ← Treba da prikaže ".env"

# 3. Testiraj da li Docker setup radi:
./start-docker.sh
# Otvori http://localhost u browser-u
./stop-docker.sh

# 4. Commit SVE osim .env:
git add .
git commit -m "feat: Add complete Docker containerization setup"
git push
```

---

## 📝 Šta je postignuto

✅ **Kompletna kontejnerizacija** - Backend, Frontend, PostgreSQL  
✅ **Automatske migracije** - Pri svakom startu  
✅ **Zero-config** - Radi odmah sa `./start-docker.sh`  
✅ **Production-ready** - Multi-stage builds, health checks  
✅ **Sigurnost** - `.env` nije na Git-u, non-root user  
✅ **Dokumentacija** - 3 nivoa (README, DOCKER, QUICKSTART)  
✅ **Helper scriptovi** - start, stop, logs  
✅ **Cross-platform** - Radi na macOS, Windows, Linux  

---

**Sledeći koraci:**
1. Push na Git
2. Test na drugom računaru (clone + `./start-docker.sh`)
3. Deploy na VPS (sa production `.env`)

🎉 **Gotovo!**
