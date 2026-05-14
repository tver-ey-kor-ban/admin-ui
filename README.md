# Garage Management — Admin & Owner Web Dashboard

A React + Vite web dashboard for **admin** and **shop owner/mechanic** roles, built to complement the Flutter mobile app. Connects to the same backend API.

**Backend:** `https://backend-1-s2fl.onrender.com/api/v1`  
**Base URL (local dev):** `http://localhost:8000/api/v1`

> **Note:** The backend runs on Render free tier — the first request after inactivity may take 30–60 s (cold start).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Roles & Access](#roles--access)
- [Features](#features)
- [Screen Flow](#screen-flow)
- [API Endpoints Connected](#api-endpoints-connected)
- [Auth & Session](#auth--session)
- [Running the App](#running-the-app)
- [Environment Variables](#environment-variables)
- [Test Accounts](#test-accounts)
- [Known Limitations](#known-limitations)
- [Dependencies](#dependencies)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Language | TypeScript (strict mode) |
| Routing | React Router v6 |
| HTTP | Axios (auto Bearer token injection) |
| Styling | Tailwind CSS v3 |
| State | React Context (`AuthContext`) |
| Session | `localStorage` |

---

## Project Structure

```
admin-ui/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                        # React entry point
    ├── App.tsx                         # Route definitions
    ├── index.css                       # Tailwind base styles
    │
    ├── core/
    │   ├── api/
    │   │   ├── apiClient.ts            # Axios instance + interceptors
    │   │   └── apiConstants.ts         # All endpoint path constants
    │   └── types/
    │       └── index.ts                # TypeScript interfaces for all API models
    │
    ├── contexts/
    │   └── AuthContext.tsx             # Auth state, login, logout, shop selection
    │
    ├── hooks/
    │   └── useFetch.ts                 # Generic GET data-fetching hook
    │
    ├── components/
    │   ├── ProtectedRoute.tsx          # Route guard (requireAdmin, requireShopRole)
    │   ├── layout/
    │   │   ├── DashboardLayout.tsx     # Page shell (Sidebar + Header + Outlet)
    │   │   ├── Sidebar.tsx             # Role-aware navigation + logout
    │   │   └── Header.tsx              # Top bar (unused — layout uses inline header)
    │   └── ui/
    │       ├── Badge.tsx               # Status badge + statusBadge() helper
    │       ├── Button.tsx              # Primary / secondary / danger / success / ghost
    │       ├── Input.tsx               # Input, Select, Textarea
    │       ├── LoadingSpinner.tsx      # Centered spinner
    │       └── Modal.tsx               # Overlay modal (sm / md / lg / xl)
    │
    └── pages/
        ├── LoginPage.tsx
        ├── admin/
        │   ├── AdminDashboardPage.tsx
        │   ├── UsersPage.tsx
        │   ├── AdminShopsPage.tsx
        │   ├── AdminAppointmentsPage.tsx
        │   ├── AdminOrdersPage.tsx
        │   └── AdminRatingsPage.tsx
        └── owner/
            ├── OwnerDashboardPage.tsx
            ├── BookingsPage.tsx
            ├── TodayBookingsPage.tsx
            ├── OrdersPage.tsx
            ├── ProductsPage.tsx
            ├── ServicesPage.tsx
            ├── QuotationsPage.tsx
            ├── InvoicesPage.tsx
            ├── RepairProgressPage.tsx
            ├── PerformancePage.tsx
            ├── MembersPage.tsx
            └── NotificationsPage.tsx
```

---

## Roles & Access

| Role | `is_superuser` | `roles` | Redirected to |
|------|---------------|---------|---------------|
| **Admin** | `true` | any | `/admin` |
| **Shop Owner** | `false` | `owner` | `/owner` |
| **Mechanic** | `false` | `mechanic` | `/owner` |

### What each role can see

| Page | Admin | Owner | Mechanic |
|------|:-----:|:-----:|:--------:|
| Admin Dashboard | ✅ | ❌ | ❌ |
| Users Management | ✅ | ❌ | ❌ |
| All Shops | ✅ | ❌ | ❌ |
| All Appointments | ✅ | ❌ | ❌ |
| All Orders (platform) | ✅ | ❌ | ❌ |
| Ratings Moderation | ✅ | ❌ | ❌ |
| Shop Dashboard | ✅ | ✅ | ✅ |
| Pending Bookings | ✅ | ✅ | ✅ |
| Today's Bookings | ✅ | ✅ | ✅ |
| Orders (shop) | ✅ | ✅ | ✅ |
| Products CRUD | ✅ | ✅ | ❌ |
| Services CRUD | ✅ | ✅ | ❌ |
| Quotations | ✅ | ✅ | ❌ |
| Invoices | ✅ | ✅ | ❌ |
| Repair Progress | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ (team) | ✅ (own) |
| Team Members | ✅ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ✅ |

---

## Features

### Admin (`/admin/*`)

| Feature | Page | API Endpoint |
|---------|------|-------------|
| Platform statistics | `AdminDashboardPage` | `GET /admin/statistics` |
| List / search users | `UsersPage` | `GET /admin/users?search=&skip=&limit=` |
| Change user role | `UsersPage` (modal) | `PUT /admin/users/{id}/role` |
| Activate / deactivate user | `UsersPage` | `PUT /admin/users/{id}/status` |
| Delete user | `UsersPage` | `DELETE /admin/users/{id}` |
| List all shops | `AdminShopsPage` | `GET /admin/shops` |
| Delete shop | `AdminShopsPage` | `DELETE /admin/shops/{id}` |
| All appointments | `AdminAppointmentsPage` | `GET /admin/appointments` |
| All product orders | `AdminOrdersPage` | `GET /admin/orders` |
| All ratings | `AdminRatingsPage` | `GET /admin/ratings` |
| Delete rating | `AdminRatingsPage` | `DELETE /admin/ratings/product/{id}` or `/service/{id}` |

### Shop Owner & Mechanic (`/owner/*`)

| Feature | Page | API Endpoint |
|---------|------|-------------|
| Shop overview + quick stats | `OwnerDashboardPage` | Aggregates pending bookings + orders |
| View pending bookings | `BookingsPage` | `GET /mechanic/shops/{id}/pending-bookings` |
| Accept booking | `BookingsPage` | `POST /mechanic/shops/{id}/bookings/{id}/action` `{ action: "accept" }` |
| Reject booking | `BookingsPage` | `POST /mechanic/shops/{id}/bookings/{id}/action` `{ action: "reject" }` |
| Today's bookings | `TodayBookingsPage` | `GET /mechanic/shops/{id}/today-bookings` |
| Pending orders list | `OrdersPage` | `GET /mechanic/shops/{id}/pending-orders` |
| Accept / reject order | `OrdersPage` | `POST /mechanic/shops/{id}/orders/{id}/action` |
| Mark order ready | `OrdersPage` | `PUT /mechanic/shops/{id}/orders/{id}/ready` |
| List products | `ProductsPage` | `GET /shops/{id}/products` |
| Create product | `ProductsPage` (modal) | `POST /shops/{id}/products` |
| Edit product | `ProductsPage` (modal) | `PUT /shops/{id}/products/{pid}` |
| Delete product | `ProductsPage` | `DELETE /shops/{id}/products/{pid}` |
| List services | `ServicesPage` | `GET /shops/{id}/services` |
| Create service | `ServicesPage` (modal) | `POST /shops/{id}/services` |
| Edit service | `ServicesPage` (modal) | `PUT /shops/{id}/services/{sid}` |
| Delete service | `ServicesPage` | `DELETE /shops/{id}/services/{sid}` |
| List quotations | `QuotationsPage` | `GET /quotations/shops/{id}` |
| Create quotation (with line items) | `QuotationsPage` (modal) | `POST /quotations/shops/{id}` |
| Send quotation to customer | `QuotationsPage` | `POST /quotations/shops/{id}/{qid}/send` |
| List invoices | `InvoicesPage` | `GET /invoices/shops/{id}` |
| Create invoice (with line items) | `InvoicesPage` (modal) | `POST /invoices/shops/{id}` |
| Send invoice to customer | `InvoicesPage` | `POST /invoices/shops/{id}/{iid}/send` |
| Record payment | `InvoicesPage` (modal) | `POST /invoices/shops/{id}/{iid}/payments` |
| List repairs | `RepairProgressPage` | `GET /repair-progress/shops/{id}` |
| Start repair record | `RepairProgressPage` (modal) | `POST /repair-progress/shops/{id}` |
| Update repair stage | `RepairProgressPage` (modal) | `PUT /repair-progress/shops/{id}/{pid}` |
| Team performance | `PerformancePage` | `GET /shops/{id}/mechanics/performance` |
| My performance (mechanic) | `PerformancePage` | `GET /shops/{id}/mechanics/my-performance` |
| List team members | `MembersPage` | `GET /shops/{id}/members` |
| Add member | `MembersPage` (modal) | `POST /shops/{id}/members` |
| Change member role | `MembersPage` | `PUT /shops/{id}/members/{uid}/role` |
| Remove member | `MembersPage` | `DELETE /shops/{id}/members/{uid}` |
| Notifications list | `NotificationsPage` | `GET /mechanic/my-notifications` |
| Mark notification read | `NotificationsPage` | `PUT /mechanic/notifications/{id}/read` |

---

## Screen Flow

```
App Launch
│
├── tryRestoreSession()   ← reads token from localStorage
│   ├── GET /auth/me      ← verify token still valid
│   ├── GET /auth/me/roles
│   └── GET /shops/my-shops  (owner / mechanic / admin with shops)
│
├── /login  (public)
│   └── POST /auth/login → roles resolved → useEffect redirects
│       ├── is_superuser → /admin
│       └── owner / mechanic → /owner
│
├── /admin  (is_superuser only)
│   ├── /admin/users
│   ├── /admin/shops
│   ├── /admin/appointments
│   ├── /admin/orders
│   └── /admin/ratings
│
└── /owner  (owner, mechanic, admin)
    ├── /owner/bookings/pending
    ├── /owner/bookings/today
    ├── /owner/orders
    ├── /owner/products       (owner + admin only)
    ├── /owner/services       (owner + admin only)
    ├── /owner/quotations     (owner + admin only)
    ├── /owner/invoices       (owner + admin only)
    ├── /owner/repairs
    ├── /owner/performance
    ├── /owner/members        (owner + admin only)
    └── /owner/notifications
```

---

## API Endpoints Connected

### Authentication
```
POST /auth/login            — form-encoded: username, password, grant_type=password
GET  /auth/me               — get current user profile
GET  /auth/me/roles         — get roles + is_superuser flag
POST /auth/logout           — invalidate refresh token
POST /auth/refresh          — exchange refresh token for new access token
```

### Admin
```
GET    /admin/statistics
GET    /admin/users
PUT    /admin/users/{id}/role
PUT    /admin/users/{id}/status
DELETE /admin/users/{id}
GET    /admin/shops
DELETE /admin/shops/{id}
GET    /admin/appointments
GET    /admin/orders
GET    /admin/ratings
DELETE /admin/ratings/product/{id}
DELETE /admin/ratings/service/{id}
```

### Shops
```
GET  /shops/my-shops
GET  /shops/{id}/members
POST /shops/{id}/members
PUT  /shops/{id}/members/{uid}/role
DEL  /shops/{id}/members/{uid}
```

### Products
```
GET    /shops/{id}/products
POST   /shops/{id}/products
PUT    /shops/{id}/products/{pid}
DELETE /shops/{id}/products/{pid}
```

### Services
```
GET    /shops/{id}/services
POST   /shops/{id}/services
PUT    /shops/{id}/services/{sid}
DELETE /shops/{id}/services/{sid}
```

### Mechanic — Bookings
```
GET  /mechanic/shops/{id}/pending-bookings
GET  /mechanic/shops/{id}/today-bookings
GET  /mechanic/shops/{id}/bookings/{apptId}
POST /mechanic/shops/{id}/bookings/{apptId}/action
```

### Mechanic — Orders
```
GET  /mechanic/shops/{id}/pending-orders
POST /mechanic/shops/{id}/orders/{oid}/action
PUT  /mechanic/shops/{id}/orders/{oid}/ready
```

### Quotations
```
GET  /quotations/shops/{id}
POST /quotations/shops/{id}
POST /quotations/shops/{id}/{qid}/send
```

### Invoices
```
GET  /invoices/shops/{id}
POST /invoices/shops/{id}
POST /invoices/shops/{id}/{iid}/send
POST /invoices/shops/{id}/{iid}/payments
```

### Repair Progress
```
GET  /repair-progress/shops/{id}
POST /repair-progress/shops/{id}
PUT  /repair-progress/shops/{id}/{pid}
```

### Performance
```
GET /shops/{id}/mechanics/performance       — owner: full team
GET /shops/{id}/mechanics/my-performance    — mechanic: own stats
```

### Notifications
```
GET /mechanic/my-notifications
PUT /mechanic/notifications/{id}/read
```

---

## Auth & Session

Session is persisted to `localStorage` on login and restored on every page load.

| Key | Value |
|-----|-------|
| `auth_token` | JWT access token (expires 30 min) |
| `auth_refresh_token` | Refresh token (expires 7 days) |
| `auth_shop_id` | Last selected shop ID (for owner/mechanic) |

### Token injection

All API calls automatically include the `Authorization: Bearer <token>` header via an Axios request interceptor in `src/core/api/apiClient.ts`. A response interceptor clears the session and redirects to `/login` on any `401 Unauthorized` response.

### Shop context

After login, `GET /shops/my-shops` is called for owner/mechanic accounts. The first shop in the list becomes the active shop. If the user belongs to multiple shops, a **shop selector dropdown** appears in the sidebar. Switching shops updates `shopId` in context and persists the new selection to `localStorage`.

---

## Repair Progress Stages

```
received → diagnosing → waiting_parts → in_progress → quality_check → ready_for_pickup → completed
```

Displayed as a percentage progress bar in `RepairProgressPage`. Each stage update is recorded with an optional note and estimated completion time.

---

## Running the App

```bash
# 1. Install dependencies
cd admin-ui
npm install

# 2. Start development server
npm run dev
# → http://localhost:5173

# 3. Production build
npm run build

# 4. Preview production build locally
npm run preview

# 5. Type check only (no emit)
npx tsc --noEmit
```

---

## Environment Variables

Create a `.env.local` file in `admin-ui/` to override the default backend URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

If `VITE_API_URL` is not set, the app defaults to:
```
https://backend-1-s2fl.onrender.com/api/v1
```

---

## Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Shop Owner | `owner1` | `owner123` |
| Mechanic | `mechanic1` | `mechanic123` |
| Customer | `customer1` | `customer123` |

> Customer accounts cannot log into this dashboard. They are for the Flutter mobile app only.

---

## Known Limitations

| Area | Status |
|------|--------|
| Token auto-refresh | Refresh token is saved but automatic refresh on expiry is not wired up. Token expires after 30 min, requiring manual re-login. |
| Admin shop management | Admin accesses shop owner features by having a shop assigned. No UI to switch between all shops from the owner view. |
| Pagination — owner pages | Products, Services, Quotations, Invoices, Repairs all fetch up to 100 items in one request (no infinite scroll). |
| Image upload | Product image upload is not implemented (backend ML search is a placeholder). |
| Real-time updates | No WebSocket / polling — data is fetched on page load and on manual Refresh button click. |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | `^18.3.1` | UI framework |
| `react-dom` | `^18.3.1` | DOM renderer |
| `react-router-dom` | `^6.24.0` | Client-side routing |
| `axios` | `^1.7.2` | HTTP requests |
| `tailwindcss` | `^3.4.4` | Utility-first CSS |
| `typescript` | `^5.5.3` | Static typing |
| `vite` | `^5.3.1` | Build tool & dev server |
| `@vitejs/plugin-react` | `^4.3.1` | React fast refresh |
| `postcss` | `^8.4.39` | CSS processing |
| `autoprefixer` | `^10.4.19` | CSS vendor prefixes |
