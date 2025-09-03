# Docker setup

## Prereqs
- Docker 24+
- Docker Compose v2

## 1) Set env vars
Create a `.env` at repo root (same folder as `docker-compose.yml`):

```
JWT_SECRET=change-me
GEMINI_API_KEY=your-key
# Optional Cloudinary
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
```

## 2) Build and run

```
docker compose up -d --build
```

Services:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3003
- Python service: http://localhost:5001
- MongoDB: localhost:27017

## 3) Common commands
- Stop: `docker compose down`
- View logs: `docker compose logs -f`
- Rebuild a service: `docker compose build backend && docker compose up -d backend`

## Notes
- Frontend proxies `/api` to backend internally via Nginx. In local compose, `VITE_API_URL` is not needed.
- Uploaded files and logs persist in named volumes.
