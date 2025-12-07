# 🚀 RAILWAY DEPLOYMENT - NEXT STEPS

## ✅ Yang Sudah Selesai:

1. ✅ Code di-push ke GitHub
2. ✅ Railway CLI ter-link ke project
3. ✅ Environment variables di-set:
   - NODE_ENV=production
   - PORT=3000
   - BASE_URL=https://url-shortner-production-945b.up.railway.app
   - JWT_SECRET=[generated & set]
   - JWT_EXPIRE=7d
   - CORS_ORIGIN=*
   - RATE_LIMIT_WINDOW=15
   - RATE_LIMIT_MAX_REQUESTS=100

## 🔴 Yang Perlu Dilakukan Sekarang (Di Railway Dashboard):

Railway dashboard seharusnya sudah terbuka. Lakukan langkah berikut:

### 1. Add PostgreSQL Database

1. Di Railway dashboard, klik tombol **"New"** (atau "+ New Service")
2. Pilih **"Database"**
3. Pilih **"Add PostgreSQL"**
4. Tunggu beberapa detik sampai PostgreSQL service running (hijau)
5. PostgreSQL akan otomatis generate `DATABASE_URL` dan inject ke app service

### 2. Add Redis Database

1. Klik tombol **"New"** lagi
2. Pilih **"Database"**
3. Pilih **"Add Redis"**
4. Tunggu beberapa detik sampai Redis service running (hijau)
5. Redis akan otomatis generate `REDIS_URL` dan inject ke app service

### 3. Verify Variables

1. Klik pada **"url-shortner"** service (app service Anda)
2. Buka tab **"Variables"**
3. Pastikan ada variables berikut (seharusnya otomatis muncul):
   - ✅ `DATABASE_URL` (dari PostgreSQL)
   - ✅ `REDIS_URL` (dari Redis)
   - ✅ Semua variables yang sudah kita set tadi

### 4. Trigger Redeploy (jika perlu)

Jika app belum deploy otomatis:
1. Klik tab **"Deployments"**
2. Klik **"Redeploy"** atau **"Deploy"**

---

## 📋 Setelah Deploy Selesai (Jalankan Di Terminal)

Tunggu hingga deployment status menjadi **"Success"** (hijau), lalu jalankan:

### 1. Run Database Migrations

```powershell
railway run npm run migrate
```

**Output yang diharapkan:**
```
🚀 Running database migrations...
✅ Migrations completed successfully
```

### 2. (Optional) Seed Database

```powershell
railway run npm run seed
```

**Output yang diharapkan:**
```
✅ Database seeded successfully!
Created 3 users
Created 6 URLs
Sample credentials:
  Email: admin@example.com
  Password: Password123
```

### 3. Test API

```powershell
# Test health endpoint
curl https://url-shortner-production-945b.up.railway.app/health

# Test API docs
Start-Process "https://url-shortner-production-945b.up.railway.app/api-docs"
```

---

## 🔍 Monitoring & Troubleshooting

### View Logs
```powershell
railway logs
```

### Follow Live Logs
```powershell
railway logs -f
```

### Check Service Status
```powershell
railway status
```

### Verify Variables
```powershell
railway variables
```

---

## ✅ Success Checklist

Setelah selesai, pastikan:

- [ ] PostgreSQL service status: **Active** (hijau)
- [ ] Redis service status: **Active** (hijau)
- [ ] App service status: **Active** (hijau)
- [ ] `DATABASE_URL` variable ada di app service
- [ ] `REDIS_URL` variable ada di app service
- [ ] Migration berhasil dijalankan
- [ ] Health endpoint return status "ok"
- [ ] API docs accessible di `/api-docs`

---

## 🌐 Your API Endpoints

Base URL: **https://url-shortner-production-945b.up.railway.app**

- **Health Check:** `/health`
- **API Docs:** `/api-docs`
- **Register:** `POST /api/auth/register`
- **Login:** `POST /api/auth/login`
- **Create Short URL:** `POST /api/urls`
- **Get URLs:** `GET /api/urls`
- **Redirect:** `GET /:shortCode`

---

## 🎯 Testing Production API

### Test Register
```powershell
$body = @{
    email = "test@example.com"
    password = "Password123"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://url-shortner-production-945b.up.railway.app/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Test Login
```powershell
$body = @{
    email = "test@example.com"
    password = "Password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://url-shortner-production-945b.up.railway.app/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.data.token
Write-Host "Token: $token"
```

---

## 🆘 Jika Ada Masalah

### App tidak start
```powershell
# Check logs
railway logs

# Redeploy
railway up
```

### Database connection error
1. Pastikan PostgreSQL service running
2. Check `DATABASE_URL` variable ada
3. Restart app service di dashboard

### Migration failed
```powershell
# Check database connection
railway run node -e "require('dotenv').config(); const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL, ssl: {rejectUnauthorized: false}}); pool.query('SELECT NOW()', (e,r) => {console.log(e||r.rows[0]); pool.end()});"

# Retry migration
railway run npm run migrate
```

---

## 📞 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Dashboard: `railway open`

---

**Silakan lanjutkan dengan langkah-langkah di atas! 🚀**
