# Kin2 Workforce Management Platform

A comprehensive, enterprise-grade workforce management platform built with modern technologies and AI intelligence. Streamline your entire workforce lifecycle from job posting and scheduling to timesheet tracking, payment processing, and compliance reporting.

## 🚀 Features

### Core Workforce Management
- **Job Management** - Create, assign, and track job postings with intelligent matching
- **Scheduling** - AI-powered shift scheduling with availability optimization
- **Timesheet Tracking** - Real-time time tracking with approval workflows
- **Payment Processing** - Automated payments with Stripe integration
- **Learning Management** - Course system with completion tracking and certifications

### Enterprise Capabilities
- **Multi-Tenant Architecture** - Organization isolation with white-label branding
- **Advanced Security** - 2FA authentication, audit trails, role-based permissions
- **Business Intelligence** - Predictive analytics, custom reports, interactive dashboards
- **Workflow Automation** - Intelligent automation with conditional triggers
- **Mobile PWA** - Progressive web app with offline capabilities

### AI-Powered Features
- **Intelligent Job Matching** - AI-driven worker-to-job optimization
- **Predictive Analytics** - Demand forecasting and workforce planning
- **Automated Scheduling** - Smart scheduling based on availability and skills
- **Performance Insights** - AI-generated recommendations and insights
- **Conversational Assistant** - Context-aware AI assistant for workforce queries

### Integrations (15+)
- **Communication**: Microsoft Teams, Zoom, Slack
- **Productivity**: Google Workspace, Jira, Asana
- **Payments**: Stripe, PayPal, Square
- **CRM**: Salesforce, HubSpot
- **Accounting**: QuickBooks, Xero
- **Documents**: DocuSign
- **Notifications**: Twilio, email systems

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript and Vite
- **shadcn/ui** components built on Radix UI
- **Tailwind CSS** for styling and theming
- **TanStack Query** for state management
- **Wouter** for client-side routing

### Backend
- **Node.js** with Express.js REST API
- **TypeScript** with ESM modules
- **Drizzle ORM** with PostgreSQL
- **Replit Auth** with OpenID Connect
- **WebSocket** support for real-time features

### Database
- **PostgreSQL** with Neon serverless connection
- **Drizzle migrations** for schema management
- **Session storage** in PostgreSQL
- **Full-text search** capabilities

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database access
- Replit account for authentication

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd kin2-workforce
   npm install
   ```

2. **Set up environment variables**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Configure required variables:
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open `http://localhost:5000` in your browser
   - Click "Launch Application" to sign in with Replit Auth

## 📱 Mobile PWA Setup

The platform includes Progressive Web App capabilities:

1. **Install on Mobile**
   - Visit the site on mobile browser
   - Tap "Install" banner when prompted
   - Add to home screen for native app experience

2. **Offline Features**
   - Core functionality works offline
   - Data syncs when connection restored
   - Push notifications for important updates

3. **Mobile Navigation**
   - Bottom tab navigation for easy thumb access
   - Responsive design optimized for mobile screens
   - Touch-friendly interface elements

## 🏢 Multi-Tenant Configuration

### Organization Setup

1. **Create Organization**
   ```javascript
   POST /api/organizations
   {
     "name": "Your Company",
     "subdomain": "yourcompany",
     "plan": "enterprise"
   }
   ```

2. **Configure Branding**
   ```javascript
   PUT /api/organizations/{id}/branding
   {
     "primaryColor": "#3b82f6",
     "logo": "https://yourlogo.com/logo.png",
     "companyName": "Your Company Name"
   }
   ```

3. **Add Team Members**
   ```javascript
   POST /api/organizations/{id}/members
   {
     "userId": "user_id",
     "role": "admin",
     "permissions": ["*"]
   }
   ```

## 🔒 Security Configuration

### Two-Factor Authentication

1. **Enable 2FA for Admin Users**
   - Navigate to Settings > Security
   - Enable "Require 2FA for Admin Users"
   - Users will be prompted to set up 2FA on next login

2. **Backup Codes**
   - System generates 10 backup codes per user
   - Codes are single-use and displayed only once
   - Users should store codes securely

### Audit Logging

All user actions are automatically logged including:
- Login/logout events
- Data modifications
- Permission changes
- System configuration updates
- Failed access attempts

Access audit logs via: Settings > Security > Audit Logs

## 🔌 Integration Setup

### Stripe Payments

