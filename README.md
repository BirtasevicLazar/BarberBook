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

---

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

---

## 🚀 Quick Start sa Docker

**Najbrži način** da pokreneš kompletan projekat (baza + backend + frontend):

### Option 1: Automatski script (preporučeno)

```bash
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook
./start-docker.sh
```

### Option 2: Ručno

```bash
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook

# Pokreni Docker Desktop prvo!
docker-compose up -d
```

✅ Gotovo! Aplikacija je dostupna na:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080

### Korisni script-ovi

```bash
./start-docker.sh    # Pokreni sve
./stop-docker.sh     # Zaustavi sve
./logs-docker.sh     # Prati logove (svih servisa)
./logs-docker.sh backend  # Samo backend logovi
```

📖 **Detaljno uputstvo**: [README-DOCKER.md](README-DOCKER.md)

---

## 📦 Development Setup (bez Docker-a)

### Preduslovi

- **Go 1.25+**
- **Node.js 20+**
- **PostgreSQL 16+**

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

---

## 📚 API Dokumentacija

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

Kompletna Postman kolekcija: [backend/postman/BarberBook.postman_collection.json](backend/postman/BarberBook.postman_collection.json)

---

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

---

## 🔐 Environment Variables

### Backend

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=barberbook_user
DB_PASSWORD=your_password
DB_NAME=barberbook_db
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-secret-key

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:8080
```

Template: [.env.example](.env.example)

---

## 🧪 Testing

### Backend

```bash
cd backend
go test ./...
```

### Frontend

```bash
cd frontend
npm run test
```

---

## 📝 Git Workflow

### Što NE sme na Git:

❌ `.env` fajlovi sa secrets (već u `.gitignore`)  
❌ `node_modules/` (već ignorirano)  
❌ `dist/` i `build/` folderi  
❌ PostgreSQL data folderi  
❌ Docker volumes

### ✅ Safe za Git (već uključeno):

- ✅ `.env.example` (template bez secrets)
- ✅ `.gitignore` (konfigurisano za sve foldere)
- ✅ `.gitattributes` (line endings za shell scriptove)
- ✅ Source code
- ✅ Migracije
- ✅ Dokumentacija
- ✅ Dockerfiles i docker-compose.yml
- ✅ Helper scriptovi (`start-docker.sh`, itd.)

### 🔒 Sigurnost:

**`.env` fajl NIKAD ne ide na Git!** On sadrži:
- Database passwords
- JWT secret
- SMTP credentials

Umesto toga, na Git ide **`.env.example`** koji pokazuje format, ali bez pravih vrednosti.

**Na drugom računaru:**
```bash
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook
cp .env.example .env  # ← Ručno kopiraj
nano .env             # ← Unesi prave vrednosti
```

---

## 🚢 Production Deployment

### Option 1: Docker (preporučeno)

```bash
# Na serveru
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook

# Podesi production secrets
cp .env.example .env
nano .env  # ← Promeni DB_PASSWORD, JWT_SECRET, MAIL_*

# Pokreni
docker-compose up -d
```

### Option 2: Ručno

1. Deploy PostgreSQL bazu
2. Build backend: `go build -o barberbook-server`
3. Build frontend: `npm run build`
4. Podesi Nginx reverse proxy
5. SSL certifikat (Let's Encrypt)
6. Systemd service za backend

---

## 🤝 Contributing

1. Fork repozitorijum
2. Kreiraj feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit izmene (`git commit -m 'Add some AmazingFeature'`)
4. Push na branch (`git push origin feature/AmazingFeature`)
5. Otvori Pull Request

---

## 📄 License

MIT License - vidi [LICENSE](LICENSE) za detalje.

---

## 👨‍💻 Author

**Lazar Birtašević**

- GitHub: [@BirtasevicLazar](https://github.com/BirtasevicLazar)

---

## 🆘 Support

- 📖 Dokumentacija: [README-DOCKER.md](README-DOCKER.md)
- 🐛 Issues: [GitHub Issues](https://github.com/BirtasevicLazar/BarberBook/issues)
- 📧 Email: lazar.birtasevic@example.com

---

**Made with ❤️ in Serbia**
