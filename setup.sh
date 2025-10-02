#!/bin/bash

echo "🚀 Setting up Kin2 Workforce Platform..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ Prerequisites met!"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo "🔧 Setting up environment files..."

if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
else
    echo "⚠️  apps/api/.env already exists"
fi

if [ ! -f "apps/web/.env" ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✅ Created apps/web/.env"
else
    echo "⚠️  apps/web/.env already exists"
fi

# Check if PostgreSQL is running
echo "🗄️  Checking database..."

if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "❌ PostgreSQL client not found. Please install PostgreSQL or use Docker:"
    echo "   docker run --name kin2-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15"
fi

# Setup database schema (if DATABASE_URL is configured)
if grep -q "postgresql://" apps/api/.env 2>/dev/null; then
    echo "🏗️  Setting up database schema..."
    cd apps/api
    npx prisma generate
    npx prisma db push
    echo "✅ Database schema created"
    cd ../..
else
    echo "⚠️  Please configure DATABASE_URL in apps/api/.env before running database setup"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your environment variables in apps/api/.env and apps/web/.env"
echo "2. Set up your database connection string"
echo "3. Configure Clerk authentication keys"
echo "4. Set up Stripe keys for payments"
echo ""
echo "🚀 Start development:"
echo "   pnpm dev"
echo ""
echo "🐳 Or use Docker:"
echo "   docker-compose up -d"
echo ""
echo "📖 View the full README.md for detailed instructions"