# KAICHO — Principal Architecture & Long-Term System Design

**Prepared as if presenting to CTO, Security, DevOps, and Product leadership.**
**Author stance:** Principal Architect personally accountable for this system for 5–10 years.

> A note before anything else: I read the brief as written and I also looked at what KAICHO actually is today — a ready-to-eat retort-pouch porridge brand (`kaicho.in`) with roughly a dozen SKUs (4 core meals, 4 combos, 4 saver packs) and a marketing site built on Next.js 16 / TypeScript / Tailwind. That gap between "what the business is" and "25,000 concurrent users, B2B, mobile apps, multi-app ecosystem" is the single most important thing in this document. I address it head-on in Part 1 and I do not soften it later.

---

## Table of Contents

1. Architecture Review Before Design
2. Architectural Style Decision
3. Target Architecture (diagram)
4. Frontend Architecture
5. Frontend Code Organization
6. Backend Architecture
7. Database Architecture
8. Inventory Design
9. Order Management
10. Payment Architecture
11. Redis Architecture
12. Background Processing
13. API Design
14. Authentication & Authorization
15. Security
16. Caching
17. Search
18. Storage & Images
19. Cloud Architecture (AWS vs GCP)
20. Environments
21. High Availability & Failure Design
22. Observability
23. Testing Strategy
24. Performance & Load Testing
25. Scaling Strategy
26. Modular Monolith vs Microservices
27. Cost
28. Codebase Structure
29. Engineering Standards
30. CI/CD
31. Disaster Recovery
32. Architecture Decision Records
33. Final Architecture
34. Final CTO Verdict

---

## PART 1 — Architecture Review Before Design

### The biggest risk isn't technical. It's scope vs. reality.

You've listed 25 business domains (auth, catalog, variants, cart, checkout, orders, payments, coupons, inventory, shipping, returns, refunds, reviews, notifications across three channels, invoices, admin, reporting, B2B, multi-app, mobile) and a traffic target of 5,000 concurrent users scaling to 25,000+. For a ~12-SKU D2C food brand, this is not a "modern e-commerce platform" spec — it's closer to a mid-size marketplace spec.

**I would change this.** Concretely:

- **5,000 concurrent users is very likely not a real number.** Concurrent (simultaneously connected, active-session) users at 5,000 implies, at typical e-commerce session lengths and conversion funnels, somewhere around 300K–600K+ daily visits for a single-category food brand. That's Swiggy/Zomato/Nykaa territory, not a retort-pouch porridge D2C. If this number came from a template or a competitor's traffic rather than KAICHO's own GA4 concurrent-user data, replace it before another dollar is spent. If it's a genuine investor/marketing-campaign target (e.g. a planned Shark-Tank-style spike, a festival sale, a national FMCG retail tie-in), that's a different and legitimate reason — but the *architecture response* to "sustained 5,000 CCU" and "occasional 5,000 CCU for 6 hours during a flash sale" are completely different, and conflating them leads to permanently over-provisioned infrastructure.
- **B2B, mobile apps, and a multi-app ecosystem are real future possibilities, not present requirements.** I will design data models and API boundaries so none of them require a rewrite later (that's the entire point of Part 33's modular monolith), but I will not build a B2B module, a GraphQL federation layer, or mobile-specific auth flows today. Building them now is speculative engineering — the single most common way small teams burn 6 months building infrastructure nobody uses yet.
- **Reviews, coupons, promotions, returns/refunds, notifications** — these are legitimate v1/v1.1 e-commerce features and I keep them in scope, but I sequence them (Part 25).
- **What I would explicitly *not* build in v1:** B2B portal, GraphQL, dedicated search engine (Meilisearch/Algolia/Elasticsearch), Kubernetes, service mesh, event bus (Kafka), multi-region active-active, mobile app backend-specific endpoints, admin RBAC beyond 3 roles, database sharding, read replicas (until replication lag or read QPS actually demands it).

### Where the system will actually fail under real traffic

Ranked by likelihood, for a Next.js + Postgres commerce stack at this scale:

1. **Database connection exhaustion**, not CPU. Postgres has a hard connection ceiling (typically 100–500 depending on instance class); a naive serverless/edge deployment that opens a connection per request will exhaust it long before CPU or query time becomes the bottleneck. This is the #1 real-world failure mode for Next.js + Postgres stacks and it's why PgBouncer/RDS Proxy is non-negotiable, not optional (Part 7, Part 24).
2. **Oversold inventory under concurrent checkout** on the same SKU during a flash sale or festival promotion — a correctness bug, not a performance bug, but it *presents* as a scaling incident (angry customers, refund storms). Addressed in Part 8 with row-level locking / `SELECT ... FOR UPDATE` and a reservation model.
3. **Synchronous third-party calls in the request path** — payment gateway, SMS/WhatsApp providers, email — if any of these are called synchronously inside a checkout request instead of being decoupled via webhook + queue, a slow or down provider takes your checkout down with it.
4. **N+1 queries from Prisma** in product listing/category pages as the catalog and its relations (variants, images, categories, inventory) grow — silent until traffic reveals it.
5. **CDN cache poisoning of personalized or price-sensitive data** — caching a page that embeds user-specific cart state or promo-eligible pricing at the edge is a correctness bug that looks like "the site is broken for some users."

### Consistency classification (used throughout this document)

| Domain | Consistency requirement | Why |
|---|---|---|
| Inventory decrement, order creation, payment state | **Strong** (ACID, single Postgres transaction) | Money and stock correctness — no negotiation |
| Cart contents (pre-checkout) | **Eventual is fine** | Losing a cart item to a race condition is an inconvenience, not a financial error |
| Product catalog reads (price, description, images) | **Eventual, bounded staleness** | Cacheable, but price must be re-verified server-side at checkout (Part 16) |
| Search index | **Eventual** | Index lag of seconds is invisible to users |
| Analytics / reporting | **Eventual**, can be minutes behind | Never read from the transactional path |
| Session / auth state | **Strong for revocation**, eventual for "last seen" | A revoked session must stop working immediately; last-active timestamp can lag |
| Notifications (email/SMS/WhatsApp) | **At-least-once, eventual, idempotent** | Never block the user-facing transaction on a notification provider |

### Synchronous vs. asynchronous, decided up front

**Must be synchronous (inside the request/response cycle):**
- Auth check, cart mutation, inventory reservation, payment intent creation, order state transition validation.

**Must be asynchronous (queued):**
- Sending email/SMS/WhatsApp, generating PDF invoices, search index updates, analytics events, inventory reconciliation jobs, post-payment-webhook side effects (loyalty points, marketing triggers), image processing/resizing.

**Deliberately NOT queued** (a common overreach): admin CRUD operations, simple GET reads, and anything where the user is actively waiting for a definitive yes/no answer *and* the operation is fast (<200ms) and idempotent to retry — queueing these adds latency and operational surface for no correctness benefit.

### What should NOT be built yet (explicit list)

- Microservices, service mesh, Kubernetes, Kafka — no team-ownership boundary, no independent-scaling need, no polyglot requirement exists today that justifies the operational tax.
- Elasticsearch/OpenSearch/Algolia — catalog is ~12–100 SKUs for the foreseeable future; Postgres full-text search handles this with zero additional infrastructure (Part 17).
- Multi-region active-active database — India-first customer base, single-region (`ap-south-1`) with cross-region backups covers disaster recovery without the enormous consistency complexity of multi-region writes.
- GraphQL — REST is simpler to cache, simpler to secure, and sufficient until multiple heterogeneous clients (web + native mobile + partner integrations) genuinely need flexible query composition (Part 13).
- Database sharding — Postgres vertically scales to tens of millions of rows and thousands of writes/sec on a single well-tuned primary long before KAICHO's transaction volume gets there.

---

## PART 2 — Architectural Style Decision

### Comparison

| Criterion | A. Next.js full-stack | B. Standalone Fastify + TS | C1. NestJS + Express | C2. NestJS + Fastify | D. Express.js + TS |
|---|---|---|---|---|---|
| Raw throughput | Good (Node runtime, but API routes carry framework overhead + cold starts if serverless) | Excellent | Good (Express overhead) | Excellent (near-Fastify raw numbers) | Good, but no built-in structure to keep it that way as it grows |
| Maintainability at scale | Degrades — business logic tends to leak into route handlers/Server Actions | Depends entirely on self-imposed discipline | Strong — DI + modules enforce structure | Strong — same as C1 | Weak — no enforced structure, becomes ad hoc |
| Modularity | Weak — Next.js has no domain-module concept | Manual (you build it) | Native (Nest modules) | Native | Manual |
| DI / testability | None built-in | None built-in | First-class | First-class | None built-in |
| TypeScript support | Good | Good | Excellent (Nest is TS-native) | Excellent | Good but bolted-on |
| API reuse (web + future mobile + admin) | Poor — API routes are coupled to the Next.js deploy/runtime | Good | Excellent | Excellent | Good |
| Team scalability (multiple engineers, months 6–36) | Poor without heavy self-discipline | Medium | High — module boundaries are structural, not cultural | High | Low |
| Ecosystem / hiring | Huge (Next.js), but "Next.js as a backend" is a smaller, less battle-tested pattern | Large (fast-growing) | Very large; Nest is the closest thing Node has to a "Spring/NestJS enterprise" convention | Same | Huge but unopinionated |
| Operational complexity | Lowest (one deploy) | Low | Medium (two deploys: web + API) | Medium | Medium |
| Evolvability to services later | Poor — logic is entangled with the frontend framework | Good — plain HTTP layer, easy to peel apart | Excellent — Nest modules map directly onto future service boundaries | Excellent | Poor — no boundaries to extract from |

### Why not Next.js full-stack (API routes / Server Actions as the backend)

This is the choice I expect to be challenged on hardest, because "just use Next.js for everything" is the trendy answer in 2026. I reject it for KAICHO specifically, for reasons that matter here and might not matter for a smaller project:

