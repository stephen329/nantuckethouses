> ⚠️ **MIRROR — do not edit here.**
> Canonical source of truth: the **`odin`** repo → **`docs/governance/NETWORK.md`**.
> This copy is synced from there so the local `./NETWORK.md` link in `AGENTS.md`
> resolves offline. Propose rule changes against the canonical file, not this mirror.

# The Nantucket Network — Shared Brand & Content Charter

> **Status: canonical.** This file is the single source of truth for how the four
> Nantucket properties relate. Each repo also carries its own `AGENTS.md` with that
> brand's specific lane. When the two disagree, **this file wins** — open a PR here
> to change a rule, don't override it locally.

The four properties are **separate businesses under shared ownership**. Left
uncoordinated they cannibalize each other — bidding on the same keywords,
duplicating the same guides, chasing the same buyer. The whole point of this
charter is that **each brand owns one stage of the journey and one search intent**,
so they hand traffic and leads *to* each other instead of taking it *from* each other.

## The four lanes

| Brand | Repo(s) | Lane | Owns | Signature color |
|---|---|---|---|---|
| **maury.net** | `maury-net` | **Authority** — vouches, never sells | The "Stephen Maury" name, civic/housing thought leadership, the canonical founder bio | violet |
| **Nantucket Houses** | `nantuckethouses`, iOS app | **Discover** — research & data | Market data, comps, zoning/buildability, deed history, Market Pulse | blue |
| **Congdon & Coleman** | `cnc-web-fe` | **Transact (sales)** — represents & closes | Homes for sale, seller/listing services, agent relationships | heritage orange |
| **Nantucket Rentals** | `nr-web-fe`, `rentals-ppc-landing` | **Stay (rentals)** — book & earn | Vacation rental search & booking, homeowner rental income, visitor/lifestyle guides | sea-green |

## The three non-negotiable rules

1. **One intent, one owner.** Each search intent has exactly one "money page" brand.
   Every other brand references it with a contextual link — never build a rival page
   for an intent another brand owns.
2. **Pass, don't poach.** Where journeys touch, the upstream brand hands the lead
   downstream (Houses → Coleman; Rentals → Coleman) instead of trying to close it.
3. **Publish once, link many.** Shared material — dining/visitor guides, the founder
   bio, market data — lives in exactly one canonical place. Everyone else links to it.

## SEO ownership matrix (split by intent, not topic)

| Owner | Intent | OWNS these clusters | MUST NEVER target |
|---|---|---|---|
| **Houses** | Informational / investigational | `nantucket market report`, `comparable/recent sales`, `zoning & buildability`, `what did [address] sell for`, `property records`, `nantucket real estate app` | "list with an agent", "sell my home", "book a rental" |
| **Coleman** | Commercial / transactional (sales) | `nantucket homes for sale`, `real estate broker/agent`, `[neighborhood] homes for sale`, `sell my nantucket home`, `congdon & coleman` | market-data hubs, rental booking search |
| **Rentals** | Commercial / transactional (rentals) | `nantucket vacation/summer rentals`, `house rental`, `[area] rental`, `list my home for rent`, `rental management`, `things to do / dining` | "homes for sale", market reports |
| **maury.net** | Branded / civic / opinion | `stephen maury`, `nantucket housing policy`, `finance committee / planning board`, `island economics`, `proptech commentary` | any transactional real-estate or rental term |

> **The contested phrase.** No brand may headline the bare phrase *"Nantucket real
> estate."* Houses wins it through informational depth; Coleman wins its transactional
> variants ("for sale", "broker"). If two properties rank for the same query, that's
> drift — the lower-intent one re-points to a cross-link.

## Required cross-links (the handoffs)

These are mandatory, contextual links — not optional footer decoration:

- **Houses → Coleman:** every Market Pulse & listing page CTAs to "work with the brokerage."
- **Coleman → Houses:** every listing links to "see the comps, zoning & deed history."
- **Coleman → Rentals:** "prefer to rent this season?" routes non-buyers to booking.
- **Rentals → Coleman:** homeowner & guest touchpoints offer the buy/sell path.
- **All three → maury.net:** the "about / team / expertise" link points to the one canonical bio.
- **maury.net → all three:** the "my work" section is the directory into each business.

## Governance — the pre-ship test

Before shipping any new page, guide, campaign, meta title, or landing route, the
author (human or agent) must pass this checklist:

- [ ] **Ownership:** Does another brand already own this intent? If yes, add a cross-link — do **not** build a competing page.
- [ ] **Never-list:** Does the target keyword appear in this brand's "MUST NEVER target" list? If yes, stop.
- [ ] **Canonical:** Is this content (bio, dining guide, comps, market data) already canonical elsewhere? If yes, link — don't duplicate. If it's new shared content, set `rel=canonical` to the one owner.
- [ ] **Handoff:** If this page sits at a lane boundary, is the required cross-link/CTA present?
- [ ] **Tagline:** Does the headline avoid the bare phrase "Nantucket real estate"?

**Quarterly:** pull Google Search Console for all four properties and flag any query
where two of them rank. That overlap is the early warning that a lane is drifting.

## How the per-repo files work

Each repo's `AGENTS.md` is the brand-specific enforcement of this charter: its lane,
its owns/never-target lists, its required handoffs, its content cadence, and the same
pre-ship checklist scoped to that brand. Keep them in sync with this file — when this
charter changes, update the affected `AGENTS.md` files in the same change.
