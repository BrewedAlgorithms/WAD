# Docker setup

## Prereqs
- Docker 24+
- Docker Compose v2

## 1) Set env vars
Use the existing per-service env files:
- `backend/.env` (includes JWT, Mongo URI, Cloudinary, etc.)
- `microservices_python/.env` (includes `GEMINI_API_KEY` and other Python settings)

Compose will load those files automatically. You do not need a root `.env`.

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
