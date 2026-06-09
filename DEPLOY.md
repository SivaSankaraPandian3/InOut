# Deploy Setup — INOUT

Automatic deploy uses **GitHub Actions**. One-time secret setup pannunga; apram `main` branch-ku push panna live update aagum.

## 1. Frontend → Hostinger (`InOut` repo)

### GitHub Secrets add pannunga

Repo: **https://github.com/ucattendance/InOut** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Value (Hostinger hPanel-la edukkunga) |
|--------|----------------------------------------|
| `FTP_SERVER` | FTP hostname (e.g. `ftp.inout.urbancode.tech` or `files000.hostinger.com`) |
| `FTP_USERNAME` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `FTP_SERVER_DIR` | Upload folder — usually `/public_html/` or `/domains/inout.urbancode.tech/public_html/` |

**FTP details:** hPanel → **Files** → **FTP Accounts** (or **Hosting** → **Manage** → **FTP Accounts**)

### Auto deploy

- `main` branch-ku push → build + FTP upload
- Manual: GitHub → **Actions** → **Deploy Frontend to Hostinger** → **Run workflow**

### Verify

- https://inout.urbancode.tech/deploy-check.html — green success message
- Sidebar-la **v2026.06.09** kaatum
- All Users-la **Branch** column + **Add User** button
- https://inout.urbancode.tech/api-docs — Swagger UI

---

## 2. Backend → Render (`InOut-backend` repo)

### Render Deploy Hook

1. [Render Dashboard](https://dashboard.render.com) → service `uc-attendance-system-1ts2`
2. **Settings** → **Deploy Hook** → copy URL

### GitHub Secret

Repo: **https://github.com/ucattendance/InOut-backend** → **Settings** → **Secrets** → add:

| Secret | Value |
|--------|--------|
| `RENDER_DEPLOY_HOOK` | Deploy hook URL from Render |

### Auto deploy

- `main` push → Render redeploy trigger
- Manual: **Actions** → **Deploy Backend to Render** → **Run workflow**

### Verify

- https://uc-attendance-system-1ts2.onrender.com/ping → `pong`
- https://uc-attendance-system-1ts2.onrender.com/api-docs → Swagger UI
- https://uc-attendance-system-1ts2.onrender.com/version → `{"build":"swagger-v1"}`

---

## 3. Local manual pack (backup)

```powershell
cd InOut
npm run build
npm run deploy:pack
```

Creates `InOut-deploy.zip` on Desktop for manual Hostinger upload.
