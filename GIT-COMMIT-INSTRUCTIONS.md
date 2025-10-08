# Git Commit Instrukcije

## Proveri PRE commit-a:

```bash
# 1. Proveri da .env NIJE u Git-u
git status | grep "\.env$"
# ↑ Treba da bude prazno (nema output)

# 2. Proveri da .env.example JESTE u Git-u
git status | grep ".env.example"
# ↑ Treba da prikaže: .env.example

# 3. Proveri da Docker fajlovi JESU u Git-u
git status | grep -E "(Dockerfile|docker-compose)"
# ↑ Treba da prikaže liste fajlova
```

## Commit komande:

```bash
cd /Users/lazarbirtasevic/BarberBook

# Stage SVE nove fajlove (bez .env jer je u .gitignore)
git add .

# Commit sa detaljnom porukom
git commit -m "feat: Add complete Docker containerization setup

- Add Dockerfiles for backend (Go) and frontend (React+Nginx)
- Add docker-compose.yml with postgres, backend, frontend services
- Add automatic database migrations via entrypoint.sh
- Add helper scripts: start-docker.sh, stop-docker.sh, logs-docker.sh
- Add comprehensive documentation: README-DOCKER.md, QUICKSTART.md
- Add .env.example template (actual .env is gitignored)
- Add .dockerignore for both backend and frontend
- Configure nginx for production SPA serving
- Add health checks for all services
- Add volume persistence for PostgreSQL data

BREAKING CHANGE: Docker is now required for local development.
Traditional setup (manual postgres, go run, npm run dev) still works.

Features:
- Zero-config setup: just run ./start-docker.sh
- Automatic migrations on container start
- SMTP email support configured
- Cross-platform (macOS, Windows, Linux)
- Production-ready multi-stage builds"

# Push na GitHub
git push origin main
```

## Posle push-a:

### Test na DRUGOM računaru:

```bash
# 1. Clone
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook

# 2. Proveri da .env NE POSTOJI
ls -la | grep "\.env$"
# ↑ Treba da ne prikaže ništa (samo .env.example)

# 3. Kopiraj .env.example u .env
cp .env.example .env

# 4. Uredi .env sa svojim SMTP kredencijalima
nano .env

# 5. Pokreni Docker
./start-docker.sh

# 6. Otvori browser
open http://localhost
```

---

## VAŽNO - Šta JESTE u Git-u:

✅ `.env.example` - Template
✅ `.gitignore` - Ignoriše .env
✅ Dockerfiles
✅ docker-compose.yml
✅ Helper scriptovi
✅ Dokumentacija
✅ Source code

## VAŽNO - Šta NIJE u Git-u:

❌ `.env` - **SECRETS!**
❌ `node_modules/`
❌ `dist/`, `build/`
❌ Binary fajlovi
❌ Log fajlovi
