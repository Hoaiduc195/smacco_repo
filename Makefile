.PHONY: dev up down build rebuild logs test clean

# Start all services in development mode
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start all services in production mode
up:
	docker-compose up -d --build

# Stop all services
down:
	docker-compose down

# Build all images
build:
	docker-compose build

# Rebuild a specific service: make rebuild service=core-service
rebuild:
	docker-compose up -d --build $(service)

# View logs: make logs service=core-service
logs:
	docker-compose logs -f $(service)

# Run tests for all services
test:
	cd services/core-service && npm test
	cd services/ai-service && pytest
	cd services/recommendation-service && pytest

# Clean up containers, volumes, images
clean:
	docker-compose down -v --rmi local
