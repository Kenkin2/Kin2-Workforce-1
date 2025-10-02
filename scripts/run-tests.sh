#!/bin/bash
set -e

echo "🧪 Running Kin2 Workforce Test Suite..."
echo ""

# Run all tests with verbose output
echo "Running all tests..."
npx vitest run --reporter=verbose

echo ""
echo "✅ All tests passed!"
echo ""

# Optional: Run with coverage
if [ "$1" == "--coverage" ]; then
  echo "📊 Generating coverage report..."
  npx vitest run --coverage
  echo ""
  echo "Coverage report generated in coverage/"
fi
