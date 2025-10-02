# Kin2 Workforce PR Bundle

Quick Start
```bash
cp .env.example .env
docker compose up -d --build
# API → http://localhost:8080
```

CI/CD is provided under `.github/workflows`. Health endpoints live at `src/routes/health.ts`.
