# Purple Housing Handoff

## Project Roots

- Local working project: `/home/barikhan/projects/purplehosting/pulled_project`
- Local convenience env path: `/home/barikhan/projects/purplehosting/.env`
- VPS project root: `/opt/purplehosting/Purple housing website/purplehousing`
- VPS Django app root: `/opt/purplehosting/Purple housing website/purplehousing/newProject`

## Read Order

For a new developer:

1. Read this file first
2. Then read [TECHNICAL_MANUAL.md](/home/barikhan/projects/purplehosting/pulled_project/TECHNICAL_MANUAL.md)

## Canonical `.env`

- Local canonical env file: [`/home/barikhan/projects/purplehosting/pulled_project/.env`](/home/barikhan/projects/purplehosting/pulled_project/.env)
- Local root [`/home/barikhan/projects/purplehosting/.env`](/home/barikhan/projects/purplehosting/.env) is a symlink to that file.
- Server canonical env file: `/opt/purplehosting/Purple housing website/purplehousing/.env`
- Server `/opt/purplehosting/Purple housing website/purplehousing/newProject/.env` is a symlink to `../.env`.

Edit the canonical project-root `.env` only.

## Deploy

From the VPS:

```bash
cd "/opt/purplehosting/Purple housing website/purplehousing"
docker compose -f docker-compose.prod.yml up -d --build web
```

Useful checks:

```bash
docker exec purplehousing-web-1 python /app/newProject/manage.py check
docker exec purplehousing-web-1 /bin/sh -lc 'cd /app/newProject && DJANGO_DEBUG=1 DB_ENGINE= DB_PASSWORD= python manage.py test frontend'
```

## Live Domains

- `https://purplehousing.com`

## Login / Dashboard

- Public dashboard login page: `/login/?next=/home/`
- Do not use Django admin login as the main dashboard login.
- `/admin/` is separate and requires Django staff/superuser accounts.

## Payments

### Stripe

- Live Stripe keys are now configured and authenticated successfully.
- Current flow uses Payment Intents and browser return confirmation.
- Missing item: `STRIPE_WEBHOOK_SECRET`
- Missing implementation: there is no Stripe webhook endpoint yet.

What this means:

- Card payments can work through the current return flow.
- There is no full server-to-server webhook confirmation path yet.
- Next developer should add a Stripe webhook endpoint before calling the payment integration fully complete.

### PayPal

- PayPal button uses REST Orders API redirect flow.
- Venmo uses a native PayPal JS SDK button / create-capture flow.
- Live PayPal credential auth passed.
- Flow:
  - create order server-side
  - redirect user to PayPal approval URL for the PayPal button
  - capture order on return to `/success/`
  - use dedicated SDK create/capture endpoints for the Venmo button

## Homepage / Frontend Notes

- Homepage body was rebuilt toward the supplied PDF / ZIP design.
- Reference files still in workspace root:
  - `Purple Housing New Changes(1).docx`
  - `purplehousing.zip`
- `purplehousing.zip` does not contain a usable property SQL dump.
- `purplehousing/newProject/db.sqlite3` inside the zip is present but `0` bytes.
- Property cards and public property details were improved.
- Dashboard blog editor currently uses CKEditor 4 standard.
- Live public blogs were refreshed to 3 professional posts via a repeatable management command.

## Media / Property Notes

- Property detail page supports:
  - gallery images
  - feature chips
  - YouTube embed
  - uploaded local video
  - attachment downloads
- Property media resolver was hardened to recover existing files even when DB media paths are stale.
- Live property inventory currently has `29` rows and is the active source of truth.
- Because the root zip has no usable property DB export, do not wipe or replace live properties unless the client provides a real SQL or MariaDB backup.

## Important Files

- Settings: [`newProject/settings.py`](/home/barikhan/projects/purplehosting/pulled_project/newProject/settings.py)
- URLs: [`frontend/urls.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/urls.py)
- Main views: [`frontend/views.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/views.py)
- Public base template: [`templates/base.html`](/home/barikhan/projects/purplehosting/pulled_project/templates/base.html)
- Home template: [`frontend/templates/frontend/home.html`](/home/barikhan/projects/purplehosting/pulled_project/frontend/templates/frontend/home.html)
- Property detail template: [`frontend/templates/frontend/property_details.html`](/home/barikhan/projects/purplehosting/pulled_project/frontend/templates/frontend/property_details.html)
- Applying template: [`frontend/templates/frontend/applying.html`](/home/barikhan/projects/purplehosting/pulled_project/frontend/templates/frontend/applying.html)
- Dashboard layout / CKEditor: [`frontend/templates/dashboard/layout.html`](/home/barikhan/projects/purplehosting/pulled_project/frontend/templates/dashboard/layout.html)
- Blog refresh command: [`frontend/management/commands/refresh_professional_blogs.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/management/commands/refresh_professional_blogs.py)
- Docker compose: [`docker-compose.prod.yml`](/home/barikhan/projects/purplehosting/pulled_project/docker-compose.prod.yml)
- Docker build: [`Dockerfile`](/home/barikhan/projects/purplehosting/pulled_project/Dockerfile)

## Environment / Security Notes

- `.env` files are excluded from the Docker build via [`.dockerignore`](/home/barikhan/projects/purplehosting/pulled_project/.dockerignore).
- The project no longer depends on `/app/.env` inside the container.
- Do not commit `.env`.
- Use [`.env.example`](/home/barikhan/projects/purplehosting/pulled_project/.env.example) as the schema reference only.

## Tests / Validation Last Run

- `python manage.py check` passed on live container
- `python manage.py test frontend` passed with 23 tests
- `https://purplehousing.com/` returned `200`
- Stripe auth check succeeded with live keys
- PayPal live OAuth token check succeeded
- Live blog inventory is now:
  - `How to Evaluate a Fort Worth Rental Home Before You Apply`
  - `A Professional Rental Application Checklist That Speeds Up Approval`
  - `Questions Students and Parents Should Settle Before Signing a Lease`

## Known Gaps For Next Developer

1. Add a Stripe webhook endpoint and store `STRIPE_WEBHOOK_SECRET`.
2. Keep all future env edits in the canonical project-root `.env` only.
3. If historical property data must be restored, request a real SQL or MariaDB dump first. The root backup zip does not contain a usable property database snapshot.
