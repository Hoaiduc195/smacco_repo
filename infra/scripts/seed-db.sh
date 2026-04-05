#!/bin/bash
# ============================================
# Initialize PostgreSQL with seed data
# ============================================

set -e

echo "Seeding PostgreSQL..."

psql "postgresql://postgres:postgres@postgres:5432/accommodation_db" -f /app/infra/scripts/seed-db.sql

echo "Seed data inserted successfully!"
