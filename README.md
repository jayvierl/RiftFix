# RiftFix

A League of Legends stats website (OP.GG-style) built around three ideas:

- **One Fix** — instead of a wall of stats, each profile leads with the single
  biggest stat gap between a player's wins and losses in their archived games,
  plus a next-rank benchmark computed only from real archived games at the
  next tier.
- **Honest Builds** — builds and tier lists are computed *only* from matches
  in RiftFix's own archive. Every number shows its sample size and a
  confidence badge (`Solid` ≥ 50 games, `Promising` ≥ 20, `Too early` below
  that). When the archive is empty, the page says so — nothing is faked.
- **My League, Forever** — every match fetched during a player lookup is
  archived permanently. Other sites delete match history after a few months;
  RiftFix keeps it, so long-term trends never evaporate.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Riot Games API (server-side only) for player data
- Data Dragon (public, no key) for champion / item / rune data
- Local JSON archive store (swappable for a hosted DB — see below)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in RIOT_API_KEY
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `RIOT_API_KEY` | For player lookups | Server-side only. Read at runtime from the environment, sent as the `X-Riot-Token` header, never exposed to the client and never committed. |
| `RIFTFIX_DATA_DIR` | No | Overrides the Forever archive location (default: `./data/archive`). |

Without `RIOT_API_KEY`, the site still runs: champions, champion pages, and
already-archived profiles work, and player lookup returns a clear
"not configured" message instead of crashing.

### ⚠️ Development vs Production keys

- A **development key** from https://developer.riotgames.com **expires every
  24 hours** and is rate-limited (20 req / 1s, 100 req / 2 min). It is for
  local development only — Riot's terms do **not** allow dev keys in a
  publicly available product.
- Before launching publicly, apply for a **Production key** in the Riot
  developer portal (describe RiftFix, link the working site) and swap the
  `RIOT_API_KEY` value in your host's environment settings. No code change is
  needed.
- If lookups suddenly return "Riot rejected the server API key", the key has
  almost certainly expired — regenerate it and update the env var. A freshly
  regenerated key can take a few minutes to start working.

## How it works

### Data layer (`src/lib/`)

- `regions.ts` — platform → regional routing map for all 17 platforms
  (na1, br1, la1, la2, euw1, eun1, tr1, ru, me1, kr, jp1, oc1, ph2, sg2, th2,
  tw2, vn2). Account-V1 and Match-V5 use regional hosts
  (americas / europe / asia / sea); Summoner-V4, League-V4 and
  Champion-Mastery-V4 use platform hosts.
- `riot.ts` — Riot API client. Handles 404 (player not found), 401/403
  (expired/invalid key), and 429 (rate limit, with Retry-After backoff) as
  typed errors with honest user-facing messages.
- `ddragon.ts` — Data Dragon client: latest version, champion list + detail,
  items, rune names. Cached (module memo + fetch revalidation).
- `archive.ts` — the Forever archive behind an `ArchiveStore` interface.
- `lookup.ts` — orchestrates a lookup: resolve Riot ID → summoner / league /
  mastery → fetch newest match IDs → download and archive any matches not
  already stored → build the profile from the archive.
- `analysis.ts` — One Fix, next-rank benchmark, champion-pool and session
  patterns, Honest Builds and tier list. Everything is computed from archived
  games only.

### The Forever archive

The default store is three JSON documents under `data/archive/`:

- `matches.json` — `{ [matchId]: match }`, matches are immutable once saved
- `players.json` — latest snapshot (rank, level, mastery) per player
- `tracked.json` — legacy server-side tracked marks. The store interface
  still carries the tracked methods (kept for a possible future admin
  feature), but the product no longer uses them: tracked players are
  per-visitor and live only in each visitor's browser (localStorage key
  `riftfix.tracked.v1`, see `src/lib/tracked-local.ts`). There is no
  `/api/track` route and `/api/status` returns no tracked list.

Writes are serialized and atomic (tmp file + rename). The archive directory
is git-ignored. To move to a hosted database later, implement the
`ArchiveStore` interface in `src/lib/archive.ts` (e.g. Postgres/Turso) —
no other file needs to change.

### Pages & API routes

| Route | What it does |
| --- | --- |
| `/` | Branding, player search (Riot ID + region), your tracked players (per-visitor, saved in the browser), honest no-key notice |
| `/player?platform=&gameName=&tagLine=` | Full profile: ranks, mastery, champion stats, One Fix, next-rank benchmark, pool/session patterns, expandable match scoreboards |
| `/champions` | Searchable champion grid (live patch) with tag filters |
| `/champions/[id]` | Champion detail: lore, passive + abilities, base stats, tips |
| `/builds` | Honest Builds + tier list from the archived corpus |
| `GET /api/status` | `{ hasKey, patch, corpus counts }` |
| `GET /api/search` | Light Riot ID existence check used by the search form |
| `GET /api/lookup` | Full lookup (archives matches) as JSON |
| `GET /api/champions`, `GET /api/champions/[id]` | Data Dragon champion data |
| `GET /api/builds` | Builds + tier list as JSON |
| `GET /api/match/[matchId]` | One archived match (scoreboard data) |
| `/terms`, `/privacy` | Terms of Service and Privacy Policy (what player data is stored — Riot ID, PUUID, match data — why, deletion on request, no sale of data, cookies/analytics disclosure) |
| `/sitemap.xml`, `/robots.txt` | Generated by `src/app/sitemap.ts` / `src/app/robots.ts`; sitemap lists every champion page |
| `/riot.txt` | Placeholder for Riot's domain-verification token during the Production key review |

### Compliance & SEO notes

- Every page footer carries Riot's standard "not endorsed by Riot Games"
  boilerplate, as production-key reviewers expect.
- Per-page metadata (title / description / Open Graph) is set on all pages;
  champion pages are patch-labelled and structured as
  `/champions/[champion]`, ready for future build subpages
  (e.g. `/champions/[champion]/build`).
- **Indexing quality gates:** player profile pages are `noindex` (personal
  lookups), and `/builds` renders for users but is `noindex` until the
  archive backs it with at least 10 champions with 10+ archived ranked games.
- One Fix copy is framed as a suggestion ("your biggest lever") with the
  evidence shown and alternatives offered — never as a verdict.
- Deliberately **not** built (Riot policy): hidden-MMR estimates, Augment /
  Arena / Brawl data products, enemy ultimate or summoner-spell timers, and
  any shaming/tilt labels about other players. Session/tilt patterns are
  self-facing only, on the profile owner's own page.

## Deploy notes (Vercel)

1. Import the repo into Vercel; framework preset **Next.js** is auto-detected.
2. Set the `RIOT_API_KEY` environment variable (Production key — see the
   warning above) in Project Settings → Environment Variables. Never commit a
   key; `.env*` is git-ignored.
3. **Archive persistence caveat:** Vercel functions run on an ephemeral
   filesystem, so the JSON archive does not persist reliably between
   invocations in production. For a durable public launch, either run the app
   on a host with a persistent disk (a VPS / container with `RIFTFIX_DATA_DIR`
   on a volume) or swap the `ArchiveStore` implementation for a hosted
   database. The interface is designed exactly for that swap.
4. Put Cloudflare (or Vercel's built-in protection) in front for DNS/CDN once
   a domain is attached.

## Notes

- Match timelines (Match-V5 `/timeline`) are available in the client
  (`getMatchTimeline`) but not yet surfaced in the UI.
- RiftFix isn't endorsed by Riot Games. League of Legends and Riot Games are
  trademarks or registered trademarks of Riot Games, Inc.
