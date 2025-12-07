# Railway Deployment Guide

## 🚂 Setup Railway Project

### Step 1: Create New Project
1. Login ke https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose repository: `sabiliwafa29/url-shortner`

### Step 2: Add Database Services

#### Add PostgreSQL
1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway akan auto-generate variables:
   - `DATABASE_URL`
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

#### Add Redis
1. Click "New" → "Database" → "Add Redis"
2. Railway akan auto-generate:
   - `REDIS_URL`
   - `REDIS_PRIVATE_URL`

### Step 3: Configure Application Variables

Masuk ke **App Service** → **Variables** tab, tambahkan:

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=[PASTE_GENERATED_SECRET_HERE]
JWT_EXPIRE=7d
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Generate JWT Secret

Di terminal lokal, jalankan:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy hasilnya dan paste ke `JWT_SECRET` variable di Railway.

### Step 5: Add Service References

Tambahkan variables untuk reference ke database services:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

*(Ganti "Postgres" dan "Redis" dengan nama actual service Anda)*

### Step 6: Deploy

Railway akan otomatis deploy setelah push ke GitHub.

### Step 7: Run Database Migrations

#### Option A: Via Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run migrate

# Optional: Seed database
railway run npm run seed
```

#### Option B: Via Railway Dashboard
1. Go to App Service → Settings
2. Add "Deploy Command":
   ```bash
   npm install && npm run migrate && npm start
   ```

Or create a startup script.

---

## 🔧 Troubleshooting

### Error: "SASL: client password must be a string"

**Cause:** Environment variables tidak ter-load dengan benar.

**Solution:**
1. Pastikan PostgreSQL service sudah running
2. Pastikan app service sudah link ke PostgreSQL service
3. Check Variables tab - pastikan `DATABASE_URL` ada dan ter-populate
4. Restart service

### Error: "Connection timeout"

**Cause:** Database belum ready atau network issue.

**Solution:**
1. Check PostgreSQL service status (harus "Active")
2. Wait 1-2 menit setelah create database
3. Restart app service

### Error: "Redis connection refused"

**Cause:** Redis belum ready atau tidak ter-configure.

**Solution:**
1. Check Redis service status
2. Pastikan `REDIS_URL` variable ada
3. App tetap bisa jalan tanpa Redis (dengan warning)

---

## 📋 Environment Variables Checklist

### ✅ Manual Input (Harus Anda Set)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`
- [ ] `JWT_SECRET=[generated]`
- [ ] `JWT_EXPIRE=7d`
- [ ] `CORS_ORIGIN=*`
- [ ] `RATE_LIMIT_WINDOW=15`
- [ ] `RATE_LIMIT_MAX_REQUESTS=100`

### ✅ Auto-Generated (Railway Inject Otomatis)
- [ ] `DATABASE_URL` - Dari PostgreSQL service
- [ ] `REDIS_URL` - Dari Redis service
- [ ] `RAILWAY_PUBLIC_DOMAIN` - Auto dari Railway
- [ ] `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

---

## 🎯 Quick Setup Commands

```bash
# 1. Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Install Railway CLI
npm install -g @railway/cli

# 3. Login & Link
railway login
railway link

# 4. Run migrations
railway run npm run migrate

# 5. Optional: Seed data
railway run npm run seed

# 6. Check logs
railway logs

# 7. Open app
railway open
```

---

## 🌐 Accessing Your App

After deployment:
- **API:** `https://your-app.up.railway.app`
- **Health Check:** `https://your-app.up.railway.app/health`
- **API Docs:** `https://your-app.up.railway.app/api-docs`

---

## 📝 Post-Deployment

1. Test health endpoint
2. Test register endpoint
3. Test create short URL
4. Monitor logs for errors
5. Setup custom domain (optional)

---

## 💡 Tips

- Railway auto-redeploys on git push
- Use `railway logs -f` to follow live logs
- Environment variables changes require redeploy
- Database backups available in Railway dashboard
- Use Railway CLI for quick debugging

---

Need help? Check Railway docs: https://docs.railway.app
