# NantucketHouses Sitemap

Last generated: 2026-04-28
Source of truth: `src/app/**/page.tsx` and `src/lib/navigation.ts`

## 1) Primary Navigation (current pillars)

- `/`
- `/map` — unified property map (rentals pins + parcels + zoning; replaces `/tools/zoning-lookup` entry)
- `/market-pulse`
  - `/market-pulse/whale-watch`
  - `/market-pulse/price-trends`
  - `/market-pulse/inventory`
  - `/market-pulse/reports`
- `/regulatory`
  - `/regulatory/hdc-morning-after`
    - `/regulatory/hdc-morning-after/[date]` (dynamic)
  - `/regulatory/planning-board`
  - `/regulatory/zoning-board`
  - `/regulatory/zoning-lookup` (redirects to `/map`)
  - `/regulatory/cheat-sheets`
- `/affordable-housing`
  - `/affordable-housing/hfhn-projects`
  - `/affordable-housing/get-involved`
  - in-page anchors:
    - `/affordable-housing#safe-harbor`
    - `/affordable-housing#covenant`
    - `/affordable-housing#lease-to-locals`
    - `/affordable-housing#pipeline`
- `/build-renovate` (pillar landing currently exists)
  - planned nav children currently do not have route files:
    - `/build-renovate/cost-calculator`
    - `/build-renovate/building-costs`
    - `/build-renovate/case-studies`
    - `/build-renovate/vendor-rate-sheet`
- `/neighborhoods`
  - `/neighborhoods/[slug]` (dynamic)
    - nav-linked examples:
      - `/neighborhoods/sconset`
      - `/neighborhoods/cliff`
      - `/neighborhoods/town`
      - `/neighborhoods/surfside`
      - `/neighborhoods/madaket`
      - `/neighborhoods/dionis`
      - `/neighborhoods/mid-island`
      - `/neighborhoods/cisco`
      - `/neighborhoods/brant-point`
      - `/neighborhoods/monomoy`
      - `/neighborhoods/polpis`
      - `/neighborhoods/madequecham`
- CTA:
  - `/opportunities`

## 2) Standalone Nav Links

- `/articles`
  - `/articles/[slug]` (dynamic)
- `/about`

## 3) Public Routes Not in Primary Nav

- `/buy`
  - `/buy/thank-you`
- `/opportunities/for-sale`
- `/opportunities/for-rent`
- `/opportunities/wanted-to-buy`
- `/opportunities/wanted-to-rent`
- `/opportunities/services`
- `/opportunities/workforce-housing`
- `/regulatory/zoning-map`
- `/coming-soon`
- `/ai`
- `/directory`

## 4) Admin / Internal Routes

- `/admin`
- `/admin/import`
- `/admin/zoning`
- `/admin/opportunities`
- `/admin/partners`
- `/admin/articles`
  - `/admin/articles/[slug]` (dynamic)

## 5) Streamlining Candidates (quick read)

- Build & Renovate has child links in nav but no matching route files yet.
- Opportunities has both a top-level CTA and 6 sub-routes outside the main nav structure.
- Regulatory currently has both `/regulatory/zoning-lookup` and `/regulatory/zoning-map`; consider whether both should remain first-class.
- `/ai` and `/directory` are public but not represented in top-level nav.
