# Kin2 Workforce Management Platform

## Overview
Kin2 Workforce is a comprehensive, next-generation enterprise workforce management platform designed to streamline the entire workforce lifecycle. It offers features such as job posting, scheduling, timesheet tracking, payment processing, and compliance reporting. The platform includes role-based access (admin, client, worker), gamification, learning management, and integrated payment processing. It aims to provide a world-class solution with global scalability, AI-driven optimization, proactive management, and advanced security, making it suitable for various industries.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript and Vite
- **UI**: shadcn/ui (built on Radix UI) and Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation

### Backend
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript (ESM modules)
- **ORM**: Drizzle ORM (PostgreSQL dialect)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL

### Backend Architecture (October 2025 Improvements)
- **Modular Routers**: 5 domain-specific routers (50 routes total)
  - `server/routes/compliance.routes.ts` - Compliance domain (9 routes)
  - `server/routes/workforce.routes.ts` - Workforce domain (20 routes)
  - `server/routes/payments.routes.ts` - Payments & billing (13 routes)
  - `server/routes/analytics.routes.ts` - Analytics & reporting (4 routes)
  - `server/routes/system.routes.ts` - System health & metrics (4 routes)
- **Centralized Error Handling**: Typed error classes with asyncHandler wrapper
  - `server/middleware/error-handler.ts` - ValidationError, AuthorizationError, NotFoundError, etc.
  - All routes use asyncHandler (zero manual try-catch blocks)
  - Consistent 4xx/5xx error responses with structured logging
- **Intelligent Caching**: Domain-based caching with TTL strategies
  - `server/middleware/cache.ts` - cacheMiddleware with domain-specific TTLs
  - Cache domains: COMPLIANCE, WORKFORCE, PAYMENTS, ANALYTICS, SYSTEM
  - TTLs: LONG (10min), MEDIUM (5min), SHORT (2min), VERY_SHORT (30sec)
  - Cache invalidation on mutations for data consistency
- **Automated Testing**: Comprehensive test coverage with Vitest
  - `tests/server/api/modular-routers.test.ts` - 19 tests for all modular routers
  - `tests/setup.ts` - Test data factories and database utilities
  - Integration tests for compliance, workforce, payments, analytics, system routes
  - Cache behavior and error handling verification
- **Disaster Recovery**: Documented backup/restore procedures
  - `server/DISASTER-RECOVERY.md` - RPO/RTO targets, backup strategies
  - Database snapshots, object storage backups, business continuity plans
- **Documentation**: Comprehensive architectural guides
  - `server/ERROR-HANDLING.md` - Error handling patterns
  - `server/CACHE-STRATEGY.md` - Caching and invalidation strategies
  - `server/ARCHITECTURE-INTEGRATION.md` - Integration guide and migration checklist
- **Code Quality**: Legacy routes.ts reduced from 4,326 to 3,601 lines (725 lines of dead code removed)

### Database
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle migrations
- **Core Entities**: Users, Organizations, Jobs, Shifts, Timesheets, Payments, Courses, Activities

### Authentication & Authorization
- **Provider**: Replit Auth (OIDC)
- **Session Storage**: PostgreSQL-backed express sessions
- **Role-Based Access**: Admin, Client, Worker
- **Security**: HTTP-only secure cookies with CSRF protection

### Key Features
- **Job Management**: CRUD operations, status tracking
- **Scheduling**: Shift management, calendar integration
- **Timesheet System**: Time tracking, approval workflows
- **Payment Processing**: Stripe integration
- **Learning Management**: Course system, completion tracking
- **Gamification**: Karma coins system
- **Real-time Updates**: Activity feed
- **Marketing Automation**: Campaign management, email templates, social media scheduling, lead sources, analytics
- **Business Development**: Partnership tracking, market analysis, strategic planning, growth metrics
- **Enhanced CRM**: Unified customer relationship dashboard
- **Global Search**: Cmd+K search across jobs, workers, clients, timesheets with 300ms debounce and category-based results
- **Confirmation Dialogs**: Reusable dialog component for critical actions (timesheet approval/rejection, role updates, subscription cancellation) with loading state preservation

### Advanced Enterprise Features
- **Global Expansion**: Multi-language (25+), localization, international compliance, multi-currency payroll, time zone management.
- **AI-Powered Optimization**: Machine learning for workforce analytics, performance forecasting, smart scheduling, predictive analytics.
- **Intelligent Issue Detection & Resolution**: AI Resolution Center for detecting and managing workforce issues (understaffing, payment delays, compliance breaches, resource shortages) using rule-based evaluators and OpenAI integration, providing automated recommendations and action execution.
- **Mobile-First PWA**: Offline capabilities, push notifications, voice control, biometric authentication, location tracking, camera integration.
- **Blockchain Integration**: Multi-network support (Ethereum, Polygon, BSC, Solana), crypto payments, smart contracts, DeFi integration.
- **IoT Workplace Monitoring**: Device management (RFID, biometrics), environmental monitoring, safety systems, asset tracking, predictive maintenance, geofencing.
- **Real-Time Collaboration**: Video conferencing, voice control, document collaboration, instant messaging, live cursors, WebSocket integration.
- **Quantum Security**: Post-Quantum Cryptography, hybrid encryption, quantum threat monitoring, quantum-safe key management.
- **White-Label Platform**: Industry modules (healthcare, construction, retail), custom branding, multi-tenant architecture, custom domains.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **@neondatabase/serverless**: For connection pooling with WebSocket support.

### Authentication Services
- **Replit Auth**: OpenID Connect provider.
- **connect-pg-simple**: For PostgreSQL session storage.

### Payment Processing
- **Stripe**: Payment gateway.
    - **Frontend**: @stripe/stripe-js, @stripe/react-stripe-js
    - **Backend**: Stripe API

### AI Services
- **OpenAI**: GPT-4 for workforce analytics and chat assistance.
- **TensorFlow.js**: For client-side ML capabilities.

### UI Component Library
- **Radix UI**: Accessible React components.
- **shadcn/ui**: Pre-styled component system built on Radix.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Fast build tool.
- **TypeScript**: Type safety.
- **Tailwind CSS**: Utility-first CSS framework.