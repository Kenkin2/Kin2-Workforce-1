#!/bin/bash
set -e

echo "🔍 Running pre-deployment checks..."
echo ""

# 1. TypeScript check
echo "📝 Checking TypeScript compilation..."
if npm run check > /dev/null 2>&1; then
  echo "✅ TypeScript check passed"
else
  echo "❌ TypeScript errors found"
  npm run check
  exit 1
fi
echo ""

# 2. Run tests
echo "🧪 Running test suite..."
if npx vitest run > /dev/null 2>&1; then
  echo "✅ All tests passed"
else
  echo "❌ Test failures detected"
  npx vitest run --reporter=verbose
  exit 1
fi
echo ""

# 3. Security audit
echo "🔒 Running security audit..."
if npm audit --audit-level=moderate > /dev/null 2>&1; then
  echo "✅ No security vulnerabilities (moderate+)"
else
  echo "❌ Security vulnerabilities found"
  npm audit
  echo ""
  echo "Fix vulnerabilities before deploying: npm audit fix"
  exit 1
fi
echo ""

# 4. Schema check
echo "📊 Checking database schema drift..."
if npx drizzle-kit check > /dev/null 2>&1; then
  echo "✅ No schema drift detected"
else
  echo "❌ Schema drift detected - sync required"
  npx drizzle-kit check
  echo ""
  echo "Sync schema before deploying: npm run db:push"
  exit 1
fi
echo ""

echo "✅ Pre-deployment checks complete!"
echo "Ready to deploy 🚀"
