# Reanty Local

A Reanty homepage built from 10 reference images, with a FastAPI + MongoDB + MinIO data server.

The public pages — `index.html`, `login.html`, `signup.html` and `coming-soon.html` — are plain HTML and CSS with no JavaScript and relative paths only, so they also work when opened directly from disk. Styles live in `src/styles.css`; `src/interactions.css` provides the carousels, property filter, testimonial slider, mobile menu and dark mode using `:checked`, `:target` and `:has()`. Forms post straight to `./api/contact` and `./api/newsletter`; the API stores the data and redirects back to `#<form>-done` or `#<form>-error` on the same page.

`admin.html` is a separate JavaScript panel (bundled by Vite) for reading contact messages and newsletter subscribers and editing the stored content.

## Requirements

- Node.js 20.19+ or 22.12+, Python 3.11+, Docker Compose.
- Default ports: Vite `5173`, API `8000`, MongoDB `27017`, MinIO `9000`, MinIO Console `9001`.

## Running locally

1. Copy `.env.example` to `.env`. Replace `MONGO_ROOT_PASSWORD`, `MINIO_ROOT_PASSWORD`, `MINIO_SECRET_KEY` and `ADMIN_TOKEN`. `MINIO_SECRET_KEY` must equal `MINIO_ROOT_PASSWORD`; the Mongo password in `MONGO_URL` must equal `MONGO_ROOT_PASSWORD` (URL-encode it if it contains special characters).
2. From the project directory, run `docker compose up -d`.
3. Create a Python virtual environment and start the API:

   ```bash
   python -m venv .venv
   # Linux/macOS: source .venv/bin/activate
   # Windows PowerShell: .venv\Scripts\Activate.ps1
   pip install -r backend/requirements.txt
   cd backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Open a new terminal in the project directory:

   ```bash
   npm install
   npm run dev
   ```

5. Visit `http://localhost:5173` for the site and `http://localhost:5173/admin` for the admin panel; enter the `ADMIN_TOKEN` value from `.env`. API docs are at `http://localhost:8000/docs`; the MinIO Console is at `http://localhost:9001`.

On Windows CMD, copy the file with `copy .env.example .env` and activate Python with `.venv\Scripts\activate.bat`. Run `docker compose down` to stop the services; do not add `-v` if you want to keep your data.

## Configuration

| Variable | Purpose |
| --- | --- |
| `MONGO_URL`, `MONGO_DB` | MongoDB connection and database name |
| `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_SECURE` | Connection to the private media store |
| `ADMIN_TOKEN` | Bearer token for saving content, uploading media and reading messages |
| `ALLOWED_ORIGINS` | Origins allowed to call the API directly |
| `MAX_UPLOAD_MB` | Per-file size limit, 50 MB by default |
| `VITE_API_BASE` | API URL used by the browser, relative `./api` by default |
| `VITE_PROXY_TARGET` | Vite proxy target for `npm run dev`, `http://127.0.0.1:8000` by default |

Vite reads `VITE_` variables from `.env` at startup/build time. When the frontend and API are deployed on separate domains, set `VITE_API_BASE` to the full API URL and rebuild, and add the frontend domain to `ALLOWED_ORIGINS`. On a single domain, reverse-proxy `/api` to FastAPI.

## Data and administration

MongoDB creates these collections once the API starts:

| Collection | Contents |
| --- | --- |
| `site_settings` | A single `_id: homepage` document: branding, email, phone, address, content blocks and media IDs; a `version` field prevents overwriting newer changes |
| `media_assets` | File metadata, MIME type, size and MinIO object key |
| `contact_messages` | Messages from the contact form |
| `newsletter_subscriptions` | Newsletter emails; unique index on `email` |

In `/admin`: the **Content** tab edits each part of the page and assigns media IDs from a dropdown; the **Media** tab uploads JPEG/PNG/GIF/WebP/MP4/WebM files; the **Inbox** tab shows contact messages and newsletter subscribers. Files are proxied through the API, so the MinIO bucket does not need to be public. Media that is in use on the page cannot be deleted until it is unassigned and saved.

Main endpoints: `GET /api/site`, `POST /api/contact`, `POST /api/newsletter`, `GET/PUT /api/admin/site`, `GET/POST /api/admin/media`, `DELETE /api/admin/media/{id}`, `GET /api/media/{id}/file`, `GET /api/admin/messages`, `GET /api/admin/subscribers`.

## Build and test

```bash
npm run build
pip install -r backend/requirements-dev.txt
cd backend
python -m unittest discover -s tests -v
```

The frontend uses sample default content taken from the reference images; it does not contain any real client content or media. The reference images are only for comparing against the design and must not be embedded in the website. This is local source code; no connection to the Figma file is needed to run it.