1. **Coupled lifecycle.** A payment webhook handler, an inventory-reservation transaction, and a marketing landing page have completely different risk profiles, deploy cadences, and scaling needs. Bundling them into one Next.js deployment means a frontend hotfix (a typo in a hero banner — literally what we've been doing this whole conversation) and a payment-webhook code change ship through the same pipeline, the same build, the same blast radius.
2. **No first-class DI/module system.** As checkout, inventory, coupons, and B2B logic grow, API routes become a pile of files with business logic duplicated or awkwardly shared via `lib/`. This is exactly the "Complex → Distributed → Expensive → Difficult to operate" outcome you told me to avoid — except inverted: it's "simple today, unmaintainable in 18 months."
3. **Future clients.** The moment a mobile app or an admin SPA needs the same "create order" logic, a Next.js-API-routes backend forces you to either duplicate logic or have the mobile app depend on a framework (Next.js) it has no business depending on.
4. **Long-running workers don't belong in a web framework.** Background reconciliation jobs, scheduled tasks, and queue consumers need a persistent Node process with their own lifecycle — trying to run these "inside" Next.js is a well-known source of pain (build-time vs. runtime confusion, serverless timeout limits if deployed to Vercel).

Next.js remains the **frontend** — this is not a rejection of Next.js, it's a rejection of *Next.js as the system of record for business logic*.

### Why not standalone Fastify (no framework)

Fastify alone is the fastest raw option and is a completely legitimate choice for a small team that wants full control. I reject it for KAICHO only because of what happens **after month 3**: without Nest's enforced module/DI structure, a growing team will either (a) organically reinvent a lightweight version of Nest's patterns (in which case, just use Nest), or (b) drift into an unstructured pile of route handlers with a shared `db.ts` — the same failure mode as Express, just with a faster HTTP layer underneath it. Fastify's speed is real but it's not KAICHO's bottleneck (Part 24 shows the database is the bottleneck, not the HTTP framework).

### Why not Express.js

Express has no built-in DI, no enforced module boundaries, callback-era middleware patterns that fight TypeScript, and — critically — as of 2026 it's in "legacy-but-supported" mode relative to Fastify's actively-optimized core. There is no scenario in this brief where Express wins over NestJS+Fastify: Express offers less structure than Nest and less raw performance than Fastify, while inheriting complexity from both directions.

### NestJS: Express adapter or Fastify adapter?

Evaluated separately, as instructed:

- **NestJS + Express adapter**: mature, the widest third-party middleware compatibility (some older Express-only middleware), slightly higher per-request overhead, slightly larger memory footprint under load.
- **NestJS + Fastify adapter**: Nest's Fastify adapter has been first-class (not experimental) for years now; you get Fastify's schema-based validation/serialization speed and lower overhead, with only a small minority of Express-only middleware being incompatible — none of which KAICHO needs (standard needs: helmet-equivalent via `@fastify/helmet`, CORS via `@fastify/cors`, rate limiting via `@fastify/rate-limit`, multipart via `@fastify/multipart` — all have first-party Fastify plugins).

**I choose the Fastify adapter.** There is no real downside for this project and a measurable upside in P95/P99 latency and memory efficiency under the exact "5,000+ concurrent" load profile you asked me to design for.

### RECOMMENDATION

**Backend: NestJS with the Fastify HTTP adapter, as a modular monolith. Frontend: Next.js App Router. These are two separately deployed applications communicating over a versioned REST API.**

### WHY

- Nest's module system is the only option on this list that gives you *structural* (not cultural/convention-based) enforcement of domain boundaries — Auth, Products, Inventory, Orders, Payments, etc. as real Nest modules with explicit `imports`/`exports`, which is exactly what a modular monolith needs and exactly what makes future service extraction (Part 26) mechanical instead of a rewrite.
- Fastify adapter gives you the performance headroom without giving up Nest's DI/testing/module ergonomics.
- Decoupling the API from Next.js means the payment webhook handler, the inventory transaction, and the admin dashboard can be reasoned about, deployed, and scaled independently of marketing-page changes — while still starting as one deployable service (not microservices).
- The same REST API is immediately consumable by a future mobile app or admin SPA with zero rework, because it was never coupled to Next.js in the first place.

### WHY NOT THE OTHERS (summary)

- **Next.js full-stack**: fast to start, expensive to maintain past month 6; couples unrelated risk profiles into one deploy.
- **Standalone Fastify**: you'll rebuild Nest's structure by hand, badly, under deadline pressure.
- **Express**: strictly dominated by Fastify on performance and by Nest on structure — no axis where it wins here.

---

## PART 3 — Target Architecture

```text
                                   ┌────────────────────────┐
                                   │        Customers        │
                                   │  (Web, future Mobile)   │
                                   └───────────┬─────────────┘
                                               │ HTTPS
                                               ▼
                                   ┌────────────────────────┐
                                   │      DNS (Route 53)     │
                                   └───────────┬─────────────┘
                                               ▼
                        ┌───────────────────────────────────────────┐
                        │                 CLOUDFLARE                 │
                        │  CDN │ WAF │ Bot Mgmt │ DDoS │ Rate Limit   │
                        │  Edge cache: static assets, product images │
                        └───────────┬─────────────────┬──────────────┘
                                    │                  │
                     (marketing/catalog pages,    (product images,
                      SSR/ISR HTML, static JS)     user-upload assets)
                                    │                  │
                                    ▼                  ▼
                        ┌───────────────────┐   ┌─────────────────┐
                        │   VERCEL (Next.js) │   │  Cloudflare R2   │
                        │  App Router: SSR/   │   │  (object storage)│
                        │  ISR/RSC/Streaming  │   └─────────────────┘
                        └─────────┬──────────┘
                                  │ HTTPS, server-side only
                                  │ (never exposes API keys to browser)
                                  ▼
                        ┌────────────────────────────────────────┐
                        │         AWS  (ap-south-1, single VPC)    │
                        │                                          │
                        │   ┌──────────────────────────────────┐   │
                        │   │  ALB (Application Load Balancer)  │   │
                        │   └──────────────┬───────────────────┘   │
                        │                  ▼                       │
                        │   ┌──────────────────────────────────┐   │
                        │   │  ECS Fargate: NestJS API Service   │   │
                        │   │  (2–N tasks, autoscaled)           │   │
                        │   │  Auth │ Catalog │ Cart │ Orders │  │   │
                        │   │  Payments │ Inventory │ Coupons   │   │
                        │   └───────┬───────────────┬───────────┘   │
                        │           │               │               │
                        │           ▼               ▼               │
                        │  ┌────────────────┐  ┌───────────────┐    │
                        │  │  RDS Proxy /    │  │  ElastiCache   │    │
                        │  │  PgBouncer      │  │  for Redis     │    │
                        │  └───────┬────────┘  └───────┬────────┘    │
                        │          ▼                    │            │
                        │  ┌────────────────┐           │            │
                        │  │  RDS PostgreSQL │           │            │
                        │  │  (Multi-AZ,      │           │            │
                        │  │   1 primary +    │           │            │
                        │  │   read replica    │           │            │
                        │  │   when needed)    │           │            │
                        │  └────────────────┘           │            │
                        │                                 ▼            │
                        │                    ┌─────────────────────┐  │
                        │                    │  BullMQ queues        │  │
                        │                    │  (backed by Redis)    │  │
                        │                    └──────────┬────────────┘  │
                        │                                ▼              │
                        │                    ┌─────────────────────┐  │
                        │                    │  ECS Fargate: Worker  │  │
                        │                    │  Service (autoscaled) │  │
                        │                    │  Email │ SMS │ WA     │  │
                        │                    │  Invoices │ Recon     │  │
                        │                    └──────────┬────────────┘  │
                        │                                │              │
                        │        Secrets Manager ────────┤              │
                        │        CloudWatch Logs/Metrics ┤              │
                        │        AWS X-Ray (tracing)  ────┘              │
                        └────────────────────────────────────────────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        ▼                       ▼                       ▼
              ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
              │  Razorpay          │   │  Email (SES/       │   │  SMS/WhatsApp      │
              │  (payment gateway, │   │  Postmark/Resend)   │   │  (MSG91/Gupshup/   │
              │  webhooks)         │   │                     │   │  WhatsApp Cloud API)│
              └──────────────────┘   └──────────────────┘   └──────────────────┘

     Observability plane (cross-cutting, not a single box):
     Sentry (errors) │ CloudWatch (infra metrics/logs) │ Grafana Cloud or
     CloudWatch Dashboards (RPS/P95/P99) │ UptimeRobot/Better Stack (external health checks)
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| **Cloudflare** | DNS, TLS termination at edge, CDN caching of static/ISR pages and images, WAF rules, managed + custom rate limiting, DDoS absorption before traffic ever reaches origin |
| **Vercel (Next.js)** | Rendering (SSR/ISR/RSC/streaming), SEO, image optimization pipeline, server-only API-key usage for calling the NestJS API, no business logic, no direct DB access |
| **ALB** | TLS-terminated internal load balancing across API tasks, health-check-based routing, zero-downtime deploy target for rolling updates |
| **ECS Fargate — API service** | NestJS modular monolith: all synchronous business logic, auth, request validation, transaction boundaries |
| **RDS Proxy / PgBouncer** | Connection pooling — this is the component that prevents "Postgres ran out of connections" from being the first outage (Part 1, risk #1) |
| **RDS PostgreSQL (Multi-AZ)** | System of record for all business-critical data: users, products, inventory, orders, payments |
| **ElastiCache for Redis** | Cache, rate-limit counters, distributed locks, BullMQ backing store, session/refresh-token revocation list |
| **ECS Fargate — Worker service** | Async job consumers: notifications, invoicing, reconciliation, search index sync |
| **Cloudflare R2** | Product images and other object storage, zero egress cost, fronted by Cloudflare CDN |
| **Razorpay** | Payment processing, sends signed webhooks back to the API |
| **SES/Postmark, MSG91/Gupshup/WhatsApp Cloud API** | Transactional email, SMS, WhatsApp — all called only from the worker service, never inline in a request |
| **Secrets Manager** | All credentials, API keys, DB passwords — never in env files committed to git, never in the Next.js bundle |
| **CloudWatch + X-Ray + Sentry** | Metrics, logs, distributed tracing, error aggregation |

---

## PART 4 — Frontend Architecture

### Rendering strategy per page type (this is the actual decision table, not a general essay)

| Page | Strategy | Why |
|---|---|---|
| Homepage, About/Story, Blog posts | **Static (SSG) + ISR** (revalidate 5–15 min) | Content changes rarely; maximize CDN cache hit rate |
| Category / product listing | **ISR** (revalidate 60s) with **on-demand revalidation** on product/price/stock change via webhook from the API | Balances freshness with cache economics — see the caching note below |
| Product detail page | **ISR** (revalidate 60s) + client-side "hydrate live price/stock" call on mount for high-traffic SKUs during sales | Product pages are the highest-traffic, highest-cache-value pages; but price/stock must never be trusted stale at the moment of "Add to Cart" |
| Cart | **Client-rendered** (Client Component), backed by an authenticated API call | Inherently user-specific, must never be cached |
| Checkout | **Server-rendered per request (SSR), no caching**, `Cache-Control: private, no-store` | Must always reflect live price, live stock, live coupon validity |
| Account / Orders | **SSR**, no caching, auth-gated | User-specific, sensitive |
| Admin dashboard | **Client-rendered SPA-style within Next.js**, no caching, behind separate auth | Internal tool, not SEO/perf-sensitive the same way |
| Search results | **Server-rendered on request**, results cached at the API layer (Redis), not at the CDN | Query-dependent, effectively infinite cache key space — CDN caching here is a cache-stampede risk, not a win |

**Do not make everything client-side.** Product/category/marketing pages are Server Components by default — this is where App Router's actual value is: zero client JS for content that doesn't need interactivity, streamed HTML, and SEO that doesn't depend on a client-side hydration race. Client Components are reserved for: cart widget, add-to-cart button, filters/sort UI, checkout form, account forms, anything with `useState`/`useEffect`/browser APIs.

### The price/stock/promotion staleness problem — solved explicitly

This is the part of "frontend caching" that actually causes production incidents, so I'm answering it directly rather than generally:

1. **ISR-cached pages (listing, PDP) are allowed to show stale price/stock for up to their revalidate window (60s).** This is acceptable for *browsing*.
2. **The "Add to Cart" and "Buy Now" actions never trust the rendered page's price/stock.** They call the API, which re-reads price/stock/promotion eligibility from Postgres (or a Redis cache with a TTL measured in single-digit seconds, never the CDN) at the moment of the action, inside the same transaction that reserves inventory.
3. **Checkout re-validates everything server-side, again, immediately before payment intent creation** — price, stock reservation, coupon validity — regardless of what the client believes. The frontend is never the source of truth (this principle also governs Part 10).
4. **Product mutation in the admin triggers on-demand ISR revalidation** (`revalidatePath`/`revalidateTag`) via a webhook from the NestJS API to Next.js, so a price change propagates to cached pages within seconds rather than waiting for the 60s window — this closes the gap between "cache freshness" and "correctness," without needing to disable caching entirely.

### Cross-cutting frontend concerns

- **SEO/Metadata**: `generateMetadata` per route, JSON-LD structured data (`Product`, `Offer`, `BreadcrumbList`, `Organization`) rendered server-side.
- **Images**: `next/image`, served from R2 via a Cloudflare-fronted domain, `sizes` set per breakpoint, AVIF/WebP negotiated automatically.
- **Auth on the frontend**: httpOnly cookie set by the API (not localStorage — see Part 14), Next.js middleware checks a lightweight signed session cookie for route protection (redirect unauthenticated users away from `/account`), the actual authorization decision is still re-checked server-side by the API on every request.
- **Error boundaries**: route-level `error.tsx` for recoverable UI errors, a global error boundary that reports to Sentry, and a dedicated `not-found.tsx`.
- **Loading/Suspense**: `loading.tsx` per route segment + `<Suspense>` boundaries around slow data (e.g., recommended products) so the primary content streams first.
- **Forms/validation**: shared Zod schemas between frontend and backend (see Part 5's `packages/shared` note) so client-side validation and API validation can never drift out of sync.
- **State management**: Server state (cart, orders, products) lives in React Query (TanStack Query) on the client, not Redux/Zustand global stores — this project doesn't have enough genuinely global client-only state to justify a global store; cart *server* state via React Query, small local UI state via `useState`/Context where truly needed (e.g., mobile menu open/close, which is exactly what this codebase already does).
- **Accessibility**: semantic HTML first (this session's hero work already follows this — real `<h1>`, real `<button>`, `aria-label`s, `prefers-reduced-motion` handling), keyboard navigation, focus management on modals/drawers, WCAG 2.1 AA as the bar.
- **Analytics**: server-side event forwarding for critical commerce events (purchase, add-to-cart) via the API rather than only client-side pixels, so ad blockers and privacy-mode browsers don't silently corrupt conversion data.

---

## PART 5 — Frontend Code Organization

```text
apps/web/                          # Next.js application
├── app/
│   ├── (marketing)/                # static/ISR marketing routes
│   │   ├── page.tsx                 # homepage
│   │   ├── about/
│   │   └── blog/
│   ├── (shop)/
│   │   ├── products/[slug]/
│   │   ├── categories/[slug]/
│   │   └── search/
│   ├── (account)/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   └── settings/
│   ├── (admin)/                     # separate layout, separate auth guard
│   ├── api/                         # ONLY thin proxy/webhook-relay routes if unavoidable
│   │                                  (e.g. Next→Nest revalidation webhook receiver)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # dumb, reusable, no business logic (Button, Container…)
│   └── sections/                    # page-section components (Hero, ProductCard…)
├── features/                        # feature/domain-oriented, mirrors backend modules
│   ├── cart/
│   │   ├── components/
│   │   ├── hooks/                    # useCart(), useAddToCart()
│   │   ├── api.ts                    # typed client calls to /v1/cart
│   │   └── types.ts
│   ├── checkout/
│   ├── products/
│   └── orders/
├── lib/
│   ├── api-client.ts                 # fetch wrapper, auth header injection, error normalization
│   ├── server-only/                  # ⚠ imports `server-only` package — build fails if bundled to client
│   │   ├── session.ts                 # reads httpOnly cookie, never sent to browser
│   │   └── secrets.ts
│   └── client-only/                  # imports `client-only` package
├── hooks/                            # generic, cross-feature hooks
├── schemas/                          # Zod schemas — ideally imported from a shared package (below)
├── types/
├── middleware.ts                     # auth redirect, locale, security headers
└── public/
```

```text
packages/                             # if a monorepo (Turborepo/pnpm workspaces) — recommended
├── shared-types/                     # DTOs shared between apps/web and apps/api
├── shared-schemas/                   # Zod validation schemas, single source of truth
└── config/                           # eslint, tsconfig, tailwind base configs
```

**Server-only code that must never reach the browser bundle:** anything importing the Razorpay secret key, internal service-to-service tokens, database connection strings (there shouldn't be any direct DB access from Next.js at all — this is enforced architecturally, not just by convention, since Next.js never talks to Postgres directly in this design), and the `lib/server-only/` directory is enforced with the `server-only` npm package so a misplaced import fails the build rather than silently leaking a secret into client JS — this is a real, common, and completely preventable vulnerability class.

---

## PART 6 — Backend Architecture

### Module list (NestJS modules = domain boundaries)

`AuthModule · UsersModule · CustomersModule · ProductsModule · VariantsModule · CategoriesModule · InventoryModule · CartModule · WishlistModule · OrdersModule · PaymentsModule · CouponsModule · PromotionsModule · ShippingModule · ReturnsModule · RefundsModule · ReviewsModule · NotificationsModule · AdminModule · ReportingModule · AuditLogModule`

(`B2BModule` deliberately not built in v1 — see Part 1/25.)

### Dependency direction (enforced, not aspirational)

```text
Controller  →  Application Service  →  Domain logic  →  Repository (Prisma)  →  PostgreSQL
     │                                                        ▲
     └── DTO validation (class-validator/Zod) happens here ───┘
```

- **Controllers**: parse/validate the HTTP request (via DTOs + pipes), call exactly one application service method, map the result to an HTTP response. **No business logic. No direct Prisma calls.** A controller method should be readable in 5 lines.
- **Application services**: orchestrate a use case (e.g. `PlaceOrderService.execute()`), own the transaction boundary, call domain logic and repositories, publish domain events (e.g. `OrderPlacedEvent` → picked up by the notifications module listener).
- **Domain logic**: pure business rules with no framework/IO dependencies where practical (e.g. "can this coupon apply to this cart?", "is this state transition valid?") — this is what's unit-tested without a database.
- **Repositories**: the only layer that talks to Prisma. This indirection means swapping an ORM or adding a read-replica-aware query path later doesn't ripple through business logic.
- **Infrastructure**: Prisma client, Redis client, S3/R2 client, payment gateway SDK wrapper, email/SMS provider adapters — all behind interfaces the application layer depends on, so they're mockable in tests and swappable (e.g., swapping Razorpay for a second gateway someday touches one adapter, not the order flow).

### Where things live

- **Validation**: DTO-level (shape/type) validation in the controller layer via `class-validator`/Zod pipes; **business-rule validation** (e.g. "this SKU has insufficient stock," "this coupon is expired") lives in the application/domain layer, never the controller.
- **Authorization**: a `PermissionsGuard` at the controller level checks coarse-grained access ("is this an admin route"); fine-grained, data-dependent authorization ("does this customer own this order") is checked in the application service, because it often requires a DB read the guard doesn't have.
- **Transactions**: owned by the application service via a `UnitOfWork`/Prisma `$transaction` wrapper — a repository method never opens its own transaction, so multi-repository operations (e.g., "decrement inventory AND create order row") are always atomic.
- **External API integrations** (Razorpay, SES, MSG91): live in an `infrastructure/` adapter per module, called only from application services or queue processors, never from controllers directly.
- **Inter-module communication**: modules depend on each other's **exported service interfaces only** (Nest's `imports`/`exports`), never reach into another module's repository or Prisma models directly. Cross-cutting workflows (e.g., "order placed → decrement inventory → send confirmation email") are wired through an internal domain-event bus (`@nestjs/event-emitter` — in-process, not Kafka) so `OrdersModule` doesn't need a hard compile-time dependency on `NotificationsModule`.
- **Circular dependencies** are prevented structurally: the event-emitter pattern above replaces most cases where Module A would otherwise need to call Module B which needs to call Module A back; where a genuine two-way relationship exists (rare), a shared `SharedKernelModule` holds the common interface both depend on.

---

## PART 7 — Database Architecture

### Core entities (abbreviated — full DDL is a separate migration-by-migration exercise, not a single document)

```text
users            (id, email, phone, password_hash, role, mfa_secret?, created_at, ...)
customers        (id, user_id FK, default_address_id, ...)
addresses        (id, customer_id FK, line1, city, state, pincode, ...)
products         (id, slug UNIQUE, name, description, category_id FK, status, created_at, ...)
product_variants (id, product_id FK, sku UNIQUE, price, weight, attributes JSONB, ...)
categories       (id, slug UNIQUE, parent_id FK NULLABLE, ...)
inventory_items  (id, variant_id FK UNIQUE, on_hand, reserved, ...)          -- see Part 8
inventory_ledger (id, variant_id FK, delta, reason, ref_type, ref_id, created_at) -- append-only, source of truth
carts            (id, customer_id FK NULLABLE, session_token, status, ...)
cart_items       (id, cart_id FK, variant_id FK, quantity, price_snapshot, ...)
orders           (id, order_number UNIQUE, customer_id FK, status, totals..., created_at, ...)
order_items      (id, order_id FK, variant_id FK, quantity, unit_price, ...)
order_status_history (id, order_id FK, from_status, to_status, actor, created_at) -- audit trail
payments         (id, order_id FK, gateway, gateway_payment_id UNIQUE, status, amount, ...)
payment_events   (id, payment_id FK, gateway_event_id UNIQUE, payload JSONB, processed_at) -- webhook idempotency
coupons          (id, code UNIQUE, type, value, constraints JSONB, valid_from, valid_to, ...)
reviews          (id, variant_id FK, customer_id FK, rating, body, status, ...)
audit_logs       (id, actor_id, action, entity_type, entity_id, diff JSONB, created_at)
```

### Keys, constraints, indexes

- **Primary keys**: UUID v7 (time-ordered UUIDs) rather than sequential integers or plain UUID v4 — avoids exposing sequential order counts to competitors/customers (`?order=1042` leaking business volume) while keeping index locality better than random UUID v4.
- **Foreign keys**: enforced at the database level, always, even though Prisma also models relations in the app layer — the database is the last line of defense against orphaned rows from a bug or manual `psql` fix.
- **Unique constraints**: `products.slug`, `product_variants.sku`, `users.email`, `coupons.code`, `payments.gateway_payment_id`, `payment_events.gateway_event_id` (this last one is the actual idempotency mechanism for webhooks — Part 10).
- **Composite indexes**: `(customer_id, status)` on `orders` for "my orders" queries, `(variant_id, created_at)` on `inventory_ledger` for stock history, `(category_id, status)` on `products` for listing pages.
- **Check constraints**: `inventory_items.on_hand >= 0`, `inventory_items.reserved >= 0`, `orders.total_amount >= 0` — the database refuses to persist an impossible state even if application logic has a bug.

### Transactions, isolation, locking

- **Default isolation level**: `READ COMMITTED` (Postgres default) for the vast majority of operations — sufficient for typical CRUD.
- **Inventory reservation and order creation**: wrapped in a single transaction using `SELECT ... FOR UPDATE` on the `inventory_items` row (pessimistic row lock) — this is the correct tool specifically because the operation is short (milliseconds) and contention on a single hot SKU during a flash sale is exactly when you *want* other transactions to queue rather than retry-storm (Part 8 has the full flow).
- **Coupon redemption count / promotion usage caps**: same pattern — `SELECT ... FOR UPDATE` on the coupon row, or an atomic `UPDATE ... SET used_count = used_count + 1 WHERE used_count < max_uses RETURNING *` (optimistic, single-statement, no explicit lock needed) for the simple cases.
- **Optimistic concurrency**: used for admin edits to non-contended rows (e.g., two admins editing a product description) via a `version` integer column checked on update — cheaper than locking for low-contention writes.
- **Connection pooling**: **RDS Proxy** (AWS-native, integrates with IAM auth and Secrets Manager rotation) in front of Postgres; Prisma's own connection pool is configured conservatively (`connection_limit` per Fargate task × task count must stay under RDS Proxy's/Postgres's ceiling) — this single decision prevents the #1 failure mode identified in Part 1.

### Migrations, backups, recovery

- **Migrations**: Prisma Migrate, expand-contract pattern for anything touching a live column (add nullable column → backfill → make non-null in a later migration → drop old column in a later migration still) — never a single migration that both adds a NOT NULL column and a default in one step against a large live table without a `CONCURRENTLY`-safe path.
- **Backups**: RDS automated backups, **35-day retention**, daily snapshots + continuous transaction log shipping for **point-in-time recovery (PITR)** to any second within the retention window.
- **Read replicas**: **not provisioned in v1.** Added when read QPS on the primary demonstrably exceeds a defined threshold (Part 25) — reporting/analytics queries are the first candidate to move to a replica, since they're read-heavy and tolerate eventual consistency (Part 1's table).
- **Data retention**: `orders`, `payments`, `invoices` retained indefinitely (financial/legal record); `audit_logs` retained 2+ years; `cart_items` for abandoned carts pruned after 90 days; soft-delete (`deleted_at`) for customer-facing entities, hard-delete only for genuinely transient data.
- **Audit history**: `order_status_history` and `audit_logs` are append-only tables — never updated, only inserted — giving a durable trail for support/dispute resolution without needing a separate audit product.

---

## PART 8 — Inventory Design

**`products.stock` as a single mutable integer is rejected outright.** It cannot answer "why is stock wrong," cannot support reservations during checkout, and cannot be audited. The real model:

```text
inventory_items      -- current state, one row per variant
  variant_id (PK/FK)
  on_hand      int    -- physically in the warehouse
  reserved     int    -- allocated to in-flight orders not yet fulfilled
  available    int    -- GENERATED ALWAYS AS (on_hand - reserved) STORED
  version      int    -- optimistic concurrency guard for admin corrections

inventory_ledger     -- append-only, the actual source of truth for "why"
  id, variant_id, delta, reason, ref_type, ref_id, created_by, created_at
  -- reason ∈ {purchase_in, sale, reservation, release, return_in,
  --           damaged, manual_adjustment, transfer_out, transfer_in}
```

`inventory_items` is a materialized, always-consistent-with-the-ledger snapshot maintained inside the same transaction as every ledger insert — never edited independently.

### Preventing overselling — the actual transaction flow

```sql
BEGIN;

-- 1. Lock the row (pessimistic) — this is what makes concurrent
--    checkouts on the same SKU safe.
SELECT on_hand, reserved
FROM inventory_items
WHERE variant_id = $1
FOR UPDATE;

-- 2. Application checks: (on_hand - reserved) >= requested_qty
--    If not enough available stock → ROLLBACK, return 409 to the client
--    (never allow the transaction to proceed on insufficient stock)

-- 3. Reserve
UPDATE inventory_items
SET reserved = reserved + $2
WHERE variant_id = $1;

INSERT INTO inventory_ledger (variant_id, delta, reason, ref_type, ref_id)
VALUES ($1, -$2, 'reservation', 'order', $3);

-- 4. Create the order row in PAYMENT_PENDING state, same transaction
INSERT INTO orders (...) VALUES (...);
INSERT INTO order_items (...) VALUES (...);

COMMIT;
```

Two customers hitting "Buy Now" on the last unit of a SKU at the same millisecond will serialize on the `FOR UPDATE` lock — the second transaction blocks for milliseconds, re-reads the now-updated `reserved` value once the first commits, sees insufficient stock, and fails cleanly with a "just sold out" response. **No oversell is possible by construction**, not by hope.

- **Reservation timeout**: if payment isn't confirmed within a configurable window (e.g., 15 minutes), a scheduled worker job releases the reservation (`reason: 'release'`, `delta: +qty`) so abandoned checkouts don't permanently lock stock.
- **Payment confirmed**: reservation converts to a permanent decrement (`reason: 'sale'`) — no ledger row is deleted, the flow is captured as a sequence of ledger entries, fully auditable.
- **Returns**: `reason: 'return_in'`, increments `on_hand` after a returns workflow (Part 9) approves it — never a direct edit to the current stock number.
- **Manual corrections/damaged stock**: always via `manual_adjustment`/`damaged` ledger entries with a required `created_by` and reason note — an admin can never silently overwrite the stock count; they can only insert an auditable correction.
- **Reconciliation**: a nightly job recomputes `on_hand`/`reserved` from the full ledger and alerts (doesn't silently auto-correct) if the materialized `inventory_items` row has drifted from the ledger sum — this is the safety net that catches any bug in the "always update both in one transaction" discipline above.

---

## PART 9 — Order Management

### State machine

```text
CART
  ↓ (checkout initiated)
CHECKOUT_IN_PROGRESS
  ↓ (order + inventory reservation committed)
ORDER_CREATED
  ↓ (payment intent created at gateway)
PAYMENT_PENDING
  ↓ (webhook: payment success, signature+idempotency verified)      ↓ (webhook: payment failed / timeout)
PAYMENT_CONFIRMED                                                    PAYMENT_FAILED → back to CART (stock released)
  ↓
PROCESSING (warehouse picks/packs)
  ↓
SHIPPED
  ↓
DELIVERED
  ↓
COMPLETED (return window closed)

Side branches, valid from specific states only:
ORDER_CREATED / PAYMENT_PENDING  → CANCELLED   (customer/system cancel before payment)
PAYMENT_CONFIRMED / PROCESSING    → CANCELLED   (admin cancel before shipment, triggers refund)
SHIPPED / DELIVERED               → RETURN_REQUESTED → RETURN_APPROVED → RETURNED → REFUNDED / PARTIALLY_REFUNDED
any post-payment state            → REFUNDED / PARTIALLY_REFUNDED (via Payments module, Part 10)
```

### Rules that make this safe

- **Transitions are enforced by an explicit state machine table in code** (`ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]>`), checked in the application service before any `UPDATE orders SET status = ...` — there is no code path that writes an arbitrary status string. An attempted invalid transition (e.g., `DELIVERED → PAYMENT_PENDING`) throws a domain error and is logged, never silently succeeds.
- **Every transition writes an `order_status_history` row** (`from_status`, `to_status`, `actor` — customer/admin/system/webhook, `reason` where applicable) — this is the audit trail Part 15 (security) and customer support both depend on.
- **Transaction boundaries**: each transition that touches both `orders` and another aggregate (inventory, payments) happens in a single Postgres transaction — e.g., `CANCELLED` from `PAYMENT_CONFIRMED` atomically updates order status **and** releases/reverses inventory **and** enqueues a refund job, or none of it happens.
- **Idempotency**: every state-changing request (checkout submission, cancel request) accepts an `Idempotency-Key` header; the API stores `(idempotency_key, response)` for 24h and replays the stored response for a duplicate request instead of re-executing — this is what makes "customer double-clicks Place Order" or "mobile network retries the request" safe.
- **Race conditions**: the payment webhook and a customer-initiated cancellation can theoretically race; both paths acquire a row lock on the specific `orders` row (`SELECT ... FOR UPDATE`) before evaluating/writing a transition, so they serialize rather than corrupt state — the loser of the race sees the already-updated status and exits cleanly (its own transition either becomes a no-op or a rejected invalid-transition, both handled gracefully).
- **Retry/failure recovery**: webhook processing is itself idempotent (Part 10) and queued through BullMQ with exponential backoff, so a transient DB blip during webhook processing results in a retried job, not a lost payment confirmation.

---

## PART 10 — Payment Architecture

**The frontend never determines payment success.** It initiates payment and later reflects a status the backend has already confirmed via a verified webhook — never via a client-side redirect/callback URL alone (a client can be closed, spoofed, or simply lie).

```text
Customer → Frontend → Backend (create order, PAYMENT_PENDING)
                         ↓
                Backend → Razorpay: create payment order (server-to-server, secret key never in browser)
                         ↓
