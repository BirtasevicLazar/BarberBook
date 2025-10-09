# 💈 BarberBook

Kompletan sistem za rezervaciju termina u frizerskim salonima.

## 🌟 Features

- 🎯 **Online rezervacija termina** - Klijenti rezervišu termine preko weba
- 📅 **Upravljanje rasporedom** - Vlasnici i frizeri upravljaju svojim rasporedom
- 📧 **Email notifikacije** - Automatsko slanje potvrda i podsećanja
- 👥 **Multi-barber podrška** - Više frizera u jednom salonu
- 💼 **Upravljanje uslugama** - Kreiranje i cenovnik usluga
- 🚫 **Slobodni dani** - Blokiranje termina za odmor/odsustvo
- 🔒 **Autentikacija** - JWT token-based authentication
- 📱 **Responsive dizajn** - Radi na desktop-u i mobilnom


## 🏗️ Tehnološki Stack

### Backend (Go)
- **Gin** - Web framework
- **PostgreSQL** - Baza podataka
- **JWT** - Autentikacija
- **Goose** - Database migrations
- **SMTP** - Email notifikacije

### Frontend (React)
- **React 19** - UI framework
- **React Router** - Routing
- **Tailwind CSS 4** - Styling
- **Vite 7** - Build tool

### DevOps
- **Docker** - Kontejnerizacija
- **docker-compose** - Orkestracija
- **Nginx** - Reverse proxy


## 🚀 Quick Start sa Docker

**Najbrži način** da pokreneš kompletan projekat (baza + backend + frontend):

### Pokretanje 

```bash
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook
./start-docker.sh
```

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080

### Docker script-ovi

```bash
./start-docker.sh    # Pokreni sve
./stop-docker.sh     # Zaustavi sve
./logs-docker.sh     # Prati logove (svih servisa)
./logs-docker.sh backend  # Samo backend logovi
./setup-env.sh       # Kreiraj .env fajlove iz template-a
```

### Za Android Emulator:**
```bash
cd android
npm install
npm start
# U drugom terminalu:
npm run android
```

## 📦 Development Setup (bez Docker-a)

### Preduslovi

- **Go 1.25+**
- **Node.js 20+**
- **PostgreSQL 16+**

### PostgreSQL Setup

Ako nemaš PostgreSQL user-a `postgres`, kreiraj ga:

```bash
# macOS (Homebrew PostgreSQL)
psql postgres
CREATE USER postgres WITH PASSWORD 'postgres' SUPERUSER;
CREATE DATABASE barberbook_db OWNER postgres;
\q

# Ili koristi svog postojećeg user-a:
# Uredi backend/.env i promeni DB_USER i DB_PASSWORD na svoje kredencijale
```

### Backend

```bash
cd backend

# Instaliraj dependence
go mod download

# Podesi .env
cp .env.example .env
nano .env

# Pokreni migracije
go run cmd/migrate/main.go up

# Pokreni server
go run main.go
```

Backend radi na: http://localhost:8080

### Frontend

```bash
cd frontend

# Instaliraj dependence
npm install

# Podesi .env
echo "VITE_API_BASE_URL=http://localhost:8080" > .env

# Pokreni dev server
npm run dev
```

Frontend radi na: http://localhost:5173


## 📚 API Dokumentacija

### 📮 Postman Collection

Kompletan Postman collection sa svim endpoint-ima je dostupan u:
```
backend/postman/BarberBook.postman_collection.json
```

**Kako koristiti:**
1. Otvori Postman
2. Import → File → Izaberi `BarberBook.postman_collection.json`
3. Kolekcija sadrži **40+ endpoint-a** organizovanih u foldere:
   - 🌐 **Public** - Javni endpoint-i (salon, frizeri, rezervacije)
   - 🔐 **Auth** - Login za vlasnike i frizere
   - 👔 **Owner** - Upravljanje salonom i frizerima
   - ✂️ **Barber** - Usluge, radno vreme, pauze, slobodni dani, termini

**Features:**
- Auto-save test skripte za tokene i ID-jeve
- Collection variables za lako testiranje
- Svi opisi na srpskom jeziku
- Email funkcionalnost dokumentovana

### Public Endpoints (bez autentikacije)

```
GET  /public/salons/:id                    - Detalji salona
GET  /public/salons/:id/barbers            - Lista frizera
GET  /public/barbers/:id/services          - Usluge frizera
GET  /public/availability                  - Dostupni termini
POST /public/appointments                  - Kreiraj termin
```

### Auth Endpoints

```
POST /auth/owner/register                  - Registruj vlasnika salona
POST /auth/owner/login                     - Login vlasnika
POST /auth/barber/login                    - Login frizera
```

### Protected Endpoints (potreban JWT token)

```
# Saloni
GET    /salons                             - Lista salona (owner)
POST   /salons                             - Kreiraj salon
PUT    /salons/:id                         - Ažuriraj salon

# Frizeri
GET    /salons/:id/barbers                 - Lista frizera
POST   /salons/:id/barbers                 - Dodaj frizera
PUT    /salons/:salon_id/barbers/:id       - Ažuriraj frizera

# Usluge
GET    /salons/:salon_id/barbers/:barber_id/services  - Lista usluga
POST   /salons/:salon_id/barbers/:barber_id/services  - Dodaj uslugu

# Termini
GET    /appointments                       - Lista termina
PUT    /appointments/:id                   - Ažuriraj termin
DELETE /appointments/:id                   - Otkaži termin

# Raspored
GET    /salons/:salon_id/barbers/:barber_id/schedule  - Radno vreme
POST   /salons/:salon_id/barbers/:barber_id/schedule  - Podesi radno vreme
POST   /salons/:salon_id/barbers/:barber_id/timeoff   - Dodaj slobodan dan
```


## 🗄️ Database Schema

### Glavne tabele

- **users** - Vlasnici i frizeri (autentikacija)
- **salons** - Frizerski saloni
- **barbers** - Frizeri (relacija user ↔ salon)
- **barber_services** - Usluge koje frizer nudi
- **appointments** - Rezervisani termini
- **barber_schedule** - Radno vreme frizera
- **barber_breaks** - Pauze tokom radnog dana
- **barber_timeoff** - Slobodni dani / odmori

Migracije: [backend/migrations/](backend/migrations/)


## 👨‍💻 Author

**Lazar Birtašević**

- GitHub: [@BirtasevicLazar](https://github.com/BirtasevicLazar)
