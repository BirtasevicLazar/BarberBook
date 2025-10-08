# 🚀 BRZO POKRETANJE - BarberBook

## Za PRVI put na SVOM računaru:

```bash
# 1. Otvori Docker Desktop aplikaciju i sačekaj da se pokrene

# 2. Pokreni skriptu
./start-docker.sh
```

✅ **Gotovo!** Otvori http://localhost u browser-u.

**Napomena:** Script automatski kreira `backend/.env` i `frontend/.env.local` iz template fajlova koji već imaju tvoje SMTP kredencijale!

---

## Za DRUGI računar (npr. kolega, drugi laptop):

```bash
# 1. Kloniraj projekat
git clone https://github.com/BirtasevicLazar/BarberBook.git
cd BarberBook

# 2. Instaliraj Docker Desktop (ako već nije)
# macOS: https://www.docker.com/products/docker-desktop/
# Windows: https://www.docker.com/products/docker-desktop/

# 3. Otvori Docker Desktop

# 4. Pokreni
./start-docker.sh
```

✅ **Radi!** http://localhost

**To je SVE!** Ne treba ručno kreirati `.env` fajlove - sve je automatski!

---

## Komande:

```bash
./start-docker.sh         # Pokreni sve
./stop-docker.sh          # Zaustavi sve
./logs-docker.sh          # Prati logove
./logs-docker.sh backend  # Samo backend
```

---

## Troubleshooting:

### "Docker nije pokrenut"
➡️ Otvori **Docker Desktop** aplikaciju

### "Port 80 is already in use"
➡️ Zaustavi drugi server koji koristi port 80

### "Cannot connect to database"
➡️ Prati logove: `./logs-docker.sh postgres`

### Potpuno resetuj (BRIŠE BAZU!)
```bash
docker-compose down -v
./start-docker.sh
```

---

## Gde su podaci?

- **PostgreSQL baza**: Docker volume `postgres_data` (ostaje i nakon gašenja)
- **Logovi**: `docker-compose logs`
- **Kod**: U tvom projektu (menjaj slobodno i radi `./start-docker.sh` ponovo)

---

📖 **Detaljna dokumentacija**: [README-DOCKER.md](README-DOCKER.md)
