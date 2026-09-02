# SPYROBO — Personal Jira Attention & Notification Assistant
## Full Architecture & Implementation Plan

SPYROBO is a personal attention and visibility layer over Jira. It consumes Jira data, identifies issues relevant to the current user, evaluates deterministic attention rules (assignments, due dates, overdue items, missing required fields, status transitions), and presents a single, beautifully designed actionable dashboard with an integrated notification center.

---

## Technical Stack & Architecture

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router, Server Actions, API Routes) | Full-stack TypeScript environment combining server API routes and client UI in a single unified codebase. |
| **Styling & UI** | Tailwind CSS + Lucide Icons + Custom Modern Design System | Rich dark mode glassmorphism UI with vibrant HSL accent colors, micro-animations, and responsive cards. |
| **Database** | Supabase PostgreSQL | Managed cloud PostgreSQL database with low latency and free-tier compatibility. |
| **ORM** | Prisma ORM | Type-safe database client, declarative schema management, and automated SQL migrations. |
| **Jira Integration** | Jira Cloud REST API v3 | Primary source of truth integration using basic auth (dev) / OAuth 2.0 (production ready). |
| **Deployment Target** | Vercel | Seamless deployment for Next.js and Supabase database integration. |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SPYROBO Dashboard                             │
│                  (Next.js App Router Client Components)                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / Server Actions
┌────────────────────────────────────▼────────────────────────────────────┐
│                       Server Application Layer                          │
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│ │  Auth / User   │ │  Jira Service  │ │  Sync Engine   │ │ Rule Engine │ │
│ └────────────────┘ └────────────────┘ └────────────────┘ └─────────────┘ │
└────────┬───────────────────────────┬──────────────────────────┬─────────┘
         │                           │                          │
         ▼                           ▼                          ▼
