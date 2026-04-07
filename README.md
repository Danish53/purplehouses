# Purple Housing (Next.js App)

This folder contains the **Next.js** frontend/backend (App Router) for Purple Housing.

It uses a **MariaDB/MySQL** database (tables like `Property`, `blogs`, `booking`, `frontend_applying`, etc.).

## Prerequisites

- Node.js + npm
- MariaDB running (default `127.0.0.1:3306`)

## Environment

Create/update `purplehousing/.env.local`:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=purple
DB_USER=purple_app
DB_PASSWORD=your_password

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SESSION_SECRET=replace-with-a-64-char-random-hex-string
```

Notes:

- Do not commit `.env.local`.
- If the DB is empty / tables are missing, run Django migrations from `pulled_project/` (see below).

## Run (local dev)

```bash
cd purplehousing
npm install
npm run dev -- --port 3000
```

Open:

- http://localhost:3000

## Database schema (migrations)

The DB schema is managed by the Django project in `pulled_project/`.

To create/update tables:

```bash
cd pulled_project
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
```

## Data safety (backup/restore)

Before changing the DB, take a backup:

```bash
cd pulled_project
./scripts/db_backup.sh ./backup_before_change.sql
./scripts/db_verify.sh
```

Restore:

```bash
cd pulled_project
./scripts/db_restore.sh ./backup_before_change.sql
./scripts/db_verify.sh
```

More details: `pulled_project/MARIADB_MIGRATION.md`.

## Troubleshooting

- **DB access denied**: verify `DB_USER`/`DB_PASSWORD` in `purplehousing/.env.local` matches a real MariaDB user.
- **Port 3000 busy**: `npm run dev -- --port 3001`
- **Tables missing**: run Django migrations (see “Database schema”).
---

## VPS / Production

| Detail | Value |
|---|---|
| **Server IP** | `74.208.170.184` |
| **SSH user** | `root` |
| **SSH password** | `9gJhgAYY` |
| **App directory** | `/var/www/purplehousing` |
| **PM2 process** | `purplehousing` (id 0) |
| **Port** | `3005` |
| **DB user** | `ph_next` |
| **DB password** | `914e1e5d7dc6d247cf6286189ddf4774c3cf22ab0520bf8e` |
| **DB name** | `purplehousing` |

### Admin credentials

| Detail | Value |
|---|---|
| **Username** | `admin` |
| **Password** | `Admin@1234` |
| **Password hash (bcrypt)** | `$2a$12$Qlriy1vFQI7EZZYUG/JfN.GhO4Bft9kPOw55NB9l3NVeMozj.O9ka` |

### Deploy commands

```bash
# 1. Build locally
cd "/Users/mawans/Downloads/purplehosting new/purplehousing"
npm run build

# 2. Sync to VPS
sshpass -p '9gJhgAYY' rsync -avz \
  --exclude 'node_modules' --exclude '.next' \
  --exclude '.env.local' --exclude '.env' \
  --exclude 'public/media' \
  "/Users/mawans/Downloads/purplehosting new/purplehousing/" \
  root@74.208.170.184:/var/www/purplehousing/

# 3. Build & restart on VPS
sshpass -p '9gJhgAYY' ssh -o StrictHostKeyChecking=no root@74.208.170.184 \
  "cd /var/www/purplehousing && npm run build && pm2 restart purplehousing"
```

### Property images on the live server

Photos are saved under `public/media/` (for example `public/media/property_images/`). That path is **gitignored** and the sample deploy command above **excludes `public/media/`**, so the server only has what you copy there.

- **Database vs files**: Rows in MySQL store paths like `property_images/123_photo.jpg`. If you import the DB but never copy the files, browsers request `/media/property_images/...` and get **404** — thumbnails look broken.
- **Fix**: Copy media to the VPS after deploy (from the machine that has the files), for example:

  `rsync -avz ./public/media/ user@your-server:/var/www/purplehousing/public/media/`

- **New uploads from the dashboard** need a writable folder on the server: `mkdir -p public/media/property_images` (and correct owner/permissions for the user running Node/PM2).
- **Serverless hosts** (e.g. some Next.js clouds): the filesystem is often read-only or wiped on redeploy — use object storage (S3, R2, etc.) for uploads instead of local disk.

# purplehousing
