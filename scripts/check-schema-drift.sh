#!/bin/bash

echo "📊 Checking for database schema drift..."
echo ""

# Check for schema drift
DRIFT_OUTPUT=$(npx drizzle-kit check 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ] || echo "$DRIFT_OUTPUT" | grep -qi "drift"; then
  echo "⚠️  Schema drift detected!"
  echo ""
  echo "$DRIFT_OUTPUT"
  echo ""
  echo "To fix schema drift:"
  echo "  1. Review changes in shared/schema.ts"
  echo "  2. Run 'npm run db:push' to sync schema"
  echo "  3. Or run 'npm run db:push --force' if push is blocked"
  echo ""
  exit 1
else
  echo "✅ No schema drift detected"
  echo "Schema is synchronized with database"
  exit 0
fi
