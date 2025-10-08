# 🐳 BarberBook - Docker Deployment Guide

Kompletno uputstvo za pokretanje BarberBook aplikacije na **bilo kom računaru** koristeći Docker.

---

## 📋 Preduslovi

Jedini preduslov je instaliran **Docker Desktop**:

- **macOS**: [Preuzmi Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Windows**: [Preuzmi Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**: Instaliraj `docker` i `docker-compose` preko package manager-a

---

## 🚀 Brzo pokretanje (3 koraka)

### 1. Kloniraj repozitorijum

```bash
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook
```

### 2. Pokreni sa Docker-om

```bash
./start-docker.sh
```

**To je SVE!** Aplikacija automatski:
- ✅ Kreira `backend/.env` i `frontend/.env.local` iz template-a
- ✅ Pokreće PostgreSQL sa automatskim kredencijalima
- ✅ Build-uje backend i frontend
- ✅ Izvršava database migracije
- ✅ Pokreće sve servise

---

## 🔧 Database Credentials - Lokalno vs Docker

### Za **Docker** (automatski):
```yaml
DB_HOST: postgres             # Docker internal hostname
DB_USER: barberbook_user
DB_PASSWORD: barberbook_pass_2025
DB_NAME: barberbook_db
```
Docker **automatski kreira** ove kredencijale - ne treba ništa menjati!

### Za **lokalni development** (bez Docker-a):
```env
DB_HOST=localhost
DB_USER=postgres              # PostgreSQL default user
DB_PASSWORD=postgres          # PostgreSQL default password
DB_NAME=barberbook_db
```
Ovi kredencijali rade na **svakom računaru** gde je PostgreSQL instaliran sa default podešavanjima.

---

---

## ✅ Gotovo!

Aplikacija je dostupna na:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5432

---

## 📊 Provera statusa

### Proveri da li sve radi

```bash
docker-compose ps
```

Trebalo bi da vidiš:

```
NAME                   STATUS         PORTS
barberbook-postgres    Up (healthy)   0.0.0.0:5432->5432/tcp
barberbook-backend     Up (healthy)   0.0.0.0:8080->8080/tcp
barberbook-frontend    Up (healthy)   0.0.0.0:80->80/tcp
barberbook-migrate     Exited (0)     -
```

- `barberbook-migrate` treba da ima status **Exited (0)** - to znači da su migracije uspešno izvršene
- Ostali servisi treba da imaju status **Up (healthy)**

### Prati logove

```bash
# Svi servisi
docker-compose logs -f

# Samo backend
docker-compose logs -f backend

# Samo postgres
docker-compose logs -f postgres
```

---

## 🛠️ Često korišćene komande

### Zaustavi sve kontejnere

```bash
docker-compose down
```

> **Napomena**: Ovo NE BRIŠE podatke u bazi! PostgreSQL podaci se čuvaju u Docker volume-u.

### Ponovo pokreni

```bash
docker-compose up -d
```

### Zaustavi i obriši SVE (uključujući bazu!)

```bash
docker-compose down -v
```

> **UPOZORENJE**: `-v` briše volumes, što znači da se **BRIŠU SVI PODACI U BAZI**!

### Rebuild nakon izmene koda

```bash
docker-compose down
docker-compose up --build -d
```

### Pročisti Docker (oslobodi disk prostor)

```bash
# Obriši nekorišćene image-e
docker image prune -a

# Obriši nekorišćene volume-e
docker volume prune

# Obriši SVE nekorišćeno (image, volume, network, cache)
docker system prune -a --volumes
```

---

## 🗄️ Rad sa bazom

### Uđi u PostgreSQL terminal

```bash
docker-compose exec postgres psql -U barberbook_user -d barberbook_db
```

Unutar PostgreSQL terminala:

```sql
-- Prikaži sve tabele
\dt

-- Prikaži sve korisnike
SELECT * FROM users;

-- Prikaži sve salone
SELECT * FROM salons;

-- Izađi
\q
```

### Backup baze

```bash
docker-compose exec postgres pg_dump -U barberbook_user barberbook_db > backup.sql
```

### Restore baze

```bash
docker-compose exec -T postgres psql -U barberbook_user barberbook_db < backup.sql
```

---

## 🔧 Troubleshooting

### Problem: Port 80 ili 8080 je zauzet

**Rešenje**: Promeni port u `docker-compose.yml`

```yaml
services:
  frontend:
    ports:
      - "3000:80"  # ← Umesto 80, koristi 3000
  
  backend:
    ports:
      - "9000:8080"  # ← Umesto 8080, koristi 9000
```

Zatim restartuj:

```bash
docker-compose down
docker-compose up -d
```

### Problem: Migracije nisu izvršene

**Rešenje**: Ručno pokreni migracije

```bash
docker-compose run --rm migrate
```

### Problem: Backend ne može da se poveže na bazu

**Rešenje**: Proveri da li je postgres zdravo

```bash
docker-compose ps postgres
```

Ako nije `(healthy)`, prati logove:

```bash
docker-compose logs postgres
```

Restartuj samo postgres:

```bash
docker-compose restart postgres
```

### Problem: Frontend ne učitava podatke

**Proveri**:

1. Da li backend radi:
   ```bash
   curl http://localhost:8080/health
   ```

2. Proveri browser console (F12) za CORS greške

3. Prati backend logove:
   ```bash
   docker-compose logs -f backend
   ```

### Problem: Docker build je spor

**Rešenje**: Docker cache-uje layere. Ako imaš problema:

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Problem: "No space left on device"

**Rešenje**: Očisti Docker:

```bash
docker system prune -a --volumes
```

---

## 📦 Šta se dešava iza scene?

### Prvi put (build)

1. **Docker preuzima base image-e** (~1GB):
   - `golang:1.25.1-alpine`
   - `node:20-alpine`
   - `postgres:16-alpine`
   - `nginx:alpine`

2. **Build-uje backend**:
   - Instalira Go dependence
   - Kompajlira kod u statički binary
   - Kreira finalni image (~50MB)

3. **Build-uje frontend**:
   - Instalira npm dependence
   - Build-uje React app (`npm run build`)
   - Kreira finalni image sa Nginx (~30MB)

4. **Pokreće servise**:
   - **Postgres** - Kreira bazu `barberbook_db`
   - **Migrate** - Izvršava SQL migracije (kreira tabele)
   - **Backend** - Startuje Go API na `:8080`
   - **Frontend** - Servira React app preko Nginx na `:80`

### Drugi put (restart)

- **NE build-uje ponovo** (osim ako nisi promenio kod)
- **Koristi postojeće image-e** (~10 sekundi za start)
- **Koristi postojeće volume-e** (baza ostaje nepromenjena)

---

## 🌐 Deploy na produkciju

### VPS (DigitalOcean, Linode, AWS EC2)

1. Instaliraj Docker na serveru:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. Kloniraj repo:
   ```bash
   git clone https://github.com/BirtasevicLazar/BarberBook.git
   cd BarberBook
   ```

3. Podesi `.env` sa **production secrets**:
   ```bash
   cp .env.example .env
   nano .env
   ```

   **Obavezno promeni**:
   ```env
   DB_PASSWORD=JAKO_JAKA_LOZINKA_12345
   JWT_SECRET=random-string-minimum-64-karaktera-1234567890abcdef
   MAIL_USERNAME=tvoj-email@gmail.com
   MAIL_PASSWORD=app-password
   ```

4. Pokreni:
   ```bash
   docker-compose up -d
   ```

5. Dodaj Nginx reverse proxy sa Let's Encrypt SSL-om:
   - Instaliraj Certbot
   - Generiši SSL certifikat
   - Konfiguriši Nginx da proxy-uje na Docker kontejnere

---

## 🔒 Sigurnost - Best Practices

### Development (lokalno)

✅ **OK**:
- Hardcoded kredencijali u `docker-compose.yml`
- HTTP (bez SSL)
- Default ports (80, 8080, 5432)

### Production (javni server)

❌ **NIKADA**:
- Nemoj koristiti default passwords
- Nemoj expose-ovati port 5432 (PostgreSQL) na javnu mrežu
- Nemoj koristiti HTTP bez SSL-a

✅ **OBAVEZNO**:
- Promeni **sve** passwords u jakog i random
- Koristi **SSL certifikat** (Let's Encrypt besplatan)
- Koristi **Nginx reverse proxy** ispred Docker kontejnera
- Koristi **firewall** (ufw, iptables)
- Redovno pravi **backup baze**

---

## 📂 Folder struktura

```
BarberBook/
├── backend/
│   ├── Dockerfile              # Multi-stage build za Go
│   ├── .dockerignore           # Fajlovi koje Docker ignoriše
│   ├── main.go
│   ├── migrations/             # SQL migracije
│   └── ...
├── frontend/
│   ├── Dockerfile              # Multi-stage build za React + Nginx
│   ├── nginx.conf              # Nginx konfiguracija
│   ├── .dockerignore
│   └── ...
├── docker-compose.yml          # Orchestrator - definiše sve servise
├── .env.example                # Template za environment varijable
├── .gitignore                  # .env je ovde!
└── README-DOCKER.md            # Ova dokumentacija
```

---

## 🆘 Podrška

Ako imaš problema:

1. **Proveri logove**: `docker-compose logs -f`
2. **Proveri status**: `docker-compose ps`
3. **Proveri health**: `curl http://localhost:8080/health`
4. **Restartuj sve**: `docker-compose restart`
5. **Kompletno resetuj**: `docker-compose down -v && docker-compose up -d`

---

## 📝 Changelog

### 2025-10-09
- ✅ Inicijalni Docker setup
- ✅ Multi-stage build za backend i frontend
- ✅ Automatske migracije
- ✅ Health checks za sve servise
- ✅ Volume persistence za PostgreSQL
- ✅ Production-ready sa `.env.example`

---

**Sretno! 🚀**