1. **Get API Keys**
   - Visit [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Copy Publishable Key (starts with `pk_`)
   - Copy Secret Key (starts with `sk_`)

2. **Configure Environment**
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```

### Microsoft Teams

1. **Register App in Azure AD**
   - Go to Azure Portal > App Registrations
   - Create new registration
   - Configure redirect URI: `https://yourdomain.com/api/integrations/teams/callback`

2. **Configure Permissions**
   - Add Microsoft Graph permissions
   - Grant admin consent
   - Copy Client ID and Client Secret

### Google Workspace

1. **Create Google Cloud Project**
   - Enable Google Workspace APIs
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs

2. **Set Up Integration**
   ```javascript
   POST /api/integrations/google-workspace/activate
   {
     "clientId": "your_client_id",
     "clientSecret": "your_client_secret",
     "refreshToken": "your_refresh_token"
   }
   ```

## 📊 Analytics & Reporting

### Built-in Reports
- **Workforce Utilization** - Worker availability and capacity analysis
- **Financial Performance** - Revenue tracking and payment analytics
- **Job Completion** - Success rates and timeline analysis
- **Skills Analysis** - Skill gaps and training recommendations

### Custom Reports
1. Navigate to Analytics > Reports
2. Click "Create Custom Report"
3. Select data sources and metrics
4. Configure filters and grouping
5. Save and schedule automated delivery

### AI Insights
- **Demand Forecasting** - Predict future workforce needs
- **Optimization Recommendations** - AI-generated improvement suggestions
- **Performance Trends** - Identify patterns and anomalies
- **Cost Analysis** - ROI calculations and cost optimization

## 🔧 Development

### Project Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages/routes
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Express.js backend
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── analytics.ts        # Analytics engine
│   ├── automation.ts       # Workflow automation
│   ├── security.ts         # Security management
│   └── multi-tenant.ts     # Multi-tenant functionality
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── public/                 # Static assets and PWA files
```

### Adding New Features

1. **Define Schema** (if database changes needed)
   ```typescript
   // shared/schema.ts
   export const newTable = pgTable('new_table', {
     id: varchar('id').primaryKey(),
     // ... other fields
   });
   ```

2. **Update Storage Interface**
   ```typescript
   // server/storage.ts
   interface IStorage {
     // Add new methods
     createNewEntity(data: NewEntityInsert): Promise<NewEntity>;
   }
   ```

3. **Add API Routes**
   ```typescript
   // server/routes.ts
   app.post('/api/new-entity', isAuthenticated, async (req, res) => {
     // Route implementation
   });
   ```

4. **Create Frontend Components**
   ```typescript
   // client/src/pages/new-feature.tsx
   export default function NewFeature() {
     // Component implementation
   }
   ```

### Database Migrations

```bash
# Apply schema changes
npm run db:push

# Force apply (destructive)
npm run db:push --force
```

## 🚀 Deployment

### Replit Deployment
1. Click "Deploy" in Replit interface
2. Configure custom domain (optional)
3. Set production environment variables
4. Deploy and monitor health

### Environment Variables (Production)
```bash
DATABASE_URL=your_production_database_url
SESSION_SECRET=secure_random_string
STRIPE_SECRET_KEY=your_production_stripe_key
VITE_STRIPE_PUBLIC_KEY=your_production_stripe_public_key
OPENAI_API_KEY=your_openai_api_key
```

## 📋 User Roles & Permissions

### Admin
- Full system access
- User management
- Organization settings
- Financial reports
- Security configuration

### Client
- Job creation and management
- Worker assignments
- Payment processing
- Performance reports
- Basic analytics

### Worker
- Job applications
- Timesheet submission
- Schedule viewing
- Learning modules
- Profile management

## 🆘 Support & Troubleshooting

### Common Issues

**Authentication Problems**
- Verify Replit Auth configuration
- Check session storage connectivity
- Confirm environment variables are set

**Database Connection Issues**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database exists and is accessible

**Integration Failures**
- Validate API credentials
- Check webhook configurations
- Review integration health dashboard

### Performance Monitoring
- Built-in performance metrics
- Real-time error tracking
- Automated health checks
- Detailed logging system

## 🔄 Backup & Recovery

### Automated Backups
- Daily database backups
- Configuration snapshots
- User data retention policies
- Disaster recovery procedures

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database
psql $DATABASE_URL < backup.sql
```

## 📞 Contact & Support

For technical support, feature requests, or enterprise inquiries:
- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs or feature requests
- **Enterprise Support**: Contact for dedicated support channels

---

**Built with ❤️ using React, TypeScript, and modern web technologies**