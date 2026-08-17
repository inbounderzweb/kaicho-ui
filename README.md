# Kaicho — Marketing Website

Next.js (App Router) + TypeScript + Tailwind CSS. This repository is currently
the **marketing homepage only** — there is no backend, no cart, no checkout,
no auth, and no product/[slug] route in this codebase. Product content is
static data ([`app/components/sections/product-data.ts`](app/components/sections/product-data.ts)).

For the full target system design (backend, database, payments, scaling,
security, the works), see [`KAICHO-Architecture.md`](./KAICHO-Architecture.md)
— that document is the source of truth for anything beyond this frontend.
[`kaicho-live-site-audit.md`](./kaicho-live-site-audit.md) is a content
inventory of the current live `kaicho.in` site, useful as a reference when
building out real product/category pages later.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in what you need. Every var is
optional — the app works with none of them set (see `NEXT_PUBLIC_GTM_ID`
below).

## Project Structure

```text
app/
├── layout.tsx                 # root layout: fonts, site-wide metadata, GTM, JSON-LD
├── page.tsx                   # homepage — composes the sections below
├── globals.css                # Tailwind + design tokens (colors, fonts, keyframes)
├── components/
│   ├── ui/                    # generic, reusable, no business logic
│   │   ├── Button.tsx
│   │   ├── Container.tsx
│   │   ├── SectionHeading.tsx
│   │   └── icons.tsx
│   ├── layout/                # site chrome, present on every page
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── MobileTabBar.tsx
│   │   ├── WhatsAppButton.tsx
│   │   └── nav-links.ts
│   ├── sections/               # homepage-specific sections (Hero, StoryCover, …)
│   │   └── product-data.ts     # static product content — see "Product Data" below
│   ├── analytics/
│   │   └── GoogleTagManager.tsx
│   └── seo/
│       └── JsonLd.tsx
lib/
├── seo/
│   ├── urls.ts                 # SITE_URL, absoluteUrl()
│   ├── metadata.ts              # buildPageMetadata() — shared OG/Twitter/robots shape
│   └── structured-data.ts       # organizationJsonLd(), websiteJsonLd(), breadcrumbJsonLd()
└── analytics/
    ├── types.ts                 # StandardEvent — typed GA4-shaped event contract
    ├── gtm.ts                   # GTM_ID, pushToDataLayer() (internal)
    ├── events.ts                 # trackEvent() — the one function UI code should call
    ├── ecommerce.ts               # toEcommerceItem() helper (unused until real cart/PDP exist)
    └── consent.ts                  # hasAnalyticsConsent() — single consent choke point
```

### Where new code goes

- **A new homepage section?** `app/components/sections/`.
- **A generic, reusable UI primitive with zero business meaning** (a new
  Button variant, an Input, a Badge)? `app/components/ui/`.
- **Site chrome that appears on every page** (nav, footer, a global banner)?
  `app/components/layout/`.
- **A new page/route** (About, Blog, a real Product page): create it under
  `app/`, following Next.js App Router conventions. Give it its own
  `generateMetadata` built from `lib/seo/metadata.ts`'s `buildPageMetadata()`
  rather than duplicating the OG/Twitter/robots shape by hand.

## SEO

`lib/seo/metadata.ts` exports `buildPageMetadata()` — the root layout already
uses it for the homepage. When a new route is added, give it a
`generateMetadata` that calls the same helper with a different `title` /
`description` / `path`, instead of hand-writing another full `Metadata`
object.

`lib/seo/structured-data.ts` currently exports `Organization` and `WebSite`
JSON-LD (rendered in the root layout via `app/components/seo/JsonLd.tsx`),
plus a ready-to-use `breadcrumbJsonLd()` for when real product/category
routes exist. **Do not add `Product`/`Offer`/`Review`/`AggregateRating`
structured data until a page genuinely has real price, availability, and
review data to back it** — fabricated structured data risks a Search Console
manual action, not just being "a bit early."

Current heading hierarchy: exactly one `<h1>` (the Hero headline), `<h2>`
per major section, `<h3>` only for genuine subsections. Keep it that way —
don't add heading tags for font-sizing; use Tailwind classes on `<p>`/`<span>`
instead.

## Analytics / GTM

There was no analytics wired up before this — this is a real, load-bearing
addition, not speculative scaffolding.

- **`NEXT_PUBLIC_GTM_ID`** (in `.env.local`) controls everything. Unset →
  `GoogleTagManager` renders nothing and the app behaves identically to
  before. Set it and the GTM container loads via `next/script`
  (`afterInteractive`), plus the `<noscript>` fallback.
