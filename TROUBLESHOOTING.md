# ⚠️ Error Fix Guide - Docker & Database Setup

## 🔴 Masalah yang Ditemukan

### 1. Docker Error
```
TypeError: kwargs_from_env() got an unexpected keyword argument 'ssl_version'
```
**Penyebab:** Docker tidak terinstall atau menggunakan `docker-compose` versi lama (Python-based)

### 2. Database Connection Error
```
Error: Connection terminated due to connection timeout
password authentication failed for user "postgres"
```
**Penyebab:** Password PostgreSQL di `.env` tidak sesuai dengan konfigurasi PostgreSQL Anda

---

## ✅ SOLUSI 1: Setup Lokal (Tanpa Docker)

### Langkah 1: Update Password PostgreSQL di .env

Buka file `.env` dan update bagian database:

```env
# Ganti dengan password PostgreSQL Anda yang sebenarnya
POSTGRES_PASSWORD=YOUR_ACTUAL_POSTGRES_PASSWORD

# Update DATABASE_URL dengan password yang sama
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_POSTGRES_PASSWORD@localhost:5432/urlshortener
```

**Cara mengetahui password PostgreSQL Anda:**
1. Buka **pgAdmin 4**
2. Password yang Anda gunakan untuk login pgAdmin adalah password postgres
3. ATAU: Cek di file `pg_hba.conf` (biasanya di `C:\Program Files\PostgreSQL\18\data\`)

### Langkah 2: Buat Database

Buka **pgAdmin** atau **SQL Shell (psql)** dan jalankan:

```sql
CREATE DATABASE urlshortener;
```

Atau via command line:
```powershell
# Jika password sudah benar di .env
createdb -U postgres -h localhost urlshortener
```

### Langkah 3: Jalankan Migrations

```powershell
npm run migrate
```

### Langkah 4: Seed Database (Optional)

```powershell
npm run seed
```

### Langkah 5: Install Redis (Optional - untuk caching)

Redis tidak wajib untuk development awal, tapi direkomendasikan.

**Download Redis untuk Windows:**
- https://github.com/tporadowski/redis/releases

Setelah extract, jalankan:
```powershell
.\redis-server.exe
```

**Atau skip Redis sementara:**
Comment out Redis di kode untuk development:
```javascript
// src/config/redis.js - Tambahkan error handling
```

### Langkah 6: Start Development Server

```powershell
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

---

## ✅ SOLUSI 2: Setup Docker (Rekomendasi untuk Production-like Environment)

### Install Docker Desktop

1. **Download Docker Desktop:**
   - https://www.docker.com/products/docker-desktop/

2. **Install dan Restart:**
   - Jalankan installer
   - Restart komputer
   - Buka Docker Desktop dan tunggu hingga running

3. **Verifikasi Installation:**
   ```powershell
   docker --version
   # Output: Docker version 24.x.x, build ...
   
   docker compose version
   # Output: Docker Compose version v2.x.x
   ```

4. **Update .env dengan Docker config:**
   ```env
   # Untuk Docker, gunakan:
   POSTGRES_PASSWORD=your_secure_password
   DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/urlshortener
   REDIS_URL=redis://redis:6379
   JWT_SECRET=your-jwt-secret-minimum-64-chars
   ```

5. **Jalankan Docker Compose:**
   ```powershell
   # PENTING: Gunakan "docker compose" BUKAN "docker-compose"
   docker compose up -d
   
   # Check status
   docker compose ps
   
   # View logs
   docker compose logs -f app
   ```

6. **Run Migrations in Docker:**
   ```powershell
   docker compose exec app npm run migrate
   docker compose exec app npm run seed
   ```

---

## 🔧 Quick Fix untuk Development Sekarang

Jika ingin cepat start development tanpa Docker:

### 1. Fix .env File
```powershell
# Edit .env dan ganti password
notepad .env
```

Update baris ini:
```env
POSTGRES_PASSWORD=rosya123
DATABASE_URL=postgresql://postgres:rosya123@localhost:5432/urlshortener
```
*(Ganti `rosya123` dengan password PostgreSQL Anda yang sebenarnya)*

### 2. Buat Database via pgAdmin
1. Buka **pgAdmin 4**
2. Login dengan password Anda
3. Klik kanan pada **Databases** → **Create** → **Database**
4. Name: `urlshortener`
5. Klik **Save**

### 3. Test Connection
```powershell
node -e "const {Pool}=require('pg');const pool=new Pool({connectionString:process.env.DATABASE_URL||'postgresql://postgres:YOUR_PASSWORD@localhost:5432/urlshortener'});pool.query('SELECT NOW()',(e,r)=>{console.log(e?'Error: '+e.message:'✅ Connected: '+r.rows[0].now);pool.end()});"
```

### 4. Run Migration
```powershell
npm run migrate
```

### 5. Start App
```powershell
npm run dev
```

---

## 📝 Catatan Penting

### Redis (Optional untuk Development)
Jika belum install Redis, aplikasi mungkin error. **Temporary fix:**

Edit `src/config/redis.js`:
```javascript
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('⚠️ Redis not available, running without cache');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
  console.warn('⚠️ Redis error (app will continue without cache):', err.message);
});

module.exports = redis;
```

---

## 🎯 Checklist Sebelum Start

- [ ] PostgreSQL service running (check Task Manager atau Services)
- [ ] Password PostgreSQL sudah benar di `.env`
- [ ] Database `urlshortener` sudah dibuat
- [ ] Dependencies sudah diinstall (`npm install`)
- [ ] Migrations sudah dijalankan (`npm run migrate`)
- [ ] (Optional) Redis terinstall dan running
- [ ] Port 3000 tidak digunakan aplikasi lain

---

## 🆘 Masih Error?

Jalankan diagnostic script:

```powershell
# Check PostgreSQL
Get-Service | Where-Object { $_.DisplayName -like '*postgres*' }

# Check port 3000
netstat -ano | findstr :3000

# Test Node.js
node --version

# Check if npm modules installed
Test-Path .\node_modules
```

Atau hubungi dengan error message lengkap! 🙋‍♂️
