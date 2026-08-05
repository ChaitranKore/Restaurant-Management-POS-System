# Restaurant Management POS System

A full-stack restaurant Point-of-Sale platform with separate **customer** and
**admin/staff** interfaces, **real-time kitchen order routing**, **multi-method
payments** (cash/card), and **role-based access control** (Admin / Staff /
Customer). Ships with a zero-config schema-installation script so a fresh
environment can be stood up with a single command.

## Architecture

```
Restaurant-Management-POS-System/
├── server/            Express + MongoDB (Mongoose) API, Socket.IO, JWT auth/RBAC
├── client-customer/   React (Vite) app — browse menu, order, pay, track live status
├── client-admin/      React (Vite) app — admin dashboard, kitchen display, POS, RBAC-gated management
└── docker-compose.yml Optional one-command local deployment of all four services
```

* **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.IO, JWT.
* **Customer app**: React 18 + React Router, talks to the API over REST and
  subscribes to Socket.IO for live order-status updates.
* **Admin app**: React 18 + React Router, RBAC-gated routes, a live Kanban-style
  Kitchen Display System (KDS) fed by Socket.IO, and a POS terminal for
  staff-entered walk-in orders.

### Data model

`User` (role: admin/staff/customer) · `Category` · `MenuItem` · `Table` ·
`Order` (items, status lifecycle, payment link) · `Payment` (cash/card,
transaction record).

### Order lifecycle & real-time routing

```
pending → confirmed → preparing → ready → served → completed
   └────────────┴───────────┘
              cancelled (from pending/confirmed/preparing)
```

When a customer (or staff, via the POS terminal) places an order, the API
re-prices every line server-side, persists the order, and immediately emits
`order:new` over Socket.IO to every connected admin/staff client — that's
what makes the Kitchen Display board update live with no polling. Every
subsequent status change emits `order:statusUpdate` to the kitchen/admin
rooms **and** to the specific customer who placed that order (if they're on
their tracking page), so both sides see the same state at the same time.

### Role-based access control (RBAC)

| Capability                          | Admin | Staff | Customer |
|--------------------------------------|:---:|:---:|:---:|
| Browse menu / place own order        | ✅ | ✅ | ✅ |
| View/track own orders                | ✅ | ✅ | ✅ |
| View & manage **all** orders         | ✅ | ✅ | ❌ |
| Advance order status (kitchen)       | ✅ | ✅ | ❌ |
| Take walk-in orders / process payment (POS) | ✅ | ✅ | ❌ |
| Manage menu items & categories       | ✅ | ❌ | ❌ |
| Manage tables                        | ✅ | ❌ | ❌ |
| Manage staff accounts & roles        | ✅ | ❌ | ❌ |
| View payment history / dashboard     | ✅ | staff: dashboard only | ❌ |

Enforced server-side via `protect` (JWT verification) + `authorize(...roles)`
middleware on every route — the frontends only *hide* UI for roles that
can't use it; the API is the actual gate.

### Payments

`POST /api/payments` supports two methods on the same endpoint:

* **cash** — staff records the tendered amount; the API computes change due.
* **card** — a simulated gateway (`server/src/controllers/paymentController.js`)
  validates the card number format and approves/declines it, returning a
  transaction id, brand, and last 4 digits (never storing full card data).
  It's isolated behind one function so swapping in a real processor (Stripe,
  Braintree, etc.) later doesn't touch order/socket logic.
  Test card `0000000000000000` always declines, for exercising the failure path.

## Getting started (local, no Docker)