- **Never call `dataLayer.push()` or GTM APIs directly from a component.**
  Call `trackEvent(name, params)` from `lib/analytics/events.ts` instead.
  This is the one seam between business code and the analytics provider —
  swapping/adding a destination later (GA4 direct, Meta CAPI, Google Ads)
  means editing `events.ts`, not every call site.
- **Event names/shapes are typed** in `lib/analytics/types.ts`
  (`StandardEvent`) using the standard GA4 ecommerce vocabulary
  (`view_item`, `add_to_cart`, `purchase`, etc.). `trackEvent("purchase", {...})`
  is type-checked against the exact params that event needs.
- **Nothing currently calls the ecommerce events.** There's no cart, no PDP,
  no checkout, no auth — firing `add_to_cart`/`purchase`/`login` against fake
  state would corrupt conversion data before a single real feature exists.
  Wire up a case only when the corresponding feature is real and the data is
  real (a genuine cart item, a genuine completed order with a real
  `transaction_id`).
- **Consent**: `lib/analytics/consent.ts`'s `hasAnalyticsConsent()` is the
  single choke point `GoogleTagManager` and `trackEvent` both check. It
  currently always returns `true` (no cookie-consent requirement is live
  yet). When one is needed, change only this function — nothing else in the
  analytics layer or any business component needs to know.

### Marketing attribution (utm_source, gclid, fbclid, …) — not yet implemented

No code exists for this yet, on purpose — nothing today does anything with
it (no lead form, no checkout, no CRM handoff). When it's needed:

- Read `utm_source` / `utm_medium` / `utm_campaign` / `utm_term` /
  `utm_content` / `gclid` / `fbclid` from the initial landing URL's query
  string, once, on first page load.
- Store only what's needed for attribution (not a general-purpose tracking
  blob) — a small first-touch record is enough for most needs; only add
  last-touch/multi-touch if a real reporting requirement asks for it.
- Prefer a short-lived, first-party cookie set server-side over
  `localStorage` for anything that needs to survive to a server-rendered
  checkout/order-confirmation page.
- Attach the stored attribution to the `purchase` event's params (or to the
  order record itself, once a backend exists) rather than building a
  separate attribution database.

## Product Data

`app/components/sections/product-data.ts` is static, typed data — not a
"database," not meant to become one. When the real backend
(`KAICHO-Architecture.md`'s `apps/api`) exists:

1. Product data moves to the API; this file's `Product` type becomes the
   shape a `GET /products` response is mapped into (or is replaced by a
   generated/shared type from the API contract).
2. Sections that currently `import { MEALS, COMBOS, SAVER_PACKS } from
   "./product-data"` switch to fetching from the API (Server Component
   `fetch`, ISR-cached per `KAICHO-Architecture.md` Part 4's rendering
   table) instead.
3. `product-data.ts` is deleted, not kept around as a fallback — don't build
   a "hardcoded data as backup" pattern; it's a maintenance trap.

## Future Architecture — commerce domains (not built yet)

The following are **deliberately not present in this repository**. They are
documented here so the boundary is clear when they do get built — not
created as empty folders today, per `KAICHO-Architecture.md`'s explicit
guidance against speculative scaffolding.

```text
Future commerce domains (each gets a real backend endpoint first):
  Auth · Product · Category · Cart · Checkout · Order · Payment ·
  Wishlist · Address · Offer · Search
```

Per `KAICHO-Architecture.md`, the target shape is a monorepo, **not** these
domains folded into this Next.js app's `app/` routes with direct database
access:

```text
apps/
├── web/     # this Next.js frontend
└── api/     # NestJS backend — the only thing that talks to the database

packages/
├── shared-types/     # DTOs shared between web and api
├── shared-schemas/   # Zod validation, single source of truth
└── config/           # eslint/tsconfig/tailwind base configs
```

**Migration path** (no big-bang rewrite):

```text
Existing marketing site (this repo, as-is)
        ↓
Backend API stood up (apps/api), API contract defined
        ↓
One commerce feature implemented against the real API (e.g. Product listing)
        ↓
Feature flag / controlled rollout
        ↓
Production validation
        ↓
Next feature (Cart, then Checkout, then Payment, then Orders, …)
```

The marketing site stays live and stable throughout — commerce features are
added module by module against a real API, never simulated against fake
data in this frontend first.

## Performance / Accessibility

- Server Components by default. `"use client"` only where a component
  genuinely needs interactivity, browser APIs, or local state (the Hero
  carousel, mobile menu, and the bulk-order form are the current examples —
  everything else on the homepage is a Server Component).
- Images go through `next/image` with explicit `sizes`.
- Exactly one `<h1>` per page; semantic HTML (`<button>`, `<nav>`, real
  `alt` text) is used throughout rather than `<div onClick>` + ARIA
  patched on top.
