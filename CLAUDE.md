# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **FinanceHub**, a comprehensive personal finance management application built with a modern full-stack TypeScript architecture. The application provides features for tracking transactions, managing wallets, categorizing expenses, generating reports, and includes admin functionality.

## Architecture

### Full-Stack Structure
- **Frontend**: React 18 + TypeScript with Vite as build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with Passport.js
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack Query (React Query) for server state

### Key Directories
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files
- `scripts/` - Database and deployment scripts

### Database Schema
Core entities defined in `shared/schema.ts`:
- `users` - User accounts with subscription management
- `wallets` - Financial wallets with balances
- `categories` - Transaction categorization
- `transactions` - Financial transactions
- `paymentMethods` - Payment methods
- `apiTokens` - API token management
- `reminders` - Financial reminders

## Development Commands

### Core Development
```bash
# Development server (client + server)
npm run dev

# Type checking
npm run check

# Production build
npm run build

# Start production server
npm run start
```

### Database Operations
```bash
# Push database schema changes
npm run db:push

# Seed global data
npm run db:seed

# Run initial migration
npm run start:migration

# Run copy migration
npm run start:copy-migration
```

### Environment Setup
1. Copy `production.env.example` to `.env`
2. Configure `DATABASE_URL` for PostgreSQL connection
3. Set `SESSION_SECRET` for session management
4. Configure timezone: `TZ=America/Sao_Paulo`

## Key Technical Features

### Authentication & Authorization
- Session-based authentication with express-session
- User roles: normal, admin
- Subscription-based access control
- API token system with master tokens

### Financial Features
- Transaction management (income/expense)
- Wallet balance tracking
- Category-based organization
- Payment method tracking
- Financial reports and analytics
- Reminder system for recurring transactions

### UI/UX Features
- Dark/light theme support with auto-detection
- Responsive design with mobile support
- Radix UI component library
- Framer Motion animations
- Real-time notifications
- Unsaved changes protection

### Admin Features
- User management and impersonation
- Database administration
- System customization
- Analytics dashboard

## Development Patterns

### API Design
- RESTful API with Swagger documentation
- Consistent error handling
- Request/response logging
- Rate limiting support

### State Management
- TanStack Query for server state
- React hooks for local state
- Optimistic updates for better UX

### File Organization
- Feature-based page structure in `client/src/pages/`
- Reusable components in `client/src/components/`
- Shared utilities in `client/src/lib/`
- Custom hooks in `client/src/hooks/`

## Deployment

### Production Build Process
1. Client build: `npx vite build`
2. Server build: `npx esbuild server/index.ts`
3. Static files served from `dist/public/`

### Deployment Scripts
- `deploy-heroku.sh` - Heroku deployment
- `deploy-railway.sh` - Railway deployment
- `setup-production.js` - Production setup

## Important Notes

- Timezone is configured for São Paulo (America/Sao_Paulo)
- Database uses Portuguese table/column names
- Session storage uses memorystore with 7-day expiration
- File upload directories are auto-created at startup
- Setup wizard mode available for initial configuration

## Development Workflow

1. Start development server: `npm run dev`
2. Client runs on port 3000 with Vite dev server
3. Server runs on port 5000 with API proxy
4. Database changes: `npm run db:push`
5. Type checking: `npm run check`