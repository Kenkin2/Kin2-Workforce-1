#!/bin/bash
set -e

echo "🚀 Starting Kin2 Workforce Platform deployment..."

# Environment validation
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ SESSION_SECRET environment variable is required"
    exit 1
fi

# Build application
echo "📦 Building application..."
npm run build

# Database migration
echo "🗄️ Running database migrations..."
npm run db:push

# Health check
echo "🏥 Running health check..."
npm run test:health

# Start application
echo "✅ Starting application..."
npm start

echo "🎉 Deployment completed successfully!"