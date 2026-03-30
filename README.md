# Accommodation Discovery Platform

A microservices-based web application for discovering accommodations and dining spots.

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐
│   Frontend   │────▶│  API Gateway  │
│  React/Vite  │     │    (Nginx)    │
└─────────────┘     └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
    ┌──────────────┐ ┌───────────┐ ┌────────────────┐
    │ Core Service │ │AI Service │ │ Recommendation │
    │   (NestJS)   │ │ (FastAPI) │ │   (FastAPI)    │
    └──────┬───────┘ └─────┬─────┘ └───────┬────────┘
           │               │               │
           ▼               ▼               ▼
    ┌──────────────────────────────────────────┐
    │           MongoDB / PostgreSQL            │
    └──────────────────────────────────────────┘
```

## Tech Stack

| Layer          | Technology                     |
| -------------- | ------------------------------ |
| Frontend       | React (Vite) + TailwindCSS     |
| Core Service   | Node.js + NestJS               |
| AI Service     | Python + FastAPI               |
| Recommendation | Python + FastAPI               |
| Database       | MongoDB                        |
| Auth           | Firebase Auth                  |
| Maps           | OpenStreetMap (Leaflet)         |
| Gateway        | Nginx                          |
| Deployment     | Docker + Docker Compose        |

## Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd accommodation-discovery

# Copy environment files
cp .env.example .env
cp services/core-service/.env.example services/core-service/.env
cp services/ai-service/.env.example services/ai-service/.env
cp services/recommendation-service/.env.example services/recommendation-service/.env
cp services/frontend/.env.example services/frontend/.env

# Start all services
docker-compose up --build

# Or use Makefile
make dev
```

## Services

| Service              | Port | Description                          |
| -------------------- | ---- | ------------------------------------ |
| Frontend             | 3000 | React SPA                            |
| API Gateway          | 80   | Nginx reverse proxy                  |
| Core Service         | 3001 | User, Places, Reviews, Search        |
| AI Service           | 8000 | NLP parsing, intent extraction       |
| Recommendation       | 8001 | Ranking & recommendation engine      |
| MongoDB              | 27017| Database                             |

## Project Structure

```
accommodation-discovery/
├── services/                    # All microservices
│   ├── frontend/                # React + Vite + TailwindCSS
│   ├── core-service/            # NestJS backend
│   ├── ai-service/              # FastAPI NLP service
│   └── recommendation-service/  # FastAPI recommendation engine
├── gateway/                     # Nginx API Gateway
│   ├── Dockerfile
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf         # Reverse proxy routing rules
├── packages/                    # Shared code
│   └── shared/                  # Shared types & utilities
│       └── src/
│           ├── types/           # Shared TypeScript types
│           └── constants/       # Shared constants
├── infra/                       # Infrastructure scripts
│   └── scripts/
│       └── seed-db.sh           # DB init & seed script
├── docker-compose.yml           # Production orchestration
├── docker-compose.dev.yml       # Development overrides
├── Makefile                     # Convenience commands
├── .gitignore
└── .env.example                 # Environment template
```

## Development

```bash
# Start in dev mode (with hot reload)
make dev

# Stop all services
make down

# Rebuild a specific service
make rebuild service=core-service

# View logs
make logs service=ai-service

# Run tests
make test
```

## Contributing

1. Create a feature branch from `main`
2. Follow the naming convention: `feature/<service>/<description>`
3. Each service has its own test suite — run tests before committing
4. Submit a PR with clear description

## License

MIT
