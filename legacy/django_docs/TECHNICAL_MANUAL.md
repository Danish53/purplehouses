# Purple Housing Technical Manual

## 1. Overview

This project is a Django application for a property rental site with:

- public marketing pages
- property browsing and detail pages
- a multi-step rental application flow
- booking / showing requests
- a custom dashboard for listings and blogs
- Stripe, PayPal, and Venmo-backed application fee flows

The live deployment uses Docker Compose with:

- one `web` service running Django + Gunicorn
- one MariaDB service
- Traefik as the reverse proxy outside this repo

## 2. Project Structure

Primary local root:

- `/home/barikhan/projects/purplehosting/pulled_project`

Key directories:

- `frontend/`
  Application models, views, urls, dashboard logic, public logic, tests
- `newProject/`
  Django project settings, ASGI, WSGI, root URLs
- `templates/`
  shared base templates
- `static/`
  project static source assets
- `media/`
  uploaded files and runtime media
- `blogs/`
  blog image assets from existing content

Key files:

- [`manage.py`](/home/barikhan/projects/purplehosting/pulled_project/manage.py)
- [`frontend/models.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/models.py)
- [`frontend/views.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/views.py)
- [`frontend/urls.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/urls.py)
- [`newProject/settings.py`](/home/barikhan/projects/purplehosting/pulled_project/newProject/settings.py)
- [`docker-compose.prod.yml`](/home/barikhan/projects/purplehosting/pulled_project/docker-compose.prod.yml)
- [`Dockerfile`](/home/barikhan/projects/purplehosting/pulled_project/Dockerfile)

## 3. Routing Layout

Root URL config:

- [`newProject/urls.py`](/home/barikhan/projects/purplehosting/pulled_project/newProject/urls.py)

Important public routes:

- `/`
- `/about/`
- `/contact/`
- `/booking/`
- `/properties/`
- `/property/<id>/`
- `/applying/`
- `/blog_show/`
- `/blog_detail/<id>/`
- `/success/`

Important dashboard routes:

- `/login/`
- `/logout/`
- `/home/`
- `/listning/`
- `/listning/add/`
- `/listning/<id>/edit/`
- `/blogs/`
- `/blogs/create/`
- `/blogs/<id>/edit/`
- `/blogs/upload-image/`

Security-sensitive routes:

- `/secure/photo-id/verify/<app_id>/`
- `/secure/photo-id/view/<app_id>/`
- `/secure/photo-id/file/<app_id>/`

## 4. Authentication Model

This project uses two different auth systems:

1. Django admin auth
   - Standard `/admin/`
   - Uses Django admin/staff accounts

2. Custom dashboard auth
   - Public dashboard login at `/login/?next=/home/`
   - Backed by `frontend.CustomUser`
   - Session key is `user_id`
   - Decorator: [`frontend/decorators.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/decorators.py)

Important note:

- The operational dashboard is not based on Django auth permissions.
- The custom dashboard relies on `CustomUser` and session checks only.

## 5. Core Data Model

Main models in [`frontend/models.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/models.py):

### `CustomUser`

- custom dashboard account
- stores hashed password manually with `make_password`
- not tied to Django `User`

### `Blog`

- cover image
- title
- description
- keywords
- image is converted to WebP on save

### `Booking`

- schedule-a-showing type record
- tracks status and optional reason

### `Property`

- main listing record
- stores:
  - title / description
  - category / purpose / pricing
  - map and address fields
  - features as JSON
  - gallery image paths as JSON
  - featured image index
  - attachment file paths as JSON
  - local video file path
  - YouTube URL
  - featured flag
  - login-required flag
  - disclaimer
  - status

### `Applying`

- full rental application record
- contains:
  - applicant identity
  - prior residence
  - occupants
  - pets
  - personal / vehicle / employer info
  - compliance questions
  - uploaded photo ID
  - billing info
  - payment state

### `Contact`

- basic contact form model

## 6. Media Model And Recovery Logic

Property media handling is more complex than a standard Django file field setup.

Why:

- older DB rows can contain stale media filenames
- the real files on disk may still exist with different names

Current solution:

- property media is normalized and resolved in [`frontend/views.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/views.py)
- helper functions:
  - normalize media paths
  - verify file existence
  - find fallback files by property ID prefix
  - build public URLs from recovered files