Frontend ← Backend: {razorpay_order_id, amount, key_id (public)}
                         ↓
Frontend → Razorpay Checkout SDK (customer completes payment on Razorpay's UI)
                         ↓
        ┌────────────────┴───────────────────┐
        ▼                                     ▼
Razorpay → Frontend (redirect/callback,       Razorpay → Backend WEBHOOK
  "looks" successful — UNTRUSTED signal)        (the ONLY trusted signal)
        │                                     ▼
        │                          1. Verify HMAC signature (Razorpay webhook secret)
        │                          2. Check payment_events.gateway_event_id
        │                             for existing row → if present, ACK 200 and stop
        │                             (duplicate webhook, already processed)
        │                          3. BEGIN transaction:
        │                             - Insert payment_events row (idempotency record)
        │                             - Update payments.status
        │                             - Transition order: PAYMENT_PENDING → PAYMENT_CONFIRMED
        │                             - Convert inventory reservation → sale (Part 8)
        │                             - Enqueue: confirmation email/SMS/WhatsApp, invoice generation
        │                          4. COMMIT, respond 200 to Razorpay
        ▼
Frontend polls/re-fetches order status from Backend
  (shows "Payment confirmed" only once the backend says so — never
   trusts its own redirect handler as proof of payment)
```

### Failure scenarios, handled explicitly

- **Duplicate webhooks** (gateways retry until they get a 200): `payment_events.gateway_event_id UNIQUE` constraint makes a second delivery a no-op — the unique constraint, not application-level "if already processed" logic alone, is the real guarantee (constraints don't have race conditions; naive `SELECT` then `INSERT` does).
- **Delayed webhooks**: the frontend never blocks on the webhook synchronously. It shows an "awaiting confirmation" state and polls a lightweight order-status endpoint; if a webhook hasn't arrived within a threshold, a scheduled job actively reconciles by querying Razorpay's API directly for the payment status (defense against a lost webhook, not just a slow one).
- **Failed payments**: webhook (or the reconciliation job) transitions the order to `PAYMENT_FAILED`, releases the inventory reservation, notifies the customer with a retry link.
- **Payment retries**: a new payment attempt on the same order reuses the order but creates a new `payments` row linked to it — `orders` and `payments` are one-to-many by design specifically to support retries without creating duplicate orders.
- **Timeouts**: the backend's call to Razorpay to *create* a payment order has an aggressive timeout (a few seconds) with no retry-storm — if Razorpay is down, the customer sees "payment temporarily unavailable," not a hung request.
- **Refunds / partial refunds**: issued via the Payments module, which calls Razorpay's refund API and — symmetrically — only marks a refund `COMPLETED` once *Razorpay's refund webhook* confirms it, not at the moment the refund API call returns 200 (a 200 on "refund initiated" is not the same as "refund settled").
- **Reconciliation**: a daily job compares KAICHO's `payments` table against Razorpay's settlement report API and flags mismatches to an admin alert channel — this is the safety net for "what if a webhook silently never arrived and the reconciliation-by-polling job also missed it."
- **Gateway downtime**: checkout shows a clear "payments temporarily unavailable, please try again shortly" state rather than a generic error; the order remains in `ORDER_CREATED`/`PAYMENT_PENDING` with its inventory reservation intact until the reservation timeout, so a customer retrying in 10 minutes doesn't lose their cart to someone else — up to the reservation TTL.
- **Order/payment mismatch** (e.g., amount tampering attempts): the backend recomputes the order total server-side at payment-order-creation time and again validates the webhook's `amount` against the stored order total — a mismatch is treated as a security event (logged, order held, admin alerted), never auto-approved.

### How idempotency actually works, precisely

Two independent idempotency mechanisms, for two different failure classes:
1. **Client-request idempotency** (`Idempotency-Key` header, Part 9) — protects against duplicate *customer actions* (double-click, mobile retry).
2. **Webhook idempotency** (`gateway_event_id` unique constraint) — protects against duplicate *gateway deliveries*, which are expected and normal (Razorpay explicitly documents at-least-once webhook delivery).

Both are backed by a **database uniqueness constraint**, not an in-memory cache or a "check-then-act" read — this is the difference between idempotency that's actually guaranteed and idempotency that merely reduces the odds of a duplicate.

---

## PART 11 — Redis Architecture

| Use case | Classification | Notes |
|---|---|---|
| API response cache (product listings, category pages) | **Recommended** | Short TTL (30–120s), always alongside a DB fallback |
| Rate limiting counters | **Recommended** | Sliding-window counters via `INCR`+`EXPIRE`, cheap and fast |
| Distributed locks (e.g., "only one reconciliation job runs at a time") | **Recommended** | Via `SET NX PX` pattern (Redlock only if genuinely multi-Redis, which we don't need at this scale) |
| BullMQ queue backing store | **Recommended** | This is Redis's primary job here |
| Session store (opaque refresh-token → user mapping, revocation list) | **Recommended** | Fast lookup for "is this token revoked" |
| Temporary tokens (email verification, password reset, OTP) | **Recommended** | Natural TTL fit |
| Cart storage (as the *only* copy) | **Avoid** | Cart is business data a customer expects to survive across devices/sessions/days — belongs in Postgres (`carts`/`cart_items`), not Redis alone. Redis *may* cache a read-through view of an active cart for latency, but Postgres is the source of truth. |
| Full API-level cache of authenticated/user-specific responses | **Avoid** | Risk of leaking one user's cached response to another if cache keys aren't perfectly scoped — the blast radius of getting this wrong (showing User A's order to User B) is severe enough that it's not worth the marginal latency win versus caching only anonymous/public data |
| Product cache | **Recommended** | Read-heavy, tolerant of few-second staleness (Part 4/16) |
| Distributed locks as a substitute for proper DB transactions on financial data | **Avoid** | Inventory/payment correctness is guaranteed by Postgres row locks (Part 8/10), not by Redis locks — Redis locks are best-effort, not ACID |

**Postgres remains the source of truth for every business-critical fact.** If Redis is completely unavailable:
- Rate limiting fails open to a conservative in-memory-per-instance fallback (degraded but not down) or fails closed on auth endpoints specifically (safer to be briefly stricter on login attempts than to lose brute-force protection entirely).
- API response caching simply misses every time — requests fall through to Postgres directly; this increases DB load and latency but does not cause incorrect behavior, because cached data was never the system of record.
- BullMQ jobs pause and resume once Redis returns — no jobs are lost (Redis is configured with AOF persistence for the queue database), but async side effects (emails, invoices) are delayed, not dropped.
- Sessions: if the revocation list is unreachable, the design fails **closed** on admin sessions (deny) and fails **open with a short grace period** on customer sessions to avoid locking out all customers over a cache outage — this trade-off is a deliberate, documented business decision, not an oversight.

---

## PART 12 — Background Processing

### Queue/worker architecture

BullMQ on Redis, consumed by a dedicated **ECS Fargate worker service** (separate task definition from the API, scaled independently on queue depth rather than HTTP RPS).

Queues, each with its own concurrency setting and priority:

| Queue | Jobs | Concurrency | Priority |
|---|---|---|---|
| `notifications.email` | Order confirmation, shipping updates, password reset | 10 | High |
| `notifications.sms` | OTP, delivery alerts | 10 | High |
| `notifications.whatsapp` | Order updates (opt-in) | 5 | Medium |
| `invoices` | PDF generation, upload to R2 | 5 | Medium |
| `search-index` | Sync product changes to search index (Part 17) | 5 | Low |
| `reconciliation` | Payment reconciliation, inventory ledger reconciliation | 1 (scheduled) | Low |
| `analytics` | Server-side event forwarding | 20 | Low |

- **Retry policy**: exponential backoff (`attempts: 5`, base delay 5s, doubling, capped at ~5 min) — appropriate for transient provider failures (SMS gateway 503, SES throttling).
- **Dead-letter handling**: jobs exhausting retries move to a `failed` state BullMQ tracks natively; a scheduled sweep alerts on-call (via the observability stack, Part 22) rather than retrying forever — a permanently-failing job (e.g., invalid phone number) shouldn't burn worker capacity indefinitely.
- **Idempotency**: every job handler is written to be safely re-runnable (e.g., "send order confirmation email" checks `notifications_sent` before sending) — because at-least-once delivery is BullMQ's guarantee, not exactly-once.
- **Priority/concurrency**: OTP and transactional emails are high-priority/low-latency; search indexing and analytics are explicitly low-priority and can lag minutes without anyone noticing.
- **Monitoring**: queue depth, processing rate, and failure rate are first-class metrics (Part 22) — a growing `notifications.email` queue depth is treated as an incident, not background noise.

### What stays synchronous (not queued)

Inventory reservation, order creation, payment-intent creation, coupon validation, auth — all synchronous because the user is actively waiting for a definitive answer and these operations are fast (single-digit milliseconds to low tens of milliseconds) and require a strongly-consistent result before the response can be returned. **Queueing these would add latency for zero correctness benefit** and would turn a simple request/response into a polling UX for no reason.

---

## PART 13 — API Design

### REST, chosen and defended

REST over GraphQL, specifically because:
1. **CDN/edge caching** (Part 16) works naturally with REST's URL-based cache keys; GraphQL's single-endpoint POST queries require bespoke caching infrastructure (persisted queries + custom cache layers) to get the same benefit.
2. **Webhooks are inherently REST/HTTP** — Razorpay, WhatsApp, email providers all speak webhook payloads to REST endpoints; there's no GraphQL equivalent, so the API needs solid REST handling regardless.
3. **Client query shapes aren't heterogeneous yet.** GraphQL earns its complexity when many different clients need very different, deeply nested data shapes from the same underlying graph. Web, and eventually a mobile app, both want "product list," "product detail," "cart," "order" — well-known, enumerable shapes REST handles cleanly.
4. Simpler to secure (Part 15) — REST's per-endpoint authorization is easier to reason about than GraphQL's per-field authorization, and REST doesn't carry GraphQL's query-complexity/depth-limiting DoS surface.

*(Revisit GraphQL specifically for the admin/reporting dashboard if and when its query needs become genuinely heterogeneous — not for the core commerce API.)*

### Conventions

- **Versioning**: URL-based, `/v1/...` — simplest to reason about, cache, and document; a breaking change ships as `/v2/...` alongside `/v1/...` during a deprecation window, never an in-place breaking change.
- **Resource URLs**: plural nouns, nested only one level (`/v1/products`, `/v1/products/:id`, `/v1/orders/:id/items` — not `/v1/customers/:id/orders/:id/items/:id/...`).
- **HTTP methods**: `GET` (read, cacheable, no side effects), `POST` (create / non-idempotent action), `PUT`/`PATCH` (full/partial update), `DELETE` (soft-delete in practice for most resources).
- **Status codes**: `200/201/204` success, `400` validation, `401` unauthenticated, `403` unauthorized, `404` not found, `409` conflict (e.g., insufficient stock, invalid state transition), `422` semantically invalid, `429` rate-limited, `5xx` server error — used consistently, never `200` with an error payload.
- **Request validation**: Zod/`class-validator` DTOs, rejected before reaching application logic.
- **Response envelope**:
  ```json
  { "data": { ... }, "meta": { "requestId": "..." } }
  ```
  Errors:
  ```json
  { "error": { "code": "INSUFFICIENT_STOCK", "message": "Only 2 left in stock", "requestId": "..." } }
  ```
  Machine-readable `code` fields (not just human messages) so frontend/mobile clients can branch on error type reliably.
- **Pagination**: cursor-based (`?cursor=...&limit=20`) for feeds that grow unbounded (orders, reviews); offset-based acceptable for small, bounded admin lists.
- **Filtering/sorting/search**: `?category=oats&sort=-created_at&q=veg+porridge` — documented, allow-listed query params only (never pass raw query params into a SQL `ORDER BY`/`WHERE`).
- **Rate limiting**: per-IP and per-account limits at both Cloudflare (coarse, edge) and the API (fine-grained, per-endpoint — e.g., stricter on `/v1/auth/login` and `/v1/coupons/apply` than on `/v1/products`).
- **Idempotency**: `Idempotency-Key` header supported on all unsafe methods that create financial/inventory side effects (Part 9/10).
- **OpenAPI**: generated directly from Nest decorators (`@nestjs/swagger`) — documentation can't drift from the actual implementation because it's derived from the same code, not hand-maintained separately.
- **Deprecation**: `Deprecation` and `Sunset` HTTP headers on old versions, minimum 6-month overlap window before removing a version.

### Example endpoints

```text
GET    /v1/products?category=porridge&sort=-created_at&cursor=...
GET    /v1/products/veg-oats-porridge
GET    /v1/products/veg-oats-porridge/variants
POST   /v1/cart/items                 { variantId, quantity }
PATCH  /v1/cart/items/:id             { quantity }
POST   /v1/checkout                   { cartId, addressId, couponCode? }   Idempotency-Key required
POST   /v1/orders/:id/cancel
GET    /v1/orders/:id
POST   /v1/payments/webhooks/razorpay                                    (signature-verified, unauthenticated)
POST   /v1/auth/login                 { email, password }
POST   /v1/auth/refresh
POST   /v1/auth/logout
GET    /v1/admin/orders?status=processing
PATCH  /v1/admin/orders/:id/status    { status: "shipped", trackingId }
```

Reusable by web (this API), a future mobile app (same endpoints, same auth model adapted for token storage — Part 14), and an admin app (same API, admin-scoped endpoints under the same versioned base) — this reuse is a direct payoff of *not* coupling the API to Next.js (Part 2).

---

## PART 14 — Authentication & Authorization

### Customer authentication flow

```text
1. POST /v1/auth/login {email, password}
2. Backend: bcrypt/argon2id verify → issue:
   - Access token: short-lived JWT (10–15 min), signed (RS256), contains userId+role, NOT sensitive data
   - Refresh token: opaque random 256-bit token, stored hashed in Postgres (refresh_tokens table)
     + a pointer cached in Redis for fast revocation checks
3. Access token → httpOnly, Secure, SameSite=Lax cookie (web) — never localStorage
   Refresh token → separate httpOnly, Secure, SameSite=Strict cookie, path-scoped to /v1/auth/refresh only
4. On each request: Next.js middleware/API reads access token from cookie, validates signature+expiry
5. On access token expiry: frontend calls /v1/auth/refresh (refresh cookie sent automatically)
   → backend validates refresh token against DB hash, ROTATES it (issues new refresh token,
     invalidates the old one immediately — reuse of an old refresh token is treated as a
     compromise signal and revokes the entire session family)
6. Logout: deletes refresh token row + Redis revocation entry, clears cookies
```

- **Password hashing**: argon2id (memory-hard, current best practice) — bcrypt acceptable as a fallback if operational familiarity strongly favors it, but argon2id is the default recommendation.
- **Password reset**: single-use, time-limited (15 min) token, delivered via email, invalidated after use or expiry; rate-limited per account and per IP.
- **Email verification**: required before checkout (not before browsing) — reduces friction while still gating the action that actually matters.
- **OTP**: used for phone-based login/verification (common expectation in Indian D2C) — 6-digit, 5-minute expiry, rate-limited (max attempts, max sends per hour), delivered via the same SMS provider as order notifications.
- **MFA for administrators**: **mandatory**, TOTP-based (authenticator app), enforced at first admin login — not optional. Admin accounts are the highest-value target in this system (Part 15).
- **RBAC**: `customer`, `admin`, `staff` (limited admin — e.g., warehouse staff who can update order status but not issue refunds) as the base roles; permission-based checks (`orders:read`, `orders:cancel`, `refunds:issue`) layered on top of roles so granular permissions can be assigned without inventing a new role per combination.
- **Session/device management**: customers can view and revoke active sessions (`refresh_tokens` rows, one per device/login), surfaced in account settings — this is both a security feature and a support-ticket reducer ("I think someone accessed my account").
- **Token storage — explicitly rejected**: `localStorage`/`sessionStorage` for tokens (XSS-exfiltrable), long-lived JWTs used as if they were sessions (no revocation path once issued), and access tokens with business-sensitive claims embedded (JWTs are base64, not encrypted — never put PII or pricing logic in a JWT payload).

---

## PART 15 — Security

### OWASP Top 10, addressed concretely

| Risk | KAICHO mitigation |
|---|---|
| **Broken access control** | Every endpoint has an explicit guard; ownership checks (Part 6) happen server-side on every request, never inferred from client-supplied IDs alone |
| **Cryptographic failures** | TLS everywhere (Cloudflare + ALB), argon2id passwords, secrets in Secrets Manager (encrypted at rest, IAM-scoped access), RDS encryption at rest |
| **Injection (SQLi)** | Prisma parameterizes all queries by default; any raw SQL is reviewed and parameterized explicitly, never string-concatenated |
| **Insecure design** | This entire document — threat modeling happened before code, not after (e.g., the payment/inventory idempotency design in Parts 8/10) |
| **Security misconfiguration** | Infrastructure-as-code (no manual console changes to prod), least-privilege IAM roles per ECS task, security headers enforced via Fastify Helmet plugin |
| **Vulnerable/outdated components** | Automated dependency scanning in CI (Dependabot/Snyk), scheduled patch cadence, not "whenever someone notices" |
| **Auth failures** | Part 14 — argon2id, rate-limited login, MFA for admins, rotating refresh tokens |
| **Software/data integrity failures** | Signed CI artifacts, webhook signature verification (Part 10), no unsigned third-party scripts on checkout pages |
| **Logging/monitoring failures** | Structured logs + Sentry + CloudWatch alarms on auth anomalies, payment mismatches (Part 22) |
| **SSRF** | Any server-initiated URL fetch (e.g., a future "import product from URL" admin feature) goes through an allow-listed egress proxy, never fetches arbitrary user-supplied URLs directly from a privileged network context |

### Specific attack surfaces, ranked highest-risk first

1. **Admin panel** — highest-value target (can issue refunds, view all customer data, modify orders). Mitigation: mandatory MFA, IP-based conditional access optional, separate stricter rate limits, full audit log of every admin action (`audit_logs` table, Part 7), session timeout shorter than customer sessions.
2. **Payment webhook endpoint** — must be reachable without auth (Razorpay calls it) but must not be spoofable. Mitigation: HMAC signature verification is the *first* line of code executed, before any parsing of the payload; the endpoint is otherwise treated as fully untrusted input.
3. **Coupon/promotion abuse** — automated scripts trying codes, or exploiting a race to redeem a single-use coupon multiple times. Mitigation: rate limiting on `/v1/coupons/apply`, atomic `used_count` increments (Part 7), per-customer usage caps enforced server-side.
4. **Credential stuffing / brute force on login** — mitigated by rate limiting (per-IP and per-account), Cloudflare bot management, and never revealing "email exists but password wrong" vs. "email doesn't exist" (uniform error message).
5. **File upload (reviews with photos, future B2B document upload)** — strict MIME-type allow-listing validated server-side (not trusting the client-supplied `Content-Type`), file size limits, re-encoding images server-side (strips embedded scripts/EXIF), uploaded to R2 with randomized keys (never user-controlled paths), served from a separate domain/subdomain from the main app to prevent any stored-content XSS from running in the app's origin.
5b. **CSRF**: `SameSite=Lax/Strict` cookies plus double-submit CSRF tokens on state-changing form submissions from the web app is the belt-and-suspenders approach — SameSite alone is strong but not infinite protection against all edge cases (e.g., some legacy browser behavior), so both layers are used for the checkout/payment paths specifically.
5c. **CORS**: allow-list of exact origins (the Next.js app's domain(s), nothing else) — never `Access-Control-Allow-Origin: *` on any authenticated endpoint.
6. **XSS**: React/Next.js escapes by default; the specific danger zones are `dangerouslySetInnerHTML` (used only for sanitized CMS/blog content, run through a strict allow-list HTML sanitizer server-side before storage) and any admin-authored HTML.
7. **Secrets in the frontend bundle**: enforced by the `server-only` package pattern (Part 5) plus a CI check that fails the build if any `NEXT_PUBLIC_*` env var name pattern matches a known-sensitive key naming convention.
8. **Personal data protection**: India's DPDP Act (Digital Personal Data Protection Act) applies — consent capture for marketing communications, data export/deletion capability for customer requests, PII minimized in logs (phone/email are hashed or redacted in application logs, full values only in the database with restricted access).
9. **Dependency vulnerabilities**: automated scanning in CI blocks merges on critical/high CVEs in direct dependencies; a defined patch SLA (critical: 48h, high: 1 week) rather than an open-ended "we'll get to it."
10. **Logging sensitive information**: passwords, tokens, full card numbers (which KAICHO never touches directly — Razorpay's hosted checkout means PCI scope stays minimal, SAQ-A level, not full PCI-DSS) are explicitly excluded from all log output via a redaction middleware, not developer discipline alone.

---

## PART 16 — Caching

```text
Browser (Cache-Control per-response, short/none for user-specific pages)
   ↓
Cloudflare CDN (static assets: 1yr immutable; ISR HTML: matches Next.js revalidate window; images: 1yr)
   ↓
Next.js Data/Fetch Cache + ISR (revalidate windows per Part 4's table; tag-based invalidation)
   ↓
Redis (API-layer cache: product reads, category reads; 30–120s TTL; NEVER user-specific data)
   ↓
PostgreSQL (source of truth, always consulted for: price at add-to-cart, stock at checkout, payment state)
```

| Layer | What's cached | TTL | Invalidation |
|---|---|---|---|
| Cloudflare CDN | Static JS/CSS/fonts, product images, fully static/ISR marketing HTML | 1yr (assets, content-hashed filenames), matches ISR window (pages) | Automatic via content-hash for assets; `Cache-Tag` purge on page publish for HTML |
| Next.js | ISR pages, `fetch()` cache for server-rendered data | 60s (listing/PDP), 5–15min (marketing) | `revalidateTag`/`revalidatePath` triggered by an admin-mutation webhook |
| Redis | Product/category read models, session/refresh-token lookups, rate-limit counters | 30–120s (product data), matches token TTL (sessions) | TTL expiry + explicit invalidation on product/inventory mutation |
| Postgres | — (source of truth) | — | — |

- **Cache stampede prevention**: for hot keys (a viral product during a sale), the Redis cache layer uses a short **lock + single-flight** pattern (first request to see a cache miss acquires a short lock and repopulates; concurrent requests wait briefly or serve slightly-stale data rather than all hammering Postgres simultaneously).
- **Cache keys**: always namespaced and never include anything user-specific for shared caches (`product:v1:{slug}`, `category:v1:{slug}:page:{n}` — versioned prefix so a schema change can invalidate everything at once by bumping the version segment).
- **Price/inventory/promotions — the rule that overrides all caching layers**: any layer *may* serve a cached price/stock number for **display**, but the **checkout/payment path always re-reads from Postgres inside the reservation transaction** (Part 8), full stop. Caching is a browsing-performance optimization, never a source of truth for a financial decision. This is stated three times in this document (here, Part 4, Part 10) deliberately — it is the single most important caching rule in an e-commerce system and the most common way "caching" causes a real financial incident (charging a stale price, selling stock that's gone).
- **User-specific data (cart, checkout, account)**: `Cache-Control: private, no-store` at every layer — never cached at the CDN, never in the shared Redis product-cache namespace.

---

## PART 17 — Search

**Start with PostgreSQL full-text search.** `tsvector`/`tsquery` for relevance-ranked text search on product name/description, `pg_trgm` (trigram) indexes for typo-tolerant/fuzzy matching ("prridge" still finds "porridge"), combined with standard `WHERE` filters for category/price/attributes. This handles KAICHO's realistic catalog size (dozens to low hundreds of SKUs, not millions) with **zero additional infrastructure, zero additional monthly cost, zero additional operational surface.**

### Measurable triggers to justify a dedicated search engine (Meilisearch first choice; Algolia/OpenSearch only if a specific need — e.g., Algolia's merchandising UI, or OpenSearch if already deep in AWS's observability stack for log search — demands it):

- Catalog exceeds **~5,000–10,000 SKUs** (Postgres FTS query latency starts becoming noticeable well before this, but this is a reasonable planning threshold).
- Search-relevance quality is demonstrably hurting conversion (measured: search→purchase conversion rate meaningfully lower than browse→purchase, A/B-tested, not assumed).
- A genuine need for faceted search UI with sub-100ms interactive filtering across many simultaneous facets (Postgres can do this but the query complexity/index maintenance burden crosses over to "a search engine would be simpler" past a certain facet-count).
- Multi-language/typo-tolerance requirements exceed what `pg_trgm` reasonably provides.

At that point: **Meilisearch** (self-hosted on the existing ECS cluster, or Meilisearch Cloud starting ~$30/mo) is the recommended next step over Algolia (materially more expensive at scale) or OpenSearch/Elasticsearch (justified only if there's already an operational reason to run the ELK/OpenSearch stack, e.g., centralized log search at a scale where CloudWatch Logs Insights becomes limiting — not justified by product search alone).

---

## PART 18 — Storage & Images

```text
Admin/Customer upload → Backend issues a short-lived SIGNED UPLOAD URL (R2 presigned PUT)
   → Client uploads directly to R2 (bypasses the API for the actual bytes — no server bandwidth cost)
   → Backend receives an upload-complete callback/polling confirmation, validates:
       - MIME type (server-side content sniffing, not trusting client Content-Type header)
       - File size limit
       - Image dimensions sane
   → Async job (Part 12): generate responsive variants (multiple widths) + WebP/AVIF encodes,
     write back to R2 under a content-hashed key
   → Cloudflare CDN in front of R2 for delivery, with cache-busting via content-hashed filenames
```

- **Responsive images**: `next/image` requests the appropriately-sized variant per breakpoint via a `srcset`; source-of-truth original stored once, derived sizes generated once (not on every request) and cached at the CDN indefinitely (content-hashed = safe to cache forever).
- **Signed URLs**: uploads never go through a public unauthenticated endpoint — every presigned URL is short-lived (minutes) and scoped to a specific key.
- **Validation**: MIME allow-list (`image/jpeg`, `image/png`, `image/webp` for product/review images), size caps (e.g., 10MB), dimension sanity checks, and images are **re-encoded server-side** (not just validated) before being served publicly — this neutralizes most image-based exploit payloads (e.g., polyglot files) as a side effect of legitimate resizing.
- **Malware considerations**: for any future user-generated upload path (review photos), files are scanned (e.g., via a ClamAV Lambda or a managed scanning service) before being marked "published" — admin-uploaded product images are lower risk (trusted internal users) but the pipeline is the same either way for consistency.
- **Storage lifecycle**: unused/orphaned uploads (abandoned admin upload flows) are swept by a scheduled job after 24h if never linked to a product; product images are retained indefinitely (needed for order history — a product page can change, but a historical order should be able to show what was actually purchased, which argues for **not** deleting images tied to past orders even if a product is discontinued).
- **Backup**: R2 objects are the origin; a lifecycle policy replicates to a secondary bucket/region for disaster recovery of media assets specifically (cheap insurance against accidental bulk deletion).

---

## PART 19 — Cloud Architecture (AWS vs. GCP)

| Criterion | AWS | GCP |
|---|---|---|
| India region maturity | `ap-south-1` (Mumbai) is one of AWS's most mature non-US regions — full service parity | `asia-south1` (Mumbai) exists but historically trails AWS in service breadth/release cadence in-region |
| Managed Postgres | RDS + RDS Proxy — mature, well-documented, IAM-integrated | Cloud SQL for Postgres — solid, slightly less tooling maturity around proxying at this scale |
| Managed Redis | ElastiCache — mature | Memorystore — comparable, fine either way |
| Object storage + CDN | S3 (paid egress) — but we're using **R2**, not S3, specifically to route around this | GCS — similar egress economics to S3 |
| WAF/DDoS/CDN | Delegated to Cloudflare regardless of cloud choice — this axis is neutral | Same |
| Talent pool (India-based hiring, which matters for a long-term India business) | Larger AWS-skilled talent pool in India currently | Smaller, growing GCP talent pool |
| Third-party integration precedent | Razorpay, Indian logistics providers (Shiprocket, Delhivery), and Indian SaaS tooling more commonly document AWS integration | Less common in this specific ecosystem |
| Cost at this scale | Broadly comparable; AWS Graviton (ARM) instances give a real price/performance edge | Broadly comparable |
| Container operations without Kubernetes | ECS Fargate — genuinely simple, no cluster to manage | Cloud Run is arguably *even simpler* than ECS Fargate for pure stateless HTTP services |

**GCP's Cloud Run is a legitimate, arguably simpler alternative to ECS Fargate specifically** — worth naming honestly rather than hand-waving away. It loses to AWS here on three practical grounds specific to KAICHO: (1) `ap-south-1`'s deeper service/tooling maturity, (2) the Indian third-party ecosystem (logistics, payments, compliance tooling) has denser AWS integration precedent, and (3) RDS Proxy + ElastiCache + Secrets Manager + IAM form a more complete, more commonly-hired-for skill set for a long-term India-based engineering team.

### DECISION: **AWS**, `ap-south-1` (Mumbai) as primary region.

Compute: ECS Fargate (not EKS/Kubernetes — no polyglot-services need, no team-topology need for Kubernetes' complexity at this scale). Database: RDS PostgreSQL Multi-AZ. Cache/queue backing: ElastiCache for Redis. Secrets: Secrets Manager. Networking: single VPC, private subnets for API/DB/Redis, public subnets only for the ALB. **Frontend hosting is a deliberate exception**: Next.js runs on **Vercel**, not on AWS. This is not "half the stack is on a different cloud by accident" — it's a specific, defensible call: Vercel's Next.js-specific optimizations (ISR, Edge Middleware, image optimization, zero-config preview deployments per PR) have real, measurable DX and performance ROI, and the frontend holds no business-critical transactional state — it's a stateless rendering layer calling a versioned API over HTTPS. The same logic that justifies R2 (Part 18) over forcing everything into S3 applies here: a narrow, well-justified cross-vendor boundary around a component that's stateless and swappable, not a violation of "avoid unnecessary complexity."

---

## PART 20 — Environments

| | Development | Staging | Production |
|---|---|---|---|
| Database | Local Postgres (Docker) or a dev RDS instance, seeded fixture data | Dedicated RDS instance, periodically refreshed from a **scrubbed/anonymized** production snapshot | RDS Multi-AZ, real customer data, strict access control |
| Redis | Local Docker | Dedicated ElastiCache (small) | Dedicated ElastiCache (Multi-AZ at scale) |
| Secrets | `.env.local`, never committed, dummy/test credentials | Separate Secrets Manager path, **test-mode** Razorpay keys | Separate Secrets Manager path, live Razorpay keys, tightest IAM scoping |
| Payment credentials | Razorpay test mode | Razorpay test mode | Razorpay live mode — **physically different API keys**, never reachable from staging/dev code paths even by misconfiguration (enforced by separate Secrets Manager paths + separate IAM roles per environment, not just an env var swap) |
| Storage | Local/dev R2 bucket | Separate staging R2 bucket | Separate production R2 bucket |
| Domains | `localhost` | `staging.kaicho.in` (noindex, optionally behind basic auth) | `kaicho.in` |

**No accidental staging → production access**: enforced structurally, not by convention — separate AWS accounts (or at minimum separate VPCs with no peering) for staging and production, separate IAM roles with no cross-environment permissions, CI/CD pipelines that inject environment-scoped credentials per deploy target (a staging deploy literally cannot obtain production secrets because its pipeline identity has no IAM permission to read them).

---

## PART 21 — High Availability & Failure Design

| Failure | Timeout | Retry | Backoff | Circuit breaker | Fallback | Recovery/Alerting |
|---|---|---|---|---|---|---|
| **API instance (ECS task) crashes** | ALB health check (10s interval) | ECS auto-replaces the task | N/A | N/A | Traffic routes to remaining healthy tasks | CloudWatch alarm on task count drop |
| **Next.js instance issue** | Vercel platform-managed | Vercel-managed | N/A | N/A | Vercel's own multi-instance routing | Vercel status + Sentry |
| **Redis fails** | Client-side connect timeout (short) | Limited retry with backoff | Yes | Yes — API stops attempting Redis after N consecutive failures for a cooldown window | Degrade per Part 11 (cache miss → DB; rate-limit fail-safe per endpoint sensitivity) | PagerDuty/Slack alert; ElastiCache Multi-AZ auto-failover for the primary node |
| **PostgreSQL unavailable** | Connection timeout (few seconds) | Application-level retry only for read-only idempotent queries | Yes | Yes on the connection layer | **None for writes** — a write that can't reach the DB fails loudly (never silently "succeeds" without persistence); RDS Multi-AZ auto-failover (typically <60s) | Immediate high-severity alert — this is the one dependency with no graceful degradation, by design, because pretending an order was placed without a DB write would be worse than an honest error |
| **Worker crashes** | N/A (mid-job) | BullMQ requeues jobs whose lock/heartbeat expires | Yes (job-level backoff, Part 12) | N/A | Other worker replicas continue processing | ECS replaces the task; queue depth alarm if processing stalls |
| **Payment gateway (Razorpay) fails** | Short timeout on order-creation call | No aggressive retry (avoid duplicate payment intents) | N/A | Yes — stop attempting new payment intents briefly after repeated failures, show a clear customer message | Order stays in `ORDER_CREATED` with reservation intact until timeout | Alert; reconciliation job catches anything missed once the gateway recovers |
| **Email provider fails** | Provider SDK default | Yes (queued job retry, Part 12) | Yes | N/A | Order still succeeds — email is fire-and-forget, never blocks checkout | Failed-job alert if failure rate spikes |
| **SMS/WhatsApp provider fails** | Same as email | Yes | Yes | N/A | Same — never blocks checkout | Same |
| **External API timeout (any third party)** | Always explicit, always short (2–5s) | Bounded (2–3 attempts) for idempotent calls only | Yes | Yes for chatty dependencies | Never let one slow dependency exhaust the request thread pool | Latency alarms per dependency |
| **CDN (Cloudflare) fails** | N/A | N/A | N/A | N/A | DNS-level failover path documented (direct-to-origin as a last resort, accepting reduced protection temporarily) | Cloudflare status page + external synthetic monitoring (Part 22) |

**"High availability" here means, concretely**: Multi-AZ RDS (automatic primary failover), N≥2 ECS tasks behind an ALB across multiple AZs (no single task is a single point of failure), ElastiCache Multi-AZ once traffic justifies it, and a documented, tested (not just written) failure response for every dependency above — not a marketing claim.

---

## PART 22 — Observability

- **Structured logging**: JSON logs (Pino, which Fastify uses natively) with a consistent shape (`timestamp`, `level`, `requestId`, `userId?`, `module`, `message`), shipped to CloudWatch Logs, PII-redacted (Part 15).
- **Metrics**: CloudWatch custom metrics + a Grafana Cloud dashboard (or CloudWatch Dashboards if minimizing vendor count) for: RPS, P50/P95/P99 latency (per route), error rate (4xx vs 5xx separately), DB query latency, DB connection pool utilization, Redis latency, **cache hit ratio**, queue depth per queue, failed-job count, payment failure rate, order failure rate, CPU/memory per ECS service, network throughput.
- **Distributed tracing**: AWS X-Ray (or OpenTelemetry → a vendor of choice) across API → DB/Redis/external calls, so a slow checkout request can be traced to exactly which downstream call was slow, not guessed at.
- **Error tracking**: Sentry, both frontend (Next.js) and backend (NestJS), with release tracking so a regression can be pinned to a specific deploy.
- **Health/readiness/liveness checks**: `/healthz` (process is up), `/readyz` (DB + Redis reachable — used by the ALB target group and ECS), distinct endpoints because "the process is running" and "the process can actually serve a request" are different questions and conflating them causes bad rolling-deploy behavior.
- **External synthetic monitoring**: Better Stack/UptimeRobot hitting the real public site from outside the infrastructure — the only check that catches "Cloudflare/DNS/ALB is misconfigured and internal health checks look fine but the site is actually down for real users."
- **Alert routing**: Slack for warnings, PagerDuty (or equivalent) for anything customer-impacting (payment failures spiking, DB unreachable, error rate above threshold) — alert fatigue is a real failure mode, so alarms are tuned to page only on genuinely actionable, customer-impacting conditions.

---

## PART 23 — Testing Strategy

```text
                E2E (Playwright)
               /                \
        Integration (module + DB, Testcontainers)
       /                                          \
   API / Contract (supertest against real NestJS app, real Postgres)
  /                                                              \
                          Unit (domain logic, pure functions)
```

- **Unit tests**: domain logic (order state machine, inventory availability calculation, coupon eligibility rules, pricing math) — fast, no DB, no network, the majority of the test count.
- **Integration tests**: application services against a real ephemeral Postgres (Testcontainers) — this is where "does the inventory reservation transaction actually prevent oversell under concurrent requests" gets tested for real, not mocked.
- **API/contract tests**: full HTTP request/response cycle against the running Nest app, verifying the actual API contract (status codes, response shape) that Next.js/mobile clients depend on — catches accidental breaking changes before they ship.
- **E2E (Playwright)**: a **small, deliberately curated** set of critical user journeys — browse → add to cart → checkout → payment (using Razorpay's test mode) → order confirmation; login/logout; password reset. Not "every page," because broad UI E2E suites are notoriously slow and flaky and become a maintenance tax that teams eventually just stop running.
- **Load testing** (k6 or similar): scripted against staging, scenarios defined in Part 24.
- **Security testing**: dependency scanning in CI (every PR), and a periodic (quarterly, or before major traffic events like a festival sale) third-party penetration test — not something to build entirely in-house.

### What should NOT be tested (deliberately)

- Framework internals (don't test that Prisma correctly runs SQL, or that NestJS correctly routes a decorator — that's the framework's job).
- Every CSS pixel via visual-regression E2E — high cost, low signal relative to effort, except perhaps a small snapshot set for the checkout flow specifically where a broken layout has real revenue impact.
- 100% code coverage as a target — coverage is a signal, not a goal; a codebase can hit 100% coverage while testing nothing that matters (e.g., testing getters/setters) while missing the one concurrent-checkout race condition that actually costs money. **Tests are prioritized by business risk**, not by coverage percentage: inventory, payments, order state transitions, and auth get the deepest test investment; a static "About Us" page gets essentially none.

---

## PART 24 — Performance & Load Testing

Rejecting "Fastify is fast enough" as an answer — here is the actual analysis.

### Defined scenarios

| Scenario | CCU | Estimated RPS (read-heavy, ~85/15 read/write) | Primary bottleneck to watch |
|---|---|---|---|
| **1,000 CCU** | 1,000 | ~150–250 RPS | None expected — single API task + `db.t4g/m6g.medium`-class RDS instance handles this comfortably |
| **3,000 CCU** | 3,000 | ~450–750 RPS | DB connection count if pooling isn't yet configured correctly; Redis cache hit ratio starts mattering |
| **5,000 CCU** (stated target) | 5,000 | ~750–1,250 RPS | **RDS Proxy/PgBouncer configuration** becomes the deciding factor, not raw compute; cache hit ratio on product pages must be >90% or Postgres read load becomes the bottleneck |
| **10,000 CCU** | 10,000 | ~1,500–2,500 RPS | Read replica likely needed for reporting/admin queries to stop competing with transactional traffic; ECS task count scales horizontally (stateless API — this is the easy part) |
| **25,000+ CCU** | 25,000+ | ~3,750–6,250 RPS | Primary DB write throughput on inventory/order tables during peak checkout bursts (flash sales); this is where read replicas, more aggressive queuing of non-critical writes, and possibly a dedicated "flash sale mode" (stricter queueing of checkout attempts) become genuinely necessary engineering, not infrastructure sizing alone |

**Read/write ratio assumption**: e-commerce browsing traffic is read-dominated (~85–90% reads: product views, listing, search) with a concentrated write burst specifically at checkout — this asymmetry is *why* caching (Part 16) matters so much for scaling reads, and why the *inventory/order write path* (Part 8/9), not general API throughput, is the real ceiling at the higher end.

**What's actually measured in each load test**: P50/P95/P99 latency per key endpoint (product listing, PDP, add-to-cart, checkout, payment webhook processing), error rate under load, DB connections in use vs. pool ceiling, DB query latency (especially the `FOR UPDATE` inventory lock under concurrent contention on a single hot SKU — this is deliberately load-tested as its own scenario, "1,000 concurrent buyers of the same SKU," separately from general traffic, because it's a qualitatively different kind of load), Redis latency and hit ratio, CPU/memory per ECS task (to calibrate autoscaling thresholds correctly, not guess at them), and CDN cache hit ratio at Cloudflare.

**Bottleneck progression, honestly**: at 1,000–3,000 CCU, nothing in this architecture is under real strain. At 5,000 CCU, correct connection pooling and cache hit ratio are what stand between "runs fine" and "runs fine" — the architecture doesn't need to change, but it needs to be *configured* correctly, which is why Part 1 flags connection exhaustion as risk #1. At 10,000+, a read replica is the first genuine infrastructure change required. At 25,000+, the inventory/order write path on hot SKUs during concentrated bursts (flash sales) is the first place that might need actual application-level design work beyond "add more infrastructure" — e.g., a short-lived in-memory/Redis-backed queue in front of checkout for a specific SKU during a declared flash-sale window, to smooth a write burst into the database rather than let thousands of transactions all contend on the same row simultaneously.

---

## PART 25 — Scaling Strategy (phased, metric-triggered — not user-count-triggered)

### Phase 1 — Small production (launch)

- 1 ECS API task minimum, autoscale 1→3 on CPU >70%
- 1 ECS worker task
- RDS `db.t4g.medium` or `db.m6g.large`, single-AZ (Multi-AZ is cheap enough to enable from day one for a real business, but genuinely optional at this stage)
- ElastiCache single small node
- No read replica
- **Trigger to Phase 2**: sustained P95 API latency creeping up, or DB CPU consistently >50% at normal (non-sale) traffic, or real analytics showing traffic approaching the low thousands of daily active users

### Phase 2 — ~5,000 CCU class

- ECS API autoscale 2→6 on CPU/RPS, across 2+ AZs
- RDS Multi-AZ, `db.m6g.large`/`xlarge` depending on measured load, RDS Proxy mandatory
- ElastiCache Multi-AZ
- CDN cache hit ratio actively monitored and tuned (this is the actual "scaling work" at this phase, more than infrastructure size)
- **Trigger to Phase 3**: read replica candidacy — DB read QPS on the primary consistently competing with write latency, or reporting queries measurably impacting checkout latency

### Phase 3 — 10,000–25,000 CCU class

- ECS API autoscale up to double digits of tasks
- RDS read replica(s) added — admin/reporting/analytics queries routed there explicitly
- Worker service scaled independently based on queue depth, not CPU
- Search: reassess against Part 17's triggers
- Flash-sale-specific checkout smoothing (Part 24) implemented if the business runs high-concentration sale events
- **Trigger to Phase 4**: sustained (not just event-spike) traffic at this level, or a second major consistency-sensitive bottleneck identified by load testing that infrastructure scaling alone can't solve

### Phase 4 — Large-scale production

- This is the point at which specific modules with genuinely independent scaling/failure/team-ownership needs (Part 26's extraction triggers) get pulled out of the monolith into separate services — **not before**, and not as a wholesale microservices rewrite, but one module at a time, driven by a specific measured need.
- Multi-region read replicas if the customer base genuinely globalizes beyond India.
- Dedicated search engine if not already adopted.

**Every phase transition above is gated on a measured metric, not a round-number user-count milestone** — this directly answers the brief's instruction not to scale on user count alone.

---

## PART 26 — Modular Monolith vs. Microservices

**Modular monolith. Not close.**

KAICHO today has one engineering team (implicitly — nothing in the brief suggests otherwise), a catalog measured in dozens of SKUs, and a traffic target that (even taken at face value) doesn't approach the level where microservices' benefits (independent scaling, independent deployment, team-topology isolation, polyglot runtime needs) outweigh their costs (distributed transactions, network-call latency and failure modes between every module boundary, operational overhead of running and monitoring N services instead of 1–2, the sheer engineering time spent on service-to-service auth/discovery/observability instead of product features).

Nest's module boundaries (Part 6) are deliberately designed so that **if** a specific extraction trigger is met later, pulling a module out is mechanical: the module already only depends on other modules through exported interfaces, already owns its own repository layer, already communicates cross-module changes through domain events rather than direct calls — the seams are already there.

### Objective extraction triggers (not "because it's a big module")

- **Independent scaling need, demonstrated**: e.g., the notifications worker needs to scale to 50 instances during a campaign while the API needs only 3 — at that point, it already runs as a separate ECS service (Part 3), which is as far as it needs to go without becoming a "microservice" with its own database/team.
- **Failure isolation need, demonstrated**: a specific module's failure mode is repeatedly taking down unrelated functionality despite correct internal error handling — e.g., if a future B2B bulk-ordering feature has fundamentally different load characteristics that risk starving consumer checkout resources even with the module boundary in place.
- **Team ownership**: a second engineering team forms and needs to own a domain end-to-end (deploy independently, choose its own release cadence) without coordinating every deploy with the core team — this is the classic, legitimate Conway's-Law-driven trigger, and it requires an actual second team, not a hypothetical one.
- **Deployment independence, demonstrated pain**: the monolith's deploy cadence is genuinely blocked by unrelated changes often enough to measurably slow shipping (e.g., a slow-moving reporting feature repeatedly delaying urgent checkout fixes because they share a deploy pipeline) — mitigated first by better CI/CD practices (Part 30) before concluding a service split is the fix.
- **Resource contention, demonstrated**: a specific module's query/compute pattern is measurably starving others of DB connections or CPU despite tuning — e.g., a genuinely heavy reporting/analytics workload, which is exactly the kind of thing that should move to a read replica or a separate analytics store *before* justifying a full service extraction.
- **Security isolation**: a module handles data with a genuinely different compliance/access profile (e.g., a future payments-adjacent PCI scope expansion) that benefits from network-level isolation beyond what IAM roles/VPC security groups already provide within the monolith.
- **Different technology requirement**: a module needs a runtime/language the rest of the stack doesn't (e.g., a future ML-based recommendation engine in Python) — this is the one trigger most likely to actually fire for KAICHO, and even then, the correct first move is a narrow, single-purpose service (like the search engine in Part 17), not a wholesale architecture change.

**Do not split services simply because modules exist** — that's explicitly rejected. Modules existing is what makes a *future, evidence-driven* split cheap; it is not itself a reason to split.

---

## PART 27 — Cost (grounded in current 2026 pricing where publicly available)

*Figures below are directional planning estimates in USD, based on current published pricing at the time of writing; always re-verify against current provider pricing pages before budgeting.*

### Development
- RDS `db.t4g.micro`/small, single-AZ, or local Docker Postgres: **~$0–20/mo**
- ElastiCache small/local: **~$0–15/mo**
- Vercel Hobby/free tier: **$0**
- R2: within free tier (10GB storage, free egress) for dev assets: **~$0**
- **Total: ~$0–40/mo**

### Early production (pre-scale, Phase 1)
- ECS Fargate: 1–2 small tasks (API) + 1 small task (worker): **~$40–80/mo**
- RDS `db.m6g.large`, Multi-AZ: **~$250–320/mo** (Multi-AZ roughly doubles single-AZ compute cost)
- ElastiCache small node: **~$25–50/mo**
- Vercel Pro: **$20/seat/mo** + usage (1TB bandwidth included, ~$0.15/GB beyond — [Vercel pricing](https://checkthat.ai/brands/vercel/pricing))
- R2: image-heavy catalog, tens of GB, **zero egress fee** is the meaningful win here vs. S3 — **~$10–30/mo** ([R2 pricing](https://egresscost.com/cloudflare/))
- Cloudflare Pro (WAF/CDN tier): **~$25/mo**
- Sentry Team plan: **~$26–29/mo base** ([Sentry pricing](https://last9.io/blog/sentry-pricing/))
- Razorpay: **no fixed fee**, 2% + GST per transaction ([Razorpay pricing](https://razorpay.com/blog/razorpay-payment-gateway-charges/)) — this scales with revenue, not infrastructure, and is the correct way to think about it (it's a cost of doing business, not an infra line item)
- **Total infra (excluding payment processing %): roughly $400–550/mo**

### ~5,000 CCU (Phase 2)
- ECS Fargate: 3–6 API tasks + 2 worker tasks, autoscaled: **~$150–300/mo**
- RDS `db.m6g.xlarge`, Multi-AZ, RDS Proxy: **~$550–750/mo**
- ElastiCache Multi-AZ: **~$100–180/mo**
- Vercel Pro (multiple seats) + bandwidth overage: **~$150–400/mo** depending on traffic
- R2: **~$50–100/mo**
- Cloudflare Business tier (if warranted by traffic/WAF needs): **~$200/mo**
- Observability (Sentry Business + Grafana Cloud/CloudWatch): **~$150–300/mo**
- **Total: roughly $1,400–2,200/mo**

### 10,000–25,000 CCU (Phase 3)
- ECS Fargate: double-digit task counts across API/worker: **~$500–1,200/mo**
- RDS primary + 1–2 read replicas, larger instance class: **~$1,500–2,500/mo**
- ElastiCache, larger Multi-AZ cluster: **~$300–500/mo**
- Vercel Enterprise (likely needed at this traffic level for support SLAs/advanced controls): **custom pricing, budget $1,000+/mo**
- R2/CDN: **~$150–300/mo**
- Observability, on-call tooling (PagerDuty etc.): **~$400–700/mo**
- **Total: roughly $4,000–6,500/mo**

### Large-scale production
- Custom-negotiated AWS pricing (Enterprise Discount Program), likely multi-AZ + read replica fleet, possibly the first genuine service extractions (Part 26) with their own resource allocation — **budgeting exercise at this point depends entirely on which modules extracted and real measured load, not a template number.**

**Where spending more money helps**: RDS instance class/read replicas (directly reduces the #1 real bottleneck), Vercel/Cloudflare tier upgrades for genuinely higher traffic (buys real headroom and support SLAs), and observability tooling (directly reduces mean-time-to-detect/resolve, which has real revenue impact during incidents).

**Where spending more money does NOT help**: over-provisioning ECS task count beyond what autoscaling metrics justify (pure waste — the entire point of autoscaling is not paying for idle capacity), adopting a dedicated search engine before Part 17's triggers are met, or moving to microservices "for scale" before Part 26's triggers are met — none of these purchase real reliability or performance at KAICHO's actual current scale; they purchase complexity.

---

## PART 28 — Codebase Structure

**Backend (NestJS, `apps/api/`):**

```text
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── application/          # services, use cases
│   │   │   ├── domain/               # pure business rules, entities
│   │   │   ├── infrastructure/       # Prisma repo, external adapters
│   │   │   └── dto/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── coupons/
│   │   ├── notifications/
│   │   └── admin/
│   ├── shared/
│   │   ├── guards/
│   │   ├── interceptors/             # logging, error normalization
│   │   ├── decorators/
│   │   ├── filters/                  # global exception filter
│   │   └── events/                   # domain event bus setup
│   ├── infrastructure/
│   │   ├── prisma/
│   │   ├── redis/
│   │   ├── queue/                    # BullMQ setup
│   │   └── config/                   # env validation (Zod-validated at boot)
│   ├── main.ts
│   └── app.module.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── workers/                          # separate entrypoint, shares modules with the API
    └── main.worker.ts
```

**Frontend**: see Part 5.

**Infrastructure (`infra/`, Terraform):**

```text
infra/
├── modules/
│   ├── vpc/
│   ├── ecs/
│   ├── rds/
│   ├── elasticache/
│   ├── secrets/
│   └── monitoring/
├── environments/
│   ├── staging/
│   └── production/
└── README.md
```

This stays understandable at hundreds of files because the **module boundary is the unit of navigation**, not the file count — a developer working on coupons never needs to open `orders/` or `payments/` internals, only their exported interfaces.

---

## PART 29 — Engineering Standards

- **TypeScript**: `strict: true` everywhere, no `any` without an explicit `// eslint-disable` + justification comment, shared `tsconfig.base.json`.
- **ESLint/Prettier**: shared config package (Part 5's `packages/config`), enforced in CI, not just editor-configured (a red CI check, not a suggestion).
- **Naming**: `PascalCase` classes/components, `camelCase` functions/variables, `kebab-case` file names except React components (`PascalCase.tsx`), DB tables/columns `snake_case` (Postgres convention), API routes `kebab-case`.
- **Git/branching**: trunk-based with short-lived feature branches (`feat/`, `fix/`, `chore/`), no long-lived `develop` branch (unnecessary merge overhead at this team size) — `main` is always deployable, feature flags (Part 30) gate incomplete work.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`) — enables automated changelog generation and makes `git log` actually useful later.
- **Pull requests**: small, single-purpose, template requires "what changed / why / how tested"; no PR merges without at least one approval and a green CI pipeline.
- **Code review**: focused on correctness, security (does this touch auth/payments/inventory — extra scrutiny), and adherence to the module boundaries in Part 6 — not bikeshedding formatting (that's Prettier's job, not a reviewer's).
- **Error handling**: domain errors are typed exceptions (`InsufficientStockError`, `InvalidOrderTransitionError`), caught by a global exception filter that maps them to the correct HTTP status/error code (Part 13) — controllers never `try/catch` and swallow errors silently.
- **Logging**: structured (Part 22), never `console.log` in application code.
- **API contracts**: OpenAPI generated from code (Part 13), reviewed as part of any PR that changes a public endpoint shape.
- **Database migrations**: reviewed with the same rigor as code, expand-contract for anything touching live tables (Part 7), never run manually against production outside CI/CD.
- **Environment variables**: validated at process boot (Zod schema) — the app refuses to start with a missing/malformed required env var rather than failing mysteriously at request time.
- **Documentation**: a living `docs/` folder per module explaining *why* (business rules, edge cases handled) — not restating what the code already says.
- **Secrets**: never in git, ever (enforced by a pre-commit secret-scanning hook + CI secret scanning as a second layer), rotated on a schedule and immediately on any suspected exposure.
- **Dependency management**: `pnpm` workspaces (fast, disk-efficient for a monorepo), lockfile committed, Dependabot/Renovate for automated update PRs, security patches prioritized over feature-version bumps.

---

## PART 30 — CI/CD

```text
Developer → PR
   ↓
Lint (ESLint) + Format check (Prettier)
   ↓
Type check (tsc --noEmit, both apps)
   ↓
Unit tests
   ↓
Integration tests (Testcontainers Postgres/Redis)
   ↓
Build (Next.js build, Nest build, Docker images)
   ↓
Security scan (dependency CVEs, container image scan, secret scan)
   ↓
Deploy to Staging (automatic on merge to main)
   ↓
E2E (Playwright, against staging, including Razorpay test-mode checkout)
   ↓
Manual approval gate (for production)
   ↓
Deploy to Production (blue/green or rolling via ECS)
   ↓
Automated post-deploy health check (readyz + a small synthetic smoke test)
   ↓
Automatic rollback if health check fails within a defined window
```

- **Zero-downtime deployment**: ECS rolling deployment with `minimumHealthyPercent`/`maximumPercent` tuned so new tasks pass health checks before old tasks are drained — no request-dropping window. Vercel's deployment model is zero-downtime natively (atomic deploys, instant rollback to a prior deployment).
- **Database migration safety**: migrations run as a **separate CI step before** the new application version is deployed, always expand-contract (Part 7) so the *previous* app version keeps working against the *new* schema during the rollout window — this is what makes rolling deploys safe with a shared database.
- **Rollbacks**: application rollback is "redeploy the previous container image/Vercel deployment" (fast, automatic on failed health check); a migration rollback is **never automatic** (schema rollbacks are inherently riskier than forward-fixing) — a bad migration is fixed forward with a new corrective migration, not reverted blindly.
- **Feature flags**: a lightweight flag service (could start as simple as an environment-config-driven flag table, growing into a proper service like LaunchDarkly/Unleash only if flag usage genuinely warrants it) so incomplete features merge to `main` behind a flag rather than living on a long-lived branch.
- **Deployment strategy**: rolling for the API (simple, sufficient at this scale); blue/green reserved for changes carrying genuinely higher risk (e.g., a major payment-flow change) where instant full rollback matters more than the extra infrastructure cost of running two full environments briefly.

---

## PART 31 — Disaster Recovery

- **Backup frequency**: RDS automated daily snapshots + continuous WAL archiving for PITR (any point within the retention window, not just daily snapshot granularity).
- **RPO (Recovery Point Objective)**: **≤5 minutes** for the primary database, achieved via PITR's continuous log shipping — a failure at any moment loses at most a few minutes of the most recent transactions.
- **RTO (Recovery Time Objective)**: **Multi-AZ automatic failover: typically under 60–120 seconds** for an AZ-level failure (no manual intervention required). For a full region-level disaster (rare, but must be planned): **target 2–4 hours** to restore from cross-region snapshot copies into a fresh `ap-southeast-1` (Singapore) deployment — this is a documented runbook, not an assumption.
- **Database restore procedure**: documented, and — critically — **tested on a schedule** (e.g., quarterly game-day: restore the latest production snapshot into a scratch environment, verify data integrity, time the process) — a backup that's never been restored is a hypothesis, not a recovery plan.
- **Infrastructure recovery**: entirely re-creatable from Terraform (Part 28) — a full-region loss means re-running `terraform apply` against a new region with the last cross-region-replicated DB snapshot and R2 data, not manually reconstructing infrastructure from memory/console clicks.
- **Regional failure**: cross-region snapshot replication (RDS) + R2's built-in durability/optional cross-region replication for media; DNS (Route 53) failover routing pre-configured (not "we'll figure out DNS during the incident").
- **Data corruption / accidental deletion**: PITR covers "restore to the moment before a bad `DELETE` ran"; the append-only `inventory_ledger` and `order_status_history` tables (Part 7/8/9) mean even a corrupted materialized-state table can be **rebuilt from the ledger**, which is a second, independent layer of protection beyond database backups alone.
- **Disaster testing**: scheduled game days, not theoretical — restore drills, and at least one full "simulate the primary DB is gone, execute the runbook" exercise before the system carries meaningful transaction volume, repeated periodically thereafter.

---

## PART 32 — Architecture Decision Records (summary table; full ADRs would each be their own document)

| Decision | Reason | Alternatives | Why rejected | Key risk | Migration path |
|---|---|---|---|---|---|
| **Next.js (App Router) for frontend** | Best-in-class SSR/ISR/RSC for a content+commerce hybrid site; team already has working code in it | Remix, plain SPA | Smaller ecosystem (Remix) / worse SEO story (SPA) | Vercel platform lock-in for some features | Could self-host Next.js on ECS if Vercel cost/fit changes; App Router code itself isn't Vercel-locked |
| **NestJS + Fastify (backend)** | Structural modularity + DI + strong TS + near-Fastify performance | Standalone Fastify, Express, Next.js API routes | Fastify alone reinvents Nest's structure ad hoc; Express lacks structure and speed; Next.js API routes couple business logic to the frontend framework | Team must learn Nest's DI patterns (real but modest onboarding cost) | Nest's module boundaries are the extraction seams if services are ever split (Part 26) |
| **PostgreSQL** | ACID guarantees for money/inventory, mature, rich indexing (`pg_trgm`, `tsvector`), one database covers OLTP and (for now) search | MySQL, MongoDB | MySQL: no real advantage here; Postgres's feature set (JSONB, FTS, extensions) fits better. MongoDB: wrong consistency model for orders/payments/inventory | Vertical scaling ceiling eventually | Read replicas → (much later, if ever) partitioning of append-only tables like `inventory_ledger`/`audit_logs` by date — not full sharding |
| **Prisma** | Type-safe queries matching the TS-first stack, solid migration tooling, good DX for the whole team | Drizzle, raw SQL/knex | Drizzle: less mature ecosystem/tooling as of now; raw SQL: correct but slower team velocity and higher error surface for a team this size | Connection pooling needs external help (RDS Proxy) at scale; occasional need to drop to `$queryRaw` for complex queries | Repository-layer abstraction (Part 6) means swapping ORMs later touches one layer, not the whole app |
| **Redis (ElastiCache)** | Cache + queue backing + rate limiting + session revocation, one well-understood technology for several tactical needs | Upstash, Memcached | Upstash: attractive serverless pricing but adds a second vendor/cross-network hop once already committed to an AWS VPC; Memcached: no persistence, no data structures BullMQ needs | Single Redis cluster becomes a shared dependency across several concerns | Multi-AZ now; could split into separate cache-only and queue-only clusters later if contention between them is ever measured |
| **BullMQ** | Mature, TS-native, sufficient throughput, reuses the Redis already in the stack | Kafka, AWS SQS | Kafka: enormous operational overhead for job-queue-shaped problems, not event-streaming-shaped problems, which is what KAICHO actually has; SQS: viable, but adds a second queue paradigm/vendor for no measurable benefit over BullMQ at this scale | Redis becomes a dependency for both caching and queueing | SQS is a realistic swap later if queue volume genuinely outgrows Redis's practical ceiling — the worker/job abstraction (Part 12) is designed to make that swap contained |
| **Cloudflare R2** | Zero egress fees materially matter for an image-heavy catalog site with CDN-fronted delivery | AWS S3 | S3's mature AWS-native tooling is real, but R2's zero-egress model is a direct, ongoing, measurable cost win for this specific workload, and R2 is S3-API-compatible (low switching cost either direction) | Slightly less AWS-native tooling integration | S3-compatible API means migration either direction is low-effort if the calculus changes |
| **Cloudflare (CDN/WAF/DDoS)** | Best-in-class edge network, works identically regardless of underlying cloud choice | AWS CloudFront + WAF | Comparable capability, but Cloudflare's DX and pricing model for this scale is simpler, and decouples edge protection from the compute cloud choice entirely | One more vendor relationship | Low switching cost given CDN/WAF are edge-layer, not deeply integrated into app code |
| **AWS (over GCP)** | Region maturity in India, ecosystem/talent fit, RDS Proxy/Secrets Manager/IAM maturity | GCP (Cloud Run + Cloud SQL) | GCP is genuinely competitive, loses narrowly on India-specific ecosystem fit, not on technical merit | Standard single-cloud dependency | Containerized (ECS Fargate) + Terraform keeps a GCP migration theoretically tractable, though not trivial — not a design goal, just a side benefit of not using AWS-proprietary compute patterns beyond Fargate itself |
| **Modular monolith (over microservices)** | Team size, traffic scale, and feature scope today don't clear any legitimate extraction trigger (Part 26) | Microservices from day one | Would trade real, immediate velocity for hypothetical future scaling benefits the business doesn't need yet | Monolith could become a "distributed monolith in one process" if module discipline (Part 6) isn't enforced | Module boundaries are the designed extraction seams; Part 26 defines objective triggers |
| **PostgreSQL FTS (over a dedicated search engine)** | Catalog size doesn't justify the infrastructure | Meilisearch, Algolia, OpenSearch | All three are more capable but solve a problem KAICHO doesn't have yet at current SKU count | FTS relevance ceiling is real and eventually limiting | Part 17's explicit triggers define exactly when to move, and to what (Meilisearch first) |

---

## PART 33 — Final Architecture

**One recommendation, stated once, completely:**

1. **Diagram**: Part 3.
2. **Frontend**: Next.js App Router on Vercel — Server Components by default, ISR for catalog/marketing, SSR-no-cache for cart/checkout/account, Client Components only where interactivity requires them (Part 4/5).
3. **Backend**: NestJS + Fastify adapter, modular monolith, on ECS Fargate in a private VPC subnet behind an ALB (Part 2/3/6).
4. **Database**: PostgreSQL on RDS, Multi-AZ, accessed exclusively through RDS Proxy, Prisma as the ORM/repository layer (Part 7).
5. **Redis**: ElastiCache, used narrowly per Part 11's recommended/avoid table — cache, queue backing, rate limiting, session revocation; never the source of truth for money or stock.
6. **Queue**: BullMQ on the same Redis, consumed by a separately-scaled ECS worker service (Part 12).
7. **Storage**: Cloudflare R2, signed uploads, responsive image pipeline, fronted by Cloudflare CDN (Part 18).
8. **CDN/WAF**: Cloudflare — DNS, CDN, WAF, DDoS, edge rate limiting (Part 3/16).
9. **Authentication**: httpOnly cookie-based sessions, short-lived JWT access token + rotating opaque refresh token, argon2id password hashing, mandatory admin MFA (Part 14).
10. **Authorization**: RBAC + fine-grained permissions, enforced at the guard level (coarse) and application-service level (data-owned checks) (Part 6/14).
11. **Search**: PostgreSQL full-text search + `pg_trgm`, with explicit, measurable triggers to adopt Meilisearch later (Part 17).
12. **Monitoring**: CloudWatch + X-Ray + Sentry + external synthetic monitoring, alerting tuned to customer-impact, not noise (Part 22).
13. **CI/CD**: GitHub Actions, the full pipeline in Part 30, expand-contract migrations, automatic health-check-gated rollback.
14. **Cloud infrastructure**: AWS `ap-south-1`, ECS Fargate (no Kubernetes), single VPC, Terraform-managed (Part 19/28).
15. **Environment strategy**: fully isolated dev/staging/production — separate accounts/IAM, separate secrets, separate payment credentials, separate domains (Part 20).
16. **Security model**: Part 15 in full — defense in depth, least privilege, signature-verified webhooks, server-side-only trust for payment/price/stock.
17. **Folder structure**: Part 28.
18. **Scaling strategy**: four metric-triggered phases, not user-count-triggered (Part 25).
19. **Disaster recovery**: ≤5min RPO, <2min AZ-failure RTO, documented and *tested* region-failure runbook, append-only ledgers as a second layer of state-rebuildability (Part 31).
20. **Cost strategy**: Part 27 — start near $0, scale spend with measured load, spend where it buys reliability (DB/observability), not where it buys resume-driven complexity.
21. **Migration path**: greenfield backend (NestJS) built alongside the existing Next.js frontend (which is largely reusable — this session's hero rebuild is exactly the kind of frontend work that carries forward unchanged); the existing marketing site can go live on the new frontend/CDN/hosting immediately, with commerce features (cart/checkout/payments/accounts) built and cut over module by module behind feature flags, rather than a single big-bang relaunch.
22. **Engineering standards**: Part 29.

---

## PART 34 — Final CTO Verdict

### What I Would Build

Next.js (App Router) on Vercel for the frontend. NestJS + Fastify as a modular monolith on AWS ECS Fargate for the backend. PostgreSQL on RDS (Multi-AZ, RDS Proxy) as the single system of record. Redis (ElastiCache) for cache/queue/rate-limiting/sessions, never for money or stock. BullMQ for background jobs on a separately-scaled worker service. Cloudflare R2 for storage, Cloudflare for CDN/WAF/DDoS. Razorpay for payments, with the backend — never the frontend — as the sole authority on payment success. PostgreSQL full-text search until a measurable trigger says otherwise. GitHub Actions CI/CD with expand-contract migrations and automatic rollback. AWS `ap-south-1` as the cloud, chosen over GCP on India-specific fit, not brand preference.

### What I Would NOT Build

Microservices. Kubernetes. Kafka/event-streaming infrastructure. A service mesh. GraphQL. A dedicated search engine (yet). Database sharding. Multi-region active-active writes. A B2B module. Mobile-specific backend infrastructure. A general-purpose feature-flag platform (until flag usage outgrows a simple config table). Redis as a source of truth for anything financial. `products.stock` as a bare integer. Client-trusted payment confirmation.

### Biggest Architectural Risks (top 10)

1. **The traffic target (5,000→25,000 CCU) doesn't match the described business** — the single biggest risk is building and paying for infrastructure sized for a scale that may never materialize, while the *actual* first-year risks (correct inventory/payment logic, a working checkout, a maintainable codebase) get comparatively less attention because the brief's framing pulls focus toward scale.
2. **Database connection exhaustion** if RDS Proxy/pooling isn't configured correctly from day one — the most common real-world Next.js+Postgres outage.
3. **Overselling inventory** if the reservation/locking pattern (Part 8) isn't implemented exactly as designed — this is a correctness bug with direct financial and reputational cost.
4. **Trusting the frontend for payment success** if checkout is built under deadline pressure and the webhook-only trust model (Part 10) gets shortcut "just to ship faster."
5. **Secrets leaking into the Next.js client bundle** — an easy, common, and completely preventable mistake without the enforced `server-only` pattern (Part 5).
6. **Cache staleness bleeding into checkout pricing** — the most common way "caching" causes a real financial incident if the layered rule in Part 16 isn't enforced in code, not just in a document.
7. **Admin account compromise** — the highest-value target in the system; skipping mandatory MFA "for now" is the kind of shortcut that becomes a breach headline later.
8. **Module discipline erosion** — a modular monolith degrades into a "distributed monolith in one process" (all the coupling of a monolith, none of the clarity) if developers reach into other modules' repositories directly under time pressure; this requires ongoing code-review discipline, not just an initial design.
9. **Under-scoped v1, then panic-scoping mid-build** — trying to ship all 25 listed business domains simultaneously instead of sequencing them (Part 25) risks a v1 that's late and shallow everywhere instead of solid where it matters (catalog, cart, checkout, payments, orders) first.
10. **Untested disaster recovery** — backups that have never been restored, a region-failure runbook that's never been rehearsed — these look fine on a diagram and fail exactly when it matters most.

### What Will Break First

In order, as real traffic arrives: (1) database connection pool misconfiguration under concurrent load, well before any component's raw CPU capacity is the issue; (2) N+1 query patterns in product/category listing pages as the catalog and its relations grow, invisible until traffic reveals it; (3) a synchronous call to a third-party provider (SMS/email/payment) accidentally left in the checkout request path instead of the queue, causing checkout latency to inherit a slow provider's latency; (4) row-lock contention on a single hot SKU during the first real flash sale, which is precisely why that scenario is called out as its own load-test case in Part 24 rather than assumed away.

### When I Would Change the Architecture

- **Add a read replica** when primary DB read QPS is sustained (not spike) above a level where P95 query latency starts degrading, or when reporting/admin queries measurably compete with transactional latency.
- **Adopt Meilisearch** when catalog crosses ~5,000–10,000 SKUs, or search conversion is measurably worse than browse conversion.
- **Extract a service from the monolith** only when one of Part 26's specific triggers fires — never speculatively.
- **Move off Vercel to self-hosted Next.js on ECS** if Vercel's bandwidth/seat pricing at high scale becomes a measured, material cost disadvantage versus the added operational burden of self-hosting — a real trade-off to revisit at Phase 3/4, not a default assumption either way.
- **Introduce a proper event bus (not necessarily Kafka)** if the number of cross-module side effects genuinely outgrows what an in-process event emitter can cleanly express — most likely signaled by needing true at-least-once delivery guarantees across service boundaries once (and only once) actual services exist to communicate between.

### 5-Year Evolution

Year 1: ship the modular monolith with catalog, cart, checkout, payments, orders, and basic admin — correctly, not broadly. Year 2: add coupons/promotions, reviews, full notification channels, and reporting, informed by real usage data rather than the full speculative feature list. Year 3: if traffic genuinely approaches the 10K–25K CCU range, add read replicas, tune the caching hierarchy harder, and reassess search. Year 4: if a second team forms or a specific module's load genuinely diverges from the rest (most plausibly notifications at marketing-campaign scale, or a future B2B workflow with fundamentally different transaction patterns), extract that one module — and only that one. Year 5: reassess the entire stack against whatever KAICHO's *actual* business has become by then, because a 5-year-old prediction of "what the business needs" is exactly the kind of assumption this document opened by challenging.

### Final Verdict

**Yes, I would approve this for production — with the traffic/scope assumptions in Part 1 corrected first.**

The architecture itself — modular monolith, Postgres as the single source of truth with a properly designed inventory ledger and payment idempotency model, Redis used narrowly and safely, REST API decoupled from the frontend framework, AWS with a deliberately narrow set of justified cross-vendor exceptions (Vercel, Cloudflare, R2) — is one I'd stake my own on-call pager on. It's boring in exactly the right places (no Kubernetes, no Kafka, no microservices, no GraphQL) and rigorous in exactly the places that actually cause production incidents and financial errors in e-commerce (inventory concurrency, payment webhook idempotency, order state transitions, cache/checkout correctness).

What I would *not* approve without pushback is building it to a 25,000-concurrent-user, 25-domain, B2B-and-mobile-ready spec before there's evidence the business needs any of that. The correct move — and the one this architecture is actually designed to support — is to build the smaller, correct version first, instrumented well enough (Part 22) to know precisely when each phase in Part 25 is actually warranted, and let real numbers, not a round target, drive every expansion after that. That's not a hedge. That's the job.
