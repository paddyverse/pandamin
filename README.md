# PandaDash — GHL Agency Command Center

A Next.js 14 dashboard for GoHighLevel (GHL) agency owners to manage subaccounts, SaaS plans, and rebilling — embedded directly inside GHL via Custom Menu Link (iframe).

## Features

- **Subaccount Management** — Create, update, delete, and bulk-manage GHL locations
- **SaaS Plans** — View plan distribution, assign plans to accounts, bulk-enable SaaS
- **Rebilling** — Monitor and toggle rebilling status per account
- **Command Palette** — Cmd+K global search across accounts and plans
- **Real-time Updates** — TanStack Query with optimistic updates + Sonner toast notifications

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GHL_PRIVATE_TOKEN` | ✅ | GHL Private Integration Token (server-only, never exposed to browser) |
| `GHL_COMPANY_ID` | ✅ | Your GHL Agency Company ID |
| `NEXT_PUBLIC_APP_URL` | Optional | Public URL of deployed app |

> **Security**: `GHL_PRIVATE_TOKEN` is never sent to the client. All GHL API calls are proxied through Next.js server-side API routes.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your GHL_PRIVATE_TOKEN and GHL_COMPANY_ID

# 3. Start dev server
npm run dev

# Open: http://localhost:3000/dashboard
```

### Simulating GHL iframe params locally

```
http://localhost:3000/dashboard?location_id=abc123&user_fname=John&user_lname=Doe
```

---

## Production Deployment (DigitalOcean App Platform)

### Via DigitalOcean dashboard

1. Create a new App from your GitHub repo
2. Select **Node.js** environment
3. Set build command: `npm run build` | run command: `npm run start`
4. Add **Secret** env vars: `GHL_PRIVATE_TOKEN`, `GHL_COMPANY_ID`
5. Add **Plain Text** env var: `NEXT_PUBLIC_APP_URL` = your app URL
6. Deploy

### Via `doctl` CLI

```bash
doctl apps create --spec .do/app.yaml
# then set secrets via the DigitalOcean dashboard
```

---

## GHL Custom Menu Link Setup

1. In GHL → **Agency Settings → Custom Menu Links** → **Add Menu Link**

| Field | Value |
|---|---|
| **Title** | PandaDash Command Center |
| **URL** | `https://your-deployed-url.com/dashboard?location_id={{location.id}}&user_fname={{user.first_name}}&user_lname={{user.last_name}}` |
| **Open Mode** | Embedded Page (iFrame) |
| **Visibility** | Admin only |

2. Save — PandaDash appears in the GHL sidebar, pre-populated with the active location and user name.

---

## Project Structure

```
src/
├── app/
│   ├── api/              # Server-side GHL API proxies (token stays here)
│   └── dashboard/        # Pages: overview, accounts, saas, rebilling
├── components/
│   ├── shared/           # CommandPalette, LoadingState, EmptyState
│   ├── accounts/         # AccountsTable, CreateAccountDialog, etc.
│   └── saas/             # PlanCards, PlanAssignmentTable, RebillingStatusTable
├── hooks/                # TanStack Query hooks
└── lib/
    ├── ghl-client.ts     # GHL API client (server-only singleton)
    ├── ghl-types.ts      # TypeScript types
    ├── validators.ts     # Zod schemas
    └── rate-limiter.ts   # Token bucket (100 req/10s)
```

## Tech Stack

Next.js 14 · TypeScript · TanStack Query · shadcn/ui · Tailwind CSS · Sonner · TanStack Table · cmdk · Zod · Recharts
