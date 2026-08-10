# 🌱 Grow Karo — Investment & Portfolio Management Platform

> **Grow Karo** is a full-stack, multi-role investment and portfolio management web application built with **Next.js 16 + React 19**. It enables investors to discover and enroll in curated financial schemes, track their portfolios, and manage withdrawals — while giving administrators full control over plans, approvals, remitters, and platform activity.

---

## 📋 Table of Contents

- [Overview](#overview)
- [User Roles](#user-roles)
- [Features by Role](#features-by-role)
  - [🏠 Landing Page (Public)](#-landing-page-public)
  - [🔐 Authentication](#-authentication)
  - [👑 Malik (Admin) Dashboard](#-malik-admin-dashboard)
  - [📈 Grahak (Investor) Dashboard](#-grahak-investor-dashboard)
  - [💸 Remitter Dashboard](#-remitter-dashboard)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [API Layer](#api-layer)
- [State Management & Context](#state-management--context)
- [Infrastructure & Deployment](#infrastructure--deployment)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)

---

## Overview

Grow Karo is designed around three distinct user personas, each with their own dedicated dashboard and feature set:

| Role | Hindi Term | Description |
|---|---|---|
| **Admin** | Malik (मालिक) | Platform owner/operator who manages everything |
| **Investor** | Grahak (ग्राहक) | End user who invests in schemes |
| **Remitter** | Remitter | Agent/partner who facilitates fund transfers |

The platform supports **investment scheme management**, **bond certificate generation**, **withdrawal approvals**, **activity logging**, **user management**, and **multi-method fund transfer tracking**.

---

## User Roles

### 👑 Malik (Admin)
The platform administrator. Has access to a powerful back-office dashboard to manage all operations — from creating investment plans and approving enrollment requests, to reviewing user issues, managing remitters, and monitoring live activity logs.

### 📈 Grahak (Investor)
The end investor/customer. Can browse available investment plans, enroll in schemes, track their portfolio performance, view bond certificates, request withdrawals, and manage their account profile.

### 💸 Remitter
An agent or partner entity responsible for facilitating fund remittances. Has a dedicated dashboard to track transactions, manage recipients, handle money requests, and monitor volumes.

---

## Features by Role

---

### 🏠 Landing Page (Public)

The marketing-facing entry point of the platform with the following sections:

- **Hero Section** — Bold headline with an animated live portfolio chart (Chart.js line graph), CTA buttons linking to sign up and feature exploration.
- **Trust Section** — Social proof and platform credibility signals.
- **Asset Allocation** — Explanation of how the platform diversifies and manages investment risk.
- **Simplified Investing** — Visual walkthrough of how easy it is to get started.
- **Footer Section** — Navigation links, company info, and legal links.

> All sections are **lazily loaded** with code-splitting via `next/dynamic` for optimal performance.

---

### 🔐 Authentication

**Route:** `/auth`

A unified authentication page that supports two modes, toggled via URL query parameter (`?mode=signup` or `?mode=login`):

#### Login
- Email + password login form
- OTP-based email verification flow
- Redirects authenticated users away from the auth page automatically

#### Sign Up
- Multi-step registration with full validation
- Fields: Name, Email, Password, Phone, Bank details (via BankSelect component)
- **Email OTP Verification** — an OTP is sent to the user''s email and must be validated before account creation completes
- On success, the user is redirected to their appropriate dashboard

#### Forgot Password
- Sends a password reset link to the user''s email
- Reset flow handled via `/reset` route

#### Session Persistence
- Auth state stored in **secure, encrypted cookies**
- `UserContext` reads the cookie on mount to hydrate auth state without a round-trip login

---

### 👑 Malik (Admin) Dashboard

**Route:** `/dashboard/malik`

A full-featured back-office panel with a collapsible sidebar navigation and a top bar. All tabs are **code-split** and lazy-loaded.

#### 📊 Overview Tab
- Real-time inflow/revenue chart (line graph with Chart.js)
- Pending withdrawal count badge
- Open issue count badge
- Snapshot of fundraiser/remitter codes and their status

#### 🗓️ Activity Log Tab
- Live streaming activity log using **Server-Sent Events (SSE)**
- **Live Logs Panel** — real-time event feed as they happen
- **Recent Logs Panel** — paginated historical log browser with cursor-based pagination
- **Log Details Modal** — drill into any log entry for full metadata
- **Filter Panel** — filter by log type (deposit, withdrawal, signup, KYC, referral)
- All log types fetched dynamically from the API

#### 💰 Withdrawals Tab
- Full withdrawals management table with **server-side pagination** (10/25/50 rows per page)
- **Status tabs:** pending / processed / approved / rejected / all
- **Search** by user name or transaction ID (debounced)
- **Filters:** payment method (Bank Transfer, UPI, Wallet), date range picker
- **Approve / Reject** actions with confirmation modal
- Rejection requires a reason field (sent to API)
- Real-time status update after action without full page reload

#### 📜 Plans Tab
- Full CRUD for investment schemes/plans
- **Create Plan** — form with: name, description, interest rate, duration, min/max investment, type
- **Edit Plan** — inline editing
- **Activate / Deactivate** plans (toggle visibility to investors)
- **Delete Plan** with confirmation
- Plan list with status badges (active/inactive)

#### ✅ Approvals Tab
- Manage investor scheme enrollment requests
- **Filter tabs:** pending / approved / rejected / all
- **Search** by investor name or scheme name
- **Approve** — admin sets paid amount and date, then issues bond
- **Reject** — with reason field
- **Add Bond** — allows uploading bond certificate files for approved schemes

#### 🎫 Remitter Tab
- View and manage all registered remitter accounts
- Create Remitter — form modal with validation
- Delete Remitter — with confirmation modal
- Tracker Cards — each remitter as an expandable card with stats

#### 👥 User Management Tab
- View all registered investors/users
- Toolbar — search, filter by status, and export
- UserTable — paginated table of users with status pills
- UserDrawer — slide-out detail panel for any selected user
- **Bond Certificate** — view and print investor bond certificates
  - BondStub — compact bond stub view
  - CertificateLightbox — fullscreen certificate viewer with download

#### 📇 Contacts Tab
- Manage platform contacts and support communications

#### ⚙️ Settings Tab
- Platform-wide admin settings and configuration

---

### 📈 Grahak (Investor) Dashboard

**Route:** `/dashboard/grahak`

A clean investor-facing dashboard with sidebar navigation:

#### 📊 Overview Tab
- Account balance display
- Portfolio value summary
- Sparkline chart per holding
- Stat cards for key metrics

#### 💼 Portfolio Tab
- Full list of all enrolled investment schemes
- Per-scheme detail: invested amount, current value, profit/returns, start date, status
- **Bond Certificate Viewer** — view scheme bond image uploaded by admin (fullscreen lightbox with download)
- **Scheme Withdrawal** — request withdrawal for a specific scheme
- **Withdrawal Form** with two modes:
  - **General withdrawal** — withdraw profit only
  - **Aggressive withdrawal** — redeem full scheme early with a tiered **penalty calculation**:
    - < 2 months: 20% penalty
    - 2–4 months: 40% penalty
    - 5–7 months: 60% penalty
    - 8–11 months: 80% penalty
    - 12+ months: No penalty (full amount)

#### 💳 Transactions Tab
- Full transaction history table
- Fields: Transaction ID, date, description, type (Credit/Debit), amount, status
- Status badges for completed / pending / failed

#### ⚙️ Settings Tab
- Update personal profile information
- Change password
- Notification preferences

---

### 📈 Plan Discovery Page

**Route:** `/plan`

- Fetches all available/active plans from the API
- PlanCard — card per scheme showing name, returns, duration, minimum investment
- Plan Details Page — expanded view of a selected plan
- Enroll Confirm Modal — two-step confirmation (amount entry + confirm)
- Already-enrolled schemes are tracked and marked on the card
- Prevents duplicate enrollments

---

### 💸 Remitter Dashboard

**Route:** `/dashboard/Remitter`

#### 📊 Dashboard View
- Total Volume metric card
- Active Counterparties count
- Interactive chart of transaction volumes over time
- Recent transactions with colored avatars and status indicators

#### 👥 Recipients View
- List of all saved recipients/counterparties
- Name, country, masked bank details, colored avatar initials

#### 📤 Requests View
- Pending money requests from counterparties
- Settle or dismiss each request

#### 💳 Transactions View
- Full transaction history (Completed / Processing / Failed)

#### ⚙️ Settings View
- Remitter account settings and preferences

---

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 |
| **HTTP Client** | Axios with custom rate-limiter (5 req/sec) |
| **Charts** | Chart.js 4 + react-chartjs-2, Recharts |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **Alerts/Toasts** | SweetAlert2 |
| **Compression** | lz-string (cookie compression) |
| **Fonts** | Geist Sans & Geist Mono (next/font) |
| **Linting** | ESLint with eslint-config-next |

---

## Project Architecture

```
Grow-Karo/
├── src/
│   ├── api/                    # Raw API call functions
│   │   ├── apiClient.js        # Axios client + rate limiter + URL builder
│   │   ├── adminApi.js         # Admin/malik API endpoints
│   │   ├── userApi.js          # Investor/grahak API endpoints
│   │   ├── remitterApi.js      # Remitter API endpoints
│   │   ├── generalApi.js       # Shared/public endpoints
│   │   └── useEventStream.js   # SSE hook for live activity logs
│   │
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.jsx            # Landing page (/)
│   │   ├── layout.jsx          # Root layout + providers
│   │   ├── auth/               # Login / Signup page (/auth)
│   │   ├── plan/               # Plan discovery page (/plan)
│   │   ├── about/              # About page (/about)
│   │   ├── reset/              # Password reset (/reset)
│   │   └── dashboard/
│   │       ├── page.jsx        # Dashboard router (redirects by role)
│   │       ├── grahak/         # Investor dashboard + components
│   │       ├── malik/          # Admin dashboard + components
│   │       └── Remitter/       # Remitter dashboard + components
│   │
│   ├── components/             # Shared UI components
│   │   ├── HeroSection.jsx
│   │   ├── Navbar.jsx
│   │   ├── AuthLogin.jsx
│   │   ├── AuthSignup.jsx
│   │   ├── AuthForgot.jsx
│   │   ├── TrustSection.jsx
│   │   ├── AssetAllocation.jsx
│   │   ├── SimplifiedInvesting.jsx
│   │   ├── FooterSection.jsx
│   │   └── Message.jsx         # SweetAlert2 wrappers
│   │
│   ├── context/                # React Context providers
│   │   ├── UserContext.jsx     # Auth user, portfolio, transactions
│   │   ├── AdminContext.jsx    # Admin-specific state
│   │   ├── LoaderContext.jsx   # Global loader state
│   │   └── cookiesManagement.js # Secure cookie read/write/delete
│   │
│   └── loader/                 # Loading UI components
│       ├── Loader.jsx
│       ├── GlobalLoader.jsx
│       ├── TabLoader.jsx
│       └── TableRowLoader.jsx
│
├── services/                   # Business logic layer (between UI and API)
│   ├── malikService.js         # Admin service functions + mock data
│   ├── grahakService.js        # Investor service functions + mock data
│   └── remitterService.js      # Remitter service functions + mock data
│
├── Dockerfile
├── docker-compose.yaml
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## API Layer

The API layer follows a **3-tier architecture**:

```
UI Component
    ↓
Service Layer (services/*.js)      ← Business logic, mock support
    ↓
API Functions (src/api/*.js)       ← HTTP calls via apiClient
    ↓
apiClient.js                       ← Axios + rate limiter + error normalization
    ↓
Backend REST API
```

### API Client Features
- **Rate Limiting** — enforces max 5 requests per second using a sliding-window queue
- **URL Builder** — handles both absolute and relative base URLs, appends query params cleanly
- **FormData Support** — auto-removes Content-Type for multipart uploads
- **Error Normalization** — all errors standardized with `.status` and `.payload` fields

### Mock Mode
Each service file includes a `USE_MOCK` flag. When `true`, it returns local mock data with an artificial network delay, enabling full frontend development without a running backend.

---

## State Management & Context

### `UserContext`
Global context for authenticated investor state. Provides:
- `authUser` — the currently logged-in user object
- `updateAuthUser` — update auth state and sync to cookie
- `portfolio` / `fetchPortfolio` — user''s enrolled schemes
- `transactions` / `FetchTransactions` — user''s transaction history
- `logout` — SweetAlert2 confirmation → API call → cookie deletion → redirect
- `getUserDataFromContext` — re-hydrates user from cookie if context is empty
- `isLoading` — controls skeleton/loading states

### `LoaderContext`
Global overlay loader. Components call `showLoader(message)` and `hideLoader()` to trigger a fullscreen loading overlay during async operations.

### Cookie Management
Secure cookie utilities using `lz-string` compression:
- `setSecureCookie(name, value)` — stores compressed, serialized data
- `getSecureCookie(name)` — retrieves and decompresses cookie data
- `deleteSecureCookie(name)` — removes cookie on logout

---

## Infrastructure & Deployment

Docker Compose orchestrates the full backend infrastructure:

```yaml
services:
  postgres:   # PostgreSQL 16 — primary database
  pgadmin:    # pgAdmin 4 — database GUI at :8081
  redis:      # Redis 7 — caching / session storage at :6379
  dozzle:     # Dozzle — real-time Docker log viewer at :9999
```

### Ports Summary
| Service | Port |
|---|---|
| Next.js Frontend | 3000 |
| Backend API | 4000 (when enabled) |
| PostgreSQL | 5432 |
| pgAdmin | 8081 |
| Redis | 6379 |
| Dozzle Logs | 9999 |

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Backend API base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api

# Alternative env key also supported
NEXT_PUBLIC_BASE_URL=http://localhost:4000/api
```

> If neither variable is set, the API client defaults to relative paths (`/api/...`) suitable for a reverse-proxy setup in production.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose (for the database infrastructure)

### 1. Clone & Install

```bash
git clone <repository-url>
cd Grow-Karo
npm install
```

### 2. Start Infrastructure

```bash
docker-compose up -d postgres redis pgadmin
```

### 3. Configure Environment

```bash
# Create your .env.local with the appropriate API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### 4. Run Development Server

```bash
npm run dev
```

App available at **http://localhost:3000**

### 5. Build for Production

```bash
npm run build
npm run start
```

---

## Key Design Decisions

- **No Redux** — React Context with `useMemo` and `useCallback` is sufficient for this app''s complexity
- **Code Splitting** — every dashboard tab is loaded via `next/dynamic` with a TabLoader skeleton to keep initial bundle small
- **Rate Limiting on Client** — prevents accidental API flooding during rapid navigation
- **Mock Data Toggle** — `USE_MOCK` flag per service allows full UI development without a backend
- **SSE for Live Logs** — Server-Sent Events for the admin activity log instead of polling
- **Penalty-Based Withdrawals** — early redemption from aggressive schemes applies a tiered penalty calculated on the frontend based on months elapsed since enrollment

---

## License

This project is private and proprietary. All rights reserved.

---

*Built with ❤️ by the Grow Karo team.*