Requires Node.js 20+ (Tailwind v4's native binary needs it) and a running MongoDB instance (local or Atlas).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # optional — `npm run setup` will do this for you
npm run setup               # zero-config: generates .env (with a random JWT secret)
                             # if missing, builds indexes, and seeds:
                             #   - a default admin account
                             #   - sample categories, menu items and tables
npm run dev                 # starts the API on http://localhost:5000
```

The default admin credentials (printed by `npm run setup`, and overridable
via `.env`) are:

```
email:    admin@restaurant.local
password: Admin@123
```

**Change this password after first login.** Re-running `npm run setup` is
safe — it only fills in what's missing, it never duplicates or wipes data.

### 2. Customer app

```bash
cd client-customer
npm install
cp .env.example .env   # points at http://localhost:5000 by default
npm run dev             # http://localhost:5173
```

### 3. Admin / staff app

```bash
cd client-admin
npm install
cp .env.example .env
npm run dev             # http://localhost:5174
```

Log in with the seeded admin account, or create staff accounts from
**Staff & Roles** once logged in as admin.

## Getting started (Docker Compose)

```bash
docker compose up --build
```

This brings up MongoDB, the API (running the same idempotent setup script on
every start), and both frontends built as static bundles served via nginx:

* Customer app → http://localhost:5173
* Admin app → http://localhost:5174
* API → http://localhost:5000/api

Override the generated admin credentials or JWT secret via environment
variables (see `docker-compose.yml`), e.g.:

```bash
JWT_SECRET=$(openssl rand -hex 32) DEFAULT_ADMIN_PASSWORD=ChangeMe123 docker compose up --build
```

> **After changing any client code, rebuild the images.** The containers serve a
> static bundle baked in at image build time, so restarting them alone keeps
> serving the previous build:
>
> ```bash
> docker compose up -d --build client-customer client-admin
> ```

## Demo data

`npm run seed:demo` (in `server/`, or `docker compose exec server npm run seed:demo`)
populates everything the demo is judged on:

* three sign-in-ready accounts — all with password `demo1234`

  | Email | Role | Sees |
  | --- | --- | --- |
  | `admin@tableside.demo` | admin | Everything |
  | `staff@tableside.demo` | staff | Kitchen board, POS, orders |
  | `diner@tableside.demo` | customer | The customer app |

* seven days of completed orders and payments, weighted to lunch and dinner
  peaks, so the dashboard charts have a shape rather than a single spike
* six live tickets spread across the kitchen board at ages from one to eighteen
  minutes, so the colour-coded timers show green, amber and red at once

It is **scoped**: it only removes records it created (matched on the demo
order-number shape `ORD-YYYYMMDD-Dnnn` and the `DEMO-` transaction prefix), so
re-running it resets the demo without touching a real menu, tables or staff.
Pass `--force-all` to wipe every order and payment instead.

Demo accounts are updated in place rather than recreated, so a scheduled reset
does not invalidate the JWT of anyone signed in at the time.

**Re-run it on a schedule for a public demo.** The live tickets are seeded at
fixed ages and keep ageing afterwards — leave it a few hours and every ticket on
the board reads red, and "today's" orders roll into yesterday. `render.yaml`
includes an hourly cron service that does this.

## Deploying

Three deployables, each independent:

| Piece | Platform | Config |
| --- | --- | --- |
| `server` | Render (web service) | `render.yaml` |
| `client-customer` | Vercel | `client-customer/vercel.json` |
| `client-admin` | Vercel | `client-admin/vercel.json` |
| database | MongoDB Atlas | connection string via `MONGO_URI` |

The API runs as a long-lived web service rather than a serverless function —
Socket.IO needs a persistent connection.

Environment variables to set:

* **Server** — `MONGO_URI`, and `CLIENT_ORIGINS` as a comma-separated list of
  the two deployed frontend URLs with no trailing slashes. `JWT_SECRET` is
  generated by the blueprint.
* **Both clients** — `VITE_API_URL` (`https://your-api/api`) and
  `VITE_SOCKET_URL` (`https://your-api`). Vite inlines these at *build* time, so
  changing them requires a redeploy, not just a restart.
* **Customer app** — `VITE_ADMIN_URL` so the landing page can link to the staff
  console, and optionally `VITE_REPO_URL`.

Two things that will bite otherwise, both already handled in the config here:

* **Node 20 or newer is required.** Tailwind v4's native binary declares
  `engines: node >= 20`, and npm *skips* optional dependencies whose engines
  don't match instead of failing — so an older Node produces a confusing
  "Cannot find native binding" error at build time rather than a version error.
* **SPA routing needs a rewrite rule.** Without one, refreshing on `/checkout`
  or opening a shared link to `/orders/:id` returns 404.

On Render's free tier the API sleeps after ~15 minutes idle and the next request
pays a cold start of roughly a minute. For a link on a CV, either use a paid
instance or keep it warm by pinging `/api/health`.

## API overview

All endpoints are namespaced under `/api`. Highlights:

| Method & Path | Access | Purpose |
|---|---|---|
| `POST /auth/register` | public | Customer self-registration |
| `POST /auth/login` | public | Login (any role) |
| `GET /menu`, `GET /categories`, `GET /tables` | public | Customer-facing browsing |
| `POST /orders` | authenticated | Place an order (server re-prices items) |
| `GET /orders` | admin/staff | All orders |
| `GET /orders/my` | customer | Own order history |
| `PATCH /orders/:id/status` | admin/staff | Advance/cancel an order — triggers real-time push |
| `POST /payments` | authenticated | Process cash or card payment for an order |
| `GET /dashboard/stats` | admin/staff | Today's orders, revenue, payment mix, top items |
| `POST/PUT/DELETE /menu`, `/categories`, `/tables` | admin | Catalog management |
| `POST/PUT/DELETE /users` | admin | Staff/admin account management |

Socket.IO (same host as the API): clients authenticate via
`io(url, { auth: { token } })`. Admin/staff sockets auto-join `kitchen` and
`admin` rooms; customers call `socket.emit('order:subscribe', orderId)` to
watch their own order (ownership is verified server-side before joining).

## Notes on scope

This is a solid, working MVP covering the full order-to-payment loop with
real RBAC and real-time updates — not a static mockup. Things intentionally
left out for a first pass: real payment gateway integration (Stripe/etc.),
inventory/stock tracking, receipt printing/email, and automated test suites.
The card "gateway" is a clearly-labeled simulation so the payment flow (API
shape, order state transitions, sockets, UI) is real and swappable.