┌──────────────────┐       ┌────────────────────┐     ┌───────────────────┐
│ External System: │       │   Database Layer   │     │ Notification      │
│  Jira REST API   │       │ Supabase Postgres  │     │ Engine & Dedupe   │
└──────────────────┘       └────────────────────┘     └───────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> **Jira API Access Strategy:** For local development, SPYROBO will support direct Jira Server/Cloud API Token authentication (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`). This allows instant sync without setup overhead, while keeping the client abstraction completely decoupled so Atlassian OAuth 2.0 (3LO) can be toggled via configuration.

> [!NOTE]
> **Jira Custom Field Mapping:** Jira projects often use custom field IDs (e.g., `customfield_10015` for Story Points or Acceptance Criteria). SPYROBO will include an automatic custom field detector during initial sync to map standard custom fields dynamically.

---

## Proposed Changes

We will build the entire application inside `d:/BroCamp/Group-Project/spyrobo`.

### Project Structure Blueprint

```
spyrobo/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                           # Redirects to /dashboard
│   ├── globals.css                        # Design system tokens & utility classes
│   ├── dashboard/
│   │   └── page.tsx                       # Main Attention Dashboard
│   ├── notifications/
│   │   └── page.tsx                       # Complete Notification History & Filters
│   ├── issues/
│   │   └── page.tsx                       # My Issues View (Assigned / Reported)
│   ├── settings/
│   │   └── page.tsx                       # Jira Credentials & Required Fields Config
│   └── api/
│       ├── jira/
│       │   ├── connect/route.ts           # Test Jira connection & identity
│       │   └── sync/route.ts              # Trigger manual or cron sync
│       ├── dashboard/
│       │   └── summary/route.ts           # Overview metrics & attention items
│       ├── issues/route.ts                # Query synced local issues
│       └── notifications/
│           ├── route.ts                   # Fetch notifications
│           ├── [id]/read/route.ts         # Mark single notification as read
│           └── read-all/route.ts          # Mark all notifications as read
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                    # Main navigation sidebar
│   │   └── Header.tsx                     # User header, sync pill, notification bell
│   ├── dashboard/
│   │   ├── MetricCard.tsx                 # Attention metric counters
│   │   ├── AttentionList.tsx              # High-priority issue list
│   │   ├── QuickSyncButton.tsx            # Interactive Sync Now widget with status
│   │   └── ActivityFeed.tsx               # Recent notification stream
│   ├── notifications/
│   │   ├── NotificationItem.tsx           # Individual alert card with read toggle
│   │   └── NotificationFilters.tsx        # Filter by severity/type/read state
│   ├── issues/
│   │   └── IssueTable.tsx                 # Detailed issues list with filters & badges
│   └── ui/                                # Base glassmorphism cards, badges, buttons
├── lib/
│   ├── db/
│   │   └── prisma.ts                      # Prisma client singleton
│   ├── jira/
│   │   ├── client.ts                      # Axios/Fetch wrapper for Jira REST API v3
│   │   ├── types.ts                       # Jira API payload type definitions
│   │   └── normalizer.ts                  # Raw Jira response -> normalized schema
│   ├── rules/
│   │   ├── types.ts                       # Rule input/output interfaces
│   │   ├── assigned.ts                    # New assignment evaluation
│   │   ├── due-today.ts                   # Due today evaluation
│   │   ├── due-soon.ts                    # Due soon evaluation
│   │   ├── overdue.ts                     # Overdue evaluation (skips DONE)
│   │   ├── missing-fields.ts              # Grouped required fields quality validator
│   │   ├── status-change.ts               # Status transition detector
│   │   └── engine.ts                      # Unified rule execution engine
│   └── sync/
│       └── sync-service.ts                # Main orchestration pipeline
├── prisma/
│   └── schema.prisma                      # Full PostgreSQL database schema
└── docs/
    └── README.md                          # Architecture & setup guide
```

---

### Component Breakdown

#### Database & Schema (`prisma/schema.prisma`)

#### [NEW] [schema.prisma](file:///d:/BroCamp/Group-Project/spyrobo/prisma/schema.prisma)

Database tables with explicit constraints and indexes:
1. `User`: Maps local application user to Jira `jiraAccountId`.
2. `JiraIssue`: Stores normalized snapshots of issues where user is assignee or reporter.
3. `Notification`: Stores notifications generated by the Rule Engine with unique `eventKey` for strict deduplication.
4. `SyncState`: Tracks last sync timestamp, status, and error messages.
5. `NotificationPreference`: Stores user-configurable rules parameters (e.g. `dueSoonDays`, required field list).

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Priority {
  HIGH
  MEDIUM
  LOW
  INFO
}

enum NotificationType {
  ASSIGNED
  DUE_TODAY
  DUE_SOON
  OVERDUE
  MISSING_FIELDS
  STATUS_CHANGE
}

enum NotificationSeverity {
  HIGH
  MEDIUM
  LOW
  INFO
}

model User {
  id            String   @id @default(cuid())
  jiraAccountId String   @unique
  displayName   String
  email         String
  jiraSite      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  issuesAssigned  JiraIssue[]              @relation("AssignedIssues")
  issuesReported  JiraIssue[]              @relation("ReportedIssues")
  notifications   Notification[]
  syncState       SyncState?
  preferences     NotificationPreference?
}

model JiraIssue {
  id                  String       @id @default(cuid())
  jiraId              String       @unique
  issueKey            String       @unique
  projectKey          String
  summary             String
  description         String?
  status              String
  statusCategory      String       // TODO, IN_PROGRESS, DONE
  priority            String
  assigneeId          String?
  reporterId          String?
  startDate           DateTime?
  dueDate             DateTime?
  labels              String[]     @default([])
  storyPoints         Float?
  sprint              String?
  acceptanceCriteria  String?
  jiraUrl             String
  updatedAt           DateTime
  syncedAt            DateTime     @default(now())

  assignee            User?        @relation("AssignedIssues", fields: [assigneeId], references: [jiraAccountId])
  reporter            User?        @relation("ReportedIssues", fields: [reporterId], references: [jiraAccountId])
  notifications       Notification[]

  @@index([assigneeId])
  @@index([reporterId])
  @@index([dueDate])
  @@index([statusCategory])
}

model Notification {
  id        String               @id @default(cuid())
  userId    String
  issueId   String
  type      NotificationType
  severity  NotificationSeverity
  title     String
  message   String
  eventKey  String               @unique // e.g., "userId:issueId:OVERDUE:2026-09-02"
  readAt    DateTime?
  createdAt DateTime             @default(now())

  user      User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  issue     JiraIssue            @relation(fields: [issueId], references: [id], onDelete: Cascade)

  @@index([userId, readAt])
  @@index([userId, createdAt])
  @@index([type])
}

model SyncState {
  id            String    @id @default(cuid())
  userId        String    @unique
  lastSyncAt    DateTime?
  lastSuccessAt DateTime?
  lastError     String?
  issueCount    Int       @default(0)

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model NotificationPreference {
  id             String   @id @default(cuid())
  userId         String   @unique
  dueSoonDays    Int      @default(3)
  requiredFields String[] @default(["description", "assignee", "startDate", "dueDate", "labels", "storyPoints", "priority", "sprint", "acceptanceCriteria"])
  quietHours     Boolean  @default(false)

  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

#### Jira Service Module (`lib/jira/`)

#### [NEW] [client.ts](file:///d:/BroCamp/Group-Project/spyrobo/lib/jira/client.ts)
#### [NEW] [normalizer.ts](file:///d:/BroCamp/Group-Project/spyrobo/lib/jira/normalizer.ts)
#### [NEW] [types.ts](file:///d:/BroCamp/Group-Project/spyrobo/lib/jira/types.ts)

- **Auth support:** Basic Auth header with base64 encoded `email:api_token` for development MVP.
- **JQL query construction:** `assignee = currentUser() OR reporter = currentUser()` to fetch only personal issue universe.
- **Changelog fetching:** Supports historical verification of status changes and assignments.

---

#### Rule Engine (`lib/rules/`)

Deterministic rules run against normalized issue snapshots. Each rule is pure and returns null or a notification candidate.

| Rule | Trigger Condition | Severity | Grouped / Deduplication Key Format |
| :--- | :--- | :--- | :--- |
| `OVERDUE` | `dueDate < today` AND `statusCategory !== 'DONE'` | **HIGH** | `${userId}:${issueId}:OVERDUE:${dueDateStr}` |
| `DUE_TODAY` | `dueDate === today` AND `statusCategory !== 'DONE'` | **HIGH** | `${userId}:${issueId}:DUE_TODAY:${todayStr}` |
| `DUE_SOON` | `dueDate > today` AND `dueDate <= today + N days` AND `statusCategory !== 'DONE'` | **MEDIUM** | `${userId}:${issueId}:DUE_SOON:${dueDateStr}` |
| `ASSIGNED` | Current user is assignee AND recently assigned | **MEDIUM** | `${userId}:${issueId}:ASSIGNED:${assigneeId}` |
| `MISSING_FIELDS` | Relevant issue is missing 1+ configured required fields | **MEDIUM** | `${userId}:${issueId}:MISSING_FIELDS:${missingFieldsHash}` |
| `STATUS_CHANGE` | Issue status changed since last snapshot | **LOW** | `${userId}:${issueId}:STATUS_CHANGE:${newStatus}` |

> [!IMPORTANT]
> **Grouped Missing Fields Rule:** If an issue is missing `dueDate`, `storyPoints`, and `labels`, the rule evaluates all missing fields into **a single notification message**:
> *"PROJ-145 is missing required fields: Due Date, Story Points, Labels"* instead of generating 3 separate notifications.

---

#### Synchronization Pipeline (`lib/sync/sync-service.ts`)

#### [NEW] [sync-service.ts](file:///d:/BroCamp/Group-Project/spyrobo/lib/sync/sync-service.ts)

Execution Flow:
1. Verify user Jira connection.
2. Query Jira Cloud API for issues matching `assignee = currentUser() OR reporter = currentUser()`.
3. Fetch issue changelogs where status/assignee context is required.
4. Perform atomic bulk `upsert` into `JiraIssue` table using `jiraId` as key.
5. Pass normalized issues and prior state to `RuleEngine`.
6. Batch insert generated notification candidates using `skipDuplicates` or `ON CONFLICT (eventKey) DO NOTHING`.
7. Update `SyncState` record with timestamp and success/error status.

---

#### UI & Dashboard Design (`app/`, `components/`)

- **Color Palette & Visuals:** Deep slate/navy dark mode canvas (`#0f172a`), translucent glass cards (`backdrop-blur-md bg-white/5 border border-white/10`), vibrant HSL status colors:
  - Overdue: Rose Red (`#f43f5e`)
  - Due Today: Amber Orange (`#f59e0b`)
  - Missing Fields: Cyan/Violet (`#8b5cf6`)
  - New Assignment: Emerald Green (`#10b981`)
- **Dashboard Sections (`/dashboard`):**
  - **Header:** Welcome message, active sync status timer, manual "Sync Now" button with spinner state.
  - **Attention Metric Row:** 4 interactive metric cards (Overdue, Due Soon, Incomplete Quality, New Assignments) with click-to-filter capabilities.
  - **Action Needed Stream:** Prioritized cards of tickets needing urgent user action, with clear explanation ("2 days overdue", "Missing 3 required fields"), field tags, and direct `[Open in Jira ↗]` links.
  - **Recent Activity Feed:** Feed of latest status changes and notifications.
- **Notification Center (`/notifications`):**
  - Filterable by type (Overdue, Due Soon, Quality, Assignments) and state (Unread, All).
  - Individual "Mark Read" button & global "Mark All as Read" header action.

---

## Verification Plan

### Automated Tests Setup

We will create unit tests in `tests/` using Node test runner / Vitest for rule engine deterministic logic and deduplication key generation.

#### 1. Rule Engine Unit Tests (`tests/rules.test.ts`)
- **Overdue Rule Test:**
  - Given an unresolved issue with due date 1 day in the past, verify it generates `OVERDUE` high-priority notification.
  - Given a **completed** (`DONE`) issue with due date 1 day in the past, verify it returns `null` (no overdue notification).
- **Due Today / Soon Tests:**
  - Given an issue due today, verify `DUE_TODAY` output.
  - Given an issue due in 2 days, verify `DUE_SOON` output with default 3-day threshold.
- **Missing Fields Grouping Test:**
  - Given an issue missing `description`, `dueDate`, and `storyPoints`, verify exactly **1 notification** is produced listing all three fields in the text payload.
- **Deduplication Key Test:**
  - Verify that running the rule engine twice on the same issue produces identical `eventKey` strings.

#### 2. Synchronization & DB Upsert Test (`tests/sync.test.ts`)
- Mock Jira API response.
- Run `syncService.syncUser(userId)`.
- Re-run `syncService.syncUser(userId)` with unchanged data.
- Verify `Notification` count in DB does not increase (0 duplicates created).

### Manual Verification Flow

1. **Jira Integration Setup:**
   - Configure `.env.local` with valid Jira site URL, user email, and API token.
   - Run `/api/jira/connect` to verify user profile response and mapping.
2. **Sync Execution:**
   - Trigger "Sync Now" on the dashboard UI.
   - Observe progress indicator, count of synced issues, and timestamp update.
3. **Dashboard & Notification Inspection:**
   - Verify metric cards reflect real Jira ticket stats.
   - Verify "Open in Jira ↗" opens the target issue key URL in a new browser tab.
   - Click "Mark Read" on a notification and confirm unread counter decrements in real time.

---

## 24-Hour Execution Milestones

```
[Phase 1: 0-3h] Bootstrap Next.js, Tailwind, Prisma schema & Supabase DB connection
       │
[Phase 2: 3-6h] Jira REST API service client, data normalizer & issue fetching
       │
[Phase 3: 6-10h] Rule Engine implementation (Overdue, Due Soon, Quality, Assignment) & Unit Tests
       │
[Phase 4: 10-14h] Sync Pipeline & Event Key Deduplication persistence engine
       │
[Phase 5: 14-19h] Premium Glassmorphism Dashboard, Notification Center & Filters UI
       │
[Phase 6: 19-22h] Integration testing, edge-case validation & Manual Sync controls
       │
[Phase 7: 22-24h] Final verification, deployment preparation & documentation
```