Result:

- property cards
- property detail pages
- dashboard edit pages

all try to recover usable existing files even if the DB points at dead paths.

This is an operational compatibility layer and should be preserved unless the media model is fully migrated.

## 7. Public Property Flow

The public property flow is:

1. Query approved / non-expired properties
2. Resolve real media files
3. Build gallery / attachment / video context
4. Render public cards and detail pages

Property detail currently supports:

- recovered image gallery
- feature chips
- related properties
- uploaded local video playback
- YouTube embed conversion
- downloadable attachments / floor plans

## 8. Application Fee Payment Flow

Payment logic lives in [`frontend/views.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/views.py).

### Stripe

Current status:

- live keys validated successfully
- browser-return flow works
- no webhook endpoint yet

Current flow:

1. User submits application with `payment_method=card`
2. Server creates Stripe Payment Intent
3. If Stripe needs additional action, client completes it
4. User returns to `/success/?payment_intent=<id>`
5. Server retrieves the intent and updates the `Applying` record

Important limitation:

- `STRIPE_WEBHOOK_SECRET` is still missing
- there is no Stripe webhook endpoint
- this means payment confirmation is not fully server-to-server hardened yet

### PayPal

Current status:

- validated against live credentials
- PayPal button uses REST Orders API redirect flow
- Venmo button uses PayPal JS SDK create/capture endpoints

Current flow:

1. Server creates PayPal order for the PayPal button
2. User is redirected to PayPal approval page
3. PayPal returns user to `/success/?token=<order_id>`
4. Server captures the order
5. `Applying.payment_status` is updated to `paid`

Venmo note:

- `/applying/` renders a native Venmo SDK button
- server-side endpoints exist to create and capture SDK orders
- this is separate from the plain PayPal redirect button

## 9. Blog Editing

Dashboard blog forms currently use CKEditor 4 standard.

Key points:

- editor is initialized in [`frontend/templates/dashboard/layout.html`](/home/barikhan/projects/purplehosting/pulled_project/frontend/templates/dashboard/layout.html)
- it supports basic rich text such as headings, emphasis, lists, links, blockquotes, and tables
- there is still a server-side image upload endpoint at `/blogs/upload-image/`, but the current dashboard template is not wired to a CKEditor 5 custom upload adapter anymore

Limitations:

- there is no full media library or asset browser
- if richer inline media tooling is needed later, the next developer should either wire the existing upload endpoint into the current editor or move back to a modern CKEditor 5 setup deliberately

Current live blog set:

- `How to Evaluate a Fort Worth Rental Home Before You Apply`
- `A Professional Rental Application Checklist That Speeds Up Approval`
- `Questions Students and Parents Should Settle Before Signing a Lease`

Repeatable refresh command:

- [`frontend/management/commands/refresh_professional_blogs.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/management/commands/refresh_professional_blogs.py)

## 10. Environment Design

Canonical local env file:

- [`pulled_project/.env`](/home/barikhan/projects/purplehosting/pulled_project/.env)

Convenience local path:

- [`/.env`](/home/barikhan/projects/purplehosting/.env)
  This is a symlink to `pulled_project/.env`

Canonical server env:

- `/opt/purplehosting/Purple housing website/purplehousing/.env`

Important behavior:

- settings now load only the project-root `.env`
- the old `/app/.env` fallback was removed
- `.env` files are excluded from image build by [`.dockerignore`](/home/barikhan/projects/purplehosting/pulled_project/.dockerignore)

