# CI/CD Pipeline for Kin2 Workforce Platform

## Overview
This document outlines the Continuous Integration and Continuous Deployment (CI/CD) workflow for the Kin2 Workforce Management Platform on Replit.

## Pipeline Stages

### 1. Pre-Deployment Checks

#### Code Quality Checks
```bash
# TypeScript compilation check
npm run check

# Run all tests
npx vitest run

# Run specific test suites
npx vitest run tests/server/api/
npx vitest run tests/server/storage.test.ts
```

#### Database Schema Drift Detection
```bash
# Check for schema drift between code and database
npx drizzle-kit check

# Generate migration if needed (manual review required)
npx drizzle-kit generate

# Push schema changes (development only)
npm run db:push
```

#### Security Scans
```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities (auto-fix)
npm audit fix

# Check for security issues (requires npm audit or similar)
npm audit --audit-level=moderate
```

### 2. Automated Testing

#### Test Execution Order
1. **Unit Tests** - Fast, isolated tests
2. **Integration Tests** - API endpoint tests
3. **Storage Tests** - Database operation tests

```bash
# Run all tests with coverage
npx vitest run --coverage

# Run tests in watch mode (development)
npx vitest watch

# Run specific test file
npx vitest run tests/server/api/modular-routers.test.ts
```

#### Test Coverage Goals
- **Critical Paths**: >80% coverage
- **Business Logic**: >70% coverage
- **API Endpoints**: >60% coverage
- **Overall**: >65% coverage

### 3. Deployment Workflow

#### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors (`npm run check`)
- [ ] No high/critical security vulnerabilities
- [ ] Database schema synchronized
- [ ] Environment variables configured
- [ ] Cache warming complete

#### Replit Deployment Steps
1. **Manual Trigger**: User clicks "Publish" in Replit UI
2. **Automatic Build**: `npm run build` compiles TypeScript
3. **Health Check**: System verifies `/health` endpoint
4. **Traffic Switch**: Replit routes traffic to new deployment
5. **Monitoring**: Track errors and performance metrics

#### Rollback Procedure
If deployment fails or issues detected:
1. Use Replit's rollback feature (checkpoints)
2. Restore to last known good state
3. Investigate logs via `refresh_all_logs`
4. Fix issues in development
5. Re-deploy after validation

### 4. Continuous Monitoring

#### Health Checks
```bash
# System health check
curl https://your-app.replit.app/api/system/health

# Database health
curl https://your-app.replit.app/api/system/status

# Performance metrics
curl https://your-app.replit.app/api/system/metrics
```

#### Log Monitoring
- **Error Logs**: Monitor for 5xx errors
- **Performance Logs**: Track slow queries (>100ms)
- **Security Logs**: Watch for auth failures
- **Business Metrics**: Track user activity

### 5. Schema Drift Prevention

#### Development Workflow
```bash
# 1. Make schema changes in shared/schema.ts
# 2. Check for drift
npx drizzle-kit check

# 3. Push to development database
npm run db:push

# 4. Test changes locally
npx vitest run tests/server/storage.test.ts

# 5. Commit schema changes
git add shared/schema.ts
git commit -m "feat: add new schema fields"
```

#### Schema Migration Best Practices
1. **Never change ID column types** (serial ↔ varchar)
2. **Add columns as nullable first**, then populate, then add constraint
3. **Use db:push --force only when safe** (development)
4. **Test migrations on copy of production data**
5. **Document breaking changes in commit message**

### 6. Environment-Specific Configurations

#### Development
- Hot module reloading enabled
- Debug logging enabled
- Mock external services
- Use development database
- Relaxed security for testing

#### Production (Published)
- Optimized builds
- Error logging only
- Real external services
- Production database
- Strict security policies
- HTTPS enforced

### 7. Automated Tasks

#### Daily Tasks
- Database backup (via Replit's automatic backups)
- Log rotation
- Cache cleanup
- Health check monitoring

#### Weekly Tasks
- Security vulnerability scan
- Dependency updates check
- Performance analysis
- Test coverage report

#### Monthly Tasks
- Disaster recovery drill
- Compliance audit
- Capacity planning review
- Technical debt assessment

## CI/CD Integration Scripts

### Pre-Deployment Script
Create `scripts/pre-deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🔍 Running pre-deployment checks..."

# 1. TypeScript check
echo "📝 Checking TypeScript..."
npm run check

# 2. Run tests
echo "🧪 Running tests..."
npx vitest run

# 3. Security audit
echo "🔒 Security audit..."
npm audit --audit-level=moderate

# 4. Schema check
echo "📊 Checking database schema..."
npx drizzle-kit check

echo "✅ All pre-deployment checks passed!"
```

### Schema Drift Checker
Create `scripts/check-schema-drift.sh`:
```bash
#!/bin/bash

# Check for schema drift
DRIFT=$(npx drizzle-kit check 2>&1)

if echo "$DRIFT" | grep -q "drift detected"; then
  echo "⚠️  Schema drift detected!"
  echo "$DRIFT"
  exit 1
else
  echo "✅ No schema drift"
  exit 0
fi
```

### Test Runner Script
Create `scripts/run-tests.sh`:
```bash
#!/bin/bash
set -e

echo "🧪 Running test suite..."

# Run all tests
npx vitest run --reporter=verbose

# Check coverage
npx vitest run --coverage

echo "✅ All tests passed!"
```

## Metrics and KPIs

### Deployment Metrics
- **Deployment Frequency**: Target 2-3x per week
- **Lead Time**: < 1 hour from commit to production
- **Mean Time to Recovery (MTTR)**: < 30 minutes
- **Change Failure Rate**: < 5%

### Quality Metrics
- **Test Pass Rate**: > 95%
- **Code Coverage**: > 65%
- **Bug Escape Rate**: < 2%
- **Performance SLA**: 99.5% uptime

## Troubleshooting

### Common Issues

#### Test Failures
1. Check test logs for specific failures
2. Verify database schema is synchronized
3. Check environment variables
4. Review recent code changes

#### Schema Drift
1. Run `npx drizzle-kit check` to identify drift
2. Review schema changes in `shared/schema.ts`
3. Push changes with `npm run db:push --force`
4. Verify in development before production

#### Deployment Failures
1. Check Replit deployment logs
2. Verify build command succeeds
3. Check health endpoint response
4. Review environment configuration

## Next Steps

### Planned Improvements
1. **Automated Deployment**: Trigger on git push to main branch
2. **Blue-Green Deployments**: Zero-downtime deployments
3. **Canary Releases**: Gradual traffic shifting
4. **A/B Testing**: Feature flag integration
5. **Performance Budgets**: Automated performance checks

### Integration Opportunities
- GitHub Actions (if moving from Replit)
- Monitoring tools (Sentry, DataDog)
- Code quality tools (SonarQube, CodeClimate)
- Security scanning (Snyk, npm audit)

## Resources

### Documentation
- [Replit Deployments](https://docs.replit.com/deployments)
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Vitest](https://vitest.dev/)

### Support
- Replit Support: support@replit.com
- Team Slack: #kin2-workforce-dev
- On-call: See PagerDuty rotation
