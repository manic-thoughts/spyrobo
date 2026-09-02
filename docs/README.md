# SPYROBO — Personal Jira Attention & Notification Assistant

## System Architecture

SPYROBO is a personal attention and visibility layer over Jira. It consumes Jira data, identifies issues relevant to the current user, evaluates deterministic attention rules (assignments, due dates, overdue items, missing required fields, status transitions), and presents a single prioritized dashboard instead of requiring the user to continuously monitor Jira.

### Architecture Overview
- **Next.js (App Router)**: Single repository full-stack framework.
- **Supabase PostgreSQL**: Managed database backend.
- **Prisma ORM**: Type-safe DB client & migrations.
- **Jira Cloud REST API v3**: Direct Jira REST endpoints.
- **Rule Engine**: Deterministic pure typescript rule evaluation.
- **Deduplication Engine**: Event key generation preventing duplicate notifications.

### Getting Started

#### 1. Prerequisites
- Node.js 18+
- PostgreSQL / Supabase connection string
- Jira Cloud account & API token

#### 2. Environment Variables (`.env`)
```env
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

JIRA_BASE_URL="https://your-domain.atlassian.net"
JIRA_EMAIL="your-email@example.com"
JIRA_API_TOKEN="your-jira-api-token"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 3. Setup & Migration
```bash
npm install
npx prisma db push
npm run dev
```
