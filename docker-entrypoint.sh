#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding default tags..."
node scripts/seed-tags.cjs

echo "Starting application..."
exec npm start
