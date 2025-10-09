# 📱 BarberBook Android App - Setup

## 🚀 Quick Start

### 1. Pokreni Docker Backend
```bash
# U glavnom folderu projekta
./start-docker.sh
```

### 2. Setup Android Environment
```bash
# Kopiraj .env.example u .env
cp android/.env.example android/.env
```

### 3. Pokreni Android App

**Za Android Emulator:**
```bash
cd android
npm install
npm start
# U drugom terminalu:
npm run android
```

**Za fizički uređaj:**
1. Pronađi IP adresu svog računara:
   ```bash
   # macOS:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows:
   ipconfig
   
   # Linux:
   ip addr show
   ```

2. Izmeni `android/.env`:
   ```properties
   API_BASE_URL=http://192.168.1.X:8080
   ```
   (Zameni `X` sa svojim IP brojem)

3. Restartuj Metro bundler:
   ```bash
   npm start -- --reset-cache
   ```

---

## 🔧 Konfiguracija

### Backend API URL

**Android Emulator (Defaultno):**
```properties
API_BASE_URL=http://10.0.2.2:8080
```
- `10.0.2.2` je specijalna adresa koja pokazuje na `localhost` host mašine

**Fizički Android uređaj:**
```properties
API_BASE_URL=http://192.168.1.X:8080
```
- Zameni `X` sa IP adresom računara na kojem radi Docker

---

## 📋 Česte greške

### "Network request failed"
- **Emulator**: Proveri da li Docker backend radi na portu 8080
  ```bash
  curl http://localhost:8080/health
  ```
- **Fizički uređaj**: Proveri da li su računar i telefon na istoj WiFi mreži

### "Connection refused"
- Proveri da li je Docker backend pokrenut:
  ```bash
  docker ps | grep barberbook-backend
  ```

### "Cannot read property of undefined"
- Resetuj Metro bundler cache:
  ```bash
  npm start -- --reset-cache
  ```

---

## 🆘 Troubleshooting

```bash
# Rebuild Android app
cd android/android
./gradlew clean
cd ..
npm run android

# Proveri Metro bundler logove
npm start

# Proveri backend logove
docker logs barberbook-backend -f
```
