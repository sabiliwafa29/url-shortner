# Setup Guide - Local Development (Without Docker)

## Prerequisites

Pastikan sudah terinstall:
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 15+ ([Download](https://www.postgresql.org/download/windows/))
- Redis 7+ ([Download Windows](https://github.com/tporadowski/redis/releases))

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL Database

Buka **pgAdmin** atau **psql** dan jalankan:
```sql
CREATE DATABASE urlshortener;
```

### 3. Setup Redis

Jalankan Redis server:
```bash
# Jika menggunakan Redis portable
redis-server.exe

# Atau jika terinstall sebagai service
Start-Service Redis
```

### 4. Update .env File

File `.env` sudah diupdate dengan konfigurasi berikut:
```env
DATABASE_URL=postgresql://postgres:postgres_password_123@localhost:5432/urlshortener
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long-please-change-this
```

**PENTING:** Update `POSTGRES_PASSWORD` sesuai password PostgreSQL Anda!

### 5. Run Database Migrations
```bash
npm run migrate
```

### 6. Seed Database (Optional)
```bash
npm run seed
```

### 7. Start Development Server
```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

## Docker Setup (Alternatif)

### Masalah yang Ditemukan
Error yang terjadi karena:
1. **Docker belum terinstall** atau tidak ada di PATH
2. **docker-compose versi lama** (Python-based) yang tidak kompatibel

### Solusi Docker

#### Option 1: Install Docker Desktop
1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Install dan restart komputer
3. Jalankan Docker Desktop
4. Verifikasi dengan: `docker --version`
5. Jalankan: `docker compose up -d` (tanpa dash, Docker Compose V2)

#### Option 2: Update docker-compose
Jika sudah ada Docker Desktop tapi error, gunakan perintah baru:
```bash
# Gunakan "docker compose" (TANPA DASH) bukan "docker-compose"
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f
```

### docker-compose.yml Sudah Diperbaiki

File sudah diupdate dengan:
- ✅ Environment variables dari `.env`
- ✅ Health checks untuk semua services
- ✅ Custom networks
- ✅ Volume mounts untuk development
- ✅ Restart policies

## Troubleshooting

### Error: "JWT_SECRET variable is not set"
**Solusi:** File `.env` sudah diperbaiki dengan semua variable yang diperlukan.

### Error: "Cannot connect to PostgreSQL"
**Solusi:** 
1. Pastikan PostgreSQL service berjalan
2. Periksa username dan password di `.env`
3. Pastikan database `urlshortener` sudah dibuat

### Error: "Cannot connect to Redis"
**Solusi:**
1. Pastikan Redis service berjalan
2. Test dengan: `redis-cli ping` (should return "PONG")

## Testing

Setelah aplikasi berjalan, test dengan:

### Health Check
```bash
curl http://localhost:3000/health
```

### API Documentation
Buka browser: http://localhost:3000/api-docs

### Sample API Request
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123","name":"Test User"}'
```

## Next Steps

1. **Jika ingin menggunakan Docker:**
   - Install Docker Desktop
   - Restart terminal
   - Jalankan: `docker compose up -d`

2. **Jika ingin development lokal:**
   - Install PostgreSQL dan Redis
   - Update `.env` dengan credentials yang benar
   - Jalankan: `npm run dev`

Pilih metode yang paling sesuai dengan environment Anda!