Schema reference:

- [`.env.example`](/home/barikhan/projects/purplehosting/pulled_project/.env.example)

## 11. Deployment Architecture

Compose file:

- [`docker-compose.prod.yml`](/home/barikhan/projects/purplehosting/pulled_project/docker-compose.prod.yml)

Services:

- `web`
  - Django + Gunicorn
  - runs migrations and `collectstatic` on startup
- `db`
  - MariaDB 11.4

Proxy:

- Traefik labels are attached to the `web` service

Important domain behavior:

- `purplehousing.com` is live

## 12. Build And Deploy Commands

Local sanity checks:

```bash
python manage.py check
DJANGO_DEBUG=1 DB_ENGINE= DB_PASSWORD= python manage.py test frontend
```

VPS deploy:

```bash
cd "/opt/purplehosting/Purple housing website/purplehousing"
docker compose -f docker-compose.prod.yml up -d --build web
```

Live validation:

```bash
docker exec purplehousing-web-1 python /app/newProject/manage.py check
docker exec purplehousing-web-1 /bin/sh -lc 'cd /app/newProject && DJANGO_DEBUG=1 DB_ENGINE= DB_PASSWORD= python manage.py test frontend'
curl -I https://purplehousing.com/
```

## 13. Testing Strategy

Primary test file:

- [`frontend/tests.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/tests.py)

What is currently covered:

- PayPal REST order creation
- PayPal capture flow
- Stripe payment-intent success / requires-action handling
- success page payment finalization
- Venmo SDK order endpoints
- dashboard property creation rendering media publicly
- blog refresh / rich content rendering assumptions
- booking flow and booking status changes
- application photo-ID access protection

Current live test count:

- `23` frontend tests

Recommended next tests:

1. Contact form captcha validation
2. Dashboard login and access control
3. Property edit page media mutation behavior
4. Stripe webhook handling after it is added
5. Visual regression checks for the heavily customized public pages

## 14. Operational Gotchas

1. Dashboard auth is custom, not Django auth.
2. Property media may appear broken if helper recovery logic is removed.
3. The `Property` model uses `db_table = "Property"` with capital `P`, which can be a portability gotcha.
4. Recreating Compose services may also recreate the DB container, so watch rollout output carefully.
5. If hostnames disappear from `.env`, production can fail with `400 Bad Request` due to `ALLOWED_HOSTS`.
6. The current settings file force-adds required production hosts/origins as a safety net.
7. The project has historical naming inconsistencies such as `listning` in route names and templates. Do not rename casually without a full pass.
8. The root backup zip is not a reliable property-data restore source: it contains no `.sql` dump and its embedded `db.sqlite3` is `0` bytes.

## 15. Recommended Next Refactors

1. Replace `CustomUser` dashboard auth with Django auth or a proper permission layer.
2. Add Stripe webhook endpoint and configure `STRIPE_WEBHOOK_SECRET`.
3. Normalize property media into relational models instead of JSON path arrays.
4. Standardize naming such as `listing` vs `listning`.
5. Add structured docs for dashboard workflows and admin operations.
6. Obtain and archive a real MariaDB / SQL export for properties and applications so future handoffs are not forced to treat the live DB as the only valid source of truth.

## 16. Safe Handoff Starting Points

A new developer should read these in order:

1. [HANDOFF.md](/home/barikhan/projects/purplehosting/pulled_project/HANDOFF.md)
2. [TECHNICAL_MANUAL.md](/home/barikhan/projects/purplehosting/pulled_project/TECHNICAL_MANUAL.md)
3. [`newProject/settings.py`](/home/barikhan/projects/purplehosting/pulled_project/newProject/settings.py)
4. [`frontend/urls.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/urls.py)
5. [`frontend/views.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/views.py)
6. [`frontend/models.py`](/home/barikhan/projects/purplehosting/pulled_project/frontend/models.py)
